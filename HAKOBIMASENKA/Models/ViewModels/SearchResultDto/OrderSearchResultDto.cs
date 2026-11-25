namespace HAKOBIMASENKA.Models.ViewModels.SearchResultDto
{
    public class OrderSearchResultDto
    { 
        public string OrderNo { get; set; } = "";
        public string OrderDisplayNo { get; set; } = "";
        public string Content { get; set; } = "";
        public DateTime? LoadingDate { get; set; }
        public string LoadingTime { get; set; } = "";
        public DateTime? UnloadingDate { get; set; }
        public string UnloadingTime { get; set; } = "";
        public string CharteringCompany { get; set; } = "";
        public string TransportationCompany { get; set; } = "";
        public string DriverName { get; set; } = "";
        public string VehicleNumber { get; set; } = "";
        public string VehicleType { get; set; } = "";
        public string ShipperName { get; set; } = "";
        public string OriginName { get; set; } = "";
        public string DestinationName { get; set; } = "";
        public string ProductName { get; set; } = "";
        public decimal? Quantity { get; set; }
        public decimal? Weight { get; set; }
        public string UnitName { get; set; } = "";
        public decimal? UnitPrice { get; set; }
        public decimal? BillingFreight { get; set; }
        public decimal? Surcharge { get; set; }
        public decimal? TollFeeBilling { get; set; }
        public string PaymentUnitName { get; set; } = "";
        public decimal? PaymentUnitPrice { get; set; }
        public decimal? PaymentFreight { get; set; }
        public decimal? PaymentSurcharge { get; set; }
        public decimal? TollFeePayment { get; set; }
        public string Packaging { get; set; } = "";
        public string InternalRemarks { get; set; } = "";
        public string DailyReportRemarks { get; set; } = "";
    }


    public class OrderSearchRequestDto
    {
        public string? ShipperCode { get; set; }
        public string? CharteringCompanyCode { get; set; }

        public string? DriverCode { get; set; }
        public string? VehicleCode { get; set; }
        public string? OriginCode { get; set; }
        public string? DestinationCode { get; set; }
        public string? ProductCode { get; set; }

        // Manual name search for code 0000000000.
        public string? DriverName { get; set; }
        public string? VehicleName { get; set; }
        public string? OriginName { get; set; }
        public string? DestinationName { get; set; }
        public string? ProductName { get; set; }

        public int DateType { get; set; } = 0;

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

}