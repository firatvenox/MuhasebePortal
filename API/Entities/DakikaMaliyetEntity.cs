namespace API.Entities;


public class DakikaMaliyetEntity
{
    public required string Part { get; set; }           // temp1_part LIKE fffth_part
    public decimal Type { get; set; }           // temp1_type LIKE fffth_type
    public required string Type1 { get; set; }          // temp1_type1 AS CHAR FORMAT "X(25)"
    public required string Tip { get; set; }            // temp1_tip AS CHAR FORMAT "X(25)"
    public required string CostCode { get; set; }       // temp1_costcode LIKE CostCentre.CostCentreCode
    public required string GlCode { get; set; }         // temp1_glcode LIKE GL.GLCode
    public required string GlDesc { get; set; }         // temp1_gldesc LIKE GL.GLDescription
    public required string CostDesc { get; set; }       // temp1_costdesc LIKE CostCentre.CostCentreDescription
    public decimal Para { get; set; }          // temp1_para LIKE PostingLine.PostingLineDebitLC
}
