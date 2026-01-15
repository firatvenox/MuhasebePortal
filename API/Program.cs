using System.Text;
using API.Data;
using API.Entities;
using API.Handler;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OfficeOpenXml;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

var defaultConnectionString = config.GetConnectionString("defaultConnection");
builder.Services.AddDbContext<MsContext>(opt => opt.UseSqlServer(defaultConnectionString));
builder.Services.AddScoped<UploadHaftalikExcelHandler>();
builder.Services.AddScoped<HaftalikServisRaporuExcelHandler>();

builder.Services.AddIdentity<User, IdentityRole<Guid>>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<MsContext>()
.AddDefaultTokenProviders();

// JWT Authentication
var jwtSettings = config.GetSection("JwtSettings");
var keyString = jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key not configured");
var key = Encoding.UTF8.GetBytes(keyString);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "https://localhost:5173",
            "https://muhasebe-api.ermetal.com",
            "https://muhasebe.ermetal.com",
            "https://ambartarama-api.ermetal.com",
            "https://ambartarama.ermetal.com"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

ExcelPackage.License.SetNonCommercialOrganization("MuhasebePortal");

builder.Services.AddControllers();

builder.Services.AddOpenApi();
var app = builder.Build();

app.MapOpenApi();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/openapi/v1.json", "Firat API");
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Web API V1");
});

app.UseHttpsRedirection();

app.UseCors("ReactPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
