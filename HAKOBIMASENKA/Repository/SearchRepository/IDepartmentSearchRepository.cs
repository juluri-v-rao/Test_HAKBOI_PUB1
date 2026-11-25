using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public interface IDepartmentSearchRepository
    {
        Task<IEnumerable<DepartmentSearchResultDto>> SearchAsync();
    }
}