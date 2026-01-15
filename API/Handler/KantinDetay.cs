using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Progress.Open4GL.DynamicAPI;
using Progress.Open4GL.Proxy;
using API.Entities;

namespace API.Handler
{
    public class KantinDetay
    {
        private const int BATCH_SIZE = 1000;
        private const int MAX_PARALLELISM = 4;

        public async Task<KantinResult> HandleAsync()
        {
            var kantinListe = new List<Kantin>(112000);
            var sw = Stopwatch.StartNew();

            try
            {
                string cf_serverDb = "AppServerDC";
                string cf_server = "172.16.1.19";
                string cf_port = "29082";
                string cf_appServer = "as-mfg";
                string appsrvUrl = String.Format("{0}://{1}:{2}/{3}", cf_serverDb, cf_server, cf_port, cf_appServer);
                var appsrvConn = new Connection(appsrvUrl, "", "", "");
                Console.WriteLine($"[INFO] Bağlantı kuruluyor: {appsrvUrl}");
                OpenAppObject openAO = new OpenAppObject(appsrvConn, cf_appServer);
                appsrvConn.SessionModel = 1;

                ProDataSetMetaData pro_meta = new ProDataSetMetaData("ds1", null);
                ParamArray parms = new ParamArray(1);
                parms.AddDatasetHandle(0, null, ParamArrayMode.OUTPUT, pro_meta);

                Console.WriteLine("[INFO] us/dl/dlkntfatura.p procedure çağrılıyor...");
                openAO.RunProc("us/dl/dlkntfatura.p", parms);

                var kritikStoklar = parms.GetOutputParameter(0) as DataSet;

                if (kritikStoklar == null || kritikStoklar.Tables.Count == 0)
                {
                    Console.WriteLine("[WARN] dsAmbar null veya boş!");
                    return new KantinResult();
                }

                // === 1. TABLO: Ambar ===
                DataTable table = kritikStoklar.Tables[0];
                Console.WriteLine($"[INFO] Kantin tablosu: {table.Rows.Count} satır");

                // satırları batch’lere böl
                var rows = table.AsEnumerable().ToList();
                var batches = rows
                    .Select((r, i) => new { r, i })
                    .GroupBy(x => x.i / BATCH_SIZE)
                    .Select(g => g.Select(x => x.r).ToList())
                    .ToList();

                var semaphore = new SemaphoreSlim(MAX_PARALLELISM);
                var tasks = batches.Select(b => ProcessBatchAsync(b, semaphore)).ToList();
                var results = await Task.WhenAll(tasks);

                foreach (var result in results)
                    kantinListe.AddRange(result);

                Console.WriteLine($"[INFO] ✓ {kantinListe.Count} kayıt işlendi ({sw.ElapsedMilliseconds} ms)");

                // JSON’a kaydet
                await SaveJsonAsync(kantinListe);

                // Foreign key tabloları oluştur
                var resultData = BuildLookupTables(kantinListe);
                sw.Stop();
                Console.WriteLine($"[INFO] İşlem tamamlandı ({sw.Elapsed.TotalSeconds:N1} sn)");

                return resultData;
            }
            catch (Exception ex)
            {
                sw.Stop();
                Console.WriteLine($"[FATAL] {ex.Message}");
                Debug.WriteLine(ex);
                return new KantinResult();
            }
        }

        private async Task<List<Kantin>> ProcessBatchAsync(List<DataRow> rows, SemaphoreSlim sem)
        {
            await sem.WaitAsync();
            try { return ProcessBatch(rows); }
            finally { sem.Release(); }
        }

        private List<Kantin> ProcessBatch(List<DataRow> rows)
        {
            var list = new List<Kantin>(rows.Count);

            foreach (var r in rows)
            {
                try
                {
                    list.Add(new Kantin
                    {
                        FirmaKodu = SafeString(r, 0),
                        UrunGrubu = SafeString(r, 1),
                        HesapNo = SafeString(r, 2),
                        ParcaKodu = SafeString(r, 3),
                        MusteriUrunKodu = SafeString(r, 4),
                        ParcaAdi = SafeString(r, 5),
                        Satir = SafeString(r, 6),
                        SiparisNo = SafeString(r, 7),
                        SiparisSatir = SafeString(r, 8),
                        IrsaliyeNo = SafeString(r, 9),
                        IrsaliyeTarih = SafeDate(r, 10),
                        FaturaNo = SafeString(r, 11),
                        FaturaTarih = SafeDate(r, 12),
                        FaturaMiktar = SafeDecimal(r, 13),
                        Birim = SafeString(r, 14),
                        UrunKodu = SafeString(r, 15),
                        BirimFiyat = SafeDecimal(r, 16),
                        DovizDegeri = SafeDecimal(r, 17),
                        DovizOrani = SafeDecimal(r, 18),
                        FaturaTRL = SafeDecimal(r, 19),
                        DovizCinsi = SafeString(r, 20),
                        IadeMiktar = SafeDecimal(r, 21),
                        IadeTutar = SafeDecimal(r, 22),
                        YM = SafeString(r, 23),
                        ListeFiyat = SafeDecimal(r, 24),
                        ShipTo = SafeString(r, 25),
                        ListeParaBirimi = SafeString(r, 26),
                        PlanAciklama = SafeString(r, 27),
                        Grup = SafeString(r, 28),
                        Maliyet = SafeDecimal(r, 29),
                        Tip = SafeString(r, 30),
                        Vergi = SafeString(r, 31),
                        TedarikciAdi = SafeString(r, 32),
                        ProdLine = SafeString(r, 33),
                        GibNo = SafeString(r, 34),
                        Malzeme = SafeDecimal(r, 35),
                        Diger = SafeDecimal(r, 36)
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ERROR] Satır hatası: {ex.Message}");
                }
            }

            return list;
        }

        private KantinResult BuildLookupTables(List<Kantin> kantinListe)
        {
            var result = new KantinResult
            {
                KantinListe = kantinListe,

                Tarihler = kantinListe
                    .Where(x => x.FaturaTarih.HasValue)
                    .Select(x => x.FaturaTarih!.Value.Date)
                    .Distinct()
                    .OrderBy(x => x)
                    .Select(t => new API.Entities.Tarih { TarihValue = t })
                    .ToList(),

                Parcalar = kantinListe
                    .GroupBy(x => new { x.ParcaKodu, x.ParcaAdi })
                    .Select(g => new API.Entities.Parca { ParcaKodu = g.Key.ParcaKodu, ParcaAdi = g.Key.ParcaAdi })
                    .ToList(),

                UrunTipleri = kantinListe
                    .Where(x => !string.IsNullOrWhiteSpace(x.Tip))
                    .Select(x => x.Tip.Trim())
                    .Distinct()
                    .Select(t => new API.Entities.UrunTipi { Tip = t })
                    .ToList(),

                UrunGruplari = kantinListe
                    .Where(x => !string.IsNullOrWhiteSpace(x.UrunGrubu))
                    .Select(x => x.UrunGrubu.Trim())
                    .Distinct()
                    .Select(g => new API.Entities.UrunGrubu { UrunGrubuAdi = g })
                    .ToList(),

                Musteriler = kantinListe
                    .Where(x => !string.IsNullOrWhiteSpace(x.ShipTo))
                    .Select(x => x.ShipTo.Trim())
                    .Distinct()
                    .Select(m => new API.Entities.Musteri { ShipTo = m })
                    .ToList(),

                HareketTipleri = kantinListe
                    .Where(x => !string.IsNullOrWhiteSpace(x.YM))
                    .Select(x => x.YM.Trim())
                    .Distinct()
            .Select(h => new API.Entities.HareketTipi { Tip = h })
                    .ToList()
            };

            Console.WriteLine($"[INFO] Lookup tablolar oluşturuldu: " +
                $"Tarih({result.Tarihler.Count}), Parça({result.Parcalar.Count}), " +
                $"Ürün Tipi({result.UrunTipleri.Count}), Ürün Grubu({result.UrunGruplari.Count}), " +
                $"Müşteri({result.Musteriler.Count}), Hareket Tipi({result.HareketTipleri.Count})");

            return result;
        }

        private async Task SaveJsonAsync(List<Kantin> data)
        {
            try
            {
                var dir = Path.Combine(AppContext.BaseDirectory, "logs");
                Directory.CreateDirectory(dir);

                var file = Path.Combine(dir, $"kantin_detay_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json");

                var opt = new JsonSerializerOptions
                {
                    WriteIndented = true,
                    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
                };

                using var fs = File.Create(file);
                await JsonSerializer.SerializeAsync(fs, data, opt);
                await fs.FlushAsync();

                Console.WriteLine($"[INFO] JSON kayıt: {file}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WARN] JSON kaydedilemedi: {ex.Message}");
            }
        }

        private static string SafeString(DataRow row, int idx)
        {
            if (row == null || idx < 0 || idx >= row.ItemArray.Length) return string.Empty;
            var val = row[idx];
            return val == DBNull.Value ? string.Empty : val?.ToString()?.Trim() ?? string.Empty;
        }

        private static decimal SafeDecimal(DataRow row, int idx)
        {
            if (row == null || idx < 0 || idx >= row.ItemArray.Length) return 0;
            var val = row[idx];
            return val == DBNull.Value ? 0 : decimal.TryParse(val.ToString(), out var d) ? d : 0;
        }

        private static DateTime? SafeDate(DataRow row, int idx)
        {
            if (row == null || idx < 0 || idx >= row.ItemArray.Length || row.IsNull(idx)) return null;
            var str = row[idx]?.ToString()?.Trim();
            if (DateTime.TryParse(str, out var dt)) return dt;
            if (DateTime.TryParseExact(str, new[] { "yyyyMMdd", "ddMMyyyy", "dd.MM.yyyy", "yyyy-MM-dd", "dd/MM/yyyy" },
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out dt))
                return dt;
            return null;
        }
    }

    public class KantinResult
    {
        public List<Kantin> KantinListe { get; set; } = new();
    public List<API.Entities.Tarih> Tarihler { get; set; } = new();
    public List<API.Entities.Parca> Parcalar { get; set; } = new();
    public List<API.Entities.UrunTipi> UrunTipleri { get; set; } = new();
    public List<API.Entities.UrunGrubu> UrunGruplari { get; set; } = new();
    public List<API.Entities.Musteri> Musteriler { get; set; } = new();
    public List<API.Entities.HareketTipi> HareketTipleri { get; set; } = new();
    }
}
