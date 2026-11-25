using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ShipperMasterViewModel;
using Microsoft.AspNetCore.Mvc;
using HAKOBIMASENKA.Service.ShipperService;

namespace HAKOBIMASENKA.Controllers.MasterController
{
    public class ShipperMasterController : Controller
    {
        private readonly IShipperService _service;
        private readonly IConfiguration _configuration;

        public ShipperMasterController(IShipperService service, IConfiguration configuration)
        {
            _service = service;
            _configuration = configuration;
        }
        private string ClientNo => string.IsNullOrWhiteSpace(_configuration["Terminal:ClientNo"]) ? "01" : _configuration["Terminal:ClientNo"]!.Trim();

        // =====================================================
        // 1. DISPLAY SHIPPER MASTER SCREEN
        // =====================================================
        [HttpGet]
        public async Task<IActionResult> Shipper_master(bool popupMode = false)
        {
            try
            {
                var model = new ShipperViewModel();

                ViewBag.PaymentCategories = await _service.GetPaymentCategoriesAsync();

                var defaults = await _service.GetSystemDefaultsAsync();

                ViewBag.SystemDefaults = defaults;

                ViewBag.unkoukanri = defaults.unkoukanri;

                ViewBag.digitco = defaults.digitco;

                ViewBag.NextCode = await _service.GetMaxCodeAsync();

                ViewBag.Units = await _service.GetUnitsAsync();

                ViewBag.BranchCode = "01"; // Default branch code for display
                ViewBag.BranchName = await _service.GetManagementNameAsync("01");

                ViewBag.PopupMode = popupMode;
                return View("~/Views/Master/ShipperMaster/Shipper_master.cshtml", model);
            }
            catch
            {
                return StatusCode(
                    500,
                    new { message = "荷主マスタ画面の読み込みに失敗しました。" });
            }

        }

        // =====================================================
        // 2. GET SHIPPER BY CODE
        // =====================================================
        [HttpGet]
        public async Task<IActionResult> GetByCode([FromQuery] string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new
                {
                    Message = "荷主コードを入力してください。"
                });
            }

            try
            {
                var shipper = await _service.GetByCodeAsync(code);

                if (shipper == null)
                {
                    return NotFound(new
                    {
                        message = "指定された荷主コードが存在しません。"
                    });
                }
                return Ok(shipper);
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "荷主情報の取得に失敗しました。"
                });
            }
        }

        // =====================================================
        // 3. CHECK WHETHER SHIPPER CODE EXISTS
        // =====================================================
        [HttpGet]
        public async Task<IActionResult> Exists([FromQuery] string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new
                {
                    message = "荷主コードを入力してください。"
                });
            }

            try
            {
                bool exists = await _service.ExistsAsync(code);

                return Ok(new { exists });
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "荷主コードの確認に失敗しました。"
                });
            }
        }

        // =====================================================
        // 4. GET NEXT SHIPPER CODE
        // =====================================================
        [HttpGet]
        public async Task<IActionResult> GetNextCode(
            [FromQuery] string currentCode = "")
        {
            try
            {
                string nextCode =
                await _service.GetNextCodeAsync(currentCode);

                return Ok(new { code = nextCode });
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "次の荷主コードの取得に失敗しました。"
                });
            }
        }

        // =====================================================
        // 5. GET PREVIOUS SHIPPER CODE
        // =====================================================
        [HttpGet]
        public async Task<IActionResult> GetPrevCode(
            [FromQuery] string currentCode)
        {
            try
            {
                string previousCode =
                await _service.GetPrevCodeAsync(currentCode);

                return Ok(new { code = previousCode });
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "前の荷主コードの取得に失敗しました。"
                });
            }
        }

        // =====================================================
        // 7. VALIDATE SETTLEMENT DESTINATION
        // =====================================================
        [HttpGet]
        public async Task<IActionResult> ValidateSettlementDestination(
            [FromQuery] string code,
            [FromQuery] bool isNewRecord = false)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new
                {
                    message = "請求先コードを入力してください。"
                });
            }

            try
            {
                var result =
                    await _service.ValidateSettlementDestinationAsync(
                        code,
                        isNewRecord);

                return Ok(new
                {
                    valid = result.valid,
                    略称 = result.略称
                });
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "請求先の確認に失敗しました。"
                });
            }
        }

        // =====================================================
        // 8. SAVE OR UPDATE SHIPPER
        // =====================================================
        [HttpPost]
        public async Task<IActionResult> Save(
            [FromBody] ShipperViewModel model)
        {
            if (model == null)
            {
                return BadRequest(new
                {
                    message = "保存する荷主情報がありません。"
                });
            }

            if (string.IsNullOrWhiteSpace(model.締め日))
            {
                return BadRequest(new
                {
                    message = "締め日を入力してください。"
                });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                await _service.UpsertAsync(model, ClientNo);

                return Ok(new
                {
                    success = true,
                    message = "荷主情報を保存しました。"
                });
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "荷主情報の保存に失敗しました。"
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> CheckDelete(string code, string kanriPlKbn)
        {
            var result = await _service.CheckDeleteAsync(
                code,
                kanriPlKbn
            );

            return Ok(new
            {
                success = string.IsNullOrEmpty(result),
                message = result
            });
        }

        // =====================================================
        // 9. DELETE SHIPPER
        // =====================================================
        [HttpPost]
        public async Task<IActionResult> Delete(
            [FromQuery] string code,
            [FromQuery] string kanriPlKbn)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new
                {
                    message = "削除する荷主コードを指定してください。"
                });
            }

            if (string.IsNullOrWhiteSpace(kanriPlKbn))
            {
                return BadRequest(
                    new
                    {
                        message = "kanriPlKbn は必須です。"
                    });
            }

            try
            {
                // Service checks references before deleting.
                string? message = await _service.DeleteAsync(
                    code,
                    kanriPlKbn);

                if (message != null)
                {
                    return BadRequest(new { message });
                }

                return Ok(new
                {
                    success = true,
                    message = "荷主情報を削除しました。"
                });
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "荷主情報の削除に失敗しました。"
                });
            }
        }

        // =====================================================
        // 10. GET SHIPPER HISTORY LIST
        // kind must match the values expected by the repository.
        // =====================================================
        [HttpGet]
        public async Task<IActionResult> GetHistory(
            [FromQuery] string code,
            [FromQuery] string branchCode,
            [FromQuery] string kind)
        {
            if (string.IsNullOrWhiteSpace(code) ||
                string.IsNullOrWhiteSpace(branchCode) ||
                string.IsNullOrWhiteSpace(kind))
            {
                return BadRequest(new
                {
                    message = "荷主コード、支店コード、履歴区分を指定してください。"
                });
            }

            try
            {
                var history = await _service.GetHistoryAsync(
                    code,
                    branchCode,
                    kind);

                return Ok(history);
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "履歴情報の取得に失敗しました。"
                });
            }
        }

        // =====================================================
        // 11. GET ONE SHIPPER HISTORY ROW
        // =====================================================
        [HttpGet]
        public async Task<IActionResult> GetHistoryRow(
            [FromQuery] string code,
            [FromQuery] string branchCode,
            [FromQuery] string kind,
            [FromQuery] DateTime updateDate)
        {
            try
            {
                var row = await _service.GetHistoryRowAsync(
                    code,
                    branchCode,
                    kind,
                    updateDate);

                if (row == null)
                {
                    return NotFound(new
                    {
                        message = "指定された履歴情報が存在しません。"
                    });
                }

                return Ok(row);
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "履歴情報の取得に失敗しました。"
                });
            }
        }

        // =====================================================
        // 12. INSERT OR UPDATE HISTORY ROW
        // =====================================================
        [HttpPost]
        public async Task<IActionResult> SaveHistoryRow(
            [FromQuery] string kind,
            [FromBody] ShipperHistoryDto row)
        {
            if (row == null ||
                string.IsNullOrWhiteSpace(kind) ||
                string.IsNullOrWhiteSpace(ClientNo))
            {
                return BadRequest(new
                {
                    message = "履歴情報、履歴区分、端末コードを指定してください。"
                });
            }

            try
            {
                await _service.UpsertHistoryRowAsync(
                    row,
                    kind,
                    ClientNo);

                return Ok(new
                {
                    success = true,
                    message = "履歴情報を保存しました。"
                });
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "履歴情報の保存に失敗しました。"
                });
            }
        }

        // =====================================================
        // 13. DELETE ONE HISTORY ROW
        // =====================================================
        [HttpPost]
        public async Task<IActionResult> DeleteHistoryRow(
            [FromQuery] string code,
            [FromQuery] string branchCode,
            [FromQuery] string kind,
            [FromQuery] DateTime updateDate)
        {
            try
            {
                await _service.DeleteHistoryRowAsync(
                    code,
                    branchCode,
                    kind,
                    updateDate);

                return Ok(new
                {
                    success = true,
                    message = "履歴情報を削除しました。"
                });
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "履歴情報の削除に失敗しました。"
                });
            }
        }

        // =====================================================
        // 14. GET PAYMENT CATEGORY OPTIONS
        // =====================================================
        [HttpGet]
        public async Task<IActionResult> GetPaymentCategories()
        {
            try
            {
                var categories =
                    await _service.GetPaymentCategoriesAsync();

                return Ok(categories);
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "支払区分の取得に失敗しました。"
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetDepartment([FromQuery] string code)
        {
            if (string.IsNullOrWhiteSpace(code))
                return BadRequest(new { message = "部門コードを入力してください。" });

            try
            {
                var result = await _service.GetDepartmentAsync(code);

                return Ok(new
                {
                    found = result != null,
                    departmentCode = result?.部門コード,
                    departmentName = result?.部門名称
                });
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "部門情報の取得に失敗しました。"
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetManagementName([FromQuery] string code)
        {
            if (string.IsNullOrWhiteSpace(code))
                return BadRequest(new { message = "自社コードを入力してください。" });

            try
            {
                var name = await _service.GetManagementNameAsync(code);

                return Ok(new
                {
                    found = name != null,
                    name
                });
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "管理情報の取得に失敗しました。"
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetBankName([FromQuery] string code)
        {
            if (string.IsNullOrWhiteSpace(code))
                return BadRequest(new { message = "銀行コードを入力してください。" });

            try
            {
                var result = await _service.GetBankNameAsync(code);

                return Ok(new
                {
                    found = result != null,
                    bankName1 = result?.銀行１,
                    bankName2 = result?.銀行２
                });
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "銀行情報の取得に失敗しました。"
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetUnits()
        {
            try
            {
                var result = await _service.GetUnitsAsync();

                return Ok(result);
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "単位マスタの取得に失敗しました。"
                });
            }
        }

        // =====================================================
        // 15. GET SYSTEM DEFAULTS
        // =====================================================
        [HttpGet]
        public async Task<IActionResult> GetSystemDefaults()
        {
            try
            {
                var defaults =
                    await _service.GetSystemDefaultsAsync();

                return Ok(new
                {
                    uriHasu = defaults.uriHasu,
                    zeiKbn = defaults.zeiKbn,
                    zeiHasu = defaults.zeiHasu,
                    seikyuBiSettei = defaults.seikyuBiSettei,
                    kazeiWarimashi = defaults.kazeiWarimashi,
                    hikazeiWarimashi = defaults.hikazeiWarimashi,
                    unkoukanri = defaults.unkoukanri,
                    digitco = defaults.digitco
                });
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "システム初期値の取得に失敗しました。"
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetNextGeneratedCode()
        {
            return Json(new { code = await _service.GetMaxCodeAsync() });
        }

        // =====================================================
        // CLEAR HISTORY WORK TABLES
        // =====================================================
        [HttpPost]
        public async Task<IActionResult> ClearHistoryWorkTables()
        {
            try
            {
                await _service.ClearHistoryWorkTablesAsync();

                return Ok(new
                {
                    success = true
                });
            }
            catch
            {
                return StatusCode(500, new
                {
                    message = "履歴ワークテーブルのクリアに失敗しました。"
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetKanriPlKbn()
        {
            return Ok(new
            {
                value = await _service.GetKanriPlKbnAsync()
            });
        }
    }
}
