using HAKOBIMASENKA.Service;
using Microsoft.AspNetCore.Mvc;

namespace HAKOBIMASENKA.Controllers.MasterController
{
    [Route("DepartmentMaster")]
    public class DepartmentMasterController : Controller
    {
        private readonly IDepartmentMasterService _service;

        public DepartmentMasterController(IDepartmentMasterService service)
        {
            _service = service;
        }

        // Department Master Screen
        [HttpGet("Department_Master")]
        public async Task<IActionResult> Department_Master()
        {
            var departments = await _service.GetListAsync();
            return View("~/Views/Master/DepartmentMaster/Department_Master.cshtml", departments);
        }

        // Get MAX Code + 1
        [HttpGet("NextCode")]
        public async Task<IActionResult> NextCode()
        {
            var departmentCode = await _service.GetNextCodeAsync();

            if (departmentCode == null)
            {
                return Json(new { success = false, departmentCode = "" });
            }

            return Json(new { success = true, departmentCode = departmentCode });
        }

        [HttpPost("Delete")]
        public async Task<IActionResult> Delete(string departmentCode)
        {
            if (string.IsNullOrWhiteSpace(departmentCode))
            {
                return Json(new { success = false, message = "削除するデータを選択してください。" });
            }

            var result = await _service.DeleteAsync(departmentCode);

            if (result > 0)
            {
                return Json(new { success = true });
            }

            return Json(new { success = false, message = "削除できませんでした。" });
        }

        [HttpPost("Save")]
        public async Task<IActionResult> Save(string departmentCode, string departmentName)
        {
            if (string.IsNullOrWhiteSpace(departmentCode))
            {
                return Json(new { success = false, message = "部門コードを入力してください" });
            }

            if (string.IsNullOrWhiteSpace(departmentName))
            {
                return Json(new { success = false, message = "部門名を入力してください" });
            }

            var result = await _service.SaveAsync(departmentCode, departmentName);

            if (result > 0)
            {
                return Json(new { success = true });
            }

            return Json(new { success = false, message = "登録できませんでした。" });
        }
    }
}
 
