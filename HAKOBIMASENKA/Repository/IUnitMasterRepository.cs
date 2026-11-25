using HAKOBIMASENKA.Models.ViewModels;

namespace HAKOBIMASENKA.Repository
{
    public interface IUnitMasterRepository
    {
        Task<List<UnitMasterResultDto>> GetListAsync();
        Task<string> GetNextCodeAsync();
        Task<string?> CheckDeleteAsync(string unitCode);
        Task<int> DeleteAsync(string unitCode);
        Task<int> SaveAsync(
        string unitCode,
        string unitName,
        string calculationType);
    }
}