using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Repository.SearchRepository;
using HAKOBIMASENKA.Service.SearchService;

namespace HAKOBIMASENKA.Service
{
    public class UnitSearchService : IUnitSearchService
    {
        private readonly IUnitSearchRepository _repository;

        public UnitSearchService(IUnitSearchRepository repository)
        {
            _repository = repository;
        }

        public Task<IEnumerable<UnitSearchResultDto>> SearchAsync()
        {
            return _repository.SearchAsync();
        }
    }
}