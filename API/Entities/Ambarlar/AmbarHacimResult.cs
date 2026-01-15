namespace API.Entities;

public class AmbarHacimResult
{
    public List<Ambar> Ambarlar { get; set; } = new();
    public List<KasaDetay> KasaDetaylar { get; set; } = new();
}
