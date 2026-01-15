using API.Entities;
using System.Data;
using System.Diagnostics;
using Progress.Open4GL.Proxy;
using API.Entities.Dto;
using UglyToad.PdfPig.Fonts.Encodings;

namespace API.Handler
{
    public class SatisRaporuMaliyetliPlasmot
    {
        public List<SatisRaporuPlasmot> Handle(DateTime fatdate, DateTime fatdate1,
                                        DateTime gun, DateTime gun1, Decimal yonetimOran)
        {
            List<SatisRaporuPlasmot> veriler = new();
            List<CSL> cslTutarlar = new();
            List<Tutar> tutarlar = new();

           try
            {
                string cf_serverDb = "AppServerDC";
                string cf_server = "172.16.1.19";
                string cf_port = "28082";
                string cf_appServer = "as-mfg";
                string appsrvUrl = String.Format("{0}://{1}:{2}/{3}", cf_serverDb, cf_server, cf_port, cf_appServer);
                var appsrvConn = new Connection(appsrvUrl, "", "", "");

                Console.WriteLine($"[INFO] Bağlantı kuruluyor: {appsrvUrl}");
                OpenAppObject openAO = new OpenAppObject(appsrvConn, cf_appServer);
                appsrvConn.SessionModel = 1;

                ProDataSetMetaData pro_meta = new ProDataSetMetaData("", null);
                ProDataSetMetaData pro_meta2 = new ProDataSetMetaData("", null);

                // Parametre seti
                ParamArray parms = new ParamArray(3); // p filddaki toplam parametre sayısı - input outputların toplamı
                parms.AddDate(0, fatdate, ParamArrayMode.INPUT);
                parms.AddDate(1, fatdate1, ParamArrayMode.INPUT);
                parms.AddDatasetHandle(2, null, ParamArrayMode.OUTPUT, pro_meta);

                Console.WriteLine("[INFO] us/dl/dlcslrap.p procedure çağrılıyor...");
                openAO.RunProc("us/dl/dlcslrap.p", parms);

                if (parms.GetOutputParameter(2) is not DataSet ds)
                {
                    Console.WriteLine("[WARN] Dataset null döndü!");
                    return veriler;
                }

                if (ds.Tables.Count == 0)
                {
                    Console.WriteLine("[WARN] Dataset içinde tablo yok!");
                    
                    return veriler;
                }

                DataTable dt = ds.Tables[0];
                Console.WriteLine($"[INFO] {dt.Rows.Count} satır alındı.");

                foreach (DataRow row in dt.Rows)
                {
                    try
                    {
                        var entity = new CSL
                        {
                            part = SafeString(row, 0),
                            cslmiktar = SafeDecimal(row, 1),
                            
                        };

                        cslTutarlar.Add(entity);
                    }
                    catch (Exception rowEx)
                    {
                        Console.WriteLine($"[ERROR] Satır işlenemedi: {rowEx.Message}");
                        Debug.WriteLine(rowEx.ToString());
                    }
                }

            }
            catch (Exception ex)
            {
                Console.WriteLine("[FATAL] Hata: " + ex.Message);
                Debug.WriteLine(ex.ToString());
            }


            try
            {
                string cf_serverDb = "AppServerDC";
                string cf_server = "172.16.1.19";
                string cf_port = "28082";
                string cf_appServer = "as-mfg";
                string appsrvUrl = String.Format("{0}://{1}:{2}/{3}", cf_serverDb, cf_server, cf_port, cf_appServer);
                var appsrvConn = new Connection(appsrvUrl, "", "", "");

                Console.WriteLine($"[INFO] Bağlantı kuruluyor: {appsrvUrl}");
                OpenAppObject openAO = new OpenAppObject(appsrvConn, cf_appServer);
                appsrvConn.SessionModel = 1;

                ProDataSetMetaData pro_meta = new ProDataSetMetaData("", null);
                ProDataSetMetaData pro_meta2 = new ProDataSetMetaData("", null);

                // Parametre seti
                ParamArray parms = new ParamArray(3); // p filddaki toplam parametre sayısı - input outputların toplamı
                parms.AddDate(0, fatdate, ParamArrayMode.INPUT);
                parms.AddDate(1, fatdate1, ParamArrayMode.INPUT);
                parms.AddDatasetHandle(2, null, ParamArrayMode.OUTPUT, pro_meta);

                Console.WriteLine("[INFO] us/dl/dliskarta.p procedure çağrılıyor...");
                openAO.RunProc("us/dl/dliskarta.p", parms);

                if (parms.GetOutputParameter(2) is not DataSet ds)
                {
                    Console.WriteLine("[WARN] Dataset null döndü!");
                    return veriler;
                }

                if (ds.Tables.Count == 0)
                {
                    Console.WriteLine("[WARN] Dataset içinde tablo yok!");

                    return veriler;
                }

                DataTable dt = ds.Tables[0];
                Console.WriteLine($"[INFO] {dt.Rows.Count} satır alındı.");

                foreach (DataRow row in dt.Rows)
                {
                    try
                    {
                        var entity = new Tutar
                        {
                            part = SafeString(row, 0),
                            tutar = SafeDecimal(row, 1),
                            aciklama = SafeString(row, 2),
                            firma = SafeString(row, 3),
                        };

                        tutarlar.Add(entity);
                    }
                    catch (Exception rowEx)
                    {
                        Console.WriteLine($"[ERROR] Satır işlenemedi: {rowEx.Message}");
                        Debug.WriteLine(rowEx.ToString());
                    }
                }

            }
            catch (Exception ex)
            {
                Console.WriteLine("[FATAL] Hata: " + ex.Message);
                Debug.WriteLine(ex.ToString());
            }

            try
            {
                string cf_serverDb = "AppServerDC";
                string cf_server = "172.16.1.19";
                string cf_port = "28082";
                string cf_appServer = "as-mfg";
                string appsrvUrl = String.Format("{0}://{1}:{2}/{3}", cf_serverDb, cf_server, cf_port, cf_appServer);
                var appsrvConn = new Connection(appsrvUrl, "", "", "");

                Console.WriteLine($"[INFO] Bağlantı kuruluyor: {appsrvUrl}");
                OpenAppObject openAO = new OpenAppObject(appsrvConn, cf_appServer);
                appsrvConn.SessionModel = 1;

                ProDataSetMetaData pro_meta = new ProDataSetMetaData("", null);
                ProDataSetMetaData pro_meta2 = new ProDataSetMetaData("", null);

                // Parametre seti
                ParamArray parms = new ParamArray(5); // p filddaki toplam parametre sayısı - input outputların toplamı
                parms.AddDate(0, fatdate, ParamArrayMode.INPUT);
                parms.AddDate(1, fatdate1, ParamArrayMode.INPUT);
                parms.AddDate(2, gun, ParamArrayMode.INPUT);
                parms.AddDate(3, gun1, ParamArrayMode.INPUT);
                parms.AddDatasetHandle(4, null, ParamArrayMode.OUTPUT, pro_meta);

                Console.WriteLine("[INFO] us/dl/dlsatrap.p procedure çağrılıyor...");
                openAO.RunProc("us/dl/dlsatrap.p", parms);

                if (parms.GetOutputParameter(4) is not DataSet ds)
                {
                    Console.WriteLine("[WARN] Dataset null döndü!");
                    return veriler;
                }

                if (ds.Tables.Count == 0)
                {
                    Console.WriteLine("[WARN] Dataset içinde tablo yok!");
                    return veriler;
                }

                DataTable dt = ds.Tables[0];
                Console.WriteLine($"[INFO] {dt.Rows.Count} satır alındı.");

                foreach (DataRow row in dt.Rows)
                {
                    try
                    {
                        var entity = new SatisRaporuPlasmot
                        {
                            temp5_xfirma = SafeString(row, 0),
                            temp5_xpart = SafeString(row, 1),
                            temp5_cmsort = SafeString(row, 2),
                            temp5_xgrup = SafeString(row, 3),
                            temp5_xUM = SafeString(row, 4),
                            temp5_xtop = SafeDecimal(row, 5),
                            temp5_brfiyat = SafeDecimal(row, 6),
                            temp5_eskbrfiyat = 0,
                            temp5_malzeme = SafeDecimal(row, 8),
                            temp5_xgeneltop = SafeDecimal(row, 6) * SafeDecimal(row, 5),
                            temp5_xlistfiy = SafeDecimal(row, 10),
                            temp5_xlistcurr = SafeString(row, 11),
                            temp5_iscilik = SafeDecimal(row, 12),
                            temp5_ek = SafeDecimal(row, 13),
                            temp5_urungrubu = SafeString(row, 14),
                            temp5_toplammaliyet = SafeDecimal(row, 15),
                            temp5_toplamMalzeme = SafeDecimal(row, 16),
                            temp5_toplammal = SafeDecimal(row, 17),
                            temp5_yonetimToplam = 0,
                            temp5_iskarta = SafeDecimal(row, 19),
                        };

                        veriler.Add(entity);
                    }
                    catch (Exception rowEx)
                    {
                        Console.WriteLine($"[ERROR] Satır işlenemedi: {rowEx.Message}");
                        Debug.WriteLine(rowEx.ToString());
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("[FATAL] Hata: " + ex.Message);
                Debug.WriteLine(ex.ToString());
            }

            // Önce firmalara göre grupla
            var firmalaraGoreGruplar = veriler
                .GroupBy(v => v.temp5_xfirma)
                .ToList();
            decimal? dipToplam = 0;

            // --- Dip toplam ve toplam malzeme
            foreach (var item in veriler)
            {
                dipToplam += (((item.temp5_malzeme ?? 0m) + (item.temp5_iscilik ?? 0m) + item.temp5_ek) * item.temp5_xtop);
                item.temp5_toplamMalzeme = ((item.temp5_malzeme ?? 0m) + (item.temp5_iskarta ?? 0m)) * item.temp5_xtop;
            }

            decimal? formul1 = 0;
            decimal? yonetimToplam = 0;

            foreach (var item in veriler)
            {
                formul1 = (((item.temp5_malzeme ?? 0m) + (item.temp5_iscilik ?? 0m) + item.temp5_ek) * item.temp5_xtop);

                if ((dipToplam ?? 0m) != 0 && item.temp5_xtop != 0)
                    yonetimToplam = ((formul1 / dipToplam) * yonetimOran) / item.temp5_xtop;
                else
                    yonetimToplam = 0;

                item.temp5_yonetimToplam = yonetimToplam;
                item.temp5_toplammal = ((item.temp5_iskarta ?? 0m) + (item.temp5_malzeme ?? 0m) + (item.temp5_iscilik ?? 0m) + item.temp5_ek + yonetimToplam) * item.temp5_xtop;
                item.temp5_toplammaliyet = (item.temp5_iskarta ?? 0m) + (item.temp5_malzeme ?? 0m) + (item.temp5_iscilik ?? 0m) + item.temp5_ek + yonetimToplam;
            }

            foreach (var item in cslTutarlar)
            {
                var satisItem = veriler.FirstOrDefault(v => v.temp5_xpart == item.part);
                if (satisItem != null)
                {
                    satisItem.temp5_csl = item.cslmiktar / (satisItem.temp5_xtop ?? 1);
                }
            }

            return veriler.OrderByDescending(a => a.temp5_xpart).ToList();
        }

        private static string? SafeString(DataRow row, int index)
        {
            return row[index] == DBNull.Value ? "" : row[index]?.ToString().Trim();
        }
        private static decimal SafeDecimal(DataRow row, int index)
        {
            if (row[index] == DBNull.Value) return 0;
            return decimal.TryParse(row[index].ToString(), out decimal val) ? val : 0;
        }
    }
}
