using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ShipperMasterViewModel;

namespace HAKOBIMASENKA.Repository.ShipperRepository
{
    public interface IShipperRepository
    {
        Task<ShipperViewModel?> GetByCodeAsync(string code);

        Task<bool> ExistsAsync(string code);

        /// <summary>Highest existing 荷主コード, for auto-numbering (Set_Code: MAX + 1, ZeroPad).</summary>
        Task<string> GetMaxCodeAsync();

        Task<string> GetNextCodeAsync(string currentCode);

        Task<string> GetPrevCodeAsync(string currentCode);

        /// <summary>Dsp_Seikyu(): existence + (for a new record) 取引終了日 IS NULL check.</summary>
        Task<(bool valid, string? 略称)> ValidateSettlementDestinationAsync(string code, bool isNewRecord);

        Task UpsertAsync(ShipperViewModel model, string clientNo);

        Task<string?> CheckDeleteAsync(string code, string kanriPlKbn);

        Task DeleteAsync(string code);

        Task<IEnumerable<ShipperHistoryDto>> GetHistoryAsync(string code, string branchCode, string kind);

        Task<ShipperHistoryDto?> GetHistoryRowAsync(string code, string branchCode, string kind, System.DateTime updateDate); // Dsp_Rireki
        Task UpsertHistoryRowAsync(ShipperHistoryDto row, string kind, string terminalCode); // Wk_Repl, ported to write live table directly
        Task DeleteHistoryRowAsync(string code, string branchCode, string kind, System.DateTime updateDate); // CmdSel3_Click

        Task<IEnumerable<PaymentCategoryOption>> GetPaymentCategoriesAsync(); // Set_Cmb
        /*Task<PostalCodeResult?> LookupPostalCodeAsync(string zip);*/            // Dsp_Post

        // Dsp_BKbn
        Task<DepartmentCodeResult?> GetDepartmentAsync(string code);

        // Dsp_Kanri
        Task<string?> GetManagementNameAsync(string code);

        // Dsp_Bank
        Task<BankNameResult?> GetBankNameAsync(string code);

        // Set_Cmb - Unit master
        Task<IEnumerable<UnitCategoryOption>> GetUnitsAsync();

        /// <summary>FrmM_Shire_Load's 管理マスタ read: default 端数桁数/下払端数/税区分/税端数 for a new record.</summary>
        Task<(string uriHasu, string zeiKbn, string zeiHasu, string seikyuBiSettei, string kazeiWarimashi, string hikazeiWarimashi, bool unkoukanri, bool digitco)> GetSystemDefaultsAsync();

        Task ClearHistoryWorkTablesAsync();

        Task<string?> GetKanriPlKbnAsync();

    }
}
