using HAKOBIMASENKA.Models.ViewModels.DailyProcessingEntryViewModels.OrderEntryViewModel;

namespace HAKOBIMASENKA.Repository.OrderEntryRepository
{
    public interface IOrderEntryRepository
    {
        //Task<List<OrderDetailDto>> GetDetailsAsync(string orderNo);

        Task<OrderEntryDto?> GetByOrderNoAsync(string orderNo);

        Task<OrderEntryDto?> GetNextOrderAsync(string orderNo);

        Task<OrderEntryDto?> GetPreviousOrderAsync(string orderNo);

        // Returns false when a new order's number has already been registered.
        Task SaveAsync(OrderEntryDto dto);

        Task DeleteAsync(string orderNo);

        // 受注伝票No
        Task<string> GetNewOrderNoAsync();

        // 作業伝票No
        Task<string> GetNewWorkVoucherNoAsync();

        Task<(string BranchCode, string BranchName)> GetDefaultBranchAsync();
    }
}
