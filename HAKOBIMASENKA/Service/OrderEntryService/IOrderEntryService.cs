using HAKOBIMASENKA.Models.ViewModels.DailyProcessingEntryViewModels.OrderEntryViewModel;

namespace HAKOBIMASENKA.Service.OrderEntryService
{
    public class OrderEntrySaveResult
    {
        public bool Success { get; set; }

        public string? ErrorMessage { get; set; }
    }

    public interface IOrderEntryService
    {
        Task<OrderEntryViewModel?> GetByOrderNoAsync(string orderNo);

        Task<OrderEntryViewModel?> GetNextOrderAsync(string orderNo);

        Task<OrderEntryViewModel?> GetPreviousOrderAsync(string orderNo);

        Task<OrderEntrySaveResult> SaveAsync(OrderEntryViewModel model);

        Task DeleteAsync(string orderNo);

        Task<string> GetNewOrderNoAsync();

        Task<string> GetNewWorkVoucherNoAsync();

        Task<(string BranchCode, string BranchName)>GetDefaultBranchAsync();

        // 管理マスタ.発着地区分 = "0": 発着地 are registered per 荷主 (legacy Kanri_PLKbn)
        Task<bool> IsPlaceByShipperAsync();

        // 運賃形態 1 to 9 for the list beside 車種 (legacy Frame1B)
        Task<IEnumerable<OrderEntryLookupDto>> GetVehicleTypesAsync();

        Task<OrderEntryLookupDto?> LookupAsync(string type, string code, string? shipperCode, bool isNew);

        Task<OrderEntryUnitPriceDto> GetUnitPricesAsync(string? shipperCode, string? departureCode, string? arrivalCode,
            string? productCode, string? vehicleTypeCode, string? billingUnitCode, string? paymentUnitCode);

        Task<decimal?> CalculateFareAsync(string kind, string? partyCode, string? unitCode,
            decimal quantity, decimal weight, decimal unitPrice);

    }
}
