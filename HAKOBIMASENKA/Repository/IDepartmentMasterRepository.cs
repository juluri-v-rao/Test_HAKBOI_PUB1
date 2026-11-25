using HAKOBIMASENKA.Models.ViewModels;

namespace HAKOBIMASENKA.Repository
{
    public interface IDepartmentMasterRepository
    {
        Task<List<DepartmentMasterResultDto>> GetListAsync();

        Task<string?> GetNextCodeAsync();

        Task<int> SaveAsync(
            string departmentCode,
            string departmentName);

        Task<int> DeleteAsync(string departmentCode);
    }
}