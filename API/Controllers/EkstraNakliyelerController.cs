using API.Entities;
using API.Handler;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EkstraNakliyelerController : ControllerBase
    {
        /// <summary>
        /// Verilen irsaliye numarasına göre ekstra nakliye listesini getirir.
        /// </summary>
        /// <param name="irsaliyeNumarasi">İrsaliye numarası</param>
        /// <returns>EkstraNakliyeler listesi</returns>
        [HttpGet("{irsaliyeNumarasi}")]
        public ActionResult<List<EkstraNakliyeler>> Get(string irsaliyeNumarasi)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(irsaliyeNumarasi))
                    return BadRequest("İrsaliye numarası boş olamaz.");

                var handler = new GetirEkstraNakliyeler();
                var liste = handler.Handle(irsaliyeNumarasi);

                if (liste == null || liste.Count == 0)
                    return NotFound($"'{irsaliyeNumarasi}' numaralı irsaliye için kayıt bulunamadı.");

                return Ok(liste);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Sunucu hatası: {ex.Message}");
            }
        }
    }
}
