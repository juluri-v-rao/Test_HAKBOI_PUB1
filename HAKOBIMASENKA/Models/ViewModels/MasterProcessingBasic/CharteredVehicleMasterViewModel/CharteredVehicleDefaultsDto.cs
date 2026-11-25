namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.CharteredVehicleMasterViewModel
{
    /// <summary>
    /// Values a new 傭車 starts with, read from 管理マスタ (自社コード 01) in legacy FrmM_Yosha_Load.
    /// Named after the 傭車マスタ columns they fill.
    /// </summary>
    public class CharteredVehicleDefaultsDto
    {
        public string 下払端数 { get; set; } = "0";     // 管理マスタ.売上端数
        public string 税区分 { get; set; } = "0";       // 管理マスタ.税区分
        public string 税端数 { get; set; } = "0";       // 管理マスタ.税端数
        public string 支払日設定 { get; set; } = "0";   // 管理マスタ.請求日設定
        public string 値引課税 { get; set; } = "0";     // 管理マスタ.課税割増
        public string 値引非課税 { get; set; } = "0";   // 管理マスタ.非課税割増

        // Licensed options decide which tabs are shown (legacy FrmM_Yosha_Load removes the others).
        public bool 運行管理 { get; set; }               // SEC2 = 1: 支払履歴 / 買掛履歴 tabs
        public bool デジタコ { get; set; }               // SEC4 or SEC5 = 1: ﾃﾞｼﾞﾀｺｵﾌﾟｼｮﾝ設定 tab
    }
}
