namespace API.Entities;

public class Tutar
{
    public string? firma { get; set; }
    public required string part { get; set; }
    public required decimal tutar { get; set; }
    public required string aciklama  { get; set; }
}