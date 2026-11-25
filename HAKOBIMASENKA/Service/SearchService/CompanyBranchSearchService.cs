using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Repository.SearchRepository;

namespace HAKOBIMASENKA.Service.SearchService
{
    public class CompanyBranchSearchService : ICompanyBranchSearchService
    {
        private readonly ICompanyBranchSearchRepository _repository;

        public CompanyBranchSearchService(
            ICompanyBranchSearchRepository repository)
        {
            _repository = repository;
        }

        public Task<IEnumerable<CompanyBranchSearchResultDto>> SearchAsync()
        {
            return _repository.SearchAsync();
        }
    }
}