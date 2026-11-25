using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Service.SearchService
{
    public interface IOriginDestinationSearchService
    {

        Task<IEnumerable<OriginDestinationSearchResultDto>> SearchAsync(
            string? shipperCode,
            string? nameFurigana,
            string? originDestinationName,
            string? areaCode,
            int commonMode);

        Task<OriginDestinationSearchResultDto?> GetAreaByCodeAsync(string code);
    }
}