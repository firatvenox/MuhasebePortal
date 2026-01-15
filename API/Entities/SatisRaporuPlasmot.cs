using System;

namespace API.Entities
{
    public class SatisRaporuPlasmot
    {
        // Metinsel alanlar
        public string? temp5_xfirma { get; set; }
        public string? temp5_xpart { get; set; }
        public string? temp5_cmsort { get; set; }
        public string? temp5_xgrup { get; set; }
        public string? temp5_xUM { get; set; }
        public string? temp5_xlistcurr { get; set; }
        public decimal? temp5_xtop { get; set; }              // her zaman değer var
        public decimal? temp5_ek { get; set; }                // her zaman değer var
        public decimal? temp5_brfiyat { get; set; }
        public decimal? temp5_eskbrfiyat { get; set; }
        public decimal? temp5_iskarta { get; set; }
        public decimal? temp5_malzeme { get; set; }
        public decimal? temp5_xgeneltop { get; set; }
        public decimal? temp5_xlistfiy { get; set; }
        public decimal? temp5_iscilik { get; set; }
        public string? temp5_urungrubu { get; set; }
        public decimal? temp5_toplammaliyet { get; set; }
        public decimal? temp5_toplamMalzeme { get; set; }
        public decimal? temp5_toplammal { get; set; }
        public decimal? temp5_yonetimToplam { get; set; }
        public decimal? ekMaliyet { get; set; }               // hesaplanan, boş olamaz
        public decimal? ekMaliyet2 { get; set; }               // hesaplanan, boş olamaz
        public decimal? degisken { get; set; }
        public decimal? sabit { get; set; }
        public decimal? degisken2 { get; set; }
        public decimal? araTutar { get; set; }
        public decimal? yuzdelikDagilim { get; set; }
        public decimal? iskartaToplam { get; set; }
        public decimal? birimIskarta { get; set; }
        public decimal? iskartaToplam2 { get; set; }
        public decimal? birimIskarta2 { get; set; }
        public decimal? toplamIskarta { get; set; }
        public decimal? karZarar { get; set; }
        public decimal? temp5_genelToplam { get; set; }
        public decimal? temp5_iskartaFirmaToplam { get; set; }
        public decimal? temp5_csl { get; set; }

    }
}
