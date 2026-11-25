using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    // Defines database operations for Driver Search.
    public interface IDriverSearchRepository
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
