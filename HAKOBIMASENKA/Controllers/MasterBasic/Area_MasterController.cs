using HAKOBIMASENKA.Service;
using Microsoft.AspNetCore.Mvc;

namespace HAKOBIMASENKA.Controllers.MasterController
{
    //[Authorize]
    [Route("AreaMaster")]
    public class Area_MasterController : Controller
    {
        private readonly IAreaMasterService _service;

        public Area_MasterController(
            IAreaMasterService service)
        {
            _service = service;
        }

        [HttpGet("Area_Master")]
        public async Task<IActionResult> Area_Master()
        {
            var areas = await _service.GetListAsync();

            return View(
                "~/Views/Master/AreaMaster/Area_Master.cshtml",
                areas);
        }
        [HttpPost("Delete")]
        public async Task<IActionResult> Delete(string areaCode)
        {
            var result = await _service.DeleteAsync(areaCode);

            return Json(new
            {
                success = result > 0
            });
        }
        [HttpGet("NextCode")]
        public async Task<IActionResult> GetNextAreaCode()
        {
            var nextCode =
                await _service.GetNextAreaCodeAsync();

            return Json(new
            {
                success = true,
                areaCode = nextCode
            });
        }

        [HttpPost("Save")]
        public async Task<IActionResult> Save(
    string areaCode,
    string areaName,
    string? digitalCode)
        {
            if (string.IsNullOrWhiteSpace(areaCode))
            {
                return Json(new
                {
                    success = false,
                    message = "エリアコードを入力してください。"
                });
            }

            if (string.IsNullOrWhiteSpace(areaName))
            {
                return Json(new
                {
                    success = false,
                    message = "エリア名を入力してください。"
                });
            }

            var result =
                await _service.SaveAsync(
                    areaCode,
                    areaName,
                    digitalCode);

            return Json(new
            {
                success = result > 0
            });
        }
    }
}