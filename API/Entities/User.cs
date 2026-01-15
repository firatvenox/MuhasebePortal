using System;
using Microsoft.AspNetCore.Identity;

namespace API.Entities
{
    public class User : IdentityUser<Guid>
    {
        public required string AdSoyad { get; set; }
        public required string Departman { get; set; }
        public required string Unvan { get; set; }
        public required string Firma { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreateDate { get; set; }
        public DateTime LastUpdateDate { get; set; }
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime RefreshTokenExpiryTime { get; set; }
    }
}
