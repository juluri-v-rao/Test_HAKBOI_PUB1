namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ShipperMasterViewModel
{
    public class ShipperHistoryDto
    {
        public string 荷主コード { get; set; } = string.Empty;
        public string? 略称 { get; set; }
        public string? 締め日 { get; set; }

        public string? 支店コード { get; set; }

        public string? 支店名称 { get; set; }

        public DateTime? 開始日 { get; set; }

        /// <summary>
        /// 更新日 (TxtDay1) — period end AND the row's key alongside 仕入先コード.
        /// Required (Input_Chk2: "終了日が不正です正しく入力して下さい！！").
        /// </summary>
        public DateTime 更新日 { get; set; }

        // Billing History
        public decimal 前回請求額 { get; set; }  
        public decimal 今回入金額 { get; set; }  
        public decimal 入金調整額 { get; set; }  
        public decimal 今回運賃額 { get; set; }  
        public decimal 割増額課 { get; set; }
        public decimal 割増額非 { get; set; }
        public decimal 課税値引額 { get; set; }
        public decimal 非課税値引 { get; set; }
        public decimal 今回消費税 { get; set; }


        public decimal 前月売掛残 { get; set; }
        public decimal 今月入金額 { get; set; }
        public decimal 今月運賃額 { get; set; }
        public decimal 今月消費税 { get; set; }

        // ---- Computed by Cal_Rireki — read-only in the UI (LblSKin1/3/4) ----
        /// <summary>今回繰越額 = 前回請求額 − 今回入金額 − 入金調整額.</summary>
        public decimal 今回繰越額 { get; set; }
        /// <summary>今月繰越額 = 前月売掛残 − 今月入金額 − 入金調整額.</summary>
        public decimal 今月繰越額 { get; set; }
        /// <summary>今回繰越額=課税値引額+非課税値引</summary>
        public decimal 今回値引額 { get; set; }
        /// <summary>
        /// 今回合計額 = 今回運賃額 + 割増額(課) + 割増額(非) − 課税値引額 − 非課税値引 + 今回消費税.
        /// </summary>
        public decimal 今回合計額 { get; set; }
        /// <summary>今回請求額 = 今回繰越額 + 今回合計額.</summary>
        public decimal 今回請求額 { get; set; }
        /// <summary>今回繰越額 = 課税値引額 + 非課税値引</summary>
        public decimal 今月値引額 { get; set; }
        /// <summary>
        /// 今月合計額 = − 課税値引額 − 非課税値引 + 今回消費税.
        /// </summary>
        public decimal 今月合計額 { get; set; }
        /// <summary>
        /// 今月売掛残 = 今月繰越額 + 今月合計額
        /// </summary>
        public decimal 今月売掛残 { get; set; }

        // ---- Payment-history-only fields (kind = "payment"; blank/zero for "payable") ----
        public DateTime? 回収予定日 { get; set; }   
        public string? 回収方法 { get; set; }
        public string? 回収方法名称 { get; set; }

    }
}
