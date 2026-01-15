using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace API.Data
{
    public class MsContext : IdentityDbContext<User, UserRole, Guid>
    {
        public MsContext(DbContextOptions<MsContext> options) : base(options) { }

        public DbSet<ERMPLASureler> ERMPLASureler { get; set; }
        public DbSet<ERMPersoneller> ERMPersoneller { get; set; }
        public DbSet<ERMServisEntities.ERMServisDosyalar> ERMServisDosyalar { get; set; }
        public DbSet<ERMServisEntities.ERMServisHaftalikLog> ERMServisHaftalikLog { get; set; }
        public DbSet<ERMServisEntities.ERMServisVardiyalar> ERMServisVardiyalar { get; set; }
        public DbSet<ERMServisEntities.ERMServisDuraklar> ERMServisDuraklar { get; set; }
        public DbSet<ERMServisEntities.ERMServisGuzergahlar> ERMServisGuzergahlar { get; set; }
        public DbSet<ERMServisEntities.ERMServisHaftalar> ERMServisHaftalar { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}
