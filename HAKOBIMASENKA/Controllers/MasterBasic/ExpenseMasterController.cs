using HAKOBIMASENKA.Helpers;
using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ExpenseMasterViewModel;
using HAKOBIMASENKA.Repository.MainMenuRepository;
using HAKOBIMASENKA.Service.ExpenseService;
using Microsoft.AspNetCore.Mvc;

namespace HAKOBIMASENKA.Controllers.MasterController
{
    public class ExpenseMasterController : Controller
    {
        private readonly IExpenseService _service;
        private readonly IMainMenuRepository _mainMenu;

        private readonly IConfiguration _configuration;

        public ExpenseMasterController(IExpenseService service, IMainMenuRepository mainMenu, IConfiguration configuration)
        {
            _service = service;
            _mainMenu = mainMenu;
            _configuration = configuration;
        }

        private string ClientNo => string.IsNullOrWhiteSpace(_configuration["Terminal:ClientNo"]) ? "01" : _configuration["Terminal:ClientNo"]!.Trim();

        // GET /Expense Initial Screen display
        [HttpGet]
        public async Task<IActionResult> Expense_master()
        {
            var vm = new ExpenseViewModel
            {
                経費コード = await _service.GetNextCodeAsync() ?? string.Empty,
                IsNewRecord = true
            };
            ViewBag.CategoryOptions = await _service.GetCategoryOptionsAsync();
            ViewBag.List = await _service.GetListAsync();

            ViewBag.ShowDigitalTab = (await _mainMenu.GetCompanyAsync())?.SEC4 == "1";

            return View(
            "~/Views/Master/ExpenseMaster/Expense_master.cshtml",
            vm);
        }

        // Display data into the corresponding field from the grid
        [HttpGet]
        public async Task<IActionResult> GetByCode(string code)
        {
            var vm = await _service.GetByCodeAsync(code);
            if (vm == null) return NotFound();
            return Json(vm);
        }

        // Get Category name
        [HttpGet]
        public async Task<IActionResult> CategoryLookup(string code)
        {
            var name = await _service.LookupCategoryNameAsync(code);
            if (name == null)
            {
                return NotFound(new { message = $"指定した経費区分『{code}』は未登録です！！" });
            }
            return Json(new { name });
        }

        // Check data exist
        [HttpGet]
        public async Task<IActionResult> Exists(string code)
        {
            return Json(new { exists = await _service.CodeExistsAsync(code) });
        }

        [HttpGet]
        public async Task<IActionResult> DeleteCheck(string code)
        {
            var result = await _service.DeleteCheckAsync(code);

            if (!result.Success)
            {
                return BadRequest(new
                {
                    message = result.BlockedReason
                });
            }

            return Json(new { success = true });
        }

        // Input data validation and Insert or update the input data
        [HttpPost]
        public async Task<IActionResult> Save([FromBody] ExpenseViewModel model)
        {
            //var terminalCode = HttpContext.Request.Query["client"].ToString();

            var result = await _service.SaveAsync(model, ClientNo);
            if (!result.Success)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }
            return Json(new { success = true, nextCode = result.NextCode });
        }

        // DELETE /Expense/{code} — F4 (Delete): Del_Chk() + Data_Del()
        [HttpPost]
        public async Task<IActionResult> Delete(string code)
        {
            var result = await _service.DeleteAsync(code);
            if (!result.Success)
            {
                return BadRequest(new { message = result.BlockedReason });
            }
            return Json(new { success = true });
        }

        // GET /Expense/NextCode — Set_Code() reuse for F2 (Copy) and F11 (Cancel)
        [HttpGet]
        public async Task<IActionResult> NextCode()
        {
            return Json(new { code = await _service.GetNextCodeAsync() });
        }
    }
}
