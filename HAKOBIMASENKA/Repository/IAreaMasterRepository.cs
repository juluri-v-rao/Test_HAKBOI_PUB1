using HAKOBIMASENKA.Models.ViewModels;

namespace HAKOBIMASENKA.Repository
{
    public interface IAreaMasterRepository
    {
        Task<List<AreaMasterResultDto>> GetListAsync();
        Task<int> DeleteAsync(string areaCode);
        Task<string> GetNextAreaCodeAsync();

        Task<int> SaveAsync(
            string areaCode,
            string areaName,
            string? digitalCode);
    }
}