using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.CharteredVehicleMasterViewModel;
using HAKOBIMASENKA.Service.CharteredVehicleMasterService;
using Microsoft.AspNetCore.Mvc;

namespace HAKOBIMASENKA.Controllers.MasterBasic
    {
    /// <summary>
    /// 傭車マスタ (legacy FrmM_Yosha).
    /// </summary>
    public class CharteredVehicleMasterController : Controller
    {
        private readonly ICharteredVehicleMasterService _service;

        public CharteredVehicleMasterController(ICharteredVehicleMasterService service)
        {
            _service = service;
        }

        // =========================================
        //              Screen
        // =========================================

        [HttpGet]
        public IActionResult Chartered_Vehicle_Master(string? mode = null)
        {
            // opened from a search's F10 (legacy SYORID2 = "検索"): F5 / F9 / F10 blanked
            ViewBag.FromSearch = mode == "search";
            return View("~/Views/Master/CharteredVehicleMaster/Chartered_Vehicle_Master.cshtml");
        }

        // Everything the screen needs when it opens (legacy FrmM_Yosha_Load: Set_Cmb, defaults, Set_Code).
        [HttpGet]
        public async Task<IActionResult> GetInitialData()
        {
            try
            {
                return Json(new
                {
                    nextCode = await _service.GetNextGeneratedCodeAsync(),
                    defaults = await _service.GetDefaultsAsync(),
                    units = await _service.GetUnitsAsync(),
                    paymentMethods = await _service.GetPaymentMethodsAsync()
                });
            }
            catch
            {
                return StatusCode(500, new { message = "傭車マスタ画面の読み込みに失敗しました。" });
            }
        }

        // =========================================
        //          Load / Codes
        // =========================================

        [HttpGet]
        public async Task<IActionResult> GetByCode(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new { message = "傭車コードを入力して下さい。" });
            }

            try
            {
                var model = await _service.GetByCodeAsync(code);

                return model == null ? NotFound(new { message = "指定した傭車は未登録です。" }) : Json(model);
            }
            catch
            {
                return StatusCode(500, new { message = "傭車情報の取得に失敗しました。" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> Exists(string code)
        {
            try
            {
                return Json(new { exists = !string.IsNullOrWhiteSpace(code) && await _service.ExistsAsync(code) });
            }
            catch
            {
                return StatusCode(500, new { message = "傭車情報の取得に失敗しました。" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetNextGeneratedCode()
        {
            try
            {
                return Json(new { code = await _service.GetNextGeneratedCodeAsync() });
            }
            catch
            {
                return StatusCode(500, new { message = "傭車コードの取得に失敗しました。" });
            }
        }

        // F7
        [HttpGet]
        public async Task<IActionResult> GetPreviousCode(string? code)
        {
            try
            {
                return Json(new { code = await _service.GetPreviousCodeAsync(code ?? "") ?? "" });
            }
            catch
            {
                return StatusCode(500, new { message = "傭車情報の取得に失敗しました。" });
            }
        }

        // F8
        [HttpGet]
        public async Task<IActionResult> GetNextCode(string? code)
        {
            try
            {
                return Json(new { code = await _service.GetNextCodeAsync(code ?? "") ?? "" });
            }
            catch
            {
                return StatusCode(500, new { message = "傭車情報の取得に失敗しました。" });
            }
        }

        // =========================================
        //              Lookups
        // =========================================

        // 精算先 (legacy Dsp_Seikyu)
        [HttpGet]
        public async Task<IActionResult> GetSettlement(string code, bool isNewRecord)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return Json(new { found = false, name = "" });
            }

            try
            {
                var name = await _service.FindSettlementNameAsync(code, isNewRecord);

                return Json(new { found = name != null, name = name ?? "" });
            }
            catch
            {
                return StatusCode(500, new { message = "精算先の取得に失敗しました。" });
            }
        }

        // 郵便番号 → 住所 (legacy Dsp_Post)
        [HttpGet]
        public async Task<IActionResult> GetAddress(string postalCode)
        {
            if (string.IsNullOrWhiteSpace(postalCode))
            {
                return Json(new { found = false, address = "" });
            }

            try
            {
                var address = await _service.FindAddressAsync(postalCode);

                return Json(new { found = address != null, address = address ?? "" });
            }
            catch
            {
                return StatusCode(500, new { message = "住所の取得に失敗しました。" });
            }
        }

        // =========================================
        //          Save (F1) / Delete (F4)
        // =========================================

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Save([FromBody] CharteredVehicleMasterViewModel? model)
        {
            if (model == null)
            {
                return BadRequest(new { message = "保存する傭車情報がありません。" });
            }

            try
            {
                var (message, field) = await _service.SaveAsync(model);

                return message == null
                    ? Json(new { success = true })
                    : Json(new { success = false, message, field });
            }
            catch
            {
                return StatusCode(500, new { message = "傭車情報の登録に失敗しました。" });
            }
        }

        // Checked before the 削除してもよいですか？ question, as in legacy (Del_Chk).
        [HttpGet]
        public async Task<IActionResult> CheckDelete(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new { message = "傭車コードを入力して下さい。" });
            }

            try
            {
                var message = await _service.CheckDeleteAsync(code);

                return Json(new { canDelete = message == null, message });
            }
            catch
            {
                return StatusCode(500, new { message = "傭車情報の削除に失敗しました。" });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new { message = "傭車コードを入力して下さい。" });
            }

            try
            {
                var message = await _service.DeleteAsync(code);

                return message == null
                    ? Json(new { success = true })
                    : Json(new { success = false, message });
            }
            catch
            {
                return StatusCode(500, new { message = "傭車情報の削除に失敗しました。" });
            }
        }
    }
}
