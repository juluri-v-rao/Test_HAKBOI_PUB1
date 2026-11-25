using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.DriverMasterViewModel;
using HAKOBIMASENKA.Service.DriverMasterService;
using Microsoft.AspNetCore.Mvc;

namespace HAKOBIMASENKA.Controllers.MasterBasic
{
    /// <summary>
    /// 運転手マスタ (legacy FrmM_Tanto), all tabs including 運転者台帳 1-4.
    /// </summary>
    public class DriverMasterController : Controller
    {
        private readonly IDriverMasterService _service;

        public DriverMasterController(IDriverMasterService service)
        {
            _service = service;
        }

        // =========================================
        //              Screen
        // =========================================

        [HttpGet]
        public IActionResult Driver_master(string? mode = null)
        {
            // opened from a search's F10 (legacy SYORID2 = "検索"): F5 / F9 / F10 off
            ViewBag.FromSearch = mode == "search";
            return View("~/Views/Master/DriverMaster/Driver_master.cshtml");
        }

        // Everything the screen needs when it opens (legacy FrmM_Tanto_Load: Set_Cmb, licences, Set_Code).
        [HttpGet]
        public async Task<IActionResult> GetInitialData()
        {
            try
            {
                return Json(new
                {
                    nextCode = await _service.GetNextGeneratedCodeAsync(),
                    vehicles = await _service.GetVehiclesAsync(),
                    chartered = await _service.GetCharteredAsync(),
                    license = await _service.GetLicenseAsync()
                });
            }
            catch
            {
                return StatusCode(500, new { message = "運転手マスタ画面の読み込みに失敗しました。" });
            }
        }

        // The 車輌 / 傭車 dropdowns again (legacy Set_Cmb after an F6 search).
        [HttpGet]
        public async Task<IActionResult> GetOptions()
        {
            try
            {
                return Json(new
                {
                    vehicles = await _service.GetVehiclesAsync(),
                    chartered = await _service.GetCharteredAsync()
                });
            }
            catch
            {
                return StatusCode(500, new { message = "運転手マスタ画面の読み込みに失敗しました。" });
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
                return BadRequest(new { message = "運転手ｺｰﾄﾞを入力してください" });
            }

            try
            {
                var model = await _service.GetByCodeAsync(code);

                return model == null ? NotFound(new { message = "指定した運転手は未登録です。" }) : Json(model);
            }
            catch
            {
                return StatusCode(500, new { message = "運転手情報の取得に失敗しました。" });
            }
        }

        // F2 → code typed: the code must be free (legacy Data_Chk)
        [HttpGet]
        public async Task<IActionResult> Exists(string code)
        {
            try
            {
                return Json(new { exists = !string.IsNullOrWhiteSpace(code) && await _service.ExistsAsync(code) });
            }
            catch
            {
                return StatusCode(500, new { message = "運転手情報の取得に失敗しました。" });
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
                return StatusCode(500, new { message = "運転手コードの取得に失敗しました。" });
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
                return StatusCode(500, new { message = "運転手情報の取得に失敗しました。" });
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
                return StatusCode(500, new { message = "運転手情報の取得に失敗しました。" });
            }
        }

        // =========================================
        //              Lookups
        // =========================================
        // { found, name }: found = false when the code is not registered.

        // 車輌 (Dsp_CarCd) and 号車 (Dsp_Gosya)
        [HttpGet]
        public Task<IActionResult> GetVehicle(string code) => Lookup(code, _service.FindVehicleNumberAsync);

        // 傭車 (Dsp_YoshaCd)
        [HttpGet]
        public Task<IActionResult> GetChartered(string code) => Lookup(code, _service.FindCharteredNameAsync);

        // 部門 (Dsp_BKbn)
        [HttpGet]
        public Task<IActionResult> GetDepartment(string code) => Lookup(code, _service.FindDepartmentNameAsync);

        // 所属 (Dsp_SKbn)
        [HttpGet]
        public Task<IActionResult> GetAffiliation(string code) => Lookup(code, _service.FindAffiliationNameAsync);

        // 経費項目 (Dsp_Keihi)
        [HttpGet]
        public Task<IActionResult> GetExpense(string code) => Lookup(code, _service.FindExpenseNameAsync);

        // 郵便番号 → 住所 (Dsp_Post)
        [HttpGet]
        public async Task<IActionResult> GetAddress(string postalCode)
        {
            if (string.IsNullOrWhiteSpace(postalCode))
            {
                return Json(new { found = false, address1 = "", address2 = "" });
            }

            try
            {
                var address = await _service.FindAddressAsync(postalCode);

                return address == null
                    ? Json(new { found = false, address1 = "", address2 = "" })
                    : Json(new { found = true, address1 = address.Value.Address1, address2 = address.Value.Address2 });
            }
            catch
            {
                return StatusCode(500, new { message = "住所の取得に失敗しました。" });
            }
        }

        // 運転者台帳1 写真 (legacy Dsp_Image: ImgPict.ImageLocation = 写真パス)
        [HttpGet]
        public IActionResult GetPhoto(string? path)
        {
            var file = _service.FindPhotoFile(path);

            return file == null ? NotFound() : PhysicalFile(file.Value.Path, file.Value.ContentType);
        }

        private async Task<IActionResult> Lookup(string code, Func<string, Task<string?>> find)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return Json(new { found = false, name = "" });
            }

            try
            {
                var name = await find(code);

                return Json(new { found = name != null, name = name ?? "" });
            }
            catch
            {
                return StatusCode(500, new { message = "マスタの取得に失敗しました。" });
            }
        }

        // =========================================
        //          Save (F1) / Delete (F4)
        // =========================================

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Save([FromBody] DriverMasterViewModel? model)
        {
            if (model == null)
            {
                return BadRequest(new { message = "保存する運転手情報がありません。" });
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
                return StatusCode(500, new { message = "運転手情報の登録に失敗しました。" });
            }
        }

        // Checked before the 削除してもよいですか？ question, as in legacy (Del_Chk).
        [HttpGet]
        public async Task<IActionResult> CheckDelete(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new { message = "運転手ｺｰﾄﾞを入力してください" });
            }

            try
            {
                var message = await _service.CheckDeleteAsync(code);

                return Json(new { canDelete = message == null, message });
            }
            catch
            {
                return StatusCode(500, new { message = "運転手情報の削除に失敗しました。" });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new { message = "運転手ｺｰﾄﾞを入力してください" });
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
                return StatusCode(500, new { message = "運転手情報の削除に失敗しました。" });
            }
        }
    }
}
