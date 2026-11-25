
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Service.SearchService;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using HAKOBIMASENKA.Service.OriginDestinationService;

namespace HAKOBIMASENKA.Controllers.MasterController
{
    public class SearchScreenController : Controller
    {
        private readonly IVehicleSearchService _vehicleSearchService;
        private readonly IDriverSearchService _driverSearchService;
        private readonly IOrderSearchService _orderSearchService;
        private readonly IShipperSearchService _shipperSearchService;
        private readonly ICharteredSearchService _charteredSearchService;
        private readonly IProductNameSearchService _productNameSearchService;
        private readonly IAreaSearchService _areaSearchService;
        private readonly IProductClassificationSearchService _productClassificationSearchService;
        private readonly IUnitSearchService _unitSearchService;
        private readonly ITransportationRecordSearchService _transportationRecordSearchService;
        private readonly ICompanyBranchSearchService _companyBranchSearchService;
        private readonly IOriginDestinationSearchService _originDestinationSearchService;
        private readonly IDepartmentSearchService _departmentSearchService;
        private readonly IOriginDestinationService _originDestinationService;
        private readonly IExpenseSearchService _expenseSearchService;



        public SearchScreenController(
            IVehicleSearchService vehicleSearchService,
            IDriverSearchService driverSearchService,
            IOrderSearchService orderSearchService,
            IShipperSearchService shipperSearchService,
            ICharteredSearchService charteredSearchService,
            IProductNameSearchService productNameSearchService,
            IAreaSearchService areaSearchService,
            IProductClassificationSearchService productClassificationSearchService,
            IUnitSearchService unitSearchService,
            ITransportationRecordSearchService transportationRecordSearchService,
            ICompanyBranchSearchService companyBranchSearchService,
            IOriginDestinationSearchService originDestinationSearchService,
            IDepartmentSearchService departmentSearchService,
            IOriginDestinationService originDestinationService,
            IExpenseSearchService expenseSearchService)
        {
            _vehicleSearchService = vehicleSearchService;
            _driverSearchService = driverSearchService;
            _orderSearchService = orderSearchService;
            _shipperSearchService = shipperSearchService;
            _charteredSearchService = charteredSearchService;
            _productNameSearchService = productNameSearchService;
            _areaSearchService = areaSearchService;
            _productClassificationSearchService = productClassificationSearchService;
            _unitSearchService = unitSearchService;
            _transportationRecordSearchService = transportationRecordSearchService;
            _companyBranchSearchService = companyBranchSearchService;
            _originDestinationSearchService = originDestinationSearchService;
            _departmentSearchService = departmentSearchService;
            _originDestinationService = originDestinationService;
            _expenseSearchService = expenseSearchService;
        }

        // =========================================
        // Display Search Screen
        // =========================================
        public IActionResult Search_Screen()
        {
            return View("~/Views/Master/SearchScreen/Search_Screen.cshtml");
        }

        // =========================================
        // Vehicle Search
        // =========================================
        [HttpGet]
        public async Task<IActionResult> Search(
            [FromQuery] string? vehicleNumber,
            [FromQuery] string? makerName,
            [FromQuery] string? model,
            [FromQuery] string? vehicleCategory,
            [FromQuery] decimal? loadMin,
            [FromQuery] decimal? loadMax,
            [FromQuery] bool activeOnly = false)
        {
            if (loadMin.HasValue && loadMax.HasValue &&
                loadMin.Value > loadMax.Value)
            {
                //return BadRequest(new
                //{
                //    success = false,
                //    //message = "最大積載量の範囲が正しくありません。"
                //});
            }

            if (!string.IsNullOrWhiteSpace(vehicleCategory) &&
                !new[] { "0", "1", "2" }.Contains(vehicleCategory))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "車輌区分を正しく入力して下さい！！（0・1・2）"
                });
            }

            var vehicles = await _vehicleSearchService.SearchAsync(
                vehicleNumber,
                makerName,
                model,
                vehicleCategory,
                loadMin,
                loadMax,
                activeOnly);

            return Json(new
            {
                success = true,
                items = vehicles
            });
        }

        // =========================================
        // Driver Search
        // =========================================
        [HttpGet]
        public async Task<IActionResult> DriverSearch(
            [FromQuery] string? furigana,
            [FromQuery] string? driverName,
            [FromQuery] string? driverCategory,
            [FromQuery] string? subcontractorCode,
            [FromQuery] bool activeOnly = false)
        {
            if (!string.IsNullOrWhiteSpace(driverCategory) &&
                !new[] { "0", "1", "2" }.Contains(driverCategory))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "運転手区分を正しく入力して下さい！！（0・1・2）"
                });
            }

            var drivers = await _driverSearchService.SearchAsync(
                furigana,
                driverName,
                driverCategory,
                subcontractorCode,
                activeOnly);

            return Json(new
            {
                success = true,
                items = drivers
            });
        }

        [HttpGet]
        public async Task<IActionResult> DriverCodeOptions(
    [FromQuery] string driverCategory)
        {
            if (!new[] { "0", "1", "2" }.Contains(driverCategory))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid driver category."
                });
            }

            var items = await _driverSearchService
                .GetDriverCodeOptionsAsync(driverCategory);

            return Json(new
            {
                success = true,
                items
            });
        }

        // =========================================
        // Order Search
        // =========================================
        [HttpGet]
        public async Task<IActionResult> OrderSearch(
            [FromQuery] OrderSearchRequestDto request)
        {
            var result = await _orderSearchService.SearchAsync(request);

            return Json(result);
        }

        // =========================================
        // Order Search - Master Data Lookup
        // =========================================
        [HttpGet]
        public async Task<IActionResult> OrderMasterLookup(
            string masterType,
            string code)
        {
            if (string.IsNullOrWhiteSpace(masterType) ||
                string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "検索条件が正しくありません。"
                });
            }

            code = code.Trim();

            if (code.Length != 10 || !code.All(char.IsDigit))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "コードは10桁の数字で入力してください。"
                });
            }

            var result = await _orderSearchService.FindMasterAsync(
                masterType,
                code);

            return Json(new
            {
                success = true,
                found = result != null,
                code = result?.OrderNo ?? code,

                name = masterType switch
                {
                    "shipper" => result?.ShipperName,
                    "charteringCompany" => result?.CharteringCompany,
                    "driver" => result?.DriverName,
                    "vehicle" => result?.VehicleNumber,
                    "origin" or "destination" => result?.OriginName,
                    "product" => result?.ProductName,
                    _ => ""
                }
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetOrderSearchTargetMonth()
        {
            var targetMonth =
                await _orderSearchService.GetTargetMonthAsync()
                ?? DateTime.Today;

            return Json(new
            {
                success = true,
                targetMonth = targetMonth.ToString("yyyy-MM-dd")
            });
        }
        // =========================================
        // Get Origin / Destination Registration Mode
        // =========================================
        [HttpGet]
        public async Task<IActionResult> GetRegistrationMode()
        {
            var registrationMode =
                await _originDestinationService.GetRegistrationModeAsync();

            return Json(new
            {
                success = true,
                isCommonMode = registrationMode == "1"
            });
        }
        // =========================================
        // Shipper Search
        // =========================================
        [HttpGet]
        public async Task<IActionResult> ShipperSearch(
            string? furigana,
            string? name,
            string? phoneNumber,
            bool activeOnly = false)
        {
            var shippers = await _shipperSearchService.SearchAsync(
                furigana,
                name,
                phoneNumber,
                activeOnly);

            return Json(new
            {
                success = true,
                items = shippers
            });
        }

        // =========================================
        // Chartered Carrier Search
        // =========================================
        [HttpGet]
        public async Task<IActionResult> CharteredSearch(
            string? furigana,
        [FromQuery(Name = "name")] string? abbreviation,
            string? phoneNumber,
            bool activeOnly = false)
        {
            var charteredCarriers =
                await _charteredSearchService.SearchAsync(
                    furigana,
                    abbreviation,
                    phoneNumber,
                    activeOnly);

            return Json(new
            {
                success = true,
                items = charteredCarriers
            });
        }

        // =========================================
        // Product Name Search
        // =========================================
        [HttpGet]
        public async Task<IActionResult> ProductNameSearch(
            string? productNameFurigana,
            string? productName,
            string? productCategoryCode,
            string? transportationRecordCode)
        {
            var products = await _productNameSearchService.SearchAsync(
                productNameFurigana,
                productName,
                productCategoryCode,
                transportationRecordCode);

            return Json(new
            {
                success = true,
                items = products
            });
        }

        // =========================================
        // Get Product Category
        // =========================================
        [HttpGet]
        public async Task<IActionResult> GetProductCategory(string? code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "品名区分コードを入力してください。"
                });
            }

            var name = await _productNameSearchService
                .GetProductCategoryByCodeAsync(code);

            if (name == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "該当する品名区分がありません。"
                });
            }

            return Json(new
            {
                success = true,
                code,
                name
            });
        }

        // =========================================
        // Get Transportation Record
        // =========================================
        [HttpGet]
        public async Task<IActionResult> GetTransportationRecord(string? code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "輸送実績区分コードを入力してください。"
                });
            }

            var name = await _productNameSearchService
                .GetTransportationRecordByCodeAsync(code);

            if (name == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "該当する輸送実績区分がありません。"
                });
            }

            return Json(new
            {
                success = true,
                code,
                name
            });
        }

        // =========================================
        // Area Search
        // =========================================
        [HttpGet]
        public async Task<IActionResult> AreaSearch(string? areaName)
        {
            var areas = await _areaSearchService.SearchAsync(areaName);

            return Json(new
            {
                success = true,
                items = areas
            });
        }

        // =========================================
        // Product Classification Search
        // =========================================
        [HttpGet]
        public async Task<IActionResult> ProductClassificationSearch(
            string? productCategoryName)
        {
            var categories =
                await _productClassificationSearchService.SearchAsync(
                    productCategoryName);

            return Json(new
            {
                success = true,
                items = categories
            });
        }

        // =========================================
        // Unit Search
        // =========================================
        [HttpGet]
        public async Task<IActionResult> UnitSearch()
        {
            var units = await _unitSearchService.SearchAsync();

            return Json(new
            {
                success = true,
                items = units
            });
        }

        // =========================================
        // Transportation Record Search
        // =========================================
        [HttpGet]
        public async Task<IActionResult> TransportationRecordSearch(
            string? transportationRecordName)
        {
            var records =
                await _transportationRecordSearchService.SearchAsync(
                    transportationRecordName);

            return Json(new
            {
                success = true,
                items = records
            });
        }

        // =========================================
        // Company Branch Search
        // =========================================
        [HttpGet]
        public async Task<IActionResult> CompanyBranchSearch()
        {
            var branches = await _companyBranchSearchService.SearchAsync();

            return Json(new
            {
                success = true,
                items = branches
            });
        }

        // =========================================
        // Origin / Destination Search
        // =========================================


        [HttpGet]
        public async Task<IActionResult> OriginDestinationSearch(
            string? shipperCode,
            string? nameFurigana,
            string? originDestinationName,
            string? areaCode,   
            int commonMode = 0)
        {
            var items = await _originDestinationSearchService.SearchAsync(
                shipperCode: shipperCode,
                nameFurigana: nameFurigana,
                originDestinationName: originDestinationName,
                areaCode: areaCode,
                commonMode: commonMode);

            return Json(new
            {
                success = true,
                items
            });
        }



        // =========================================
        // Get Area
        // =========================================
        [HttpGet]
        public async Task<IActionResult> GetArea(string? code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "エリアコードを入力してください。"
                });
            }

            var area = await _originDestinationSearchService
                .GetAreaByCodeAsync(code);

            if (area == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = $"指定したエリアコード『{code}』は未登録です！！"
                });
            }

            return Json(new
            {
                success = true,
                code = area.GetAreaCode,
                name = area.GetAreaName
            });
        }

        // =========================================
        // Department Search
        // =========================================
        [HttpGet]
        public async Task<IActionResult> DepartmentSearch()
        {
            var departments = await _departmentSearchService.SearchAsync();

            return Json(new
            {
                success = true,
                items = departments
            });
        }

        // =========================================
        // Expense Search
        // =========================================
        [HttpGet]
        public async Task<IActionResult> ExpenseSearch(
            string? expenseName,
            string? expenseCategory)
        {
            var expenses = await _expenseSearchService.SearchAsync(
                expenseName,
                expenseCategory);

            return Json(new
            {
                success = true,
                items = expenses
            });
        }
    }
}
