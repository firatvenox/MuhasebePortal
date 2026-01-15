using API.Entities;
using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using Progress.Open4GL.DynamicAPI;
using Progress.Open4GL.Proxy;

namespace API.Handler
{
    public class SatisRaporuMaliyetli
    {
        public List<SatisRaporu> Handle(DateTime fatdate, DateTime fatdate1,
                                        DateTime gun, DateTime gun1,
                                        decimal amortisman, decimal iskartaOran,
                                        decimal yonetimOran, decimal degiskenOran, decimal sabitOran)
        {
            List<SatisRaporu> veriler = new();

            try
            {
                string cf_serverDb = "AppServerDC";
                string cf_server = "172.16.1.98";
                string cf_port = "22082";
                string cf_appServer = "as-mfg";
                string appsrvUrl = String.Format("{0}://{1}:{2}/{3}", cf_serverDb, cf_server, cf_port, cf_appServer);
                var appsrvConn = new Connection(appsrvUrl, "", "", "");

                Console.WriteLine($"[INFO] Bağlantı kuruluyor: {appsrvUrl}");
                OpenAppObject openAO = new OpenAppObject(appsrvConn, cf_appServer);
                appsrvConn.SessionModel = 1;

                ProDataSetMetaData pro_meta = new ProDataSetMetaData("", null);
                ProDataSetMetaData pro_meta2 = new ProDataSetMetaData("", null);

                // Parametre seti
                ParamArray parms = new ParamArray(7); // p filddaki toplam parametre sayısı - input outputların toplamı
                parms.AddDate(0, fatdate, ParamArrayMode.INPUT);
                parms.AddDate(1, fatdate1, ParamArrayMode.INPUT);
                parms.AddDate(2, gun, ParamArrayMode.INPUT);
                parms.AddDate(3, gun1, ParamArrayMode.INPUT);
                parms.AddDecimal(4, iskartaOran, ParamArrayMode.INPUT);
                parms.AddDecimal(5, yonetimOran, ParamArrayMode.INPUT);
                parms.AddDatasetHandle(6, null, ParamArrayMode.OUTPUT, pro_meta);

                Console.WriteLine("[INFO] us/dl/dlsatrap.p procedure çağrılıyor...");
                openAO.RunProc("us/dl/dlsatrap.p", parms);

                if (parms.GetOutputParameter(6) is not DataSet ds)
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
                        decimal iscilik = SafeDecimal(row, 12);
                        var grup = iscilik >= 0.001m ? "ÜRETİM" : "AL-SAT";
                        var parca = SafeString(row, 1);
                        var cari = SafeString(row, 0);
                        var proje = SafeString(row, 3);
                        var firmaAdi = SafeString(row, 2);
                        var firmaSon = firmaAdi;
                        var catiSon = SafeString(row, 22);
                        // Cari kodu → sabit firma eşleştirmeleri
                        var firmaMap = new Dictionary<string, string>
                        {
                            ["12001441"] = "YAĞ KARTER",
                            ["12002137"] = "YURTDIŞI DİĞER",
                            ["12001004"] = "TOFAŞ TÜRK OTO",
                            ["12001030"] = "COŞKUNÖZ",
                            ["12001295"] = "FAURECIA",
                            ["32001007"] = "BEYÇELİK",
                            ["32001567"] = "SARIGÖZOĞLU",
                            ["12001422"] = "TOGG",
                            ["12001013"] = "TOYOTA",
                        };

                        // Grup firma eşleştirmeleri (ÜRETİM / AL-SAT)
                        var uretimAlSatCariler = new HashSet<string>
                        {
                            "12001001", "12001008", "12002049"
                        };

                        // Çoklu cari → tek isim eşleşmeleri
                        var stellantisCariler = new HashSet<string> { "12002123", "12002163" };
                        var piyasaCariler = new HashSet<string>
                        {
                            "12001248", "32001350", "32003454", "32004955", "32005515",
                            "32005601", "32005728", "32005836", "32006224", "32006349"
                        };
                        var oyakRenaultParcalar = new HashSet<string>
                        {
                            "01.14534", "01.14535", "01.14536", "01.14537"
                        };
                        var uretimAlSatCariler2 = new HashSet<string>
                        {
                            "12002049","12002150","12002152","12002159",
                            "12002165","12002169","12002171","12002179",
                            "12002059","12002055", "12001135"
                        };

                        // ---- Karar mantığı ----

                        // Önce dictionary lookup
                        if (firmaMap.TryGetValue(cari, out var sabitFirma))
                        {
                            firmaSon = sabitFirma;
                        }
                        else if (uretimAlSatCariler.Contains(cari))
                        {
                            firmaSon = iscilik >= 0.001m ? firmaAdi + " ÜRETİM" : firmaAdi + " AL/SAT";
                        }
                        else if (stellantisCariler.Contains(cari))
                        {
                            firmaSon = "STELLANTİS";
                        }
                        else if (piyasaCariler.Contains(cari))
                        {
                            firmaSon = "PİYASA";
                        }
                        else if (cari == "12001135" && oyakRenaultParcalar.Contains(parca))
                        {
                            firmaSon = "OYAK RENAULT DELESAJ";
                        }
                        else if (uretimAlSatCariler2.Contains(cari))
                        {
                            firmaSon = iscilik >= 0.001m && cari == "12001135"
                                ? firmaAdi + " ÜRETİM"
                                : firmaAdi + " AL/SAT";
                        }
                        if (cari == "12001001" && !string.IsNullOrEmpty(proje) && proje.StartsWith("K0"))
                        {
                            firmaSon = firmaAdi + "-K0";
                        }
                        var entity = new SatisRaporu
                        {
                            temp5_xfirma = cari,
                            temp5_xpart = parca,
                            temp5_cmsort = firmaAdi,
                            temp5_xgrup = SafeString(row, 3),
                            temp5_xUM = SafeString(row, 4),
                            temp5_xtop = SafeDecimal(row, 5),
                            temp5_brfiyat = SafeDecimal(row, 6),
                            temp5_eskbrfiyat = SafeDecimal(row, 7),
                            temp5_malzeme = SafeDecimal(row, 8),
                            temp5_xgeneltop = SafeDecimal(row, 9),
                            temp5_xlistfiy = SafeDecimal(row, 10),
                            temp5_xlistcurr = SafeString(row, 11),
                            temp5_iscilik = SafeDecimal(row, 12),
                            temp5_ek = SafeDecimal(row, 13),
                            temp5_fason = SafeDecimal(row, 14),
                            temp5_toplammaliyet = SafeDecimal(row, 15),
                            temp5_toplamMalzeme = SafeDecimal(row, 16),
                            temp5_toplammal = SafeDecimal(row, 17),
                            temp5_yonetimToplam = SafeDecimal(row, 18),
                            temp5_iskarta = SafeDecimal(row, 19),
                            temp5_agirlik = SafeDecimal(row, 20),
                            temp5_hurda = SafeDecimal(row, 21),
                            temp5_grup = grup,
                            temp5_afirma = firmaSon,
                            temp5_yfirma = catiSon,
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

            decimal adim1Toplam = 0;
            decimal? dipToplam = 0;

            // --- Adım 1: Amortisman1 hesaplama
            foreach (var item in veriler)
            {
                if (item.temp5_ek > 0)
                {
                    item.temp5_amortisman1 = item.temp5_xtop * item.temp5_ek;
                    adim1Toplam += item.temp5_xtop * item.temp5_ek;
                }
            }

            // --- Adım 2: Amortisman2 dağıtımı
            decimal? adim2 = 0;
            foreach (var item in veriler)
            {
                if (adim1Toplam > 0)
                {
                    adim2 = item.temp5_amortisman1 / adim1Toplam;
                    item.temp5_amortisman2 = adim2 * amortisman;
                }
                else
                {
                    adim2 = 0;
                }
            }

            // --- Genel toplamlar
            decimal? genelToplam = 0;
            decimal? genelToplam2 = 0;

            foreach (var item in veriler)
            {
                if ((item.temp5_iscilik ?? 0m) > 0.001m)
                {
                    genelToplam = (((item.temp5_malzeme ?? 0m) + (item.temp5_fason ?? 0m)) * item.temp5_xtop) + (genelToplam ?? 0m);
                    genelToplam2 += genelToplam;
                }
            }

            // --- İskarta hesaplama
            foreach (var item in veriler)
            {
                if ((item.temp5_iscilik ?? 0m) > 0.001m && (genelToplam ?? 0m) != 0 && item.temp5_xtop != 0)
                {
                    item.temp5_iskarta = ((((item.temp5_fason ?? 0m) + (item.temp5_malzeme ?? 0m)) / (genelToplam ?? 1)) * item.temp5_xtop * iskartaOran) / item.temp5_xtop;
                }
                else
                {
                    item.temp5_iskarta = 0;
                }
            }

            // --- Dip toplam ve toplam malzeme
            foreach (var item in veriler)
            {
                dipToplam += (((item.temp5_malzeme ?? 0m) + (item.temp5_iscilik ?? 0m) + item.temp5_ek + (item.temp5_fason ?? 0m)) * item.temp5_xtop);
                item.temp5_toplamMalzeme = ((item.temp5_fason ?? 0m) + (item.temp5_malzeme ?? 0m) + (item.temp5_iskarta ?? 0m)) * item.temp5_xtop;
            }

            // --- Yönetim dağıtımı
            decimal? formul1 = 0;
            decimal? yonetimToplam = 0;

            foreach (var item in veriler)
            {
                formul1 = (((item.temp5_malzeme ?? 0m) + (item.temp5_iscilik ?? 0m) + item.temp5_ek + (item.temp5_fason ?? 0m)) * item.temp5_xtop);

                if ((dipToplam ?? 0m) != 0 && item.temp5_xtop != 0)
                    yonetimToplam = ((formul1 / dipToplam) * yonetimOran) / item.temp5_xtop;
                else
                    yonetimToplam = 0;

                item.temp5_yonetimToplam = yonetimToplam;
                item.temp5_toplammal = ((item.temp5_iskarta ?? 0m) + (item.temp5_malzeme ?? 0m) + (item.temp5_iscilik ?? 0m) + item.temp5_ek + (item.temp5_fason ?? 0m) + yonetimToplam) * item.temp5_xtop;
                item.temp5_toplammaliyet = (item.temp5_iskarta ?? 0m) + (item.temp5_malzeme ?? 0m) + (item.temp5_iscilik ?? 0m) + item.temp5_ek + (item.temp5_fason ?? 0m) + yonetimToplam;
            }

            // --- Endirek maliyetler
            foreach (var item in veriler)
            {
                item.ekMaliyet = item.temp5_xtop * item.temp5_ek;
                item.endirek = (decimal)(item.temp5_amortisman2 != null ? (decimal?)(item.ekMaliyet - item.temp5_amortisman2) : item.ekMaliyet);
            }

            // --- Endirek toplam
            decimal endirekToplam = 0;
            foreach (var item in veriler)
            {
                endirekToplam += item.endirek;
            }

            // --- Oran hesaplama
            if (endirekToplam != 0)
            {
                foreach (var item in veriler)
                {
                    item.oran = (item.endirek) / endirekToplam;
                    item.degisken = item.oran * degiskenOran;
                    item.sabit = item.oran * sabitOran;
                    item.degisken2 = item.temp5_xtop != 0 ? item.degisken / item.temp5_xtop : 0;
                    item.sabit2 = item.temp5_xtop != 0 ? item.sabit / item.temp5_xtop : 0;
                }
            }
            else
            {
                // Eğer endirekToplam 0 ise, tüm oranlar 0 atanır
                foreach (var item in veriler)
                {
                    item.oran = 0;
                    item.degisken = 0;
                    item.sabit = 0;
                    item.degisken2 = 0;
                    item.sabit2 = 0;
                }
            }


            return veriler;
        }

        // Güvenli dönüşüm metodları
        private static string SafeString(DataRow row, int index)
        {
#pragma warning disable CS8603 // Possible null reference return.
#pragma warning disable CS8602 // Dereference of a possibly null reference.
            return row[index] == DBNull.Value ? "" : row[index]?.ToString().Trim();
#pragma warning restore CS8602 // Dereference of a possibly null reference.
#pragma warning restore CS8603 // Possible null reference return.
        }

        private static decimal SafeDecimal(DataRow row, int index)
        {
            if (row[index] == DBNull.Value) return 0;
            return decimal.TryParse(row[index].ToString(), out decimal val) ? val : 0;
        }
    }
}
