using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public interface IOriginDestinationSearchRepository
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