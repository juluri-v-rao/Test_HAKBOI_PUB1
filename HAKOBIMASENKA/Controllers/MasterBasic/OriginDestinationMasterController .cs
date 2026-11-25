using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.OriginDestMasterViewModel;
using HAKOBIMASENKA.Repository.MainMenuRepository;
using HAKOBIMASENKA.Service.OriginDestinationService;
using Microsoft.AspNetCore.Mvc;

namespace HAKOBIMASENKA.Controllers.MasterBasic
{
    public class OriginDestinationMasterController : Controller
    {
        private readonly IOriginDestinationService _service;
        private readonly IConfiguration _configuration;
        private readonly IMainMenuRepository _mainMenu;

        public OriginDestinationMasterController(IOriginDestinationService service, IConfiguration configuration, IMainMenuRepository mainMenu)
        {
            _service = service;
            _configuration = configuration;
            _mainMenu = mainMenu;
        }

        private string ClientNo => string.IsNullOrWhiteSpace(_configuration["Terminal:ClientNo"]) ? "01" : _configuration["Terminal:ClientNo"]!.Trim();

        // ---------------------------------------------------------
        // Open screen
        // URL: /OriginDestinationMaster
        // ---------------------------------------------------------
       // added mode for search screen work
        [HttpGet]
        public async Task<IActionResult> OriginDest_master(
    [FromQuery] string? customerCode,
    [FromQuery] string? mode)
        {
            try
            {
                // Identify whether the master is opened from the search popup. 
                // added mode for search screen work
                ViewBag.FromSearch = mode == "search";

                var model = await _service.InitializeAsync(customerCode);

                ViewBag.RegistrationMode = model.RegistrationMode;
                ViewBag.IsCommonMode = model.IsCommonMode;

                // the デジタコ tab is shown only with the デジタコ licence (legacy DIGI_Chk = 管理マスタ SEC4)
                /*ViewBag.ShowDigitalTab = (await _mainMenu.GetCompanyAsync())?.SEC4 == "1";*/
                var company = await _mainMenu.GetCompanyAsync();

                ViewBag.ShowDigitalTab = company?.SEC4 == "1" || company?.SEC5 == "1";

                return View(
                    "~/Views/Master/OriginDestinationMaster/OriginDest_master.cshtml",
                    model);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        message = $"{ex.Message}、発着地マスタ画面の読み込みに失敗しました。"
                    });
            }
        }

        // ---------------------------------------------------------
        // Customer lookup
        // URL: GET /OriginDestinationMaster/GetCustomer
        // ---------------------------------------------------------
        [HttpGet]
        public async Task<IActionResult> GetCustomer(
            [FromQuery] string customerCode)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(customerCode))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "荷主コードを入力してください。"
                    });
                }

                string? customerName =
                    await _service.GetCustomerShortNameAsync(customerCode);

                if (string.IsNullOrWhiteSpace(customerName))
                {
                    return NotFound(new
                    {
                        success = false,
                        message = $"指定した荷主『{customerCode}』は未登録です！！"
                    });
                }

                return Ok(new
                {
                    success = true,
                    customerName
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"{ex.Message}、荷主情報の取得中にエラーが発生しました。"
                });
            }
        }

        // ---------------------------------------------------------
        // District lookup
        // URL: GET /OriginDestinationMaster/GetDistrict
        // ---------------------------------------------------------
        [HttpGet]
        public async Task<IActionResult> GetDistrict(
            [FromQuery] string districtCode)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(districtCode))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "地区コードを入力してください。"
                    });
                }

                string? districtName =
                    await _service.GetDistrictNameAsync(districtCode);

                if (string.IsNullOrWhiteSpace(districtName))
                {
                    return NotFound(new
                    {
                        success = false,
                        message = $"指定したエリア『{districtCode}』は未登録です！！"
                    });
                }

                return Ok(new
                {
                    success = true,
                    districtName
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"{ex.Message}、地区情報の取得中にエラーが発生しました。"
                });
            }
        }

        // ---------------------------------------------------------
        // Postal code -> Address lookup
        // URL: GET /OriginDestinationMaster/GetPostalAddress
        // ---------------------------------------------------------
        [HttpGet]
        public async Task<IActionResult> GetPostalAddress(
            [FromQuery] string postalCode)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(postalCode))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "郵便番号を入力してください。"
                    });
                }

                var address =
                    await _service.GetAddressByPostalCodeAsync(postalCode);

                return Ok(new
                {
                    success = true,
                    address1 = address?.Address1,
                    address2 = address?.Address2
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"{ex.Message}、郵便番号情報の取得中にエラーが発生しました。"
                });
            }
        }

        // ---------------------------------------------------------
        // Generate next destination code
        // URL: GET /OriginDestinationMaster/GetNextCode
        // ---------------------------------------------------------
        [HttpGet]
        public async Task<IActionResult> GetNextCode(
            [FromQuery] string? customerCode)
        {
            try
            {
                string nextCode =
                    await _service.GetNextCodeAsync(customerCode ?? "");

                return Ok(new
                {
                    success = true,
                    nextCode
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"{ex.Message}、発着地コードの取得中にエラーが発生しました。"
                });
            }
        }

        // ---------------------------------------------------------
        // Get destination record
        // URL: GET /OriginDestinationMaster/GetByCode
        // ---------------------------------------------------------
        [HttpGet]
        public async Task<IActionResult> GetByCode(
            [FromQuery] string customerCode,
            [FromQuery] string destinationCode)
        {
            try
            {
                var model = await _service.GetByCodeAsync(
                    customerCode ?? "",
                    destinationCode ?? "");

                return Ok(new
                {
                    success = true,
                    data = model
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"{ex.Message}、発着地データの取得中にエラーが発生しました。"
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetList([FromQuery] string? customerCode)
        {
            var list = await _service.GetListAsync(customerCode ?? "");

            return Ok(new
            {
                success = true,
                list
            });
        }

        // Save / Register / Update
        // URL: POST /OriginDestinationMaster/Save?client=01
        // ---------------------------------------------------------
        [HttpPost]
        public async Task<IActionResult> Save([FromBody] OriginDestinationViewModel model)
        {
            try
            {
                if (model == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "登録データがありません。"
                    });
                }

                var result = await _service.SaveAsync(model, ClientNo);

                return Ok(new
                {
                    success = result.Success,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"{ex.Message}、発着地データの登録中にエラーが発生しました。"
                });
            }
        }

        // ---------------------------------------------------------
        // Delete
        // URL: POST /OriginDestinationMaster/Delete
        // ---------------------------------------------------------
        [HttpPost]
        public async Task<IActionResult> Delete(
            [FromBody] OriginDestinationDeleteRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "削除データがありません。"
                    });
                }

                var result = await _service.DeleteAsync(
                    request.CustomerCode ?? "",
                    request.DestinationCode ?? "",
                    request.IsCommonMode);

                return Ok(new
                {
                    success = result.Success,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"{ex.Message}、発着地データの削除中にエラーが発生しました。"
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> CheckDelete([FromQuery] string customerCode,
            [FromQuery] string destinationCode,
            [FromQuery] bool isCommonMode)
        {
            var message =
                await _service.GetDeleteBlockMessageAsync(
                    customerCode,
                    destinationCode,
                    isCommonMode);

            return Ok(new
            {
                success = true,
                message
            });
        }
    }



    // Request model for Delete
    public class OriginDestinationDeleteRequest
    {
        public string? CustomerCode { get; set; }

        public string? DestinationCode { get; set; }

        public bool IsCommonMode { get; set; }
    }

}
