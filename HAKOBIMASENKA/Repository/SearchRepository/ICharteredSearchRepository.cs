using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public interface ICharteredSearchRepository
    {
        Task<IEnumerable<CharteredSearchResultDto>> SearchAsync(
            string? furigana,
            string? abbreviation,
            string? phoneNumber,
            bool activeOnly = false);
    }
}