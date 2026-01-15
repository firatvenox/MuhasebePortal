using Microsoft.AspNetCore.Identity;
using System;

namespace API.Entities
{
    public class UserRole : IdentityRole<Guid>
    {
        // Ek alanlar ekleyebilirsin
        public string? Description { get; set; }
    }
}
