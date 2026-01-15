using API.Entities;
using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using Progress.Open4GL.DynamicAPI;
using Progress.Open4GL.Proxy;

namespace API.Handler
{
    public class CiroRaporu
    {
        public List<CiroEntity> Handle()
        {
            List<CiroEntity> veriler = new();

            try
            {
                // Şirket listesi
                var sirketler = new List<(string Ad, string Server, string AppServer, string Port)>
                {
                    ("Ermetal", "172.16.1.98", "as-mfg", "22082"),
                    ("Plasmot", "172.16.1.19", "as-mfg", "28082"),
                    ("Ergida",  "172.16.1.19", "as-mfg", "29082")
                };

                // Geçtiğimiz aydan geriye doğru 6 ay
                var bugun = DateTime.Today;
                var baslangicAy = new DateTime(bugun.Year, bugun.Month, 1).AddMonths(-6);

                foreach (var sirket in sirketler)
                {
                    string cf_serverDb = "AppServerDC";
                    string cf_server = sirket.Server;
                    string cf_port = sirket.Port;
                    string cf_appServer = sirket.AppServer;
                    string appsrvUrl = $"{cf_serverDb}://{cf_server}:{cf_port}/{cf_appServer}";

                    Console.WriteLine($"[INFO] {sirket.Ad} için bağlantı kuruluyor: {appsrvUrl}");

                    using var appsrvConn = new Connection(appsrvUrl, "", "", "");
                    using var openAO = new OpenAppObject(appsrvConn, cf_appServer);
                    appsrvConn.SessionModel = 1;

                    ProDataSetMetaData pro_meta = new ProDataSetMetaData("", null);


                    for (int i = 0; i < 6; i++)
                    {
                        DateTime startDate = new DateTime(baslangicAy.Year, baslangicAy.Month, 1).AddMonths(i);
                        DateTime endDate = startDate.AddMonths(1).AddDays(-1);

                        Console.WriteLine($"[INFO] {sirket.Ad} - Ay: {startDate:yyyy-MM} ({startDate:dd.MM.yyyy} - {endDate:dd.MM.yyyy})");

                        ParamArray parms = new ParamArray(3);
                        parms.AddDate(0, startDate, ParamArrayMode.INPUT);
                        parms.AddDate(1, endDate, ParamArrayMode.INPUT);
                        parms.AddDatasetHandle(2, null, ParamArrayMode.OUTPUT, pro_meta);

                        openAO.RunProc("us/dl/dlermciro.p", parms);

                        if (parms.GetOutputParameter(2) is not DataSet ds || ds.Tables.Count == 0)
                        {
                            Console.WriteLine($"[WARN] {sirket.Ad} için dataset boş ({startDate:yyyy-MM}).");
                            continue;
                        }

                        DataTable dt = ds.Tables[0];
                        Console.WriteLine($"[INFO] {sirket.Ad} → {dt.Rows.Count} satır alındı ({startDate:yyyy-MM}).");
                        
                        foreach (DataRow row in dt.Rows)
                        {
                            try
                            {
                                var entity = new CiroEntity
                                {
                                    CariNo = SafeString(row, 0),
                                    MusName = SafeString(row, 1),
                                    ToplamDov = SafeDecimal(row, 2),
                                    AySonu = endDate,
                                    Sirket = sirket.Ad
                                };

                                veriler.Add(entity);
                            }
                            catch (Exception rowEx)
                            {
                                Console.WriteLine($"[ERROR] {sirket.Ad} satır işlenemedi: {rowEx.Message}");
                                Debug.WriteLine(rowEx.ToString());
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("[FATAL] Hata: " + ex.Message);
                Debug.WriteLine(ex.ToString());
            }

            return veriler;
        }

        // Güvenli dönüşüm metodları
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
