using HAKOBIMASENKA.Models.ViewModels;

namespace HAKOBIMASENKA.Service
{
    public interface IAreaMasterService
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