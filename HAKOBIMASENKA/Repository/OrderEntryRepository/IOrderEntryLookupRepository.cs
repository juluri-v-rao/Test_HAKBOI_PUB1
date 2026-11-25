using HAKOBIMASENKA.Models.ViewModels.DailyProcessingEntryViewModels.OrderEntryViewModel;

namespace HAKOBIMASENKA.Repository.OrderEntryRepository
{
    // Master reads behind the Order Entry Enter lookups. Each method returns null when the code is not registered.
    // activeOnly is set on a new voucher, so masters that have ended (取引終了日, 退社日, 廃車日) are not found.
    public interface IOrderEntryLookupRepository
    {
        // 管理マスタ.発着地区分: true when 発着地 are registered per 荷主 ("0"), false when shared by all ("1")
        Task<bool> IsPlaceByShipperAsync();

        Task<OrderEntryLookupDto?> FindBranchAsync(string code);

        Task<OrderEntryLookupDto?> FindShipperAsync(string code, bool activeOnly);

        Task<OrderEntryLookupDto?> FindPlaceAsync(string shipperCode, string code);

        Task<OrderEntryLookupDto?> FindProductAsync(string code);

        Task<OrderEntryLookupDto?> FindDriverAsync(string code, bool activeOnly);

        Task<OrderEntryLookupDto?> FindVehicleAsync(string code, bool activeOnly);

        Task<OrderEntryLookupDto?> FindVehicleTypeAsync(string code);

        // 運賃形態 1 to 9 for the list beside 車種 (VehicleTypeCode, VehicleTypeName)
        Task<IEnumerable<OrderEntryLookupDto>> GetVehicleTypesAsync();

        Task<OrderEntryLookupDto?> FindCharteredAsync(string code, bool activeOnly);

        Task<OrderEntryLookupDto?> FindUnitAsync(string code);

        // Prices and fares

        // 品名マスタ.品名区分コード, or "" when the product has none
        Task<string> GetProductCategoryAsync(string productCode);

        // 発着地単価マスタ rows for the route in either direction, with 行帰区分 blank, 品名区分 blank or productCategory,
        // and one of the two units. vehicleType (1 to 9) picks the 単価n and 傭車単価n columns.
        Task<List<OrderEntryUnitPriceRow>> FindUnitPricesAsync(string shipperCode, string departureCode, string arrivalCode,
            string productCategory, int vehicleType, string billingUnitCode, string paymentUnitCode);

        // 荷主マスタ.売上端数 and 端数桁数, or null when the 荷主 is not registered
        Task<OrderEntryRoundingRule?> GetShipperRoundingAsync(string shipperCode);

        // 傭車マスタ.下払端数 and 端数桁数, or null when the 傭車 is not registered
        Task<OrderEntryRoundingRule?> GetCharteredRoundingAsync(string charteredCode);

        // 単位マスタ.計算区分, or null when the unit is not registered or has none
        Task<string?> GetCalculationTypeAsync(string unitCode);
    }
}
