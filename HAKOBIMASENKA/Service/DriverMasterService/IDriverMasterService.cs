using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.DriverMasterViewModel;

namespace HAKOBIMASENKA.Service.DriverMasterService
{
    /// <summary>
    /// 運転手マスタ rules (legacy FrmM_Tanto), all tabs including 運転者台帳 1-4.
    /// </summary>
    public interface IDriverMasterService
    {
        // Load / Codes
        Task<DriverMasterViewModel?> GetByCodeAsync(string code);
        Task<bool> ExistsAsync(string code);
        Task<string> GetNextGeneratedCodeAsync();
        Task<string?> GetPreviousCodeAsync(string code);
        Task<string?> GetNextCodeAsync(string code);
        /*Task<List<DriverHistoryDto>?> GetStoredHistoryAsync(string code, string kind);*/

        // Screen setup
        Task<IEnumerable<DriverMasterOptionDto>> GetVehiclesAsync();
        Task<IEnumerable<DriverMasterOptionDto>> GetCharteredAsync();
        Task<DriverMasterLicenseDto> GetLicenseAsync();

        // Lookups
        Task<string?> FindVehicleNumberAsync(string code);
        Task<string?> FindCharteredNameAsync(string code);
        Task<string?> FindDepartmentNameAsync(string code);
        Task<string?> FindAffiliationNameAsync(string code);
        Task<string?> FindExpenseNameAsync(string code);
        Task<(string Address1, string Address2)?> FindAddressAsync(string postalCode);
        (string Path, string ContentType)? FindPhotoFile(string? path);

        // Save (F1) / Delete (F4)
        Task<(string? Message, string? Field)> SaveAsync(DriverMasterViewModel model);
        Task<string?> CheckDeleteAsync(string code);
        Task<string?> DeleteAsync(string code);

        // Prints (F10 台帳 / the history 印刷 buttons)
        /*Task<DriverPrintViewModel?> GetLedgerPrintAsync(string code);
        Task<DriverPrintViewModel?> GetHistoryPrintAsync(string code, string kind);*/
    }
}
