using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public interface ICompanyBranchSearchRepository
    {
        Task<IEnumerable<CompanyBranchSearchResultDto>> SearchAsync();
    }
}