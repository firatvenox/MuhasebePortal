namespace API.Entities;

public class CiroEntity
{
    public required string CariNo { get; set; }      // ih_cust karşılığı
    public required string MusName { get; set; }     // ih_cust karşılığı (muhtemelen müşteri adı)
    public decimal ToplamDov { get; set; }  // toplam 
    public DateTime AySonu { get; set; }
    public required string Sirket { get; set; }
}