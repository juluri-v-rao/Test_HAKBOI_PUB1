using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Repository.SearchRepository;

namespace HAKOBIMASENKA.Service.SearchService
{
    public class DepartmentSearchService : IDepartmentSearchService
    {
        private readonly IDepartmentSearchRepository _repository;

        public DepartmentSearchService(
            IDepartmentSearchRepository repository)
        {
            _repository = repository;
        }

        public Task<IEnumerable<DepartmentSearchResultDto>> SearchAsync()
        {
            return _repository.SearchAsync();
        }
    }
}