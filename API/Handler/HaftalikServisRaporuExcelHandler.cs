using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using API.Data;
using static API.Entities.ERMServisEntities;
using System.Drawing;

public class HaftalikServisRaporuExcelHandler
{
    private readonly MsContext _context;

    public HaftalikServisRaporuExcelHandler(MsContext context)
    {
        _context = context;
    }

    public async Task<byte[]> Handle(bool pazar)
    {

        var aktifHafta = await _context.ERMServisHaftalar
            .FirstOrDefaultAsync(x => x.Durum);

        if (aktifHafta == null)
            throw new Exception("Aktif hafta bulunamadı.");

        var vardiyalar = await _context.ERMServisVardiyalar.Where(x => x.Durum).ToListAsync();
        var loglar = await _context.ERMServisHaftalikLog
            .Where(x => x.HaftaId == aktifHafta.Id && x.Durum && x.pazar == pazar)
            .ToListAsync();

        var personeller = await _context.ERMPersoneller.ToListAsync();
        var duraklar = await _context.ERMServisDuraklar.ToListAsync();
        var guzergahlar = await _context.ERMServisGuzergahlar.ToListAsync();

        using var package = new ExcelPackage();

        /* =======================
           1️⃣ VARDİYA SAYFALARI
        ======================= */

        foreach (var vardiya in vardiyalar)
        {
            var sheet = package.Workbook.Worksheets.Add(vardiya.VardiyaAdi);

            string[] headers = { "Sicil", "İsim", "Güzergah", "Durak", "Telefon", "Departman" };

            for (int i = 0; i < headers.Length; i++)
            {
                sheet.Cells[1, i + 1].Value = headers[i];
                sheet.Cells[1, i + 1].Style.Font.Bold = true;
                sheet.Cells[1, i + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                sheet.Cells[1, i + 1].Style.Fill.BackgroundColor.SetColor(Color.LightGray);
            }

            var query =
                from log in loglar
                join p in personeller on log.PersonelId equals p.Id
                join d in duraklar on log.DurakId equals d.Id
                join g in guzergahlar on d.GuzergahId equals g.Id
                where log.VardiyaId == vardiya.Id && log.pazar == pazar
                orderby g.Id, d.DurakNo
                select new
                {
                    p.SicilNo,
                    p.AdSoyad,
                    g.GuzergahAdi,
                    d.DurakAdi,
                    p.TelefonNumarasi,
                    p.Departman,
                    GuzergahId = g.Id
                };

            int row = 2;
            Guid? currentGuzergah = null;
            int sayac = 0;

            foreach (var item in query)
            {
                if (currentGuzergah != null && currentGuzergah != item.GuzergahId)
                {
                    WriteToplamRow(sheet, row++, sayac);
                    sayac = 0;
                }

                sheet.Cells[row, 1].Value = item.SicilNo;
                sheet.Cells[row, 2].Value = item.AdSoyad;
                sheet.Cells[row, 3].Value = item.GuzergahAdi;
                sheet.Cells[row, 4].Value = item.DurakAdi;
                sheet.Cells[row, 5].Value = item.TelefonNumarasi;
                sheet.Cells[row, 6].Value = item.Departman;

                currentGuzergah = item.GuzergahId;
                sayac++;
                row++;
            }

            if (currentGuzergah != null)
                WriteToplamRow(sheet, row, sayac);

            sheet.Cells[sheet.Dimension.Address].AutoFitColumns();
        }

        /* =======================
        2️⃣ GİRİŞ SAYFASI
        ======================= */

        var girisSheet = package.Workbook.Worksheets.Add("Giriş");

        string[] girisHeaders = { "Sicil", "İsim", "Güzergah", "Durak", "Telefon", "Departman" };

        for (int i = 0; i < girisHeaders.Length; i++)
        {
            girisSheet.Cells[1, i + 1].Value = girisHeaders[i];
            girisSheet.Cells[1, i + 1].Style.Font.Bold = true;
            girisSheet.Cells[1, i + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
            girisSheet.Cells[1, i + 1].Style.Fill.BackgroundColor.SetColor(Color.LightGray);
        }

        var girisQuery =
            from log in loglar
            join p in personeller on log.PersonelId equals p.Id
            join d in duraklar on log.DurakId equals d.Id
            join g in guzergahlar on d.GuzergahId equals g.Id
            join v in vardiyalar on log.VardiyaId equals v.Id
            where log.pazar == pazar && (v.VardiyaAdi == "07:30 - 17:30" || v.VardiyaAdi == "07:30 - 15:30")
            orderby g.Id, d.DurakNo
            select new
            {
                p.SicilNo,
                p.AdSoyad,
                g.GuzergahAdi,
                d.DurakAdi,
                p.TelefonNumarasi,
                p.Departman,
                GuzergahId = g.Id
            };

        int gRow = 2;
        Guid? currentGuzergahGiris = null;
        int girisSayac = 0;

        foreach (var item in girisQuery)
        {
            if (currentGuzergahGiris != null && currentGuzergahGiris != item.GuzergahId)
            {
                WriteToplamRow(girisSheet, gRow++, girisSayac);
                girisSayac = 0;
            }

            girisSheet.Cells[gRow, 1].Value = item.SicilNo;
            girisSheet.Cells[gRow, 2].Value = item.AdSoyad;
            girisSheet.Cells[gRow, 3].Value = item.GuzergahAdi;
            girisSheet.Cells[gRow, 4].Value = item.DurakAdi;
            girisSheet.Cells[gRow, 5].Value = item.TelefonNumarasi;
            girisSheet.Cells[gRow, 6].Value = item.Departman;

            currentGuzergahGiris = item.GuzergahId;
            girisSayac++;
            gRow++;
        }

        if (currentGuzergahGiris != null)
            WriteToplamRow(girisSheet, gRow, girisSayac);

        girisSheet.Cells[girisSheet.Dimension.Address].AutoFitColumns();


        /* =======================
           3️⃣ DEPARTMAN ÖZET
        ======================= */

        var deptSheet = package.Workbook.Worksheets.Add("Departman Özeti");

        deptSheet.Cells[1, 1].Value = "Departman";
        deptSheet.Cells[1, 2].Value = "Kişi Sayısı";

        var deptQuery =
            loglar
            .Join(personeller, l => l.PersonelId, p => p.Id, (l, p) => p.Departman)
            .GroupBy(x => x)
            .Select(x => new { Departman = x.Key, Sayı = x.Count() })
            .OrderBy(x => x.Departman);

        int dRow = 2;
        foreach (var item in deptQuery)
        {
            deptSheet.Cells[dRow, 1].Value = item.Departman;
            deptSheet.Cells[dRow, 2].Value = item.Sayı;
            dRow++;
        }

        deptSheet.Cells[deptSheet.Dimension.Address].AutoFitColumns();

        return package.GetAsByteArray();
    }

    private void WriteToplamRow(ExcelWorksheet sheet, int row, int toplam)
    {
        sheet.Cells[row, 4].Value = $"Toplam: {toplam}";
        sheet.Cells[row, 4].Style.Font.Bold = true;
        sheet.Cells[row, 1, row, 6].Style.Fill.PatternType = ExcelFillStyle.Solid;
        sheet.Cells[row, 1, row, 6].Style.Fill.BackgroundColor.SetColor(Color.LightGray);
    }
}
