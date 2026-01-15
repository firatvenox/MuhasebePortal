namespace API.Entities
{
    public class UserLockEntity
    {
        public int UsrID { get; set; }
        public string? UsrName { get; set; }
        public string? UsrIP { get; set; }
        public string? qadProgram { get; set; }
        public string? LockTable { get; set; }
        public string? lockDetail { get; set; }
        public string? sirket { get; set; }
        public string? lockFlags { get; set; }
    }
}