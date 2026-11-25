using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ManagementMasterViewModel;

namespace HAKOBIMASENKA.Repository.ManagementMasterRepository.ManagementMasterRepository
    {
    public interface IManagementMasterRepository
    {
        /// <summary>
        /// Load Management Master and check existence
        /// Equivalent to Dsp_Data() / Dsp_Data2()
        /// </summary>
        Task<List<ManagementMasterResultDto>> GetListAsync();

        Task<ManagementMasterViewModel?> GetByCodeAsync(string code);

        Task<bool> ExistsAsync(string code);

        Task<string?> GetNextCodeAsync();

        /// <summary>
        /// Save Management Master
        /// Equivalent to Data_Repl()
        /// </summary>
        Task SaveAsync(ManagementMasterViewModel model, string terminalCode);

        /// <summary>
        /// Delete Validation
        /// Equivalent to Del_Chk(): the legacy message when the company is in use, null when it can be deleted
        /// </summary>
        Task<string?> GetDeleteBlockReasonAsync(string companyCode);

        /// <summary>
        /// Delete Management Master
        /// Equivalent to Data_Del()
        /// </summary>
        Task DeleteAsync(string companyCode);

        }
}