using API.Entities;
using API.Entities.Dto;
using API.Handler;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MuhasebeController : ControllerBase
    {
        private readonly SatisRaporuMaliyetli _handler;
        private readonly SatisRaporuMaliyetliTest _handlerTest;
        private readonly SatisRaporuMaliyetliPlasmot _handlerSecond;
        private readonly IskartaPlasmot _iskartaPlasmot;
        private readonly CSLPlasmot _cSLPlasmot;

        public MuhasebeController()
        {
            _handlerSecond = new SatisRaporuMaliyetliPlasmot();

            _handler = new SatisRaporuMaliyetli();
            _handlerTest = new SatisRaporuMaliyetliTest();
            _iskartaPlasmot = new IskartaPlasmot();
            _cSLPlasmot = new CSLPlasmot();
        }

        /// <summary>
        /// Personel listesini getirir
        /// </summary>
        /// <param name="fatdate">Başlangıç fatura tarihi</param>
        /// <param name="fatdate1">Bitiş fatura tarihi</param>
        /// <param name="gun">Başlangıç irsaliye tarihi</param>
        /// <param name="gun1">Bitiş irsaliye tarihi</param>
        /// <param name="amortisman">Amortisman değeri</param>
        /// <param name="iskartaOran">İskarta oranı</param>
        /// <param name="yonetimOran">Yönetim oranı</param>
        /// <param name="degiskenOran">Değişken oranı</param>
        /// <param name="sabitOran">Sabit oran</param>
        /// <returns>List of SatisRaporu</returns>
        [HttpGet("SatisRaporuMaliyetli")]
        public ActionResult<List<SatisRaporu>> SatisRaporuMaliyetli(
            [FromQuery] DateTime fatdate,
            [FromQuery] DateTime fatdate1,
            [FromQuery] DateTime gun,
            [FromQuery] DateTime gun1,
            [FromQuery] decimal amortisman,
            [FromQuery] decimal iskartaOran,
            [FromQuery] decimal yonetimOran,   // burayı önce al
            [FromQuery] decimal degiskenOran, // sonra bunlar gelsin
            [FromQuery] decimal sabitOran
        )
        {
            try
            {
                var result = _handler.Handle(
                    fatdate, fatdate1, gun, gun1,
                    amortisman, iskartaOran, yonetimOran, degiskenOran, sabitOran
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Hata oluştu: {ex.Message}");
            }
        }

        /// <summary>
        /// Personel listesini getirir
        /// </summary>
        /// <param name="fatdate">Başlangıç fatura tarihi</param>
        /// <param name="fatdate1">Bitiş fatura tarihi</param>
        /// <param name="gun">Başlangıç irsaliye tarihi</param>
        /// <param name="gun1">Bitiş irsaliye tarihi</param>
        /// <param name="amortisman">Amortisman değeri</param>
        /// <param name="iskartaOran">İskarta oranı</param>
        /// <param name="yonetimOran">Yönetim oranı</param>
        /// <param name="degiskenOran">Değişken oranı</param>
        /// <param name="sabitOran">Sabit oran</param>
        /// <returns>List of SatisRaporu</returns>
        [HttpGet("SatisRaporuMaliyetliTest")]
        public ActionResult<List<SatisRaporu>> SatisRaporuMaliyetliTest(
            [FromQuery] DateTime fatdate,
            [FromQuery] DateTime fatdate1,
            [FromQuery] DateTime gun,
            [FromQuery] DateTime gun1,
            [FromQuery] decimal amortisman,
            [FromQuery] decimal iskartaOran,
            [FromQuery] decimal yonetimOran,   // burayı önce al
            [FromQuery] decimal degiskenOran, // sonra bunlar gelsin
            [FromQuery] decimal sabitOran
        )
        {
            try
            {
                var result = _handlerTest.Handle(
                    fatdate, fatdate1, gun, gun1,
                    amortisman, iskartaOran, yonetimOran, degiskenOran, sabitOran
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Hata oluştu: {ex.Message}");
            }
        }


        /// <summary>
        /// Personel listesini getirir
        /// </summary>
        /// <param name="fatdate">Başlangıç fatura tarihi</param>
        /// <param name="fatdate1">Bitiş fatura tarihi</param>
        /// <param name="gun">Başlangıç irsaliye tarihi</param>
        /// <param name="gun1">Bitiş irsaliye tarihi</param>
        /// <returns>List of SatisRaporu</returns>
        [HttpGet("SatisRaporuMaliyetliPlasmot")]
        public ActionResult<List<SatisRaporuPlasmot>> SatisRaporuMaliyetliPlasmot(
            [FromQuery] DateTime fatdate,
            [FromQuery] DateTime fatdate1,
            [FromQuery] DateTime gun,
            [FromQuery] DateTime gun1,
            [FromQuery] Decimal yonetimOran)
        {
            try
            {
                var result = _handlerSecond.Handle(fatdate, fatdate1, gun, gun1, yonetimOran);
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Hata loglama yapılabilir
                return StatusCode(500, $"Hata oluştu: {ex.Message}");
            }
        }


        /// <summary>
        /// Personel listesini getirir
        /// </summary>
        /// <param name="fatdate">Başlangıç fatura tarihi</param>
        /// <param name="fatdate1">Bitiş fatura tarihi</param>
        /// <returns>List of SatisRaporu</returns>
        [HttpGet("IskartaPlasmot")]
        public ActionResult<List<SatisRaporuPlasmot>> IskartaPlasmot(
            [FromQuery] DateTime fatdate,
            [FromQuery] DateTime fatdate1)
        {
            try
            {
                var result = _iskartaPlasmot.Handle(fatdate, fatdate1);
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Hata loglama yapılabilir
                return StatusCode(500, $"Hata oluştu: {ex.Message}");
            }
        }
        
         /// <summary>
        /// Personel listesini getirir
        /// </summary>
        /// <param name="fatdate">Başlangıç fatura tarihi</param>
        /// <param name="fatdate1">Bitiş fatura tarihi</param>
        /// <returns>List of SatisRaporu</returns>
        [HttpGet("CSLPlasmot")]
        public ActionResult<List<CSL>> CSLPlasmot(
            [FromQuery] DateTime fatdate,
            [FromQuery] DateTime fatdate1)
        {
            try
            {
                var result = _cSLPlasmot.Handle(fatdate, fatdate1);
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Hata loglama yapılabilir
                return StatusCode(500, $"Hata oluştu: {ex.Message}");
            }
        }

    }
}
