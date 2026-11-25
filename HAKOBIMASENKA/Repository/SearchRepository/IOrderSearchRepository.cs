using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public interface IOrderSearchRepository
    {
        Task<IEnumerable<OrderSearchResultDto>> SearchAsync(
            OrderSearchRequestDto request);

        Task<OrderSearchResultDto?> FindMasterAsync(
    string masterType,
    string code);

        Task<DateTime?> GetTargetMonthAsync();
    }
}