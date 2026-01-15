using API.Entities;
using System.Data;
using System.Diagnostics;
using Progress.Open4GL.Proxy;
using API.Entities.Dto;

namespace API.Handler
{
    public class IskartaPlasmot
    {
        public List<Tutar> Handle(DateTime fatdate, DateTime fatdate1)
        {
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

                Console.WriteLine("[INFO] us/dl/dliskarta.p procedure çağrılıyor...");
                openAO.RunProc("us/dl/dliskarta.p", parms);

                if (parms.GetOutputParameter(2) is not DataSet ds)
                {
                    Console.WriteLine("[WARN] Dataset null döndü!");
                    return tutarlar;
                }

                if (ds.Tables.Count == 0)
                {
                    Console.WriteLine("[WARN] Dataset içinde tablo yok!");
                    
                    return tutarlar;
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

            

            return tutarlar.OrderByDescending(a => a.aciklama).ToList();
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
