using System;

namespace API.Entities
{
    public class SatisRaporu
    {
        // Metinsel alanlar
        public string? temp5_xfirma { get; set; }
        public string? temp5_xpart { get; set; }
        public string? temp5_cmsort { get; set; }
        public string? temp5_xgrup { get; set; }
        public string? temp5_xUM { get; set; }
        public string? temp5_xlistcurr { get; set; }
        public string? temp5_grup { get; set; }
        public string? temp5_afirma { get; set; }
        public string? temp5_yfirma { get; set; }

        // Rakamlar
        public decimal temp5_xtop { get; set; }              // her zaman değer var
        public decimal temp5_ek { get; set; }                // her zaman değer var

        public decimal? temp5_brfiyat { get; set; }
        public decimal? temp5_eskbrfiyat { get; set; }
        public decimal? temp5_iskarta { get; set; }
        public decimal? temp5_malzeme { get; set; }
        public decimal? temp5_xgeneltop { get; set; }
        public decimal? temp5_xlistfiy { get; set; }
        public decimal? temp5_iscilik { get; set; }
        public decimal? temp5_fason { get; set; }
        public decimal? temp5_toplammaliyet { get; set; }
        public decimal? temp5_toplamMalzeme { get; set; }
        public decimal? temp5_toplammal { get; set; }
        public decimal? temp5_yonetimToplam { get; set; }
        public decimal? temp5_amortisman1 { get; set; }
        public decimal? temp5_amortisman2 { get; set; }
        public decimal? temp5_agirlik { get; set; }
        public decimal? temp5_hurda { get; set; }

        // Hesaplanan değerler
        public decimal ekMaliyet { get; set; }               // hesaplanan, boş olamaz
        public decimal endirek { get; set; }                 // hesaplanan, boş olamaz
        public decimal oran { get; set; }                    // hesaplanan, boş olamaz
        public decimal degisken { get; set; }
        public decimal sabit { get; set; }
        public decimal degisken2 { get; set; }
        public decimal sabit2 { get; set; }
    }
}
