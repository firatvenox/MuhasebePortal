using API.Handler;
using Microsoft.AspNetCore.Mvc;
using ClosedXML.Excel;
using System.Globalization;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Http;
using API.Entities;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DakikaMaliyetController : ControllerBase
    {
        private readonly DakikaMaliyet _handler;

        public DakikaMaliyetController()
        {
            _handler = new DakikaMaliyet();
        }

        /// <summary>
        /// Dakika Maliyet verilerini getirir.
        /// </summary>
        [HttpGet]
        public IActionResult Get([FromQuery] DateTime tarih, [FromQuery] DateTime tarih1)
        {
            if (tarih == default || tarih1 == default)
                return BadRequest("Tarih parametreleri zorunludur.");

            var veriler = _handler.Handle(tarih, tarih1);

            if (veriler == null || veriler.Count == 0)
                return NotFound("Veri bulunamadı.");

            return Ok(veriler);
        }

        /// <summary>
        /// Dakika Maliyet verilerini Excel olarak döner.
        /// Kuika uyumlu: Base64 + Dosya adı
        /// </summary>
        [HttpGet("excel")]
        [ProducesResponseType(typeof(ExcelFileResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult GetExcel([FromQuery] DateTime tarih, [FromQuery] DateTime tarih1)
        {
            if (tarih == default || tarih1 == default)
                return BadRequest("Tarih parametreleri zorunludur.");

            var veriler = _handler.Handle(tarih, tarih1);
            if (veriler == null || veriler.Count == 0)
                return NotFound("Veri bulunamadı.");

            // Filter out empty parts
            var filtered = veriler.Where(d => !string.IsNullOrWhiteSpace(d.Part)).ToList();

            // Build columns
            var costGroups = filtered
                .Select(d => new { d.CostCode, d.CostDesc })
                .Distinct()
                .ToList();

            var glTypes = new[] { "72", "73", "75", "76", "77", "Diğer" };
            var columns = new List<(string CostCode, string CostDesc, string GlType, string Label)>();

            foreach (var cost in costGroups)
            {
                foreach (var glType in glTypes)
                {
                    decimal total;
                    if (glType == "Diğer")
                    {
                        total = filtered
                            .Where(d => d.CostCode == cost.CostCode &&
                                   !(new[] { "72", "73", "75", "76", "77" }
                                   .Contains(d.GlCode?.Substring(0, Math.Min(2, d.GlCode?.Length ?? 0)))))
                            .Sum(d => d.Para);
                    }
                    else
                    {
                        total = filtered
                            .Where(d => d.CostCode == cost.CostCode &&
                                   (d.GlCode ?? "").StartsWith(glType))
                            .Sum(d => d.Para);
                    }

                    if (total > 0)
                    {
                        var label = glType switch
                        {
                            "72" => "Direk",
                            "73" => "Endirek",
                            "75" => "AR-GE",
                            "76" => "Yönetim",
                            "77" => "Pazarlama",
                            _ => "Diğer"
                        };

                        columns.Add((cost.CostCode, cost.CostDesc, glType, label));
                    }
                }
            }

            // Group rows
            var groupedByTipAndType = filtered
                .GroupBy(x => x.Tip)
                .ToDictionary(g => g.Key,
                              g => g.GroupBy(x => x.Type)
                                    .ToDictionary(h => h.Key, h => h.ToList()));

            decimal GetCellAmount(string glDesc, string tip, string costCode, string glType)
            {
                return filtered
                    .Where(d => d.GlDesc == glDesc &&
                                d.Tip == tip &&
                                d.CostCode == costCode &&
                                (glType == "Diğer"
                                    ? !(new[] { "72", "73", "75", "76", "77" }
                                        .Contains(d.GlCode?.Substring(0, Math.Min(2, d.GlCode?.Length ?? 0))))
                                    : (d.GlCode ?? "").StartsWith(glType)))
                    .Sum(d => d.Para);
            }

            decimal GetTipTotal(string tip, string costCode, string glType)
            {
                return filtered
                    .Where(d => d.Tip == tip &&
                                d.CostCode == costCode &&
                                (glType == "Diğer"
                                    ? !(new[] { "72", "73", "75", "76", "77" }
                                        .Contains(d.GlCode?.Substring(0, Math.Min(2, d.GlCode?.Length ?? 0))))
                                    : (d.GlCode ?? "").StartsWith(glType)))
                    .Sum(d => d.Para);
            }

            string GetTipHeader(string tip)
            {
                return tip switch
                {
                    "Aylık Gelirler" => "AYLIK GELİRLER",
                    "Yardımcı Giderler" => "YARDIMCI GİDERLER",
                    "İşveren Giderleri" => "İŞVEREN GİDERLER",
                    "Tazminatlar" => "TAZMİNATLAR",
                    _ => tip
                };
            }

            // Excel oluştur
            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add("DakikaMaliyet");

            int row = 1;
            int col = 1;

            ws.Cell(row, col).Value = "GL / TIP";
            ws.Range(row, col, row + 1, col).Merge();
            ws.Cell(row, col).Style.Font.Bold = true;

            col = 2;

            var uniqueCostCodesForHeader = columns
                .Select(c => new { c.CostCode, c.CostDesc })
                .Distinct()
                .ToList();

            foreach (var cost in uniqueCostCodesForHeader)
            {
                var colsForThisCost = columns.Where(c => c.CostCode == cost.CostCode).ToList();
                int colspan = colsForThisCost.Count;
                ws.Cell(row, col).Value = cost.CostCode + " " + cost.CostDesc;

                if (colspan > 1)
                    ws.Range(row, col, row, col + colspan - 1).Merge();

                ws.Cell(row, col).Style.Font.Bold = true;
                ws.Cell(row, col).Style.Fill.SetBackgroundColor(ClosedXML.Excel.XLColor.FromHtml("#e0e0e0"));
                col += colspan;
            }

            ws.Cell(row, col).Value = "Satır Toplamı";
            ws.Range(row, col, row + 1, col).Merge();
            ws.Cell(row, col).Style.Font.Bold = true;

            row++;
            col = 2;

            foreach (var c in columns)
            {
                ws.Cell(row, col).Value = c.Label;
                ws.Cell(row, col).Style.Alignment.Horizontal = ClosedXML.Excel.XLAlignmentHorizontalValues.Right;
                col++;
            }

            row++;

            var sortedTips = groupedByTipAndType.Keys.ToList();

            foreach (var tip in sortedTips)
            {
                var types = groupedByTipAndType[tip];
                var sortedTypes = types.Keys.OrderBy(x => x).ToList();
                var firstType = sortedTypes.FirstOrDefault();

                bool isDetailedTip = firstType != 0 && new decimal[] { 1, 2, 3, 4 }.Contains(firstType);

                if (isDetailedTip)
                {
                    ws.Cell(row, 1).Value = GetTipHeader(tip);
                    ws.Range(row, 1, row, columns.Count + 2).Merge();
                    ws.Cell(row, 1).Style.Font.Bold = true;
                    ws.Cell(row, 1).Style.Fill.SetBackgroundColor(ClosedXML.Excel.XLColor.FromHtml("#f0f0f0"));
                    row++;
                }

                foreach (var type in sortedTypes)
                {
                    var group = types[type];
                    if (group == null) continue;

                    if (new decimal[] { 1, 2, 3, 4 }.Contains(type))
                    {
                        var glDescs = group.Select(d => d.GlDesc).Distinct().ToList();

                        foreach (var glDesc in glDescs)
                        {
                            int writeCol = 1;

                            ws.Cell(row, writeCol++).Value = glDesc;

                            foreach (var c in columns)
                            {
                                var amount = GetCellAmount(glDesc, tip, c.CostCode, c.GlType);
                                ws.Cell(row, writeCol).Value = amount;
                                ws.Cell(row, writeCol).Style.NumberFormat.Format = "#,##0.00";
                                ws.Cell(row, writeCol).Style.Alignment.Horizontal =
                                    ClosedXML.Excel.XLAlignmentHorizontalValues.Right;
                                writeCol++;
                            }

                            ws.Cell(row, writeCol).FormulaA1 =
                                "=SUM(" + ws.Range(row, 2, row, writeCol - 1).RangeAddress.ToStringRelative() + ")";
                            ws.Cell(row, writeCol).Style.NumberFormat.Format = "#,##0.00";
                            ws.Cell(row, writeCol).Style.Font.Bold = true;

                            row++;
                        }

                        // Tip subtotal
                        int tcol = 1;
                        ws.Cell(row, tcol++).Value = GetTipHeader(tip);

                        foreach (var c in columns)
                        {
                            var total = GetTipTotal(tip, c.CostCode, c.GlType);
                            ws.Cell(row, tcol).Value = total;
                            ws.Cell(row, tcol).Style.NumberFormat.Format = "#,##0.00";
                            ws.Cell(row, tcol).Style.Font.Bold = true;
                            ws.Cell(row, tcol).Style.Alignment.Horizontal =
                                ClosedXML.Excel.XLAlignmentHorizontalValues.Right;
                            tcol++;
                        }

                        ws.Cell(row, tcol).Value =
                            GetTipTotal(tip, columns.FirstOrDefault().CostCode, "Diğer");
                        ws.Cell(row, tcol).Style.NumberFormat.Format = "#,##0.00";
                        ws.Cell(row, tcol).Style.Font.Bold = true;

                        row++;
                    }
                    else
                    {
                        int tcol = 1;
                        ws.Cell(row, tcol++).Value = GetTipHeader(tip);

                        foreach (var c in columns)
                        {
                            var total = GetTipTotal(tip, c.CostCode, c.GlType);
                            ws.Cell(row, tcol).Value = total;
                            ws.Cell(row, tcol).Style.NumberFormat.Format = "#,##0.00";
                            ws.Cell(row, tcol).Style.Font.Bold = true;
                            ws.Cell(row, tcol).Style.Alignment.Horizontal =
                                ClosedXML.Excel.XLAlignmentHorizontalValues.Right;
                            tcol++;
                        }

                        ws.Cell(row, tcol).Value =
                            GetTipTotal(tip, columns.FirstOrDefault().CostCode, "Diğer");
                        ws.Cell(row, tcol).Style.NumberFormat.Format = "#,##0.00";
                        ws.Cell(row, tcol).Style.Font.Bold = true;

                        row++;
                    }
                }
            }

            ws.Columns().AdjustToContents();

            using var ms = new MemoryStream();
            wb.SaveAs(ms);
            ms.Position = 0;

            var fileName = $"DakikaMaliyet_{tarih:yyyyMMdd}_{tarih1:yyyyMMdd}.xlsx";
            var fileBytes = ms.ToArray();

            // KUİKA UYUMLU FORMAT
            return Ok(new ExcelFileResponse
            {
                FileName = fileName,
                Data = Convert.ToBase64String(fileBytes)
            });
        }
    }
}
