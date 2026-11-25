namespace HAKOBIMASENKA.Models.ViewModels.DailyProcessingEntryViewModels.OrderEntryViewModel
{
    public class OrderEntryViewModel
        {

        // Header fields

        // 受注伝票No
        public string? OrderNo { get; set; } = string.Empty;
        public DateTime? OrderDate { get; set; } = DateTime.Now;
        public string? BranchCode { get; set; } = string.Empty;
        public string? BranchName { get; set; } = string.Empty;

        // 作業伝票No
        public string WorkVoucherNo { get; set; } = string.Empty;

        // 新規伝票フラグ (legacy Sink_Flg)
        public bool IsNew { get; set; }

        // 管理マスタ.発着地区分 = "0": 発着地 are registered per 荷主, so changing a row's 荷主 clears its 発地 and 着地 (legacy Kanri_PLKbn)
        public bool PlaceByShipper { get; set; }

        public List<OrderDetailViewModel> Details { get; set; } = [];
    }
}
