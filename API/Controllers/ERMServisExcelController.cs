using Microsoft.AspNetCore.Mvc;
using API.Handler;

[ApiController]
[Route("api/servis")]
public class ERMServisExcelController : ControllerBase
{
    private readonly UploadHaftalikExcelHandler _handler;
    private readonly HaftalikServisRaporuExcelHandler _handlerRapor;

    public ERMServisExcelController(UploadHaftalikExcelHandler handler, HaftalikServisRaporuExcelHandler handlerRapor)
    {
        _handler = handler;
        _handlerRapor = handlerRapor;
    }

    [HttpGet("haftalik-servis-raporu")]
    public async Task<IActionResult> HaftalikServisRaporu(bool pazar)
    {
        var excel = await _handlerRapor.Handle(pazar);

        return File(
            excel,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Haftalik_Servis_Raporu.xlsx"
        );
    }
    [HttpPost("haftalik-excel-yukle")]
    public async Task<IActionResult> Yukle([FromBody] string base64Data, bool pazar, string yukleyen)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(base64Data))
                return BadRequest("Base64 data gerekli.");

            // 🔥 JSON string tırnaklarını ve DATA URI prefix'ini temizle
            base64Data = base64Data.Trim('"');

            var commaIndex = base64Data.IndexOf(',');
            if (commaIndex >= 0)
                base64Data = base64Data[(commaIndex + 1)..];

            byte[] bytes;
            try
            {
                bytes = Convert.FromBase64String(base64Data);
            }
            catch (Exception ex)
            {
                return BadRequest(
                    "Excel dosyası okunamıyor. Dosyanın bozuk olmadığından, şifrelenmediğinden ve geçerli bir .xlsx formatında olduğundan emin olun. Hata: "
                    + ex.Message
                );
            }

            using var stream = new MemoryStream(bytes);

            // ✅ BURASI KRİTİK
            var message = await _handler.Handle(stream, pazar, yukleyen);

            return Ok(new
            {
                Success = true,
                Message = "İşlem başarılı: " + message
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                Success = false,
                Message = "İşlem başarısız: " + ex.Message
            });
        }
    }


}
