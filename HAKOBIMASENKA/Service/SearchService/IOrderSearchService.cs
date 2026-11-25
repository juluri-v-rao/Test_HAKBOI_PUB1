using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Service.SearchService
{
    public interface IOrderSearchService
    {
        Task<IEnumerable<OrderSearchResultDto>> SearchAsync(
            OrderSearchRequestDto request);
        Task<OrderSearchResultDto?> FindMasterAsync(
    string masterType,
    string code);

        Task<DateTime?> GetTargetMonthAsync();
    }
}