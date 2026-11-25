using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Repository.SearchRepository;

namespace HAKOBIMASENKA.Service.SearchService
{
    public class CharteredSearchService : ICharteredSearchService
    {
        private readonly ICharteredSearchRepository _repository;

        public CharteredSearchService(
            ICharteredSearchRepository repository)
        {
            _repository = repository;
        }

        public Task<IEnumerable<CharteredSearchResultDto>> SearchAsync(
            string? furigana,
            string? abbreviation,
            string? phoneNumber,
            bool activeOnly = false)
        {
            return _repository.SearchAsync(
                furigana,
                abbreviation,
                phoneNumber,
                activeOnly);
        }
    }
}