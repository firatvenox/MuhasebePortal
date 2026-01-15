using System.Data;
using System.Diagnostics;
using API.Entities;
using Progress.Open4GL.Proxy;

namespace API.Handler
{
    public class DakikaMaliyet
    {
        public List<DakikaMaliyetEntity> Handle(DateTime tarih, DateTime tarih1)
        {
            List<DakikaMaliyetEntity> veriler = new();
            List<DakikaMaliyetEntity> temp2 = new();
            try
            {
                // --- AppServer Bağlantısı ---
                string cf_serverDb = "AppServerDC";
                string cf_server = "172.16.1.19";
                string cf_port = "22082";
                string cf_appServer = "as-mfg";
                string appsrvUrl = $"{cf_serverDb}://{cf_server}:{cf_port}/{cf_appServer}";
                var appsrvConn = new Connection(appsrvUrl, "", "", "");

                Console.WriteLine($"[INFO] Bağlantı kuruluyor: {appsrvUrl}");
                OpenAppObject openAO = new OpenAppObject(appsrvConn, cf_appServer);
                appsrvConn.SessionModel = 1;

                ProDataSetMetaData pro_meta = new ProDataSetMetaData("", null);

                // --- Procedure Çağrısı ---
                ParamArray parms = new ParamArray(3);
                parms.AddDate(0, tarih, ParamArrayMode.INPUT);
                parms.AddDate(1, tarih1, ParamArrayMode.INPUT);
                parms.AddDatasetHandle(2, null, ParamArrayMode.OUTPUT, pro_meta);

                Console.WriteLine("[INFO] us/ff/ffdakika.p procedure çağrılıyor...");
                openAO.RunProc("us/ff/ffdakika.p", parms);

                if (parms.GetOutputParameter(2) is not DataSet ds || ds.Tables.Count == 0)
                {
                    Console.WriteLine("[WARN] Dataset boş veya tablo yok!");
                    return veriler;
                }

                // --- Dataset Satırlarını Listeye Çevir ---
                DataTable dt = ds.Tables[0];
                foreach (DataRow row in dt.Rows)
                {
                    veriler.Add(new DakikaMaliyetEntity
                    {
                        Part = SafeString(row, 0),
                        Type = SafeDecimal(row, 1),
                        Type1 = SafeString(row, 2),
                        Tip = SafeString(row, 3),
                        CostCode = SafeString(row, 4),
                        GlCode = SafeString(row, 5),
                        GlDesc = SafeString(row, 6),
                        CostDesc = SafeString(row, 7),
                        Para = SafeDecimal(row, 8)
                    });
                }


            }
            catch (Exception ex)
            {
                Console.WriteLine("[FATAL] Hata: " + ex.Message);
                Debug.WriteLine(ex.ToString());
            }

            try
            {
                // --- AppServer Bağlantısı ---
                string cf_serverDb = "AppServerDC";
                string cf_server = "172.16.1.98";
                string cf_port = "22082";
                string cf_appServer = "as-mfg";
                string appsrvUrl = $"{cf_serverDb}://{cf_server}:{cf_port}/{cf_appServer}";
                var appsrvConn = new Connection(appsrvUrl, "", "", "");

                Console.WriteLine($"[INFO] Bağlantı kuruluyor: {appsrvUrl}");
                OpenAppObject openAO = new OpenAppObject(appsrvConn, cf_appServer);
                appsrvConn.SessionModel = 1;

                ProDataSetMetaData pro_meta = new ProDataSetMetaData("", null);

                // --- Procedure Çağrısı ---
                ParamArray parms = new ParamArray(3);
                parms.AddDate(0, tarih, ParamArrayMode.INPUT);
                parms.AddDate(1, tarih1, ParamArrayMode.INPUT);
                parms.AddDatasetHandle(2, null, ParamArrayMode.OUTPUT, pro_meta);

                Console.WriteLine("[INFO] us/dl/dldakika.p procedure çağrılıyor...");
                openAO.RunProc("us/dl/dldakika.p", parms);

                if (parms.GetOutputParameter(2) is not DataSet ds || ds.Tables.Count == 0)
                {
                    Console.WriteLine("[WARN] Dataset boş veya tablo yok!");
                    return veriler;
                }

                // --- Dataset Satırlarını Listeye Çevir ---
                DataTable dt = ds.Tables[0];
                var verilerIki = veriler;
                foreach (DataRow row in dt.Rows)
                {
                    var glDesc = SafeString(row, 6);
                    var matched = verilerIki.Find(a => a.GlDesc == glDesc);
                    
                    veriler.Add(new DakikaMaliyetEntity
                    {
                        Part = SafeString(row, 0),
                        Type = matched?.Type ?? 1,
                        Type1 = matched?.Type1 ?? "100", // null ise 100 atanır
                        Tip = matched?.Tip ?? "",
                        CostCode = SafeString(row, 4),
                        GlCode = SafeString(row, 5),
                        GlDesc = glDesc,
                        CostDesc = SafeString(row, 7),
                        Para = SafeDecimal(row, 8)
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("[FATAL] Hata: " + ex.Message);
                Debug.WriteLine(ex.ToString());
            }

            // Gelen koddaki değişkenleri tanımla
            decimal tut1 = 84; // Bu değişkenin değeri dışarıdan gelmeli veya hesaplanmalı.
            decimal tut2 = 16; // Bu değişkenin değeri dışarıdan gelmeli veya hesaplanmalı.
            decimal montajYuksek = 0;
            decimal montajDusuk = 0;
            decimal yuzdeElli = 0;
            decimal montajd = 31;           // Montaj Direk
            decimal montajde = 4;           // Montaj Endirek
            decimal ikid = 4;               // 2D Direk
            decimal ikie = 2;               // 2D Endirek
            decimal buyukcncd = 10;         // Büyük CNC Direk
            decimal buyukcnce = 4;          // Büyük CNC Endirek
            decimal kucukcncd = 11;         // Küçük CNC Direk
            decimal kucukcnce = 4;          // Küçük CNC Endirek
            decimal genelcncd = 3;          // Genel CNC Direk
            decimal kalited = 2;            // Kalite Direk
            decimal kalitee = 3;            // Kalite Endirek
            decimal came = 4;               // CAM Endirek
            decimal planlamae = 4;          // Planlama Endirek
            decimal yonetimsistemleri = 4;  // Yönetim Sistemleri
            decimal bakimo = 1;             // Bakım Onarım
            decimal genelh = 6;             // Genel Hizmetler
            decimal maliisler = 1;          // Mali İşler
            decimal insank = 1;             // İnsan Kaynakları
            decimal bilgit = 2;             // Bilgi Teknolojileri
            decimal yonetim = 2;            // Yönetim
            decimal satinalma = 5;          // Satın Alma
            decimal egitim = 5;             // Eğitim ve İş Geliştirme


            // temp1 listesi oluştur ve veriler listesini kopyala
            List<DakikaMaliyetEntity> temp1 = new List<DakikaMaliyetEntity>(veriler);
            temp2.Clear();

            // İlk for döngüsü: temp1_costcode = "2120" ve temp1_glcode "7200" ile başlayanlar
            foreach (var item in temp1.Where(t => t.CostCode == "2120" && t.GlCode.StartsWith("7200")).ToList())
            {
                montajYuksek = (item.Para / 100) * tut1;
                montajDusuk = (item.Para / 100) * tut2;
                item.Para = montajYuksek;
                temp2.Add(new DakikaMaliyetEntity
                {
                    Part = item.Part,
                    Type = item.Type,
                    Tip = "GECICI",
                    Type1 = item.Part.Length >= 2 ? item.Part.Substring(0, 2) : "",
                    GlCode = item.GlCode,
                    CostCode = "3120",
                    GlDesc = item.GlDesc,
                    CostDesc = item.CostDesc,
                    Para = montajYuksek
                });
            }

            // İkinci for döngüsü: temp1_costcode = "2120" ve temp1_glcode "7301" ile başlayanlar
            foreach (var item in temp1.Where(t => t.CostCode == "2120" && t.GlCode.StartsWith("7301")).ToList())
            {
                montajYuksek = (item.Para / 100) * tut1;
                montajDusuk = (item.Para / 100) * tut2;
                item.Para = montajYuksek;
                temp2.Add(new DakikaMaliyetEntity
                {
                    Part = item.Part,
                    Tip = "GECICI",
                    Type = item.Type,
                    Type1 = item.Part.Length >= 2 ? item.Part.Substring(0, 2) : "",
                    GlCode = item.GlCode,
                    CostCode = "3120",
                    GlDesc = item.GlDesc,
                    CostDesc = item.CostDesc,
                    Para = montajDusuk
                });
            }

            // Üçüncü for döngüsü: temp2'den temp1'e ekleme
            foreach (var item in temp2.Where(t => t.Tip == "GECICI" && t.CostCode == "3120").ToList())
            {
                temp1.Add(new DakikaMaliyetEntity
                {
                    Part = item.Part,
                    Tip = "FIRAT",
                    Type = item.Type,
                    Type1 = item.Part.Length >= 2 ? item.Part.Substring(0, 2) : "",
                    GlCode = item.GlCode,
                    CostCode = "3120",
                    GlDesc = item.GlDesc,
                    CostDesc = item.CostDesc,
                    Para = item.Para
                });
            }

            // Gelen koddaki diğer değişken tanımlamaları (C# kodunda zaten var, ama burada yeniden set ediliyor)
            montajDusuk = 0;
            // uretimDoksan, uretimOn, cncElli kullanılmıyor.

            // Dördüncü for döngüsü: temp1_costcode = "2110" ve temp1_glcode "7301" ile başlayanlar
            foreach (var item in temp1.Where(t => t.CostCode == "2110" && t.GlCode.StartsWith("7301")).ToList())
            {
                yuzdeElli = (item.Para / 100) * 50;
                item.Para = 0;
                temp2.Add(new DakikaMaliyetEntity
                {
                    Part = item.Part,
                    Tip = "GECICI",
                    Type = item.Type,
                    Type1 = item.Part.Length >= 2 ? item.Part.Substring(0, 2) : "",
                    GlCode = item.GlCode,
                    CostCode = "2190",
                    GlDesc = item.GlDesc,
                    CostDesc = item.CostDesc,
                    Para = yuzdeElli
                });
                temp2.Add(new DakikaMaliyetEntity
                {
                    Part = item.Part,
                    Tip = "GECICI",
                    Type = item.Type,
                    Type1 = item.Part.Length >= 2 ? item.Part.Substring(0, 2) : "",
                    GlCode = item.GlCode,
                    CostCode = "2180",
                    GlDesc = item.GlDesc,
                    CostDesc = item.CostDesc,
                    Para = yuzdeElli
                });
            }

            // Beşinci for döngüsü: temp1_costcode = "2110" ve temp1_glcode "7200" ile başlayanlar
            foreach (var item in temp1.Where(t => t.CostCode == "2110" && t.GlCode.StartsWith("7200")).ToList())
            {
                yuzdeElli = (item.Para / 100) * 50;
                item.Para = 0;
                temp2.Add(new DakikaMaliyetEntity
                {
                    Part = item.Part,
                    Tip = "FRIAT",
                    Type = item.Type,
                    Type1 = item.Part.Length >= 2 ? item.Part.Substring(0, 2) : "",
                    GlCode = item.GlCode,
                    CostCode = "2190",
                    GlDesc = item.GlDesc,
                    CostDesc = item.CostDesc,
                    Para = yuzdeElli
                });
                temp2.Add(new DakikaMaliyetEntity
                {
                    Part = item.Part,
                    Type = item.Type,
                    Tip = "FRIAT",
                    Type1 = item.Part.Length >= 2 ? item.Part.Substring(0, 2) : "",
                    GlCode = item.GlCode,
                    CostCode = "2180",
                    GlDesc = item.GlDesc,
                    CostDesc = item.CostDesc,
                    Para = yuzdeElli
                });
            }

            // Altıncı for döngüsü: temp2'den temp1'e para ekleme
            foreach (var item2 in temp2.Where(t => t.Tip == "GECICI" && t.CostCode == "2190").ToList())
            {
                foreach (var item1 in temp1.Where(t => t.CostCode == item2.CostCode && t.GlCode == item2.GlCode).ToList())
                {
                    item1.Para += item2.Para;
                }
            }

            // Yedinci for döngüsü: temp2'den temp1'e para ekleme
            foreach (var item2 in temp2.Where(t => t.Tip == "GECICI" && t.CostCode == "2180").ToList())
            {
                foreach (var item1 in temp1.Where(t => t.CostCode == item2.CostCode && t.GlCode == item2.GlCode).ToList())
                {
                    item1.Para += item2.Para;
                }
            }

            // Sekizinci for döngüsü: temp1_glcode = "73035007"
            foreach (var item in temp1.Where(t => t.GlCode == "73035007").ToList())
            {
                item.Para = (item.Para / 100) * 80;
            }

            // Dokuzuncu for döngüsü: temp1_type = "2"
            foreach (var item in temp1.Where(t => t.Type == 2).ToList())
            {
                item.Para = (item.Para / 100) * 80;
            }

            // Onuncu for döngüsü: belirli glcode'lar için para bölme
            foreach (var item in temp1.Where(t => t.GlCode == "77014001" || t.GlCode == "73014001" || t.GlCode == "72004001").ToList())
            {
                item.Para = item.Para / 12;
            }

            // Onbirinci for döngüsü: özel glcode'lar için para ataması
            foreach (var item in temp1)
            {
                if (item.GlCode == "72002001")
                {
                    if (item.CostCode == "2120") item.Para = (2701 * montajd) / 12;
                    else if (item.CostCode == "2130") item.Para = (2701 * ikid) / 12;
                    else if (item.CostCode == "2190") item.Para = (2701 * buyukcncd) / 12;
                    else if (item.CostCode == "2180") item.Para = (2701 * kucukcncd) / 12;
                    else if (item.CostCode == "2140") item.Para = (2701 * genelcncd) / 12;
                    else if (item.CostCode == "3110") item.Para = (2701 * kalited) / 12;
                }
                else if (item.GlCode == "73012001")
                {
                    if (item.CostCode == "2120") item.Para = (2701 * montajde) / 12;
                    else if (item.CostCode == "2130") item.Para = (2701 * ikie) / 12;
                    else if (item.CostCode == "2190") item.Para = (2701 * buyukcnce) / 12;
                    else if (item.CostCode == "2180") item.Para = (2701 * kucukcnce) / 12;
                    else if (item.CostCode == "3110") item.Para = (2701 * kalitee) / 12;
                    else if (item.CostCode == "2160") item.Para = (2701 * came) / 12;
                    else if (item.CostCode == "3150") item.Para = (2701 * planlamae) / 12;
                }
                else if (item.GlCode == "77012001")
                {
                    if (item.CostCode == "3130") item.Para = (2701 * yonetimsistemleri) / 12;
                    else if (item.CostCode == "3160") item.Para = (2701 * bakimo) / 12;
                    else if (item.CostCode == "3140") item.Para = (2701 * genelh) / 12;
                    else if (item.CostCode == "7110") item.Para = (2701 * maliisler) / 12;
                    else if (item.CostCode == "7120") item.Para = (2701 * insank) / 12;
                    else if (item.CostCode == "7140") item.Para = (2701 * bilgit) / 12;
                    else if (item.CostCode == "7160") item.Para = (2701 * yonetim) / 12;
                    else if (item.CostCode == "7130") item.Para = (2701 * satinalma) / 12;
                    else if (item.CostCode == "3200") item.Para = (2701 * egitim) / 12;
                }
            }

            // Onikinci for döngüsü: özel glcode'lar için para ataması
            foreach (var item in temp1)
            {
                if (item.GlCode == "72002006")
                {
                    if (item.CostCode == "2120") item.Para = (5424 * montajd) / 12;
                    else if (item.CostCode == "2130") item.Para = (5424 * ikid) / 12;
                    else if (item.CostCode == "2190") item.Para = (5424 * buyukcncd) / 12;
                    else if (item.CostCode == "2180") item.Para = (5424 * kucukcncd) / 12;
                    else if (item.CostCode == "2140") item.Para = (5424 * genelcncd) / 12;
                    else if (item.CostCode == "3110") item.Para = (5424 * kalited) / 12;
                }
                else if (item.GlCode == "73012006")
                {
                    if (item.CostCode == "2120") item.Para = (5424 * montajde) / 12;
                    else if (item.CostCode == "2130") item.Para = (5424 * ikie) / 12;
                    else if (item.CostCode == "2190") item.Para = (5424 * buyukcnce) / 12;
                    else if (item.CostCode == "2180") item.Para = (5424 * kucukcnce) / 12;
                    else if (item.CostCode == "3110") item.Para = (5424 * kalitee) / 12;
                    else if (item.CostCode == "2160") item.Para = (5424 * came) / 12;
                    else if (item.CostCode == "3150") item.Para = (5424 * planlamae) / 12;
                }
                else if (item.GlCode == "77012006")
                {
                    if (item.CostCode == "3130") item.Para = (5424 * yonetimsistemleri) / 12;
                    else if (item.CostCode == "3160") item.Para = (5424 * bakimo) / 12;
                    else if (item.CostCode == "3140") item.Para = (5424 * genelh) / 12;
                    else if (item.CostCode == "7110") item.Para = (5424 * maliisler) / 12;
                    else if (item.CostCode == "7120") item.Para = (5424 * insank) / 12;
                    else if (item.CostCode == "7140") item.Para = (5424 * bilgit) / 12;
                    else if (item.CostCode == "7160") item.Para = (5424 * yonetim) / 12;
                    else if (item.CostCode == "7130") item.Para = (5424 * satinalma) / 12;
                    else if (item.CostCode == "3200") item.Para = (5424 * egitim) / 12;
                }
            }


            // Onüçüncü for döngüsü: temp1'i temp2'ye kopyalama
            temp2.Clear();
            foreach (var item in temp1)
            {
                temp2.Add(new DakikaMaliyetEntity
                {
                    Tip = "LASTDANCE",
                    Part = item.Part,
                    Type = item.Type,
                    Type1 = item.Part.Length >= 2 ? item.Part.Substring(0, 2) : "",
                    GlCode = item.GlCode,
                    CostCode = item.CostCode,
                    GlDesc = item.GlDesc,
                    CostDesc = item.CostDesc,
                    Para = item.Para
                });
            }

            Console.WriteLine("Done");
            return veriler.OrderBy(a => a.Type).ToList();

        }

        // --- Güvenli dönüşüm metodları ---
#pragma warning disable CS8603 // Possible null reference return.
#pragma warning disable CS8602 // Dereference of a possibly null reference.
        private static string SafeString(DataRow row, int index) => row[index] == DBNull.Value ? "" : row[index]?.ToString().Trim();
#pragma warning restore CS8602 // Dereference of a possibly null reference.
#pragma warning restore CS8603 // Possible null reference return.
        private static decimal SafeDecimal(DataRow row, int index) => row[index] == DBNull.Value ? 0 : decimal.TryParse(row[index].ToString(), out decimal val) ? val : 0;
    }
}