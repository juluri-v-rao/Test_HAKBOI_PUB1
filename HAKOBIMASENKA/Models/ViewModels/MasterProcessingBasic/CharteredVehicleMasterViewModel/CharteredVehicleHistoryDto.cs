namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.CharteredVehicleMasterViewModel
{
    /// <summary>
    /// One row of 傭車支払履歴 / 傭車買掛履歴 as shown on the history tabs (legacy Dsp_List / Dsp_Rireki).
    /// Key: 傭車コード + 更新日 (終了日 on the screen).
    /// </summary>
    public class CharteredVehicleHistoryDto
    {
        public DateTime? 開始日 { get; set; }

        /// <summary>終了日 on the screen; the row key.</summary>
        public DateTime 更新日 { get; set; }

        public decimal? 前回買掛額 { get; set; }
        public decimal? 今回支払額 { get; set; }
        public decimal? 今回調整額 { get; set; }
        public decimal? 今回繰越額 { get; set; }     // calculated
        public decimal? 今回仕入額 { get; set; }
        public decimal? 今回割増額 { get; set; }
        public decimal? 今回非割増 { get; set; }
        public decimal? 課税値引額 { get; set; }
        public decimal? 非課税値引 { get; set; }
        public decimal? 今回消費税 { get; set; }
        public decimal? 今回値引額 { get; set; }     // calculated
        public decimal? 今回合計額 { get; set; }     // calculated
        public decimal? 今回買掛額 { get; set; }     // calculated

        // 支払履歴 only
        public DateTime? 支払日付 { get; set; }
        public string? 支払方法 { get; set; }

        /// <summary>Display only: 支払区分マスタ.名称 of 支払方法.</summary>
        public string? 支払方法名称 { get; set; }
    }
}
