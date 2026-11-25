using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Service.SearchService
{
    public interface ICompanyBranchSearchService
    {
        Task<IEnumerable<CompanyBranchSearchResultDto>> SearchAsync();
    }
}