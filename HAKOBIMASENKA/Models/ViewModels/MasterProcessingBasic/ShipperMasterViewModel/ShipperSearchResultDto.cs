namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ShipperMasterViewModel
{
    public class ShipperSearchResultDto
    {
        public string 荷主コード { get; set; } = string.Empty;
        public string? 略称 { get; set; }
        public string? 住所1 { get; set; }
        public string? 住所2 { get; set; }
        public string? 電話番号 { get; set; }
        public System.DateTime? 取引終了日 { get; set; }
        public string 荷主名1 { get; set; } = string.Empty;
        public string? 荷主名2 { get; set; }
    }

    public class PostalCodeResult
    {
        public string 郵便番号 { get; set; } = string.Empty;
        public string 住所 { get; set; } = string.Empty;
    }

    public class PaymentCategoryOption
    {
        public string 入金区分コード { get; set; } = string.Empty;
        public string 入金区分名称 { get; set; } = string.Empty;
    }

    public class DepartmentCodeResult
    {
        public string 部門コード { get; set; } = string.Empty;
        public string 部門名称 { get; set; } = string.Empty;
    }

    public class UnitCategoryOption
    {
        public string 請求コード { get; set; } = string.Empty;
        public string 請求名称 { get; set; } = string.Empty;
    }

    public class BankNameResult
    {
        public string? 銀行１ { get; set; }
        public string? 銀行２ { get; set; }
    }
}
