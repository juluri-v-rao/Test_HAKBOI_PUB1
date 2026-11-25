using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Service.SearchService
{
    public interface IDepartmentSearchService
    {
        Task<IEnumerable<DepartmentSearchResultDto>> SearchAsync();
    }
}