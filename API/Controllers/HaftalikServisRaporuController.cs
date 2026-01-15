using API.Handler;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using API.Entities;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HaftalikServisRaporuController : ControllerBase
    {
        private readonly HaftalikServisRaporuExcelHandler _handler;

        public HaftalikServisRaporuController(HaftalikServisRaporuExcelHandler handler)
        {
            _handler = handler;
        }

        /// <summary>
        /// Haftalık Servis Raporunu Excel olarak döner.
        /// Kuika uyumlu: Base64 + Dosya adı
        /// </summary>
        [HttpGet("excel")]
        [ProducesResponseType(typeof(ExcelFileResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetExcel(bool pazar)
        {
            try
            {
                var fileBytes = await _handler.Handle(pazar);

                var fileName = "HaftalikServisRaporu.xlsx";

                // KUİKA UYUMLU FORMAT
                return Ok(new ExcelFileResponse
                {
                    FileName = fileName,
                    Data = Convert.ToBase64String(fileBytes)
                });
            }
            catch (Exception ex)
            {
                return NotFound($"Hata: {ex.Message}");
            }
        }
    }
}