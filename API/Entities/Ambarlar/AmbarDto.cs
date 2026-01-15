namespace API.Entities
{
    public class AmbarDto
    {
        public required string ambarAdi { get; set; }
        public decimal kapasite { get; set; }
        public decimal varolanAgirlik { get; set; }
        public decimal ambarHacim { get; set; }
        public List<AmbarSecond> AmbarListe { get; set; } = new();
    }
}
