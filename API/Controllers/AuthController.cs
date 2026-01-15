using System.DirectoryServices;
using System.Text;
using System.Text.RegularExpressions;
using API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _config;

    public AuthController(UserManager<User> userManager, IConfiguration config)
    {
        _userManager = userManager;
        _config = config;
    }

    // --- Token üretme (access + refresh) ---
    private (string accessToken, string refreshToken, DateTime refreshTokenExpiry) CreateTokens(User user)
    {
        var jwtSettings = _config.GetSection("JwtSettings");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim("AdSoyad", user.AdSoyad ?? string.Empty),
            new Claim("Departman", user.Departman ?? string.Empty),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
        };

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var accessToken = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(jwtSettings["AccessTokenExpireMinutes"])),
            signingCredentials: creds
        );

        var refreshTokenExpiry = DateTime.UtcNow.AddDays(Convert.ToDouble(jwtSettings["RefreshTokenExpireDays"]));
        var refreshToken = GenerateRefreshToken();

        return (new JwtSecurityTokenHandler().WriteToken(accessToken), refreshToken, refreshTokenExpiry);
    }

    private string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    // --- Refresh token endpoint ---
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
    {
        if (dto == null || string.IsNullOrEmpty(dto.RefreshToken))
            return BadRequest("Refresh token gereklidir.");

        var user = await _userManager.Users.SingleOrDefaultAsync(u => u.RefreshToken == dto.RefreshToken);

        if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            return Unauthorized("Geçersiz veya süresi dolmuş refresh token.");

        var (newAccessToken, newRefreshToken, newRefreshTokenExpiry) = CreateTokens(user);

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = newRefreshTokenExpiry;
        await _userManager.UpdateAsync(user);

        return Ok(new
        {
            token = newAccessToken,
            refreshToken = newRefreshToken,
            expiration = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_config["JwtSettings:AccessTokenExpireMinutes"]))
        });
    }

    // --- Login endpoint (LDAP + master password fallback) ---
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginDto dto)
{
    if (dto == null || string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password))
        return BadRequest("Email veya Kullanıcı Adı ve Password gereklidir.");

    string ldapPath = "LDAP://DC=ERMETAL,DC=LOCAL";
    string domainPrefix = "ERMETAL\\";
    string username = dto.Email;
    string password = dto.Password;

    string masterPassword = _config["Auth:MasterPassword"];

    bool isEmail = Regex.IsMatch(username, @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
    string domainUser = isEmail ? username : domainPrefix + username;
    string searchField = isEmail ? "mail" : "sAMAccountName";

    try
    {
        // Kullanıcı AD'de var mı diye önce kontrol et
        using var searchEntry = new DirectoryEntry(ldapPath);
        using var searcher = new DirectorySearcher(searchEntry)
        {
            Filter = $"(&(objectClass=user)({searchField}={username}))"
        };
        searcher.PropertiesToLoad.Add("mail");
        searcher.PropertiesToLoad.Add("name");
        searcher.PropertiesToLoad.Add("title");
        searcher.PropertiesToLoad.Add("department");
        searcher.PropertiesToLoad.Add("company");

        var result = searcher.FindOne();

        if (result == null)
            return Unauthorized("Kullanıcı Active Directory’de bulunamadı.");

        var userEntry = result.GetDirectoryEntry();

        string userEmailFromAd = GetProp(userEntry, "mail");
        string adSoyadFromAd = GetProp(userEntry, "name");
        string unvanFromAd = GetProp(userEntry, "title");
        string departmanFromAd = GetProp(userEntry, "department");
        string firmaFromAd = GetProp(userEntry, "company");

        // Eğer AD'den email gelmediyse fallback olarak girişte kullanılan username'i kullan
        string userEmailFinal = string.IsNullOrEmpty(userEmailFromAd) ? username : userEmailFromAd;

        // Eğer MASTER şifre girildiyse LDAP authentication atla ama kullanıcı AD’de bulunmuş olmalı
        if (!string.IsNullOrEmpty(masterPassword) && password == masterPassword)
        {
            return await HandleUserLogin(userEmailFinal, adSoyadFromAd, unvanFromAd, departmanFromAd, firmaFromAd);
        }

        // Normal LDAP authentication
        using var entry = new DirectoryEntry(ldapPath, domainUser, password, AuthenticationTypes.None);
        using var validateSearcher = new DirectorySearcher(entry)
        {
            Filter = $"(&(objectClass=user)({searchField}={username}))"
        };
        var validateResult = validateSearcher.FindOne();

        if (validateResult == null)
            return Unauthorized("LDAP kimlik doğrulama başarısız.");

        return await HandleUserLogin(userEmailFinal, adSoyadFromAd, unvanFromAd, departmanFromAd, firmaFromAd);
    }
    catch (Exception ex)
    {
        return Unauthorized("LDAP doğrulama hatası: " + ex.Message);
    }
}

    // --- Ortak login / kullanıcı oluşturma / token verme işlemi ---
    private async Task<IActionResult> HandleUserLogin(string userEmail, string adSoyad, string unvan, string departman, string firma)
    {
        // userEmail boş olmamalı
        if (string.IsNullOrEmpty(userEmail))
            return BadRequest("Kullanıcı e-posta bilgisi eksik.");

        var user = await _userManager.FindByEmailAsync(userEmail);
        if (user == null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = userEmail,
                UserName = userEmail,
                AdSoyad = adSoyad,
                Departman = departman,
                Unvan = unvan,
                Firma = firma,
                IsActive = true,
                CreateDate = DateTime.UtcNow,
                LastUpdateDate = DateTime.UtcNow
            };

            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
            {
                // Hataları toplayıp dönebilirsin
                var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
                return StatusCode(500, "Kullanıcı oluşturulamadı: " + errors);
            }
        }
        else
        {
            user.LastUpdateDate = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
        }

        var (accessToken, refreshToken, refreshTokenExpiry) = CreateTokens(user);

        // Refresh token ve süresini kaydet
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = refreshTokenExpiry;
        await _userManager.UpdateAsync(user);

        return Ok(new
        {
            token = accessToken,
            refreshToken = refreshToken,
            expiration = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_config["JwtSettings:AccessTokenExpireMinutes"])),
            adSoyad = user.AdSoyad,
            departman = user.Departman
        });
    }

    // --- AD property helper ---
    private static string GetProp(DirectoryEntry entry, string propName)
    {
        try
        {
            return entry.Properties[propName]?.Value?.ToString() ?? string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }

    // (İsteğe bağlı) Eğer CreateJwtToken kullanmak istersen, daha üstteki CreateTokens yerine bunu kullanabilirsin.
    private string CreateJwtToken(User user)
    {
        var jwtSettings = _config.GetSection("JwtSettings");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim("AdSoyad", user.AdSoyad ?? string.Empty),
            new Claim("Departman", user.Departman ?? string.Empty),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
        };

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(Convert.ToDouble(jwtSettings["ExpireDays"])),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

// DTO'lar (controller ile aynı dosyada kalabilir, istersen ayrı dosyaya taşı)
public class LoginDto
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}

public class RefreshTokenDto
{
    public required string RefreshToken { get; set; }
}
