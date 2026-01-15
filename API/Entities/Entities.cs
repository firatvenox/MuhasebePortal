namespace API.Entities;

public class Tarih
{
    public DateTime TarihValue { get; set; }
}

public class Parca
{
    public string ParcaKodu { get; set; } = string.Empty;
    public string ParcaAdi { get; set; } = string.Empty;
}

public class UrunTipi
{
    public string? Tip { get; set; }
}

public class UrunGrubu
{
    public string UrunGrubuAdi { get; set; } = string.Empty;
}

public class Musteri
{
    public string ShipTo { get; set; } = string.Empty;
}

public class HareketTipi
{
    public string Tip { get; set; } = string.Empty;
}
