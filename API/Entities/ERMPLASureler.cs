using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.Entities
{
    [Table("ERMPLASureler")]
    public class ERMPLASureler
    {
        [Key]
        public Guid Id { get; set; }

        [MaxLength(400)]
        public string? taskType { get; set; }

        [MaxLength(2)]
        public string? tasiyici { get; set; }

        [MaxLength(50)]
        public string? cikis { get; set; }

        [MaxLength(10)]
        public string? makine { get; set; }

        public short sure { get; set; } = 0;

        [MaxLength(400)]
        public string? olusturan { get; set; }

        public DateTimeOffset? OlusturmaTarihi { get; set; }

        public bool durum { get; set; } = true;

        [MaxLength(50)]
        public string? statuNo { get; set; }

        [MaxLength(50)]
        public string? statu { get; set; }

        [MaxLength(25)]
        public string? atolye { get; set; }
    }
}
