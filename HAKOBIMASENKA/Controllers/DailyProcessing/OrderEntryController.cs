using HAKOBIMASENKA.Models.ViewModels.DailyProcessingEntryViewModels.OrderEntryViewModel;
using HAKOBIMASENKA.Service.OrderEntryService;
using Microsoft.AspNetCore.Mvc;

namespace HAKOBIMASENKA.Controllers.DailyProcessing
{
    public class OrderEntryController(IOrderEntryService service) : Controller
    {
        private readonly IOrderEntryService _service = service;

        public async Task<IActionResult> Order_entry()
        {
            var (BranchCode, BranchName) = await _service.GetDefaultBranchAsync();

            var model = new OrderEntryViewModel
            {
                OrderNo = await _service.GetNewOrderNoAsync(),
                WorkVoucherNo = await _service.GetNewWorkVoucherNoAsync(),
                OrderDate = DateTime.Today,

                BranchCode = BranchCode,
                BranchName = BranchName,

                PlaceByShipper = await _service.IsPlaceByShipperAsync(),

                Details = [.. Enumerable.Range(1, 99).Select(i => new OrderDetailViewModel
                {
                    RowNo = i,
                })]
            };

            return View("~/Views/DailyProcessingEntry/OrderEntry/Order_entry.cshtml", model);

            }

        #region Load/GetNextOrder/GetPreviousOrder

        [HttpGet]
        public async Task<IActionResult> GetByOrderNo(string orderNo)
        {
            var model = await _service.GetByOrderNoAsync(orderNo);

            if (model == null)
            {
                return NotFound();
            }

            return Json(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetNextOrder(string orderNo)
        {
            var model = await _service.GetNextOrderAsync(orderNo);

            if (model == null)
            {
                return NotFound();
            }

            return Json(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetPreviousOrder(string orderNo)
        {
            var model = await _service.GetPreviousOrderAsync(orderNo);

            if (model == null)
            {
                return NotFound();
            }

            return Json(model);
        }

        #endregion

        #region Save/Delete

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Save([FromBody] OrderEntryViewModel? model)
        {
            if (model == null)
            {
                return BadRequest();
            }

            return Json(await _service.SaveAsync(model));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(string orderNo)
        {
            await _service.DeleteAsync(orderNo);

            return Ok();
        }

        #endregion

        #region Number Generation

        [HttpGet]
        public async Task<IActionResult> GetNewOrderNo()
        {
            var orderNo = await _service.GetNewOrderNoAsync();

            return Json(orderNo);
        }

        [HttpGet]
        public async Task<IActionResult> GetNewWorkVoucherNo()
        {
            var workVoucherNo = await _service.GetNewWorkVoucherNoAsync();

            return Json(workVoucherNo);
        }

        #endregion

        #region Lookup

        // Enter on a code input: returns the master values for the code, or found = false.
        // isNew hides masters that have ended, as legacy does on a new voucher (Sink_Flg).
        [HttpGet]
        public async Task<IActionResult> Lookup(string type, string code, string? shipperCode, bool isNew)
        {
            if (string.IsNullOrEmpty(type) || string.IsNullOrEmpty(code))
            {
                return BadRequest();
            }

            var result = await _service.LookupAsync(type, code.Trim(), shipperCode?.Trim(), isNew);

            if (result == null)
            {
                return BadRequest();
            }

            return Json(result);
        }

        // 運賃形態 1 to 9, shown beside 車種 while it has focus (legacy Set_Ini → Frame1B)
        [HttpGet]
        public async Task<IActionResult> GetVehicleTypes()
        {
            return Json(await _service.GetVehicleTypesAsync());
        }

        // The automatic 請求単価 and 下払単価 for a row's route, 品名, 車種 and units (legacy Dsp_Tanka). 0 means none.
        [HttpGet]
        public async Task<IActionResult> UnitPrice(string? shipperCode, string? departureCode, string? arrivalCode,
            string? productCode, string? vehicleTypeCode, string? billingUnitCode, string? paymentUnitCode)
        {
            return Json(await _service.GetUnitPricesAsync(
                shipperCode, departureCode, arrivalCode, productCode, vehicleTypeCode, billingUnitCode, paymentUnitCode));
        }

        // 運賃 (kind=bill, with the 荷主's rounding) or 下払運賃 (kind=pay, with the 傭車's rounding) (legacy Cal_King, Cal_YKing).
        [HttpGet]
        public async Task<IActionResult> CalculateFare(string kind, string? partyCode, string? unitCode,
            decimal quantity, decimal weight, decimal unitPrice)
        {
            var fare = await _service.CalculateFareAsync(kind, partyCode, unitCode, quantity, weight, unitPrice);

            if (fare == null)
            {
                return BadRequest();
            }

            return Json(new { fare });
        }

        #endregion

    }
}
