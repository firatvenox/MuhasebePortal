namespace API.Entities;

public class EkstraNakliyeler{
    public string? parca { get; set; }
    public string? olcumBirimi { get; set; }
    public string? lot { get; set; }
    public decimal qty { get; set; }
    public DateTimeOffset tarih { get; set; }

}