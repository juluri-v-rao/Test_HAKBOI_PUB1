/// <summary>
/// Product Category Master Conroller  
/// 
/// Navigated from:
/// Main Menu → Basic Master → Product Category Master
///
/// Migrated From:
/// FrmM_Mast1.vb
///
/// Purpose:
/// Maintain Product Category Master records.
/// </summary>

using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ProductCategoryMasterViewModel;
using HAKOBIMASENKA.Repository.MainMenuRepository;
using HAKOBIMASENKA.Service.ProductCategoryService.ProductCategoryService;
using Microsoft.AspNetCore.Mvc;

namespace HAKOBIMASENKA.Controllers.MasterBasic
    {
    public class ProductCategoryMasterController(
        IProductCategoryService service,
        IMainMenuRepository mainMenu,
        IConfiguration configuration) : Controller
    {
        private readonly IProductCategoryService _service = service;

        // 入力端末: this terminal's number (legacy E_CODE)
        private string ClientNo => configuration["Terminal:ClientNo"] ?? "01";

        // Initial Display
        [HttpGet]
            // mode=search: opened from a search screen's F10 マスタ登録 (legacy SYORID2 = "検索")
            public async Task<IActionResult> Product_category_master(string? mode = null)
            {
                // legacy FrmM_Mast1_Load: 検索 / リスト / マスタ登録 are not offered when opened from a search
                ViewBag.FromSearch = mode == "search";

                var vm = new ProductCategoryViewModel
                {
                    コード = await _service.GetNextCodeAsync() ?? string.Empty,
                    IsNewRecord = true
                };

                ViewBag.List = await _service.GetListAsync();

                // the デジタコ tab is shown only with the デジタコ licence (legacy DIGI_Chk = 管理マスタ SEC4)
                ViewBag.ShowDigitalTab = (await mainMenu.GetCompanyAsync())?.SEC4 == "1";

                return View("~/Views/Master/ProductCategoryMaster/Product_category_master.cshtml", vm);
            }

            // Display selected row
            [HttpGet]
            public async Task<IActionResult> GetByCode(string code)
            {
                var vm = await _service.GetByCodeAsync(code);

                    if (vm == null)
                    {
                        return NotFound();
                    }
                return Json(vm);
            }

            // Check exists
            [HttpGet]
            public async Task<IActionResult> Exists(string code)
            {
                return Json(
                new
                {
                    exists = await _service.CodeExistsAsync(code)
                });
            }

            // Save
            [HttpPost]
            [ValidateAntiForgeryToken]
            public async Task<IActionResult> Save([FromBody] ProductCategoryViewModel model)
            {
                var result = await _service.SaveAsync(model, ClientNo);

                if (!result.Success)
                {
                return BadRequest(
                new
                    {
                        message = result.ErrorMessage
                    });
                }

                return Json(
                new
                {
                    success = true,
                    nextCode = result.NextCode
                });
            }

            // Delete check, before the 削除してもよいですか？ question (legacy Del_Chk)
            [HttpGet]
            public async Task<IActionResult> CheckDelete(string code)
            {
                    var result = await _service.CanDeleteAsync(code);

                    return Json(
                    new
                    {
                        success = result.Success,
                        message = result.BlockedReason
                    });
            }

            // Delete
            [HttpPost]
            [ValidateAntiForgeryToken]
            public async Task<IActionResult> Delete(string code)
            {
                    var result = await _service.DeleteAsync(code);

                    if (!result.Success)
                    {
                        return BadRequest(
                        new
                        {
                            message = result.BlockedReason
                        });
                    }

                    return Json(
                    new
                    {
                        success = true
                    });
            }

            // Next Code
            [HttpGet]
            public async Task<IActionResult> NextCode()
                {
                    return Json(
                    new
                    {
                        code = await _service.GetNextCodeAsync()
                    });
                }
            }
    }