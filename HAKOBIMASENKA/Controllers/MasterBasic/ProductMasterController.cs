

using HAKOBIMASENKA.Models.ViewModels;
using HAKOBIMASENKA.Service; 
using Microsoft.AspNetCore.Mvc;

namespace HAKOBIMASENKA.Controllers.MasterController
{
    public class ProductMasterController : Controller
    {
        private readonly IProductMasterService _productMasterService;

        public ProductMasterController(
            IProductMasterService productMasterService)
        {
            _productMasterService = productMasterService;
        }

        // Open Product Master screen.
        [HttpGet]
        public IActionResult Product_master()
        {
            ViewBag.DIGI_Chk = 1;  // Temporary test
            ViewBag.KYUYO_Chk = 1; // Temporary test
            return View("~/Views/Master/ProductMaster/Product_master.cshtml");
        }

        // Get MAX Product Code + 1.
        [HttpGet]
        public async Task<IActionResult> NextCode()
        {
            try
            {
                var nextCode =
                    await _productMasterService.GetNextCodeAsync();

                return Json(new
                {
                    success = true,
                    productCode = nextCode
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // Get one Product Master record.
        [HttpGet]
        public async Task<IActionResult> GetByCode(string productCode)
        {
            try
            {
                var product =
                    await _productMasterService.GetByCodeAsync(productCode);

                return Json(new
                {
                    success = true,
                    found = product != null,
                    item = product
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // Get all Product Master records.
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var products =
                    await _productMasterService.GetAllAsync();

                return Json(new
                {
                    success = true,
                    items = products
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // F7: Get previous Product Code.
        [HttpGet]
        public async Task<IActionResult> Previous(string productCode)
        {
            try
            {
                var product =
                    await _productMasterService.GetPreviousAsync(productCode);

                return Json(new
                {
                    success = true,
                    found = product != null,
                    item = product
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // F8: Get next Product Code.
        [HttpGet]
        public async Task<IActionResult> Next(string productCode)
        {
            try
            {
                var product =
                    await _productMasterService.GetNextAsync(productCode);

                return Json(new
                {
                    success = true,
                    found = product != null,
                    item = product
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // F1: Register new Product or update existing Product.
        [HttpPost]
        public async Task<IActionResult> Save(
            [FromBody] ProductMasterDto product)
        {
            if (product == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "登録データがありません。"
                });
            }

            if (string.IsNullOrWhiteSpace(product.ProductCode) ||
                !product.ProductCode.All(char.IsDigit) ||
                product.ProductCode.Length > 10)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "品名コードを正しく入力してください。"
                });
            }

            if (string.IsNullOrWhiteSpace(product.ProductName))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "品名を入力してください。"
                });
            }

            if (product.UnitPrice.HasValue &&
                (product.UnitPrice.Value < 0 ||
                 product.UnitPrice.Value > 999999.99m))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "単位重量の入力可能範囲 [ 0.00～999,999.99 ]"
                });
            }

            if (product.Capacity.HasValue &&
                (product.Capacity.Value < 0 ||
                 product.Capacity.Value > 9999999m ||
                 product.Capacity.Value != decimal.Truncate(product.Capacity.Value)))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "容量の入力可能範囲 [ 0～9,999,999 ]"
                });
            }

            try
            {
                product.ProductCode =
                    product.ProductCode.Trim().PadLeft(10, '0');

                var saved =
                    await _productMasterService.SaveAsync(product);

                return Json(new
                {
                    success = saved,
                    message = saved
                        ? "登録しました。"
                        : "登録できませんでした。"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // F4: Check whether Product Master can be deleted.
        // F4: Check whether Product Master can be deleted.
        [HttpGet]
        public async Task<IActionResult> CheckDelete(string productCode)
        {
            if (string.IsNullOrWhiteSpace(productCode))
            {
                return Json(new
                {
                    success = false,
                    canDelete = false,
                    message = "品名コードを入力してください。"
                });
            }

            try
            {
                var validationMessage =
                    await _productMasterService.CheckDeleteAsync(productCode);

                return Json(new
                {
                    success = true,
                    canDelete = string.IsNullOrEmpty(validationMessage),
                    message = validationMessage
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    canDelete = false,
                    message = ex.Message
                });
            }
        }


        // F4: Permanently delete Product Master record.
        [HttpPost]
        public async Task<IActionResult> Delete(string productCode)
        {
            if (string.IsNullOrWhiteSpace(productCode))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "品名コードを入力してください。"
                });
            }

            try
            {
                // Recheck whether the record is being used.
                var validationMessage =
                    await _productMasterService.CheckDeleteAsync(productCode);

                if (!string.IsNullOrEmpty(validationMessage))
                {
                    return Json(new
                    {
                        success = false,
                        message = validationMessage
                    });
                }

                // Delete Product Master record.
                var deleted =
                    await _productMasterService.DeleteAsync(productCode);

                return Json(new
                {
                    success = deleted,
                    message = deleted
                        ? "削除しました。"
                        : "削除対象データがありません。"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // =========================================
        // 品名区分マスタ Lookup
        // =========================================

        [HttpGet]
        public async Task<IActionResult> GetProductCategoryName(string code)
        {
            if (string.IsNullOrWhiteSpace(code) ||
                !System.Text.RegularExpressions.Regex.IsMatch(code, @"^\d{4}$"))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "品名区分コードが正しくありません。"
                });
            }

            var result = await _productMasterService.GetProductCategoryAsync(code);

            return Ok(new
            {
                success = true,
                found = result != null,
                item = result
            });
        }


        // =========================================
        // 輸送実績区分マスタ Lookup
        // =========================================

        [HttpGet]
        public async Task<IActionResult> GetTransportResultCategoryName(string code)
        {
            if (string.IsNullOrWhiteSpace(code) ||
                !System.Text.RegularExpressions.Regex.IsMatch(code, @"^\d{4}$"))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "輸送実績区分コードが正しくありません。"
                });
            }

            var result = await _productMasterService.GetTransportResultCategoryAsync(code);

            return Ok(new
            {
                success = true,
                found = result != null,
                item = result
            });
        }


    }
}



//using Microsoft.AspNetCore.Mvc;

//namespace HAKOBIMASENKA.Controllers.MasterController
//{
//    public class ProductMasterController : Controller
//    {
//        public IActionResult Product_master()
//        {
//            return View("~/Views/Master/ProductMaster/Product_master.cshtml");
//        }
//    }
//}
