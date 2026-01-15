namespace API.Entities;

public class Kantin
{
    public string FirmaKodu { get; set; } = string.Empty;
    public string UrunGrubu { get; set; } = string.Empty;
    public string HesapNo { get; set; } = string.Empty;
    public string ParcaKodu { get; set; } = string.Empty;
    public string MusteriUrunKodu { get; set; } = string.Empty;
    public string ParcaAdi { get; set; } = string.Empty;
    public string Satir { get; set; } = string.Empty;
    public string SiparisNo { get; set; } = string.Empty;
    public string SiparisSatir { get; set; } = string.Empty;
    public string IrsaliyeNo { get; set; } = string.Empty;
    public DateTime? IrsaliyeTarih { get; set; }
    public string FaturaNo { get; set; } = string.Empty;
    public DateTime? FaturaTarih { get; set; }
    public decimal? FaturaMiktar { get; set; }
    public string Birim { get; set; } = string.Empty;
    public string UrunKodu { get; set; } = string.Empty;
    public decimal? BirimFiyat { get; set; }
    public decimal? DovizDegeri { get; set; }
    public decimal? DovizOrani { get; set; }
    public decimal? FaturaTRL { get; set; }
    public string DovizCinsi { get; set; } = string.Empty;
    public decimal? IadeMiktar { get; set; }
    public decimal? IadeTutar { get; set; }
    public string YM { get; set; } = string.Empty;
    public decimal? ListeFiyat { get; set; }
    public string ShipTo { get; set; } = string.Empty;
    public string ListeParaBirimi { get; set; } = string.Empty;
    public string PlanAciklama { get; set; } = string.Empty;
    public string Grup { get; set; } = string.Empty;
    public decimal? Maliyet { get; set; }
    public string Tip { get; set; } = string.Empty;
    public string Vergi { get; set; } = string.Empty;
    public string TedarikciAdi { get; set; } = string.Empty;
    public string ProdLine { get; set; } = string.Empty;
    public string GibNo { get; set; } = string.Empty;
    public decimal? Malzeme { get; set; }
    public decimal? Diger { get; set; }
}
