/// <summary>
/// Management Master Controller
/// 
/// Navigated from:
/// Main Menu → Basic Master → Management Master
///
/// Migrated From:
/// FrmM_Kanri.vb
///
/// Purpose:
/// Maintain Management Master records.
/// </summary>
/// 
using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ManagementMasterViewModel;
using HAKOBIMASENKA.Service.ManagementMasterService.ManagementMasterService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace HAKOBIMASENKA.Controllers.MasterBasic
    {
    public class ManagementMasterController(IManagementMasterService service, IConfiguration configuration) : Controller
    {
        private readonly IManagementMasterService _service = service;

        // Legacy E_CODE (PCNO in APP.ini): クライアントNo on the screen and 入力端末 on save.
        // Set Terminal:ClientNo in appsettings.json; 01 when it is not set.
        private string ClientNo =>
            string.IsNullOrWhiteSpace(configuration["Terminal:ClientNo"]) ? "01" : configuration["Terminal:ClientNo"]!.Trim();

        // Legacy SQL_Name (SQLPATH in APP.ini): the database name, here taken from the connection string.
        private string ServerPath =>
            new SqlConnectionStringBuilder(configuration.GetConnectionString("DefaultConnection") ?? "").InitialCatalog;

        public async Task<IActionResult> Management_master()
        {
            var result = new ManagementMasterViewModel
            {
                自社コード = await _service.GetNextCodeAsync() ?? string.Empty,
                IsNewRecord = true
            };

            ViewBag.List = await _service.GetListAsync();

            return View("~/Views/Master/ManagementMaster/Management_master.cshtml", result);
        }

        /// <summary>
        /// Grid Load
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetList()
        {
            var result = await _service.GetListAsync();

            return Json(result);
        }

        /// <summary>
        /// Load Record By Company Code
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetByCode(string code)
        {
            var result = await _service.GetByCodeAsync(code);

            if (result == null)
            {
                // no row: the screen still shows マシン設定 (the 01 row is created by the first F1)
                return NotFound(new { 顧客No = ClientNo, サーバーパス = ServerPath });
            }

            // shown in マシン設定 (legacy Dsp_Data2: TxtNo = E_CODE, TxtPath = SQL_Name); never saved
            result.顧客No = ClientNo;
            result.サーバーパス = ServerPath;

            return Json(result);
        }

        /// <summary>
        /// Check Existing Code
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> Exists(
        string code)
        {
            var exists = await _service.ExistsAsync(code);

            return Json(exists);
        }

        /// <summary>
        /// New Record Code
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> NextCode()
        {
            var nextCode = await _service.GetNextCodeAsync();

            return Json(nextCode);
        }

        /// <summary>
        /// Save
        /// </summary>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Save([FromBody] ManagementMasterViewModel model)
        {
            if (model == null || !ModelState.IsValid)
            {
                // A value the model cannot hold (e.g. text in a date or number field)
                return Json(new ManagementMasterSaveResult
                {
                    Success = false,
                    ErrorMessage = "登録中に異常が発生しました！！\n再登録して下さい"
                });
            }

            // 入力端末 = this PC's number (legacy E_CODE), not the クライアントNo box, which legacy never saves
            var result = await _service.SaveAsync(model, ClientNo);

            return Json(result);
        }

        /// <summary>
        /// Delete check, before the 削除してもよいですか？ question (legacy Del_Chk + 01 check)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> CheckDelete(string companyCode)
        {
            var result = await _service.CheckDeleteAsync(companyCode);

            return Json(result);
        }

        /// <summary>
        /// Delete
        /// </summary>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(string companyCode)
        {
            var result = await _service.DeleteAsync(companyCode);

            return Json(result);
        }
    }
}
