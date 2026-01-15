namespace API.Entities;

public class ExcelFileResponse
{
    public string FileName { get; set; }
    public string Data { get; set; } // Base64 Excel
}
