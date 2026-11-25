using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ManagementMasterViewModel;

namespace HAKOBIMASENKA.Service.ManagementMasterService.ManagementMasterService
{
    public interface IManagementMasterService
    {
        Task<List<ManagementMasterResultDto>> GetListAsync();

        Task<ManagementMasterViewModel?> GetByCodeAsync(string code);

        Task<bool> ExistsAsync(string code);

        Task<string?> GetNextCodeAsync();

        Task<ManagementMasterSaveResult> SaveAsync(ManagementMasterViewModel model, string terminalCode);

        Task<ManagementMasterDeleteResult> CheckDeleteAsync(string companyCode);

        Task<ManagementMasterDeleteResult> DeleteAsync(string companyCode);

        //Task<bool> CanDeleteAsync(string companyCode);

        //List<string> Validate(ManagementMasterViewModel model);
    }
}