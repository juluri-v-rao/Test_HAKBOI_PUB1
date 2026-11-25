using HAKOBIMASENKA.Models.ViewModels;

namespace HAKOBIMASENKA.Service
{
    public interface IDepartmentMasterService
    {
        Task<List<DepartmentMasterResultDto>> GetListAsync();

        Task<string?> GetNextCodeAsync();

        Task<int> SaveAsync(
            string departmentCode,
            string departmentName);

        Task<int> DeleteAsync(string departmentCode);
    }
}