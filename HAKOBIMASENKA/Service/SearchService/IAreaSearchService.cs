using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Service.SearchService
{
    public interface IAreaSearchService
    {
        Task<IEnumerable<AreaSearchResultDto>> SearchAsync(
            string? areaName);
    }
}