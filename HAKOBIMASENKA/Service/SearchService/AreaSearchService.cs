using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Repository.SearchRepository;

namespace HAKOBIMASENKA.Service.SearchService
{
    public class AreaSearchService : IAreaSearchService
    {
        private readonly IAreaSearchRepository _repository;

        public AreaSearchService(IAreaSearchRepository repository)
        {
            _repository = repository;
        }

        public Task<IEnumerable<AreaSearchResultDto>> SearchAsync(
            string? areaName)
        {
            return _repository.SearchAsync(areaName);
        }
    }
}