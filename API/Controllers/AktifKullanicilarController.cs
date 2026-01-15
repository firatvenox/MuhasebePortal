using Microsoft.AspNetCore.Mvc;
using API.Handler;
using API.Entities;
using System.Collections.Generic;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserLockController : ControllerBase
    {
        // Handler sınıfını çağırıyoruz
        private readonly AktifKullanicilar _handler;

        public UserLockController()
        {
            _handler = new AktifKullanicilar();
        }

        [HttpPost("disconnect")]
        public IActionResult Disconnect([FromBody] DisconnectRequest request)
        {
            var handler = new AktifKullanicilar();
            bool success = handler.DisconnectUser(request.UsrID, request.Sirket);
            
            if (success)
                return Ok(new { message = "Kullanıcı başarıyla sistemden düşürüldü." });
            
            return BadRequest("Bağlantı kesme işlemi başarısız oldu.");
        }

        public class DisconnectRequest {
            public int UsrID { get; set; }
            public string Sirket { get; set; }
        }

        [HttpGet("active-locks")]
        public ActionResult<List<UserLockEntity>> GetActiveLocks()
        {
            try
            {
                // Yazdığımız metodun listesini döndürüyoruz
                var result = _handler.GetActiveUsersAndLocks();
                
                if (result == null || result.Count == 0)
                {
                    return NotFound("Aktif kullanıcı veya kilitlenme bilgisi bulunamadı.");
                }

                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, $"Sunucu hatası: {ex.Message}");
            }
        }
    }
}