using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.CharteredVehicleMasterViewModel;

namespace HAKOBIMASENKA.Service.CharteredVehicleMasterService
{
    public interface ICharteredVehicleMasterService
    {
        Task<CharteredVehicleMasterViewModel?> GetByCodeAsync(string code);

        Task<bool> ExistsAsync(string code);

        /// <summary>Highest 傭車コード + 1, or "" when the 10-digit range is used up (legacy Set_Code).</summary>
        Task<string> GetNextGeneratedCodeAsync();

        Task<string?> GetPreviousCodeAsync(string code);

        Task<string?> GetNextCodeAsync(string code);

        /// <summary>略称 of the 精算先, or null when it is not a valid 精算先.</summary>
        Task<string?> FindSettlementNameAsync(string code, bool isNewRecord);

        Task<IEnumerable<CharteredVehicleMasterResultDto>> GetUnitsAsync();

        Task<IEnumerable<CharteredVehicleMasterResultDto>> GetPaymentMethodsAsync();

        Task<string?> FindAddressAsync(string postalCode);

        Task<CharteredVehicleDefaultsDto> GetDefaultsAsync();

        /// <summary>
        /// Checks the record like legacy Input_Chk and saves it.
        /// Returns the legacy message and the field to focus when it cannot be saved, or (null, null) when saved.
        /// </summary>
        Task<(string? Message, string? Field)> SaveAsync(CharteredVehicleMasterViewModel model);

        /// <summary>Returns the legacy message when the 傭車 is in use (legacy Del_Chk), or null when it can be deleted.</summary>
        Task<string?> CheckDeleteAsync(string code);

        /// <summary>Returns the legacy message when the 傭車 is in use, or null when it was deleted.</summary>
        Task<string?> DeleteAsync(string code);
    }
}
