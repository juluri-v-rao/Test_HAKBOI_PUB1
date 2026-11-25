using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.DriverMasterViewModel;

namespace HAKOBIMASENKA.Repository.DriverMasterRepository
{
    /// <summary>
    /// 運転手マスタ data access (legacy FrmM_Tanto), all tabs including 運転者台帳 1-4.
    /// </summary>
    public interface IDriverMasterRepository
    {
        // Load (Dsp_Data / Dsp_List / Dsp_UList … Dsp_IDoList)
        Task<DriverMasterViewModel?> GetByCodeAsync(string code);
        Task<List<DriverFixedExpenseDto>> GetFixedExpensesAsync(string code);
        Task LoadHistoriesAsync(DriverMasterViewModel model);
        /*Task<List<DriverHistoryDto>> GetHistoryAsync(string code, string kind);*/
        Task<bool> ExistsAsync(string code);
        /*Task<byte[]?> GetPhotoAsync(string code);*/

        // Codes (Set_Code / Data_Move)
        Task<long> GetMaxCodeAsync();
        Task<string?> GetPreviousCodeAsync(string code);
        Task<string?> GetNextCodeAsync(string code);

        // Dropdowns (Set_Cmb)
        Task<IEnumerable<DriverMasterOptionDto>> GetVehiclesAsync();
        Task<IEnumerable<DriverMasterOptionDto>> GetCharteredAsync();

        // Lookups (Dsp_CarCd / Dsp_YoshaCd / Dsp_BKbn / Dsp_SKbn / Dsp_Keihi / Dsp_Gosya / Dsp_Post)
        Task<string?> FindVehicleNumberAsync(string code);
        Task<string?> FindCharteredNameAsync(string code);
        Task<string?> FindDepartmentNameAsync(string code);
        Task<string?> FindAffiliationNameAsync(string code);
        Task<string?> FindExpenseNameAsync(string code);
        Task<string?> FindAddressAsync(string postalCode);

        // 管理マスタ '01'
        Task<DriverMasterLicenseDto> GetLicenseAsync();
        Task<string> GetArrivalDepartureTypeAsync();
        /*Task<(string Name1, string Name2)> GetCompanyNamesAsync();
        Task<bool> IsEraInputAsync();*/

        // Save (Data_Repl) / Delete (Del_Chk + Data_Del)
        Task SaveAsync(DriverMasterViewModel model, string terminalCode, byte[]? photo);
        Task<string?> GetDeleteBlockReasonAsync(string code, bool checkVehicleMaster);
        Task DeleteAsync(string code);
    }
}
