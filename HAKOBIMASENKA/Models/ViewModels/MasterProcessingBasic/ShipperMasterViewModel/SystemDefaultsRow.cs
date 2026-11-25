namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ShipperMasterViewModel
{
    public class SystemDefaultsRow
    {
        public string? 売上端数 { get; set; }
        public string? 税区分 { get; set; }
        public string? 税端数 { get; set; }
        public string? 請求日設定 { get; set; }
        public string? 課税割増 { get; set; }
        public string? 非課税割増 { get; set; }

        public bool? 運行管理 { get; set; }
        public bool? デジタコ { get; set; }
    }
}
