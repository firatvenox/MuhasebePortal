using API.Data;
using API.Entities;
using API.Handler;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Threading.Tasks;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GecikenTasimalarController : ControllerBase
    {
        private readonly ILogger<GecikenTasimalarController> _logger;
        private readonly MsContext _context;

        public GecikenTasimalarController(ILogger<GecikenTasimalarController> logger, MsContext context)
        {
            _logger = logger;
            _context = context;
        }

        private static readonly string[] _dateFormats = new[]
        {
            "yyyy-MM-dd",
            "yyyyMMdd",
            "MM/dd/yyyy",
            "M/d/yyyy",
            "dd.MM.yyyy",
            "dd/MM/yyyy"
        };

        /// <summary>
        /// Gecikmesi olan taşımaları belirtilen tarih aralığında getirir
        /// </summary>
        [HttpGet("delayed/{atolye}/{startDate:regex(.+)}/{endDate:regex(.+)}")]
        public async Task<ActionResult<List<GecikenTasimalar>>> GetDelayedTransports(
            string atolye, string startDate, string endDate)
        {
            try
            {
                // URL decode + trim
                startDate = Uri.UnescapeDataString(startDate ?? string.Empty).Trim();
                endDate   = Uri.UnescapeDataString(endDate ?? string.Empty).Trim();
                atolye    = Uri.UnescapeDataString(atolye ?? string.Empty).Trim();

                _logger.LogInformation("Delayed raw => atolye: {at}, start: {start}, end: {end}", atolye, startDate, endDate);

                if (!DateTime.TryParseExact(startDate, _dateFormats, CultureInfo.InvariantCulture,
                        DateTimeStyles.AllowWhiteSpaces, out var start) ||
                    !DateTime.TryParseExact(endDate, _dateFormats, CultureInfo.InvariantCulture,
                        DateTimeStyles.AllowWhiteSpaces, out var end))
                {
                    return BadRequest("Geçersiz tarih. Kabul edilen formatlar: yyyy-MM-dd, yyyyMMdd, MM/dd/yyyy, dd.MM.yyyy");
                }

                var handler = new GecikenTasimalarHandler();
                var result = await handler.HandleAsync(start, end, atolye);

                if (result == null || result.Count == 0)
                    return NotFound("Bu tarih aralığında gecikmiş taşıma bulunamadı.");

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetDelayedTransports hata");
                return StatusCode(500, $"Sunucu hatası: {ex.Message}");
            }
        }

        /// <summary>
        /// GecikenTasimalar ve ERMPLASureler'i birleştirerek getirir
        /// </summary>
        [HttpGet("enriched/{atolye}/{startDate:regex(.+)}/{endDate:regex(.+)}")]
        public async Task<ActionResult<List<GecikenTasimalar>>> GetEnrichedDelayedTransports(
            string atolye, string startDate, string endDate)
        {
            // URL decode + trim
            startDate = Uri.UnescapeDataString(startDate ?? string.Empty).Trim();
            endDate   = Uri.UnescapeDataString(endDate ?? string.Empty).Trim();
            atolye    = Uri.UnescapeDataString(atolye ?? string.Empty).Trim();

            _logger.LogInformation("Enriched raw => atolye: {at}, start: {start}, end: {end}", atolye, startDate, endDate);

            if (!DateTime.TryParseExact(startDate, _dateFormats, CultureInfo.InvariantCulture,
                    DateTimeStyles.AllowWhiteSpaces, out var start) ||
                !DateTime.TryParseExact(endDate, _dateFormats, CultureInfo.InvariantCulture,
                    DateTimeStyles.AllowWhiteSpaces, out var end))
            {
                return BadRequest("Geçersiz tarih. Kabul edilen formatlar: yyyy-MM-dd, yyyyMMdd, MM/dd/yyyy, dd.MM.yyyy");
            }

            var handler = new EnrichedGecikenTasimalarHandler(_context);
            var result = await handler.HandleWithTimingAsync(start, end, atolye);

            if (result == null || result.Count == 0)
                return NotFound("Bu tarih aralığında kayıt bulunamadı.");

            return Ok(result);
        }


        /// <summary>
        /// GecikenTasimalar ve ERMPLASureler'i birleştirerek getirir
        /// </summary>
        [HttpGet("kaynak3/{atolye}/{startDate:regex(.+)}/{endDate:regex(.+)}")]
        public async Task<ActionResult<List<GecikenTasimalar>>> GetEnrichedDelayedKaynak3Transports(
            string atolye, string startDate, string endDate)
        {
            // URL decode + trim
            startDate = Uri.UnescapeDataString(startDate ?? string.Empty).Trim();
            endDate   = Uri.UnescapeDataString(endDate ?? string.Empty).Trim();
            atolye    = Uri.UnescapeDataString(atolye ?? string.Empty).Trim();

            _logger.LogInformation("Enriched raw => atolye: {at}, start: {start}, end: {end}", atolye, startDate, endDate);

            if (!DateTime.TryParseExact(startDate, _dateFormats, CultureInfo.InvariantCulture,
                    DateTimeStyles.AllowWhiteSpaces, out var start) ||
                !DateTime.TryParseExact(endDate, _dateFormats, CultureInfo.InvariantCulture,
                    DateTimeStyles.AllowWhiteSpaces, out var end))
            {
                return BadRequest("Geçersiz tarih. Kabul edilen formatlar: yyyy-MM-dd, yyyyMMdd, MM/dd/yyyy, dd.MM.yyyy");
            }

            var handler = new EnrichedGecikenTasimalarKaynak3Handler(_context);
            var result = await handler.HandleWithTimingAsync(start, end, atolye);

            if (result == null || result.Count == 0)
                return NotFound("Bu tarih aralığında kayıt bulunamadı.");

            return Ok(result);
        }

    }
}
