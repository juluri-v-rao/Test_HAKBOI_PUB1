using System.Text.Json.Serialization;

namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.CharteredVehicleMasterViewModel
{
    /// <summary>
    /// 傭車マスタ one record (legacy FrmM_Yosha).
    /// Property names match the 傭車マスタ columns so Dapper maps them directly.
    /// </summary>
    public class CharteredVehicleMasterViewModel
    {
        /// <summary>True when the screen is in 新規 mode (legacy Sink_Flg).</summary>
        public bool IsNewRecord { get; set; }

        public string 傭車コード { get; set; } = "";

        // ---- Header ----
        public string? 傭車名1 { get; set; }
        public string? 傭車名2 { get; set; }

        // ---- Tab 1: 基本設定 ----
        public string? ふりがな { get; set; }
        public string? 略称 { get; set; }
        public string? 郵便 { get; set; }
        public string? 住所1 { get; set; }
        public string? 住所2 { get; set; }
        public string? 電話番号 { get; set; }

        // Explicit names: camel-casing would otherwise send "faX番号" and "mail".
        [JsonPropertyName("FAX番号")]
        public string? FAX番号 { get; set; }

        public DateTime? 取引開始日 { get; set; }
        public DateTime? 取引終了日 { get; set; }
        public string? 備考 { get; set; }

        [JsonPropertyName("MAIL")]
        public string? MAIL { get; set; }

        // ---- Tab 2: 支払設定 ----
        public string? 締め日 { get; set; }
        public string? 精算先コード { get; set; }

        /// <summary>Display only: 略称 of the 精算先 (not saved).</summary>
        public string? 精算先名称 { get; set; }

        public string? 精算区分 { get; set; }
        public string? 支払サイト { get; set; }
        public string? 支払日 { get; set; }
        public string? 支払方法1 { get; set; }
        public decimal? 支払条件 { get; set; }
        public string? 支払方法2 { get; set; }
        public string? 銀行名 { get; set; }
        public string? 支店名 { get; set; }
        public string? 口座種別 { get; set; }
        public string? 口座番号 { get; set; }
        public string? 口座名義 { get; set; }

        // ---- Tab 3: 計算設定 ----
        public string? 端数桁数 { get; set; }
        public string? 下払端数 { get; set; }
        public string? 税区分 { get; set; }
        public string? 税端数 { get; set; }
        public decimal? 値引率 { get; set; }
        public string? 値引課税 { get; set; }
        public string? 値引非課税 { get; set; }
        public string? 値引端数 { get; set; }
        public string? 支払日設定 { get; set; }
        public int? 数量小数点 { get; set; }
        public int? 重量小数点 { get; set; }
        public int? 小数点 { get; set; }

        /// <summary>"1" = checked (表示しない / 計算しない).</summary>
        public string? 単価表示 { get; set; }
        public string? 支払残計算 { get; set; }
        public string? 買掛残計算 { get; set; }

        // ---- Tab 6: デジタコオプション設定 ----
        public string? デジタココード { get; set; }

        // ---- Tab 4 / 5: 支払履歴 / 買掛履歴 ----
        // null on a save = leave the stored history as it is.
        public List<CharteredVehicleHistoryDto>? 支払履歴 { get; set; }
        public List<CharteredVehicleHistoryDto>? 買掛履歴 { get; set; }
    }
}
