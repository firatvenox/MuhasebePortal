using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Handler
{
    /// <summary>
    /// Sadece API'den geciken taşıma verisini çeker ve entity'ye map eder.
    /// ERMPlaSureler ile eşleştirme işi EnrichedGecikenTasimalarHandler içinde yapılıyor.
    /// </summary>
    public class GecikenTasimalarHandler
    {

        public async Task<List<GecikenTasimalar>> HandleAsync(DateTime startDate, DateTime endDate, string atolye)
        {
            string API_BASE_URL = $"https://172.16.1.149/{atolye}/tr/ExportData/getDelayedTransports";


            var result = new List<GecikenTasimalar>();
            var sw = Stopwatch.StartNew();

            try
            {
                string start = startDate.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
                string end = endDate.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
                
                string url = $"{API_BASE_URL}/{start}/{end}";

                Console.WriteLine($"[INFO] API çağrılıyor: {url}");

                // SSL sertifikası doğrulamasını devre dışı bırak (test ortamı için)
                HttpClientHandler handler = new();
                handler.ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true;
                using var client = new HttpClient(handler);

                var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[ERROR] API hatası: {response.StatusCode} - {response.ReasonPhrase}");
                    return result;
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[INFO] {jsonContent.Length} byte veri alındı");

                // JSON parse et
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
                    WriteIndented = false
                };

                var parsed = JsonSerializer.Deserialize<List<GecikenTasimalarDto>>(jsonContent, options);

                if (parsed == null || parsed.Count == 0)
                {
                    Console.WriteLine("[WARN] API boş veri döndü.");
                    return result;
                }

                // Entity'ye map et
                result = parsed.Select(MapToEntity).ToList();
                sw.Stop();

                Console.WriteLine($"[INFO] ✓ {result.Count} kayıt işlendi ({sw.ElapsedMilliseconds} ms)");
                return result;
            }
            catch (Exception ex)
            {
                sw.Stop();
                Console.WriteLine($"[FATAL] {ex.Message}");
                Debug.WriteLine(ex);
                return result;
            }
        }

        private GecikenTasimalar MapToEntity(GecikenTasimalarDto dto)
        {
            return new GecikenTasimalar
            {
                id = SafeInt(dto.id),
                sicil = SafeString(dto.sicil),
                adsoyad = SafeString(dto.adsoyad),
                tasiyici = SafeString(dto.tasiyici),
                tasktype = SafeString(dto.tasktype),
                erprefnumber = SafeString(dto.erprefnumber),
                code = (SafeString(dto.code) ?? "").Replace("E|", ""),
                stockcode = SafeString(dto.stockcode),
                opno = SafeInt(dto.opno),
                kasa = SafeString(dto.kasa),
                kasaici = SafeString(dto.kasaici),
                cikis = SafeString(dto.cikis),
                varis = SafeString(dto.varis),
                baslangic = SafeDateTime(dto.baslangic),
                atama = SafeDateTime(dto.atama),
                bitis = SafeDateTime(dto.bitis),
                hedef = SafeString(dto.hedef),
                sure = SafeString(dto.sure),
                suresicil = SafeString(dto.suresicil),
                molasuresi = SafeString(dto.molasuresi),
                netsureis = SafeString(dto.netsureis),
                netsuresicil = SafeString(dto.netsuresicil),
                yapilma = SafeString(dto.yapilma),
                yapilmadk = SafeInt(dto.yapilmadk),
                yapilmasicil = SafeString(dto.yapilmasicil),
                yapilmasicildk = SafeInt(dto.yapilmasicildk),
                DegisimSuresi = SafeInt(dto.DegisimSuresi),
                Tarih = SafeDateTime(dto.Tarih),
                OturumAcma = SafeString(dto.OturumAcma),
                OturumKapatma = SafeString(dto.OturumKapatma),
                Vardiya = SafeString(dto.Vardiya),
                VardiyaEkibi = SafeString(dto.VardiyaEkibi)
            };
        }

        private static string? SafeString(object? value)
        {
            if (value == null) return null;
            var str = value.ToString()?.Trim();
            return string.IsNullOrWhiteSpace(str) ? null : str;
        }

        private static int? SafeInt(object? value)
        {
            if (value == null) return null;
            if (int.TryParse(value.ToString(), out var result)) return result;
            return null;
        }

        private static DateTime? SafeDateTime(object? value)
        {
            if (value == null) return null;
            var str = value.ToString()?.Trim();
            if (string.IsNullOrWhiteSpace(str)) return null;

            if (DateTime.TryParse(str, out var dt)) return dt;
            if (DateTime.TryParseExact(str,
                    new[] { "yyyy-MM-dd HH:mm:ss", "yyyyMMdd", "ddMMyyyy", "dd.MM.yyyy", "yyyy-MM-dd", "dd/MM/yyyy" },
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None,
                    out dt))
                return dt;

            return null;
        }
    }

    // DTO sınıfı JSON deserialize için
    public class GecikenTasimalarDto
    {
        [JsonPropertyName("id")]
        public object? id { get; set; }

        [JsonPropertyName("sicil")]
        public string? sicil { get; set; }

        [JsonPropertyName("adsoyad")]
        public string? adsoyad { get; set; }

        [JsonPropertyName("tasiyici")]
        public string? tasiyici { get; set; }

        [JsonPropertyName("tasktype")]
        public string? tasktype { get; set; }

        [JsonPropertyName("erprefnumber")]
        public string? erprefnumber { get; set; }

        [JsonPropertyName("code")]
        public string? code { get; set; }

        [JsonPropertyName("stockcode")]
        public string? stockcode { get; set; }

        [JsonPropertyName("opno")]
        public object? opno { get; set; }

        [JsonPropertyName("kasa")]
        public string? kasa { get; set; }

        [JsonPropertyName("kasaici")]
        public string? kasaici { get; set; }

        [JsonPropertyName("cikis")]
        public string? cikis { get; set; }

        [JsonPropertyName("varis")]
        public string? varis { get; set; }

        [JsonPropertyName("baslangic")]
        public string? baslangic { get; set; }

        [JsonPropertyName("atama")]
        public string? atama { get; set; }

        [JsonPropertyName("bitis")]
        public string? bitis { get; set; }

        [JsonPropertyName("hedef")]
        public string? hedef { get; set; }

        [JsonPropertyName("sure")]
        public string? sure { get; set; }

        [JsonPropertyName("suresicil")]
        public string? suresicil { get; set; }

        [JsonPropertyName("molasuresi")]
        public string? molasuresi { get; set; }

        [JsonPropertyName("netsureis")]
        public string? netsureis { get; set; }

        [JsonPropertyName("netsuresicil")]
        public string? netsuresicil { get; set; }

        [JsonPropertyName("yapilma")]
        public string? yapilma { get; set; }

        [JsonPropertyName("yapilmadk")]
        public object? yapilmadk { get; set; }

        [JsonPropertyName("yapilmasicil")]
        public string? yapilmasicil { get; set; }

        [JsonPropertyName("yapilmasicildk")]
        public object? yapilmasicildk { get; set; }

        [JsonPropertyName("Değişim Süresi")]
        public object? DegisimSuresi { get; set; }

        [JsonPropertyName("Tarih")]
        public string? Tarih { get; set; }

        [JsonPropertyName("Oturum Açma")]
        public string? OturumAcma { get; set; }

        [JsonPropertyName("Oturum Kapatma")]
        public string? OturumKapatma { get; set; }

        [JsonPropertyName("Vardiya")]
        public string? Vardiya { get; set; }

        [JsonPropertyName("Vardiya Ekibi")]
        public string? VardiyaEkibi { get; set; }
    }


    public class EnrichedDelayedTransportResult
        {   
            public List<GecikenTasimalar> DelayedTransports { get; set; } = new();
            public List<ERMPLASureler> ERMPLASureData { get; set; } = new();
            public Dictionary<string, List<ERMPLASureler>> TransportTimingSummary { get; set; } = new();
            public Dictionary<string, int> TransportTimingTotals { get; set; } = new();
        }


    public class EnrichedGecikenTasimalarHandler
    {
        private readonly MsContext _context;
        private readonly GecikenTasimalarHandler _handler;

        public EnrichedGecikenTasimalarHandler(MsContext context)
        {
            _context = context;
            _handler = new GecikenTasimalarHandler();
        }

        public async Task<List<GecikenTasimalar>> HandleWithTimingAsync(DateTime startDate, DateTime endDate, string atolye)
        {

            // 1) API'den geciken taşıma verilerini çek
            var delayedTransports = await _handler.HandleAsync(startDate, endDate, atolye);

            // 2) ERMPLASureler'den aktif süre verisini çek
            var ermSureData = await _context.ERMPLASureler
                .Where(x => x.durum == true && x.atolye == atolye)
                .AsNoTracking()
                .ToListAsync();

            var resultList = new List<GecikenTasimalar>();

            foreach (var transport in delayedTransports)
            {
                // Gerekli alanlar boşsa bu kaydı geç
                if (string.IsNullOrWhiteSpace(transport.tasktype) ||
                    string.IsNullOrWhiteSpace(transport.cikis) ||
                    string.IsNullOrWhiteSpace(transport.varis))
                {
                    continue;
                }

                var taskType = transport.tasktype.Trim();
                var cikis = transport.cikis.Trim();
                var makine = transport.varis.Trim();

                // ---- ADIM 1 ----
                // taskType, cikis, makine ve statu boş olmayanları filtrele
                var baseSet = ermSureData
                    .Where(x =>
                        x.taskType == taskType &&
                        x.cikis == cikis &&
                        x.makine == makine &&
                        x.atolye == atolye &&
                        !string.IsNullOrWhiteSpace(x.statu))
                    .ToList();

                if (!baseSet.Any())
                {
                    transport.toplamSure = 0;
                    resultList.Add(transport);
                    continue;
                }

                // ---- ADIM 2 ----
                // Base set içindeki statu'leri virgülden böl, trimle, DISTINCT et
                // Örn: "1,2,6,7" ve "6,7" -> { "1","2","6","7" }
                var distinctStatuValues = baseSet
                    .SelectMany(row => (row.statu ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries))
                    .Select(v => v.Trim())
                    .Where(v => !string.IsNullOrWhiteSpace(v))
                    .Distinct()
                    .ToHashSet();

                // ---- ADIM 3 ----
                // statuNo'yu bu distinct değerlerle eşleştir
                // ve aynı taskType + cikis + makine filtresiyle süreleri topla
                var matchedRows = ermSureData
                    .Where(x =>
                        x.taskType == taskType &&
                        x.cikis == cikis &&
                        x.makine == makine &&
                        x.atolye == atolye &&
                        !string.IsNullOrWhiteSpace(x.statuNo) &&
                        distinctStatuValues.Contains(x.statuNo.Trim()))
                    .ToList();

                transport.toplamSure = matchedRows.Sum(x => x.sure);
                resultList.Add(transport);
            }

            var grouped = resultList
                .Where(x => !string.IsNullOrWhiteSpace(x.code))
                .GroupBy(x => new { x.code, x.cikis }) 
                .Select(g => new GecikenTasimalar
                {
                    code = g.Key.code,
                    cikis = g.Key.cikis,
                    toplamSure = g.Sum(x => x.toplamSure) / 60,

                    sicil = g.First().sicil,
                    adsoyad = g.First().adsoyad,
                    tasiyici = g.First().tasiyici,
                    tasktype = g.First().tasktype,
                    varis = g.First().varis,
                    stockcode = g.First().stockcode
                })
                .ToList();

            return grouped.Where(a => a.toplamSure > 0).ToList();
        }
    }



    public class EnrichedGecikenTasimalarKaynak3Handler
    {
        private readonly MsContext _context;
        private readonly GecikenTasimalarHandler _handler;

        public EnrichedGecikenTasimalarKaynak3Handler(MsContext context)
        {
            _context = context;
            _handler = new GecikenTasimalarHandler();
        }

        public async Task<List<GecikenTasimalar>> HandleWithTimingAsync(DateTime startDate, DateTime endDate, string atolye)
        {
            atolye = "kaynak3";
            // 1) API'den geciken taşıma verilerini çek
            var delayedTransports = await _handler.HandleAsync(startDate, endDate, "kaynak2");

            // 2) ERMPLASureler'den aktif süre verisini çek
            var ermSureData = await _context.ERMPLASureler
                .Where(x => x.durum == true && x.atolye == atolye)
                .AsNoTracking()
                .ToListAsync();

            var resultList = new List<GecikenTasimalar>();

            foreach (var transport in delayedTransports)
            {
                // Gerekli alanlar boşsa bu kaydı geç
                if (string.IsNullOrWhiteSpace(transport.tasktype) ||
                    string.IsNullOrWhiteSpace(transport.cikis) ||
                    string.IsNullOrWhiteSpace(transport.varis))
                {
                    continue;
                }

                var taskType = transport.tasktype.Trim();
                var cikis = transport.cikis.Trim();
                var makine = transport.varis.Trim();

                // ---- ADIM 1 ----
                // taskType, cikis, makine ve statu boş olmayanları filtrele
                var baseSet = ermSureData
                    .Where(x =>
                        x.taskType == taskType &&
                        x.cikis == cikis &&
                        x.makine == makine &&
                        x.atolye == atolye &&
                        !string.IsNullOrWhiteSpace(x.statu))
                    .ToList();

                if (!baseSet.Any())
                {
                    transport.toplamSure = 0;
                    resultList.Add(transport);
                    continue;
                }

                // ---- ADIM 2 ----
                // Base set içindeki statu'leri virgülden böl, trimle, DISTINCT et
                // Örn: "1,2,6,7" ve "6,7" -> { "1","2","6","7" }
                var distinctStatuValues = baseSet
                    .SelectMany(row => (row.statu ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries))
                    .Select(v => v.Trim())
                    .Where(v => !string.IsNullOrWhiteSpace(v))
                    .Distinct()
                    .ToHashSet();

                // ---- ADIM 3 ----
                // statuNo'yu bu distinct değerlerle eşleştir
                // ve aynı taskType + cikis + makine filtresiyle süreleri topla
                var matchedRows = ermSureData
                    .Where(x =>
                        x.taskType == taskType &&
                        x.cikis == cikis &&
                        x.makine == makine &&
                        x.atolye == atolye &&
                        !string.IsNullOrWhiteSpace(x.statuNo) &&
                        distinctStatuValues.Contains(x.statuNo.Trim()))
                    .ToList();

                transport.toplamSure = matchedRows.Sum(x => x.sure);
                resultList.Add(transport);
            }

            var grouped = resultList
                .Where(x => !string.IsNullOrWhiteSpace(x.code))
                .GroupBy(x => new { x.code, x.cikis }) 
                .Select(g => new GecikenTasimalar
                {
                    code = g.Key.code,
                    cikis = g.Key.cikis,
                    toplamSure = g.Sum(x => x.toplamSure) / 60,

                    sicil = g.First().sicil,
                    adsoyad = g.First().adsoyad,
                    tasiyici = g.First().tasiyici,
                    tasktype = g.First().tasktype,
                    varis = g.First().varis,
                    stockcode = g.First().stockcode
                })
                .ToList();

            return grouped.Where(a => a.toplamSure > 0).ToList();
        }
    }


}
