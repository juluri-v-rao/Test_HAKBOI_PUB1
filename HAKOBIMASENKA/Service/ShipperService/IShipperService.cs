using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ShipperMasterViewModel;

namespace HAKOBIMASENKA.Service.ShipperService
{
    public interface IShipperService
    {
        Task<ShipperViewModel?> GetByCodeAsync(string code);

        Task<bool> ExistsAsync(string code);

        Task<string> GetMaxCodeAsync();

        Task<string> GetNextCodeAsync(string currentCode);

        Task<string> GetPrevCodeAsync(string currentCode);

        Task<(bool valid, string? 略称)> ValidateSettlementDestinationAsync(string code, bool isNewRecord);

        Task UpsertAsync(ShipperViewModel model, string clientNo);

        Task<string?> CheckDeleteAsync(string code, string kanriPlKbn);

        Task<string?> DeleteAsync(string code, string kanriPlKbn);

        Task<IEnumerable<ShipperHistoryDto>> GetHistoryAsync(string code, string branchCode, string kind);

        Task<ShipperHistoryDto?> GetHistoryRowAsync(string code, string branchCode, string kind, DateTime updateDate);

        Task UpsertHistoryRowAsync(ShipperHistoryDto row, string kind, string terminalCode);

        Task DeleteHistoryRowAsync(string code,string branchCode, string kind, DateTime updateDate);

        Task<IEnumerable<PaymentCategoryOption>> GetPaymentCategoriesAsync();

        // Dsp_BKbn
        Task<DepartmentCodeResult?> GetDepartmentAsync(string code);

        // Dsp_Kanri
        Task<string?> GetManagementNameAsync(string code);

        // Dsp_Bank
        Task<BankNameResult?> GetBankNameAsync(string code);

        // Set_Cmb
        Task<IEnumerable<UnitCategoryOption>> GetUnitsAsync();

        Task<(string uriHasu,string zeiKbn,string zeiHasu,string seikyuBiSettei,string kazeiWarimashi,string hikazeiWarimashi, bool unkoukanri, bool digitco)> GetSystemDefaultsAsync();

        Task ClearHistoryWorkTablesAsync();

        Task<string?> GetKanriPlKbnAsync();
    }
}
