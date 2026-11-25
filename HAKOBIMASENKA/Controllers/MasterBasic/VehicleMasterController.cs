
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Service;
using HAKOBIMASENKA.ViewModels;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using HAKOBIMASENKA.Repository.MainMenuRepository;

namespace HAKOBIMASENKA.Controllers.MasterController
{
    public class VehicleMasterController : Controller
    {
        private readonly IVehicleMasterService _vehicleMasterService;
        private readonly IMainMenuRepository _mainMenu;
        public VehicleMasterController(
     IVehicleMasterService vehicleMasterService,
     IMainMenuRepository mainMenu)
        {
            _vehicleMasterService = vehicleMasterService
                ?? throw new ArgumentNullException(nameof(vehicleMasterService));

            _mainMenu = mainMenu
                ?? throw new ArgumentNullException(nameof(mainMenu));
        }

        // Display Vehicle Master screen.
        [HttpGet]
        public async Task<IActionResult> Vehicle_master()
        {
            var company = await _mainMenu.GetCompanyAsync();

            var model = new VehicleMasterResultDto
            {
                ShowVehicleManagementTab = company?.SEC3 == "1",

                ShowFixedCostTab = company?.SEC3 == "1",

                ShowDigitalTachographTab =
                    company?.SEC4 == "1" || company?.SEC5 == "1",

                ShowSalaryTab = company?.SEC9 == "1"
            };

            return View(
                "~/Views/Master/VehicleMaster/Vehicle_master.cshtml",
                model);
        }

        // Retrieve department details by department code.
        [HttpGet]
        public async Task<IActionResult> GetDepartment(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "部門コードを入力して下さい。"
                });
            }

            var result =
                await _vehicleMasterService.GetDepartmentByCodeAsync(code);

            if (result == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = $"指定した部門『{code}』は未登録です！！"
                });
            }

            return Ok(new
            {
                success = true,
                code = result.DepartmentCode,
                name = result.DepartmentName
            });
        }

        // Expense Master
        [HttpGet]
        public async Task<IActionResult> GetExpense(string code)
        {
            var result = await _vehicleMasterService.GetExpenseByCodeAsync(code);

            if (result == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = $"指定した経費『{code}』は未登録です！！"
                });
            }

            return Ok(new
            {
                success = true,
                code = result.ExpenseCode,
                name = result.ExpenseName
            });
        }

        // Driver Master
        [HttpGet]
        public async Task<IActionResult> GetDriver(
            string code,
            bool sinkFlg = false)
        {
            var result = await _vehicleMasterService.GetDriverByCodeAsync(
                code,
                sinkFlg);

            if (result == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = $"指定した運転手『{code}』は未登録です！！"
                });
            }

            return Ok(new
            {
                success = true,
                code = result.DriverCode,
                name = result.DriverName
            });
        }

        // Retrieve all expense categories for Tab 4.
        [HttpGet]
        public async Task<IActionResult> GetExpenseCategories()
        {
            try
            {
                var categories =
                    await _vehicleMasterService.GetExpenseCategoriesAsync();

                return Json(new
                {
                    success = true,
                    data = categories.Select(item => new
                    {
                        code = item.ExpenseCategoryCode,
                        name = item.ExpenseCategoryName
                    })
                });
            }
            catch
            {
                // Log the exception using your application's existing logger.
                //_logger. (ex, "Failed to retrieve expense categories.");

                return StatusCode(500, new
                {
                    success = false,
                    message = "経費区分マスタのデータ取得に失敗しました。"
                });
            }
        }

        // Retrieve all transport types for the vehicle master.
        [HttpGet]
        public async Task<IActionResult> GetTransportTypes()
        {
            try
            {
                var transportTypes =
                    await _vehicleMasterService.GetTransportTypesAsync();

                return Json(new
                {
                    success = true,
                    data = transportTypes.Select(item => new
                    {
                        code = item.TransportTypeCode,
                        name = item.TransportTypeName
                    })
                });
            }
            catch
            {
                // Log the exception using your application's existing logger.
                //_logger. (ex, "Failed to retrieve transport types.");

                return StatusCode(500, new
                {
                    success = false,
                    message = "運賃形態マスタのデータ取得に失敗しました。"
                });
            }
        }

        // Retrieve vehicle details by vehicle code.
        [HttpGet]
        public async Task<IActionResult> GetVehicleByCode(string code)
        {
            if (string.IsNullOrWhiteSpace(code) ||
                code.Length != 10 ||
                !code.All(char.IsDigit))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "車輌コードは10桁の数字で入力してください。"
                });
            }

            try
            {
                var vehicle =
                    await _vehicleMasterService.GetVehicleByCodeAsync(code);

                if (vehicle == null)
                {
                    return Json(new
                    {
                        success = true,
                        found = false,
                        data = (object?)null
                    });
                }

                return Json(new
                {
                    success = true,
                    found = true,
                    data = vehicle
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "車輌マスタのデータ取得に失敗しました。"
                });
            }
        }

        // Retrieve tire maintenance records for a vehicle.
        [HttpGet]
        public async Task<IActionResult> GetVehicleTiresByCode(string code)
        {
            if (string.IsNullOrWhiteSpace(code) ||
                code.Length != 10 ||
                !code.All(char.IsDigit))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "車輌コードは10桁の数字で入力してください。"
                });
            }

            try
            {
                var tires =
                    await _vehicleMasterService.GetVehicleTiresByCodeAsync(code);

                return Json(new
                {
                    success = true,
                    data = tires
                });
            }
            catch (Exception)
            {
                // Log the exception using your application's existing logger.

                return StatusCode(500, new
                {
                    success = false,
                    message = "タイヤ管理データの取得に失敗しました。"
                });
            }
        }

        // Retrieve fixed expense records for a vehicle.
        [HttpGet]
        public async Task<IActionResult> GetVehicleFixedExpenses(string code)
        {
            if (string.IsNullOrWhiteSpace(code) ||
                code.Length != 10 ||
                !code.All(char.IsDigit))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "車輌コードは10桁の数字で入力してください。"
                });
            }

            try
            {
                var expenses =
                    await _vehicleMasterService.GetVehicleFixedExpensesAsync(code);

                return Json(new
                {
                    success = true,
                    data = expenses
                });
            }
            catch
            {
                // Log the exception using your application's existing logger.
                //_logger.LogError(ex, "Failed to retrieve vehicle fixed expenses.");

                return StatusCode(500, new
                {
                    success = false,
                    message = "固定経費マスタのデータ取得に失敗しました。"
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> NextCode()
        {
            try
            {
                var nextCode = await _vehicleMasterService.GetNextCodeAsync();

                if (string.IsNullOrWhiteSpace(nextCode))
                {
                    return Json(new
                    {
                        success = false,
                        message = "Unable to generate the next Vehicle Code."
                    });
                }

                return Json(new
                {
                    success = true,
                    VehicleCodeRequest = nextCode
                });
            }
            catch
            {
                //_logger.LogError(ex, "Error generating the next Vehicle Code.");

                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while generating the next Vehicle Code."
                });
            }
        }

        // =========================================
        // F7: PREVIOUS VEHICLE
        // =========================================
        [HttpGet]
        public async Task<IActionResult> GetPreviousVehicle(string code)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(code) ||
                    !System.Text.RegularExpressions.Regex.IsMatch(code, @"^\d{1,10}$"))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "号車は1～10桁の数字で入力してください。"
                    });
                }

                code = code.PadLeft(10, '0');

                var previousCode =
                    await _vehicleMasterService.GetPreviousCodeAsync(code);

                return Json(new
                {
                    success = true,
                    found = !string.IsNullOrWhiteSpace(previousCode),
                    vehicleCode = previousCode
                });
            }
            catch
            {
                //_logger.LogError(ex, "Error retrieving previous vehicle.");

                return StatusCode(500, new
                {
                    success = false,
                    message = "前の車輌データの取得に失敗しました。"
                });
            }
        }

        // =========================================
        // F8: NEXT VEHICLE
        // =========================================
        [HttpGet]
        public async Task<IActionResult> GetNextVehicle(string code)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(code) ||
                    !System.Text.RegularExpressions.Regex.IsMatch(code, @"^\d{1,10}$"))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "号車は1～10桁の数字で入力してください。"
                    });
                }

                code = code.PadLeft(10, '0');

                var nextCode =
                    await _vehicleMasterService.GetNextCodeAsync(code);

                return Json(new
                {
                    success = true,
                    found = !string.IsNullOrWhiteSpace(nextCode),
                    vehicleCode = nextCode
                });
            }
            catch
            {
                //_logger.LogError(ex, "Error retrieving next vehicle.");

                return StatusCode(500, new
                {
                    success = false,
                    message = "次の車輌データの取得に失敗しました。"
                });
            }
        }


        [HttpPost]
        public async Task<IActionResult> DeleteVehicle(
            [FromBody] VehicleMasterResultDto request)
        {
            var vehicleCode = request.DeleteVehicleRequest;

            if (string.IsNullOrWhiteSpace(vehicleCode) ||
                !System.Text.RegularExpressions.Regex.IsMatch(
                    vehicleCode, @"^\d{10}$"))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "正しい車輌コードを指定してください。"
                });
            }

            try
            {
                // Check whether the vehicle is referenced in other tables
                var deleteCheckMessage =
                    await _vehicleMasterService.CheckDeleteAsync(vehicleCode);

                if (deleteCheckMessage != null)
                {
                    return Conflict(new
                    {
                        success = false,
                        message = deleteCheckMessage
                    });
                }

                // Delete vehicle only if no dependencies exist
                var deleted = await _vehicleMasterService
                    .DeleteVehicleAsync(vehicleCode);

                if (!deleted)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "削除対象の車輌データが見つかりません。"
                    });
                }

                return Json(new
                {
                    success = true,
                    message = "車輌データを削除しました。"
                });
            }
            catch
            {
                //_logger.LogError(
                //    ex,
                //    "Failed to delete vehicle {VehicleCode}",
                //    vehicleCode);

                return StatusCode(500, new
                {
                    success = false,
                    message = "車輌データの削除に失敗しました。"
                });
            }
        }


        [HttpPost]
        public async Task<IActionResult> Save(
            [FromBody] VehicleMasterSaveDto? request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "登録データがありません。"
                });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "入力内容を確認してください。"
                });
            }

            try
            {
                var result = await _vehicleMasterService.SaveAsync(request);

                if (!result.Success)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = result.Message
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = result.Message
                });
            }
            catch
            {
                //_logger.LogError(
                //    ex,
                //    "Vehicle registration failed for code {VehicleCode}",
                //    request.VehicleCode);

                return StatusCode(500, new
                {
                    success = false,
                    message = "登録処理中にエラーが発生しました。"
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetRepairHistory(
    string vehicleCode,
    string? expenseCategoryCode,
    string? expenseCode,
    string? expenseName,
    DateTime? fromDate,
    DateTime? toDate)
        {
            if (string.IsNullOrWhiteSpace(vehicleCode) ||
                !System.Text.RegularExpressions.Regex.IsMatch(
                    vehicleCode, @"^\d{10}$"))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "車輌コードを正しく入力してください。"
                });
            }

            if (fromDate.HasValue &&
                toDate.HasValue &&
                fromDate.Value.Date > toDate.Value.Date)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "対象期間の指定が異常です！！"
                });
            }

            try
            {
                var result = await _vehicleMasterService.GetRepairHistoryAsync(
                    vehicleCode,
                    expenseCategoryCode,
                    expenseCode,
                    expenseName,
                    fromDate,
                    toDate);

                return Json(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "修理・タイヤ交換履歴の取得に失敗しました。"
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> CheckDelete(string vehicleCode)
        {
            if (string.IsNullOrWhiteSpace(vehicleCode) ||
                !System.Text.RegularExpressions.Regex.IsMatch(
                    vehicleCode, @"^\d{10}$"))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "車輌コードを正しく入力してください。"
                });
            }

            try
            {
                var message = await _vehicleMasterService.CheckDeleteAsync(
                    vehicleCode
                );

                return Ok(new
                {
                    success = true,
                    canDelete = message == null,
                    message
                });
            }
            catch
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "削除可否の確認に失敗しました。"
                });
            }
        }
    }
}
