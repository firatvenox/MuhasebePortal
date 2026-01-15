using System;

namespace API.Entities
{
    public class ERMServisEntities
    {
        public class ERMServisDosyalar
        {
            public Guid Id { get; set; }
            public string? DosyaAdi { get; set; }
            public Guid HaftaId { get; set; }
            public Guid YukleyenId { get; set; }
            public DateTimeOffset OlusturmaTarihi { get; set; }
            public bool Durum { get; set; }
            public string? FilePath { get; set; }
        }

        public class ERMServisHaftalikLog
        {
            public Guid Id { get; set; }
            public Guid HaftaId { get; set; }
            public Guid PersonelId { get; set; }
            public Guid VardiyaId { get; set; }
            public Guid DurakId { get; set; }
            public Guid DosyaId { get; set; }
            public bool Durum { get; set; }
            public bool pazar { get; set; }
        }

        public class ERMServisVardiyalar
        {
            public Guid Id { get; set; }
            public string? VardiyaAdi { get; set; }
            public DateTimeOffset OlusturmaTarihi { get; set; }
            public bool Durum { get; set; }
        }

        public class ERMServisDuraklar
        {
            public Guid Id { get; set; }
            public string? DurakAdi { get; set; }
            public Guid GuzergahId { get; set; }
            public int DurakNo { get; set; }
            public DateTimeOffset OlusturmaTarihi { get; set; }
            public bool Durum { get; set; }
        }

        public class ERMServisGuzergahlar
        {
            public Guid Id { get; set; }
            public string? GuzergahAdi { get; set; }
            public int GuzergahId { get; set; }
            public DateTimeOffset OlusturmaTarihi { get; set; }
            public bool Durum { get; set; }
        }

        public class ERMServisHaftalar
        {
            public Guid Id { get; set; }
            public int Hafta { get; set; }
            public string? Aciklama { get; set; }
            public DateTimeOffset OlusturmaTarihi { get; set; }
            public string? Olusturan { get; set; }
            public bool Durum { get; set; }
        }
    }
}
