using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using API.Handler;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KantinDetayController : ControllerBase
    {
        private readonly ILogger<KantinDetayController> _logger;

        public KantinDetayController(ILogger<KantinDetayController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// İşlemi çalıştırır ve ortaya çıkan lookup/result yapısını döner.
        /// Ayrıca handler kendi içinde JSON kaydı yapar (logs/ klasörü).
        /// </summary>
        [HttpGet]
        [Route("detay")]
        public async Task<ActionResult<object>> Getir(CancellationToken cancellationToken)
        {
            try
            {
                var handler = new KantinDetay();
                var result = await handler.HandleAsync();
                if (result == null)
                    return NotFound();

                return Ok(result);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Kantin detay isteği iptal edildi");
                return StatusCode(499, "Client Closed Request");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kantin detay alınırken hata oluştu");
                return StatusCode(500, "Bir hata oluştu: " + ex.Message);
            }
        }

        /// <summary>
        /// En son oluşturulmuş JSON çıktısını indirir (logs klasöründen).
        /// Eğer dosya yoksa 404 döner.
        /// </summary>
        [HttpGet]
        [Route("detay/file")]
        public ActionResult GetLatestJson()
        {
            try
            {
                var logsDir = Path.Combine(AppContext.BaseDirectory, "logs");
                if (!Directory.Exists(logsDir)) return NotFound("Logs dizini bulunamadı.");

                var file = Directory.GetFiles(logsDir, "kantin_detay_*.json")
                    .OrderByDescending(f => f)
                    .FirstOrDefault();

                if (string.IsNullOrEmpty(file) || !System.IO.File.Exists(file))
                    return NotFound("JSON dosyası bulunamadı.");

                var fileName = Path.GetFileName(file);
                return PhysicalFile(file, "application/json", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "JSON dosyası indirilirken hata oluştu");
                return StatusCode(500, "Bir hata oluştu: " + ex.Message);
            }
        }
    }
}
