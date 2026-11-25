using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public interface IAreaSearchRepository
    {
        Task<IEnumerable<AreaSearchResultDto>> SearchAsync(
            string? areaName);
    }
}