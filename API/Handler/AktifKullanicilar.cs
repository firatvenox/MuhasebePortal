using API.Entities;
using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using Progress.Open4GL.DynamicAPI;
using Progress.Open4GL.Proxy;

namespace API.Handler;

public class AktifKullanicilar
{

    public bool DisconnectUser(int usrId, string sirketAdi)
    {
        var sirketler = new List<(string Ad, string Server, string AppServer, string Port)>
        {
            ("Ermetal", "172.16.1.98", "as-mfg", "22082")
        };

        var sirket = sirketler.FirstOrDefault(x => x.Ad == sirketAdi);
        if (sirket.Ad == null) return false;

        string appsrvUrl = $"AppServerDC://{sirket.Server}:{sirket.Port}/{sirket.AppServer}";

        try 
        {
            using var appsrvConn = new Connection(appsrvUrl, "", "", "");
            using var openAO = new OpenAppObject(appsrvConn, sirket.AppServer);
            
            ParamArray parms = new ParamArray(1);
            parms.AddInteger(0, usrId, ParamArrayMode.INPUT); // UsrID'yi input veriyoruz

            // Kovma işlemini yapan .p'yi tetikle
            openAO.RunProc("us/dl/dldiscnnct.p", parms);
            
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Kullanıcı kovulurken hata oluştu: {ex.Message}");
            return false;
        }
    }

    public List<UserLockEntity> GetActiveUsersAndLocks()
{
    List<UserLockEntity> userList = new();
    
    // Şirket bilgileri (Senin mevcut yapın)
    var sirketler = new List<(string Ad, string Server, string AppServer, string Port)>
    {
        ("Ermetal", "172.16.1.98", "as-mfg", "22082")
        };

    foreach (var sirket in sirketler)
    {
        string appsrvUrl = $"AppServerDC://{sirket.Server}:{sirket.Port}/{sirket.AppServer}";

        try 
        {
            using var appsrvConn = new Connection(appsrvUrl, "", "", "");
            using var openAO = new OpenAppObject(appsrvConn, sirket.AppServer);
            
            // Progress tarafındaki temp-table şemasına uygun meta
            ProDataSetMetaData metaData = new ProDataSetMetaData("", null);
            ParamArray parms = new ParamArray(1);
            parms.AddDatasetHandle(0, null, ParamArrayMode.OUTPUT, metaData);

            // .p dosyasını tetikle
            openAO.RunProc("us/dl/dlconnect.p", parms);

            if (parms.GetOutputParameter(0) is DataSet ds && ds.Tables.Count > 0)
            {
                foreach (DataRow row in ds.Tables[0].Rows)
                {
                    userList.Add(new UserLockEntity
                    {
                        UsrID = Convert.ToInt32(row["usrID"]),
                        UsrName = row["usrName"]?.ToString(),
                        UsrIP = row["usrIP"]?.ToString(),
                        qadProgram = row["qadProgram"]?.ToString(),
                        LockTable = row["lockTable"]?.ToString(),
                        lockDetail = row["lockType"]?.ToString(),
                        lockFlags = row["lockFlags"]?.ToString(),
                        sirket = row["sirket"]?.ToString(),
                    });
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] {sirket.Ad} bağlantı hatası: {ex.Message}");
        }
    }
    return userList;
}
}