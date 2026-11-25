using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Service.SearchService
{
    public interface IUnitSearchService
    {
        Task<IEnumerable<UnitSearchResultDto>> SearchAsync();
    }
}