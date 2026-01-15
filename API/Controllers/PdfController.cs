// Controllers/PdfController.cs
using API.Entities;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using UglyToad.PdfPig;

namespace API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PdfController : ControllerBase
    {
        // Yalnızca para birimi sembolü veya kodu olan sayıları yakalamak için yeni regex
        private static readonly Regex MoneyRegex = new Regex(
            @"(?<num>(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{2})?)\s*(?<cur>TL|₺|TRY|EUR|€|\$)",
            RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

        [HttpPost("PdfTutarlarCsv")]
        [RequestSizeLimit(50_000_000)] // 50MB
        public async Task<IActionResult> PdfTutarlarCsv([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("PDF dosyası göndermelisiniz.");

            await using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            ms.Position = 0;

            var items = new List<PdfAmountItem>();

            using (var pdf = PdfDocument.Open(ms))
            {
                foreach (var page in pdf.GetPages())
                {
                    var fullText = page.Text ?? string.Empty;
                    var lines = fullText.Split(new[] { "\r\n", "\n", "\r" }, StringSplitOptions.None);

                    foreach (var line in lines)
                    {
                        foreach (Match m in MoneyRegex.Matches(line))
                        {
                            var raw = m.Value.Trim();
                            var cur = NormalizeCurrency(m.Groups["cur"].Value);

                            if (TryParseMoney(m.Groups["num"].Value, out var amount))
                            {
                                items.Add(new PdfAmountItem
                                {
                                    Page = page.Number,
                                    Line = line.Trim(),
                                    RawMatch = raw,
                                    Amount = amount,
                                    Currency = cur
                                });
                            }
                        }
                    }
                }
            }

            if (!items.Any())
                return NotFound("PDF içinde tutar bulunamadı.");

            // CSV oluştur
            var csv = new StringBuilder();
            csv.AppendLine("Page,Line,RawMatch,Amount,Currency");
            foreach (var item in items)
            {
                var line = $"\"{item.Page}\",\"{item.Line.Replace("\"", "\"\"")}\",\"{item.RawMatch.Replace("\"", "\"\"")}\",\"{item.Amount}\",\"{item.Currency}\"";
                csv.AppendLine(line);
            }

            var bytes = Encoding.UTF8.GetBytes(csv.ToString());
            return File(bytes, "text/csv", $"pdf_tutarlar_{DateTime.Now:yyyyMMdd_HHmmss}.csv");
        }

        private static string NormalizeCurrency(string cur)
        {
            cur = cur?.Trim().ToUpperInvariant() ?? "";
            if (string.IsNullOrEmpty(cur)) return "TRY";
            if (cur.Contains("₺") || cur == "TL" || cur == "TRY") return "TRY";
            if (cur.Contains("€")) return "EUR";
            if (cur.Contains("$")) return "USD";
            return cur;
        }

        private static bool TryParseMoney(string s, out decimal value)
        {
            s = s.Trim();
            // Türkçe format: binlik ayıracı nokta, ondalık ayıracı virgül
            var trCulture = new CultureInfo("tr-TR");
            if (decimal.TryParse(s, NumberStyles.Number, trCulture, out value))
            {
                return true;
            }

            // İngilizce format: binlik ayıracı virgül, ondalık ayıracı nokta
            var enCulture = CultureInfo.InvariantCulture;
            if (decimal.TryParse(s, NumberStyles.Number, enCulture, out value))
            {
                return true;
            }

            // Eğer hem nokta hem virgül varsa ve TR formatına uymuyorsa, noktalardan kurtulup virgülü noktaya çevirme
            if (s.Contains('.') && s.Contains(','))
            {
                var cleanedString = s.Replace(".", "");
                if (decimal.TryParse(cleanedString, NumberStyles.Number, trCulture, out value))
                {
                    return true;
                }
            }
            
            value = 0;
            return false;
        }
    }
}