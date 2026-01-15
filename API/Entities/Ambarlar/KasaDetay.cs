namespace API.Entities;

public class KasaDetay
{
    public required string TempAmbar { get; set; }    // ffambh_kod
    public required string TempPart { get; set; }     // ffambh_part
    public required string TempKasa { get; set; }     // xxkasa_kod
    public decimal TempAgirlik { get; set; } // pt__dec01
    public decimal KasaHacim { get; set; }
}