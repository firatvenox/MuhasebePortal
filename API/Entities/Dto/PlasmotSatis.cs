namespace API.Entities.Dto;

public class PlasmotSatis
{
    public required List<Tutar> TutarToplam { get; set; }
    public required List<SatisRaporuPlasmot> satisRaporlari { get; set; }
}