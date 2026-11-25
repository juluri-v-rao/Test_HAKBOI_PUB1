namespace HAKOBIMASENKA.Models.ViewModels.DailyProcessingEntryViewModels.OrderEntryViewModel
{
    public class OrderEntryDto
    {
        // Header

        public string? OrderNo { get; set; } = string.Empty;
        public DateTime? OrderDate { get; set; } = DateTime.Now;
        public string? BranchCode { get; set; } = string.Empty;
        public string? BranchName { get; set; } = string.Empty;
        public string WorkVoucherNo { get; set; } = string.Empty;

        // 新規伝票フラグ (legacy Sink_Flg)
        public bool IsNew { get; set; }

        public List<OrderDetailDto> Details { get; set; } = [];
    }
}

