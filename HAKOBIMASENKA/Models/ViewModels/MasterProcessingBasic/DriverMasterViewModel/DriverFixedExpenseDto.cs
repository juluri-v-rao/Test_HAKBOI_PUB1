namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.DriverMasterViewModel
{
    /// <summary>
    /// One 固定経費マスタ row of a driver (legacy wk固定経費マスタ表示 / MSFlxGrd).
    /// キー: the stored key; 0 (or less) for a row added on screen, which gets a new key on F1.
    /// </summary>
    public class DriverFixedExpenseDto
    {
        public int キー { get; set; }

        public string? 経費コード { get; set; }

        /// <summary>Display only: 経費マスタ.名称.</summary>
        public string? 経費名称 { get; set; }

        /// <summary>号車</summary>
        public string? 車輌コード { get; set; }

        /// <summary>Display only: 車輌マスタ.車番.</summary>
        public string? 車番 { get; set; }

        /// <summary>計上方法 0: 毎月 (金額) / 1: 月指定 (金額1-12)</summary>
        public string? 分割方法 { get; set; }

        public decimal? 金額 { get; set; }
        public decimal? 金額1 { get; set; }
        public decimal? 金額2 { get; set; }
        public decimal? 金額3 { get; set; }
        public decimal? 金額4 { get; set; }
        public decimal? 金額5 { get; set; }
        public decimal? 金額6 { get; set; }
        public decimal? 金額7 { get; set; }
        public decimal? 金額8 { get; set; }
        public decimal? 金額9 { get; set; }
        public decimal? 金額10 { get; set; }
        public decimal? 金額11 { get; set; }
        public decimal? 金額12 { get; set; }
    }
}
