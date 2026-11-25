using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.CharteredVehicleMasterViewModel;

namespace HAKOBIMASENKA.Repository.CharteredVehicleMasterRepository
{
    public interface ICharteredVehicleMasterRepository
    {
        // Dsp_Data
        Task<CharteredVehicleMasterViewModel?> GetByCodeAsync(string code);

        // Data_Chk
        Task<bool> ExistsAsync(string code);

        // Set_Code: highest numeric 傭車コード (0 when none)
        Task<long> GetMaxCodeAsync();

        // Data_Move
        Task<string?> GetPreviousCodeAsync(string code);
        Task<string?> GetNextCodeAsync(string code);

        // Dsp_Seikyu: 略称 of the 精算先, null when not found
        Task<string?> FindSettlementNameAsync(string code, bool activeOnly);

        // Set_Cmb
        Task<IEnumerable<CharteredVehicleMasterResultDto>> GetUnitsAsync();
        Task<IEnumerable<CharteredVehicleMasterResultDto>> GetPaymentMethodsAsync();

        // Dsp_Tani / Dsp_Kaishu
        Task<bool> UnitExistsAsync(string code);
        Task<bool> PaymentMethodExistsAsync(string code);

        // Dsp_Post: 住所 for a postal code, null when not found
        Task<string?> FindAddressAsync(string postalCode);

        // FrmM_Yosha_Load: 管理マスタ defaults
        Task<CharteredVehicleDefaultsDto> GetDefaultsAsync();

        // Dsp_List: 傭車支払履歴 (payment = true) or 傭車買掛履歴, newest 更新日 first
        Task<List<CharteredVehicleHistoryDto>> GetHistoryAsync(string code, bool payment);

        // Data_Repl: 傭車マスタ and, when sent, both histories in one transaction
        Task SaveAsync(CharteredVehicleMasterViewModel model, string terminalCode);

        // Del_Chk: the legacy message when the code is in use, null when it can be deleted
        Task<string?> GetDeleteBlockReasonAsync(string code);

        // Data_Del
        Task DeleteAsync(string code);
    }
}
