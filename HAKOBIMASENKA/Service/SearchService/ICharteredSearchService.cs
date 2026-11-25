using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Service.SearchService
{
    public interface ICharteredSearchService
    {
        Task<IEnumerable<CharteredSearchResultDto>> SearchAsync(
            string? furigana,
            string? abbreviation,
            string? phoneNumber,
            bool activeOnly = false);
    }
}