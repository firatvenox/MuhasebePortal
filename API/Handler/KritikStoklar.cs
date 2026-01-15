using API.Entities;
using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using Progress.Open4GL.DynamicAPI;
using Progress.Open4GL.Proxy;
using API.Services;

namespace API.Handler
{
    public class KritikStoklar
    {
        public List<KritikStok> Handle()
        {
            var kritikStokListe = new List<KritikStok>();
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

                Console.WriteLine("[INFO] us/dl/dldepohacim.p procedure çağrılıyor...");
                openAO.RunProc("us/dl/dlkritikstok.p", parms);

                var kritikStoklar = parms.GetOutputParameter(0) as DataSet;

                if (kritikStoklar == null) Console.WriteLine("[WARN] dsAmbar null!");

                // === 1. TABLO: Ambar ===
                DataTable kritikStokTable = kritikStoklar.Tables[0];
                Console.WriteLine($"[INFO] Ambar tablosu: {kritikStokTable.Rows.Count} satır");

                foreach (DataRow row in kritikStokTable.Rows)
                {
                    try
                    {
                        var ambar = new KritikStok
                        {
                            Parca = SafeString(row, 0),
                            Miktar = SafeDecimal(row, 1),
                            Emniyet = SafeDecimal(row, 2),
                        };

                        kritikStokListe.Add(ambar);

                    }
                    catch (Exception rowEx)
                    {
                        Console.WriteLine($"[ERROR] Ambar satırı işlenemedi: {rowEx.Message}");
                        Debug.WriteLine(rowEx.ToString());
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("[FATAL] Hata: " + ex.Message);
                Debug.WriteLine(ex.ToString());
            }

            return kritikStokListe;
        }
        // Güvenli dönüşüm metodları
        private static string SafeString(DataRow row, int index)
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
