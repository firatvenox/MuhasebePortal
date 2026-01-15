using API.Entities;
using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using Progress.Open4GL.DynamicAPI;
using Progress.Open4GL.Proxy;
using API.Services;
using System.Globalization;

namespace API.Handler
{
    public class GetirEkstraNakliyeler
    {
        public List<EkstraNakliyeler> Handle(String irsaliyeNumarasi)
        {
            var EkstraNakliyelerListe = new List<EkstraNakliyeler>();
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

                ProDataSetMetaData pro_meta = new ProDataSetMetaData("ds1", null);                
                ParamArray parms = new ParamArray(2);
                parms.AddCharacter(0, irsaliyeNumarasi, ParamArrayMode.INPUT);
                parms.AddDatasetHandle(1, null, ParamArrayMode.OUTPUT, pro_meta);

                Console.WriteLine("[INFO] us/dl/dleksnakliye.p procedure çağrılıyor...");
                openAO.RunProc("us/dl/dleksnakliye.p", parms);

                var ekstraNakliyelerim = parms.GetOutputParameter(1) as DataSet;

                if (ekstraNakliyelerim == null) Console.WriteLine("[WARN] dsAmbar null!");

                // === 1. TABLO: Ambar ===
                DataTable EkstraNakliyelerTable = ekstraNakliyelerim.Tables[0];
                Console.WriteLine($"[INFO] Ambar tablosu: {EkstraNakliyelerTable.Rows.Count} satır");

                foreach (DataRow row in EkstraNakliyelerTable.Rows)
                {
                    try{
                        var ambar = new EkstraNakliyeler
                        {
                            parca = SafeString(row, 0),
                            olcumBirimi = SafeString(row, 1),
                            lot = SafeString(row, 2),
                            qty = SafeDecimal(row, 3), // miktar genellikle 3. sütunda olur
                            tarih = DateTimeOffset.ParseExact(
                                SafeString(row, 4),
                                "dd.MM.yyyy HH:mm:ss",
                                CultureInfo.InvariantCulture
                            ),
                        };

                        EkstraNakliyelerListe.Add(ambar);

                    }
                    catch (Exception rowEx)
                    {
                        Console.WriteLine($"[ERROR] Ekstra Nakliye satırı işlenemedi: {rowEx.Message}");
                        Debug.WriteLine(rowEx.ToString());
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("[FATAL] Hata: " + ex.Message);
                Debug.WriteLine(ex.ToString());
            }
            return EkstraNakliyelerListe;
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
