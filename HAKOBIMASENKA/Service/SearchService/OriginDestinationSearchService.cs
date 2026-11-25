
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Repository.SearchRepository;

namespace HAKOBIMASENKA.Service.SearchService
{
    public class OriginDestinationSearchService
        : IOriginDestinationSearchService
    {
        private readonly IOriginDestinationSearchRepository _repository;

        public OriginDestinationSearchService(
            IOriginDestinationSearchRepository repository)
        {
            _repository = repository;
        }


        public Task<IEnumerable<OriginDestinationSearchResultDto>> SearchAsync(
            string? shipperCode,
            string? nameFurigana,
            string? originDestinationName,
            string? areaCode,
            int commonMode)
        {
            return _repository.SearchAsync(
                shipperCode: shipperCode,
                nameFurigana: nameFurigana,
                originDestinationName: originDestinationName,
                areaCode: areaCode,
                commonMode: commonMode);
        }


        public async Task<OriginDestinationSearchResultDto?> GetAreaByCodeAsync(
            string code)
        {
            return await _repository.GetAreaByCodeAsync(code);
        }
    }
}
