using HAKOBIMASENKA.ViewModels;

namespace HAKOBIMASENKA.Service
{
    public interface IVehicleMasterService
    {
        // Retrieve Department Master details.
        Task<VehicleMasterResultDto?> GetDepartmentByCodeAsync(string code);
        // Retrieve Expense Master details.
        Task<VehicleMasterResultDto?> GetExpenseByCodeAsync(string code);
        // Driver Master.
        Task<VehicleMasterResultDto?> GetDriverByCodeAsync(
            string code,
            bool sinkFlg);
        Task<IEnumerable<VehicleMasterResultDto>>
            GetExpenseCategoriesAsync();
        // Get transport types from Transport Type Master
        Task<IEnumerable<VehicleMasterResultDto>> GetTransportTypesAsync();

        Task<VehicleMasterResultDto?> GetVehicleByCodeAsync(string code);

        // Retrieve tire maintenance records by vehicle code.
        Task<IEnumerable<VehicleMasterResultDto>> GetVehicleTiresByCodeAsync(
            string code);
        // Retrieve fixed expense records for a vehicle.
        Task<IEnumerable<VehicleMasterResultDto>> GetVehicleFixedExpensesAsync(
            string code);

        Task<string?> GetNextCodeAsync();

        Task<string?> GetPreviousCodeAsync(string code);
        Task<string?> GetNextCodeAsync(string code);

        Task<bool> DeleteVehicleAsync(string DeleteVehicleRequest);
        Task<VehicleMasterSaveResultDto> SaveAsync(
           VehicleMasterSaveDto request);

        Task<IEnumerable<VehicleRepairHistoryDto>>
    GetRepairHistoryAsync(
        string vehicleCode,
        string? expenseCategoryCode,
        string? expenseCode,
        string? expenseName,
        DateTime? fromDate,
        DateTime? toDate);

        Task<string?> CheckDeleteAsync(string vehicleCode);
    }
}