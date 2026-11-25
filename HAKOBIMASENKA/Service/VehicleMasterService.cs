using HAKOBIMASENKA.Repository;
using HAKOBIMASENKA.ViewModels;

namespace HAKOBIMASENKA.Service
{
    public class VehicleMasterService : IVehicleMasterService
    {
        private readonly IVehicleMasterRepository _vehicleMasterRepository;

        public VehicleMasterService(
            IVehicleMasterRepository vehicleMasterRepository)
        {
            _vehicleMasterRepository = vehicleMasterRepository;
        }
        // Retrieve Department Master details by department code.
        public async Task<VehicleMasterResultDto?> GetDepartmentByCodeAsync(
            string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return null;
            }

            return await _vehicleMasterRepository.GetDepartmentByCodeAsync(
                code.Trim());
        }
        // Retrieve Expense Master details by expense code.
        public async Task<VehicleMasterResultDto?> GetExpenseByCodeAsync(
            string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return null;
            }

            return await _vehicleMasterRepository.GetExpenseByCodeAsync(code.Trim());
        }

        // Driver Master.
        public async Task<VehicleMasterResultDto?> GetDriverByCodeAsync(
            string code,
            bool sinkFlg)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return null;
            }

            return await _vehicleMasterRepository.GetDriverByCodeAsync(
                code.Trim(),
                sinkFlg);
        }
        // Retrieve all expense categories for the dropdown.
        public async Task<IEnumerable<VehicleMasterResultDto>>
            GetExpenseCategoriesAsync()
        {
            return await _vehicleMasterRepository.GetExpenseCategoriesAsync();
        }

        // Get transport types from Transport Type Master
        public async Task<IEnumerable<VehicleMasterResultDto>> GetTransportTypesAsync()
        {
            return await _vehicleMasterRepository.GetTransportTypesAsync();
        }

        public async Task<VehicleMasterResultDto?> GetVehicleByCodeAsync(
     string code)
        {
            return await _vehicleMasterRepository.GetVehicleByCodeAsync(code);
        }

        // Retrieve tire maintenance records by vehicle code.
        public async Task<IEnumerable<VehicleMasterResultDto>> GetVehicleTiresByCodeAsync(
            string code)
        {
            return await _vehicleMasterRepository.GetVehicleTiresByCodeAsync(code);
        }
        // Retrieve fixed expense records for a vehicle.
        public async Task<IEnumerable<VehicleMasterResultDto>> GetVehicleFixedExpensesAsync(
            string code)
        {
            return await _vehicleMasterRepository.GetVehicleFixedExpensesAsync(code);
        }

        public async Task<string?> GetNextCodeAsync()
        {
            return await _vehicleMasterRepository.GetNextCodeAsync();
        }

        // =========================================
        // F7: GET PREVIOUS VEHICLE CODE
        // =========================================
        public async Task<string?> GetPreviousCodeAsync(string code)
        {
            return await _vehicleMasterRepository.GetPreviousCodeAsync(code);
        }

        // =========================================
        // F8: GET NEXT VEHICLE CODE
        // =========================================
        public async Task<string?> GetNextCodeAsync(string code)
        {
            return await _vehicleMasterRepository.GetNextCodeAsync(code);
        }
        // =========================================
        // F4: DELETE VEHICLE
        // =========================================
        public async Task<bool> DeleteVehicleAsync(string DeleteVehicleRequest)
        {
            return await _vehicleMasterRepository.DeleteVehicleAsync(DeleteVehicleRequest);
        }
 
        public async Task<VehicleMasterSaveResultDto> SaveAsync(
            VehicleMasterSaveDto request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.VehicleCode) ||
                !System.Text.RegularExpressions.Regex.IsMatch(
                    request.VehicleCode, @"^\d{10}$"))
            {
                return new VehicleMasterSaveResultDto
                {
                    Success = false,
                    Message = "車輌コードを正しく入力してください。"
                };
            }

            if (request.Tires.Any(t =>
                    t.PositionCode < 1 || t.PositionCode > 22))
            {
                return new VehicleMasterSaveResultDto
                {
                    Success = false,
                    Message = "タイヤ位置コードが正しくありません。"
                };
            }

            if (request.Tires
                .GroupBy(t => t.PositionCode)
                .Any(g => g.Count() > 1))
            {
                return new VehicleMasterSaveResultDto
                {
                    Success = false,
                    Message = "タイヤ位置コードが重複しています。"
                };
            }

            try
            {
                await _vehicleMasterRepository.SaveAsync(request);

                return new VehicleMasterSaveResultDto
                {
                    Success = true,
                    Message = "車輌データを登録しました。"
                };
            }
            catch
            {
                // Let the controller log the exception.
                throw;
            }
        }

        public async Task<IEnumerable<VehicleRepairHistoryDto>>
    GetRepairHistoryAsync(
        string vehicleCode,
        string? expenseCategoryCode,
        string? expenseCode,
        string? expenseName,
        DateTime? fromDate,
        DateTime? toDate)
        {
            return await _vehicleMasterRepository.GetRepairHistoryAsync(
                vehicleCode,
                expenseCategoryCode,
                expenseCode,
                expenseName,
                fromDate,
                toDate);
        }
        public async Task<string?> CheckDeleteAsync(string vehicleCode)
        {
            if (string.IsNullOrWhiteSpace(vehicleCode))
            {
                return "車輌コードを正しく入力してください。";
            }

            return await _vehicleMasterRepository.CheckDeleteAsync(
                vehicleCode.Trim()
            );
        }
    }

}