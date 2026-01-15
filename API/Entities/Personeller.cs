using System;

namespace API.Entities
{
    public class ERMPersoneller
    {
        public Guid Id { get; set; }
        public int SicilNo { get; set; }
        public string? AdSoyad { get; set; }
        public string? Firma { get; set; }
        public string? Departman { get; set; }
        public string? Unvan { get; set; }
        public string? TelefonNumarasi { get; set; }
        public int? DurakId { get; set; }
        public bool Durum { get; set; }
        public DateTimeOffset? OlusturmaTarihi { get; set; }
        public Guid? DepartmanId { get; set; }
        public string? MailAdresi { get; set; }
        public Guid? DirectorId { get; set; }
        public string? DirectorMail { get; set; }
        public DateTimeOffset? IseGirisTarihi { get; set; }
    }
}
