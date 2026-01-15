using API.Entities;
using API.Handler;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AmbarController : ControllerBase
    {
        private readonly AmbarHacim _ambarHandler;

        public AmbarController()
        {
            _ambarHandler = new AmbarHacim();
        }

        // GET: api/Ambar/hacim
        [HttpGet("hacim")]
        public ActionResult<List<AmbarDto>> GetAmbarHacim()
        {
            try
            {
                var result = _ambarHandler.Handle(); // AmbarHacim'ten listeyi alıyoruz
                if (result == null || result.Count == 0)
                    return NotFound(new { message = "Hiç ambar verisi bulunamadı." });

                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Ambar verileri alınamadı.", error = ex.Message });
            }
        }
    }
}
