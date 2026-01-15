// Models/PdfAmounts.cs
using System.Collections.Generic;

namespace API.Entities;

public class PdfAmountsResponse
{
    public List<PdfAmountItem> Items { get; set; } = new List<PdfAmountItem>();
    public Dictionary<string, decimal> TotalsByCurrency { get; set; } = new();
    public List<string> AIJsonResults { get; set; } = new(); // AI tarafından üretilen JSON
}

public class PdfAmountItem
{
    public int Page { get; set; }
    public string Line { get; set; } = "";
    public string RawMatch { get; set; } = "";
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "";
}
