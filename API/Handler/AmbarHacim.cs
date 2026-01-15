using API.Entities;
using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using Progress.Open4GL.DynamicAPI;
using Progress.Open4GL.Proxy;

namespace API.Handler
{
    public class AmbarHacim
    {
        public List<AmbarDto> Handle()
        {
            var result = new AmbarHacimResult();
            var ambarSonuc = new List<AmbarDto>();
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

                ProDataSetMetaData pro_meta = new ProDataSetMetaData("ds1", null);
                ProDataSetMetaData pro_meta2 = new ProDataSetMetaData("firat2", null);
                ParamArray parms = new ParamArray(2);
                parms.AddDatasetHandle(0, null, ParamArrayMode.OUTPUT, pro_meta);
                parms.AddDatasetHandle(1, null, ParamArrayMode.OUTPUT, pro_meta2);

                Console.WriteLine("[INFO] us/dl/dldepohacim.p procedure çağrılıyor...");
                openAO.RunProc("us/dl/dldepohacim.p", parms);

                var dsAmbar = parms.GetOutputParameter(0) as DataSet;
                var dsKasa = parms.GetOutputParameter(1) as DataSet;

                if (dsAmbar == null) Console.WriteLine("[WARN] dsAmbar null!");
                if (dsKasa == null) Console.WriteLine("[WARN] dsKasa null!");


                // === 1. TABLO: Ambar ===
                DataTable ambarTable = dsAmbar.Tables[0];
                Console.WriteLine($"[INFO] Ambar tablosu: {ambarTable.Rows.Count} satır");

                foreach (DataRow row in ambarTable.Rows)
                {
                    try
                    {
                        var ambar = new Ambar
                        {
                            AmbarKod = SafeString(row, 0),
                            AmbarYer = SafeString(row, 1),
                            AmbarKapasite = SafeDecimal(row, 2),
                            AmbarHacim = SafeDecimal(row, 3),
                        };
                        result.Ambarlar.Add(ambar);
                    }
                    catch (Exception rowEx)
                    {
                        Console.WriteLine($"[ERROR] Ambar satırı işlenemedi: {rowEx.Message}");
                        Debug.WriteLine(rowEx.ToString());
                    }
                }

                // === 2. TABLO: KasaDetay ===
                DataTable kasaTable = dsKasa.Tables[0];
                Console.WriteLine($"[INFO] KasaDetay tablosu: {kasaTable.Rows.Count} satır");

                foreach (DataRow row in kasaTable.Rows)
                {
                    try
                    {
                        var kasa = new KasaDetay
                        {
                            TempAmbar = SafeString(row, 0),
                            TempPart = SafeString(row, 1),
                            TempKasa = SafeString(row, 2),
                            TempAgirlik = SafeDecimal(row, 3),
                            KasaHacim = SafeDecimal(row, 4),
                        };
                        result.KasaDetaylar.Add(kasa);
                    }
                    catch (Exception rowEx)
                    {
                        Console.WriteLine($"[ERROR] KasaDetay satırı işlenemedi: {rowEx.Message}");
                        Debug.WriteLine(rowEx.ToString());
                    }
                }

            }
            catch (Exception ex)
            {
                Console.WriteLine("[FATAL] Hata: " + ex.Message);
                Debug.WriteLine(ex.ToString());
            }
            foreach (var item in result.Ambarlar.DistinctBy(a => a.AmbarKod))
            {
                var yeniAmbar = new AmbarDto
                {
                    ambarAdi = item.AmbarKod,
                    kapasite = item.AmbarKapasite,
                    ambarHacim = item.AmbarHacim,
                };
                ambarSonuc.Add(yeniAmbar);
            }
            foreach (var item in ambarSonuc)
            {
                var ambarList = new List<AmbarSecond>();
                foreach (var kasa in result.KasaDetaylar.Where(a => a.TempAmbar == item.ambarAdi))
                {
                    item.varolanAgirlik += kasa.TempAgirlik;
                    var ambarEkle = new AmbarSecond
                    {
                        kasaAdi = kasa.TempKasa,
                        parcaAdi = kasa.TempPart,
                        kasaAgirlik = kasa.TempAgirlik,
                        kasaHacim = kasa.KasaHacim
                    };
                    ambarList.Add(ambarEkle);
                }
                item.AmbarListe = ambarList;
            }

            return ambarSonuc;
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
