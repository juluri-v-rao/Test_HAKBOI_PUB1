using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Repository.SearchRepository;

namespace HAKOBIMASENKA.Service.SearchService
{
    public class OrderSearchService : IOrderSearchService
    {
        private readonly IOrderSearchRepository _orderSearchRepository;

        public OrderSearchService(
            IOrderSearchRepository orderSearchScreenRepository)
        {
            _orderSearchRepository = orderSearchScreenRepository;
        }

        public async Task<IEnumerable<OrderSearchResultDto>> SearchAsync(
            OrderSearchRequestDto request)
        {
            return await _orderSearchRepository.SearchAsync(request);
        }
        public async Task<OrderSearchResultDto?> FindMasterAsync(
    string masterType,
    string code)
        {
            return await _orderSearchRepository.FindMasterAsync(
                masterType,
                code);
        }
        public async Task<DateTime?> GetTargetMonthAsync()
        {
            return await _orderSearchRepository.GetTargetMonthAsync();
        }

    }
}