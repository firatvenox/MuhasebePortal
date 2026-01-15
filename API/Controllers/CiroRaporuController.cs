using API.Entities;
using API.Handler;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CiroRaporuController : ControllerBase
    {
        [HttpGet("get-ciroraporu")]
        public ActionResult<List<CiroEntity>> GetCiroRaporu()
        {
            try
            {
                var rapor = new CiroRaporu();
                var veriler = rapor.Handle();
                return Ok(veriler);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Hata: {ex.Message}");
            }
        }
    }
}
