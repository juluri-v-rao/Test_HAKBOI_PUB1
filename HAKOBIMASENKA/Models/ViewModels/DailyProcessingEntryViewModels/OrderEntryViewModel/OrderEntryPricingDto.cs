namespace HAKOBIMASENKA.Models.ViewModels.DailyProcessingEntryViewModels.OrderEntryViewModel
{
    // Automatic prices for one row from 発着地単価マスタ (legacy Dsp_Tanka). 0 means no price was found.
    public class OrderEntryUnitPriceDto
    {
        // 単価{車種}: 請求単価
        public decimal UnitPrice { get; set; }

        // 傭車単価{車種}: 下払単価
        public decimal PaymentUnitPrice { get; set; }
    }

    // One 発着地単価マスタ row that may give a row its price
    public class OrderEntryUnitPriceRow
    {
        public string DepartureCode { get; set; } = "";
        public string ProductCategory { get; set; } = "";
        public string UnitCode { get; set; } = "";
        public decimal? UnitPrice { get; set; }
        public decimal? PaymentUnitPrice { get; set; }
    }

    // Rounding settings of a 荷主 (売上端数) or 傭車 (下払端数), and 端数桁数. Null when the master has none.
    public class OrderEntryRoundingRule
    {
        public string? Rounding { get; set; }
        public string? Digits { get; set; }
    }
}
