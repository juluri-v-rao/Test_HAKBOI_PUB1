namespace HAKOBIMASENKA.Models.ViewModels.DailyProcessingEntryViewModels.OrderEntryViewModel
{
    public class OrderDetailDto
    {
        public int RowNo { get; set; }

        // 作業伝票No
        public string? WorkVoucherNo { get; set; }

        // 日報No
        public string? DailyReportNo { get; set; }

        // 日報行No
        public int? DailyReportRowNo { get; set; }

        // 荷主
        public string? SupplierCode { get; set; }
        public string? SupplierName { get; set; }

        // 積込
        public DateTime? LoadingDate { get; set; }
        public string? LoadingNotes { get; set; }

        // 荷卸
        public DateTime? UnloadingDate { get; set; }
        public string? UnloadingNotes { get; set; }

        // 発地
        public string? DepartureCode { get; set; }
        public string? DepartureName { get; set; }
        public string? DepartureAddress { get; set; }

        // 着地
        public string? ArrivalCode { get; set; }
        public string? ArrivalName { get; set; }
        public string? ArrivalAddress { get; set; }

        // 品名
        public string? ProductCode { get; set; }
        public string? ProductName { get; set; }
        public string? ProductType { get; set; }

        public decimal? Quantity { get; set; }
        public decimal? Weight { get; set; }

        // 請求
        public string? BillingUnitCode { get; set; }
        public string? BillingUnitName { get; set; }

        public decimal? BillingUnitPrice { get; set; }
        public decimal? FreightCharge { get; set; }
        public decimal? Surcharge { get; set; }
        public decimal? TollCharge { get; set; }

        // 下払
        public string? PaymentUnitCode { get; set; }
        public string? PaymentUnitName { get; set; }

        public decimal? PaymentUnitPrice { get; set; }
        public decimal? FreightPay { get; set; }
        public decimal? TollPay { get; set; }
        public decimal? SurchargePay { get; set; }


        // 運転手
        public string? DriverCode { get; set; }
        public string? DriverName { get; set; }
        public string? DriverContact { get; set; }


        // 車番
        public string? VehicleCode { get; set; }
        public string? VehicleNumber { get; set; }

        public string? VehicleTypeCode { get; set; }
        public string? VehicleTypeName { get; set; }


        // 傭車
        public string? CharteredVehicleCode { get; set; }
        public string? CharteredVehicleName { get; set; }

        // 孫請傭車名
        public string? SubcontractedVehicleName { get; set; }

        public string? ActualOperation { get; set; }


        // 発地担当 / 着地担当
        public string? DepartureAdminName { get; set; }
        public string? DepartureAdminPhone { get; set; }

        public string? ArrivalAdminName { get; set; }
        public string? ArrivalAdminPhone { get; set; }


        // 社内備考 / 日報備考
        public string? InternalNotes { get; set; }
        public string? ReportNotes { get; set; }

    }
}
