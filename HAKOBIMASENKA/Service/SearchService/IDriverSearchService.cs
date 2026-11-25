using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Service.SearchService
{
    // Defines Driver Search application operations.
    public interface IDriverSearchService
    {
        Task<IEnumerable<DriverSearchResultDto>> SearchAsync(
            string? furigana,
            string? driverName,
            string? driverCategory,
            string? subcontractorCode,
            bool activeOnly = false);

        Task<IEnumerable<DriverCodeOptionDto>> GetDriverCodeOptionsAsync(
    string driverCategory);
    }

}
