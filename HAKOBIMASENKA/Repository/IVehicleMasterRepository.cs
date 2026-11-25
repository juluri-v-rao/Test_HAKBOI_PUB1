using HAKOBIMASENKA.ViewModels;

namespace HAKOBIMASENKA.Repository
{
    public interface IVehicleMasterRepository
    {
        // Retrieve Department Master details by department code.
        Task<VehicleMasterResultDto?> GetDepartmentByCodeAsync(string code);
        // Retrieve Expense Master details by expense code.
        Task<VehicleMasterResultDto?> GetExpenseByCodeAsync(string code);
        Task<VehicleMasterResultDto?> GetDriverByCodeAsync(
         string code,
         bool sinkFlg);
        Task<IEnumerable<VehicleMasterResultDto>>
           GetExpenseCategoriesAsync();

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

        Task SaveAsync(VehicleMasterSaveDto request);

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