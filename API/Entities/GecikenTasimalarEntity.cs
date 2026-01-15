namespace API.Entities;

public class GecikenTasimalar
{
    public int? id { get; set; }
    public string? sicil { get; set; }
    public string? adsoyad { get; set; }
    public string? tasiyici { get; set; }
    public string? tasktype { get; set; }
    public string? erprefnumber { get; set; }
    public string? code { get; set; }
    public string? stockcode { get; set; }
    public int? opno { get; set; }
    public string? kasa { get; set; }
    public string? kasaici { get; set; }
    public string? cikis { get; set; }
    public string? varis { get; set; }
    public DateTime? baslangic { get; set; }
    public DateTime? atama { get; set; }
    public DateTime? bitis { get; set; }
    public string? hedef { get; set; }
    public string? sure { get; set; }
    public string? suresicil { get; set; }
    public string? molasuresi { get; set; }
    public string? netsureis { get; set; }
    public string? netsuresicil { get; set; }
    public string? yapilma { get; set; }
    public int? yapilmadk { get; set; }
    public string? yapilmasicil { get; set; }
    public int? yapilmasicildk { get; set; }
    public int? DegisimSuresi { get; set; }
    public DateTime? Tarih { get; set; }
    public string? OturumAcma { get; set; }
    public string? OturumKapatma { get; set; }
    public string? Vardiya { get; set; }
    public string? VardiyaEkibi { get; set; }
    public int toplamSure { get; set; } = 0;

}
