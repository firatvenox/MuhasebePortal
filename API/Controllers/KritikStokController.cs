using API.Entities;
using API.Handler;
using API.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KritikStokController : ControllerBase
    {
        private readonly KritikStoklar _kritikStokHandler;
        private readonly KantinDetay _kantinHandler;

        public KritikStokController()
        {
            _kritikStokHandler = new KritikStoklar();
            _kantinHandler = new KantinDetay();
        }

        /// <summary>
        /// Kritik stok listesini getirir ve mail gönderir
        /// </summary>
        [HttpGet("kritik-stoklar")]
        public ActionResult<List<KritikStok>> GetKritikStoklar()
        {
            try
            {
                // 1. Kritik stokları çek
                var result = _kritikStokHandler.Handle();

                if (result == null || result.Count == 0)
                    return NotFound("Kritik stok bulunamadı.");

                // 2. Mail gönder
                var mailService = new MailService();
                mailService.SendKritikStokMail(new List<string>
                {
                    "firat.devran@ermetal.com"
                });

                // 3. Sonucu API response olarak döndür
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Bir hata oluştu: {ex.Message}");
            }
        }
    }
}
