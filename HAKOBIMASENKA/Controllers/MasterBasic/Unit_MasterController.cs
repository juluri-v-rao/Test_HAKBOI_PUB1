using HAKOBIMASENKA.Service;
using Microsoft.AspNetCore.Mvc;

namespace HAKOBIMASENKA.Controllers.MasterController
{
    [Route("UnitMaster")]
    public class Unit_MasterController : Controller
    {
        private readonly IUnitMasterService _service;
        public Unit_MasterController(
            IUnitMasterService service)
        {
            _service = service;
        }
        [HttpGet("Unit_Master")]
        public async Task<IActionResult> Unit_Master()
        {
            var units =
                await _service.GetListAsync();

            return View(
                "~/Views/Master/UnitMaster/Unit_Master.cshtml",
                units);
        }
        [HttpGet("NextCode")]
        public async Task<IActionResult> NextCode()
        {
            var unitCode =
                await _service.GetNextCodeAsync();

            if (unitCode == null)
            {
                return Json(new
                {
                    success = false,
                    message = ""
                });
            }

            return Json(new
            {
                success = true,
                unitCode = unitCode
            });
        }
        [HttpPost("DeleteCheck")]
        public async Task<IActionResult> DeleteCheck(string unitCode)
        {
            if (string.IsNullOrWhiteSpace(unitCode))
            {
                return Json(new
                {
                    success = false,
                    message = "削除するデータを選択してください。"
                });
            }

            var message = await _service.CheckDeleteAsync(unitCode);

            return Json(new
            {
                success = string.IsNullOrEmpty(message),
                message = message
            });
        }
        [HttpPost("Delete")]
        public async Task<IActionResult> Delete(string unitCode)
        {
            if (string.IsNullOrWhiteSpace(unitCode))
            {
                return Json(new
                {
                    success = false,
                    message = "削除するデータを選択してください。"
                });
            }

            // Recheck dependencies before actual deletion.
            var message = await _service.CheckDeleteAsync(unitCode);

            if (!string.IsNullOrEmpty(message))
            {
                return Json(new
                {
                    success = false,
                    message = message
                });
            }

            var result = await _service.DeleteAsync(unitCode);

            return Json(new
            {
                success = result > 0,
                message = result > 0 ? "" : "削除できませんでした。"
            });
        }

        [HttpPost("Save")]
        public async Task<IActionResult> Save(string unitCode,string unitName, string calculationType)
        {
            if (string.IsNullOrWhiteSpace(unitCode))
            {
                return Json(new
                {
                    success = false,
                    message = "単位コードを入力してください。"
                });
            }

            if (string.IsNullOrEmpty(unitName))
            {
                return Json(new
                {
                    success = false,
                    message = "単位を入力してください。"
                });
            }

            if (string.IsNullOrWhiteSpace(calculationType))
            {
                return Json(new
                {
                    success = false,
                    message = "計算区分を入力してください。"
                });
            }
            var result =
                await _service.SaveAsync(unitCode,unitName,calculationType);

            return Json(new
            {
                success = result > 0
            });
        }
    }
}