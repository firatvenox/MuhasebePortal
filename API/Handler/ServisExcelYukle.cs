using Microsoft.EntityFrameworkCore;
using API.Data;
using static API.Entities.ERMServisEntities;
using OfficeOpenXml;

public class UploadHaftalikExcelHandler
{
    private readonly MsContext _context;

    public UploadHaftalikExcelHandler(MsContext context)
    {
        _context = context;
    }

    public async Task<string> Handle(Stream stream, bool pazar, string yukleyen)
    {
        if (stream == null)
            throw new Exception("Dosya boş.");

        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream);
        memoryStream.Position = 0;

        if (memoryStream.Length == 0)
            throw new Exception("Dosya boş.");

        using var package = new ExcelPackage(memoryStream);
        var sheet = package.Workbook.Worksheets.First();

            var aktifHafta = await _context.ERMServisHaftalar
                .FirstOrDefaultAsync(x => x.Durum);

            if (aktifHafta == null)
                throw new Exception("Aktif hafta bulunamadı.");

            /* =========================
               1️⃣ DOSYA KAYDI
            ========================= */

            var dosyaId = Guid.NewGuid();
            var personelId = await _context.ERMPersoneller
                .Where(x => x.MailAdresi == yukleyen)
                .Select(x => x.Id)
                .FirstOrDefaultAsync();
            _context.ERMServisDosyalar.Add(new ERMServisDosyalar
            {
                Id = dosyaId,
                DosyaAdi = "uploaded.xlsx",
                HaftaId = aktifHafta.Id,
                YukleyenId = personelId, // istersen UserId koyarız
                OlusturmaTarihi = DateTimeOffset.Now,
                Durum = true,
            });

            await _context.SaveChangesAsync();

        /* =========================
           VERİLERİ ÇEK
        ========================= */

        var vardiyalar = await _context.ERMServisVardiyalar
            .Where(x => x.Durum)
            .ToListAsync();

        var personeller = await _context.ERMPersoneller.ToListAsync();

        var duraklar = await _context.ERMServisDuraklar
            .Where(x => x.Durum)
            .ToListAsync();

        /* =========================
           VARDİYA MAP
        ========================= */

        var vardiyaKolonlari = new Dictionary<int, string>
        {
            { 1, sheet.Cells["A4"].Text },
            { 3, sheet.Cells["C4"].Text },
            { 5, sheet.Cells["E4"].Text },
            { 7, sheet.Cells["G4"].Text },
            { 9, sheet.Cells["I4"].Text }
        };

        var vardiyaMap = new Dictionary<int, Guid>();

        foreach (var item in vardiyaKolonlari)
        {
            var vardiya = vardiyalar.FirstOrDefault(x =>
                string.Equals(x.VardiyaAdi, item.Value, StringComparison.OrdinalIgnoreCase));

            if (vardiya == null)
                throw new Exception($"Vardiya bulunamadı: {item.Value}");

            vardiyaMap.Add(item.Key, vardiya.Id);
        }

        /* =========================
           PERSONEL – VARDİYA – DURAK
        ========================= */

        var personelMemory = new Dictionary<Guid, (Guid VardiyaId, Guid DurakId)>();

        for (int row = 6; row <= sheet.Dimension.End.Row; row++)
        {
            for (int col = 1; col <= 9; col += 2)
            {
                var sicilNoStr = sheet.Cells[row, col].Text;
                if (string.IsNullOrWhiteSpace(sicilNoStr))
                    continue;

                if (!int.TryParse(sicilNoStr, out int sicilNo))
                    continue;

                var personel = personeller.FirstOrDefault(x => x.SicilNo == sicilNo);
                if (personel == null)
                    throw new Exception($"Personel bulunamadı: {sicilNo}");

                if (!personel.Durum)
                    throw new Exception($"Pasif personel: {sicilNo}");

                if (personelMemory.ContainsKey(personel.Id))
                    throw new Exception($"Personel birden fazla vardiyada: {sicilNo}");

                if (personel.DurakId == null)
                    throw new Exception($"Personelin durak bilgisi yok: {sicilNo}");

                var durak = duraklar.FirstOrDefault(x => x.DurakNo == personel.DurakId);
                if (durak == null)
                    throw new Exception($"Durak bulunamadı. Sicil: {sicilNo}");

                personelMemory.Add(
                    personel.Id,
                    (vardiyaMap[col], durak.Id)
                );
            }
        }

        /* =========================
           LOG KAYDI
        ========================= */

        var mevcutLoglar = await _context.ERMServisHaftalikLog
            .Where(x => x.HaftaId == aktifHafta.Id && x.Durum)
            .Select(x => x.PersonelId)
            .ToListAsync();

        var mevcutPersonelSet = new HashSet<Guid>(mevcutLoglar);

        foreach (var item in personelMemory)
        {
            // 🔥 Aktif haftada zaten varsa geç
            if (mevcutPersonelSet.Contains(item.Key))
                continue;

            _context.ERMServisHaftalikLog.Add(new ERMServisHaftalikLog
            {
                Id = Guid.NewGuid(),
                HaftaId = aktifHafta.Id,
                PersonelId = item.Key,
                VardiyaId = item.Value.VardiyaId,
                DurakId = item.Value.DurakId,
                DosyaId = dosyaId,
                Durum = true,
                pazar = pazar,
            });
        }

        await _context.SaveChangesAsync();
        return "Haftalık servis excel dosyası başarıyla yüklendi.";
    }
}
