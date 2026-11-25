using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Repository.SearchRepository;

namespace HAKOBIMASENKA.Service.SearchService
{
    // Passes Driver Search conditions to the repository.
    public class DriverSearchService : IDriverSearchService
    {
        private readonly IDriverSearchRepository _repository;

        public DriverSearchService(
            IDriverSearchRepository repository)
        {
            _repository = repository
                ?? throw new ArgumentNullException(nameof(repository));
        }

        public Task<IEnumerable<DriverSearchResultDto>> SearchAsync(
            string? furigana,
            string? driverName,
            string? driverCategory,
            string? subcontractorCode,
            bool activeOnly = false)
        {
            return _repository.SearchAsync(
                furigana,
                driverName,
                driverCategory,
                subcontractorCode,
                activeOnly);
        }

        public Task<IEnumerable<DriverCodeOptionDto>> GetDriverCodeOptionsAsync(
    string driverCategory)
        {
            return _repository.GetDriverCodeOptionsAsync(driverCategory);
        }
    }
}
