using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ShipperMasterViewModel
{
    public class ShipperViewModel
    {
        /// <summary>仕入先コード — PK, 10-digit zero-padded (TxtCode).</summary>
        [Required(ErrorMessage = "荷主コードを入力して下さい。")]
        [StringLength(10, MinimumLength = 1)]
        public string 荷主コード { get; set; } = string.Empty;

        /// <summary>True when Sink_Flg is set (新規 mode) — drives New vs Edit UI.</summary>
        public bool IsNewRecord { get; set; }

        // ---- Tab 1: 基本設定 (Basic Settings) ----
        [Required(ErrorMessage = "荷主名を入力して下さい。")]
        [StringLength(40)]
        public string 荷主名1 { get; set; } = string.Empty;

        [StringLength(40)]
        public string? 荷主名2 { get; set; }

        [Required(ErrorMessage = "フリガナを入力して下さい。")]
        [StringLength(40)]
        public string ふりがな { get; set; } = string.Empty;

        [Required(ErrorMessage = "略称を入力して下さい。")]
        [StringLength(20)]
        public string 略称 { get; set; } = string.Empty;

        [StringLength(8)]
        public string? 郵便 { get; set; }

        [StringLength(60)]
        public string? 住所1 { get; set; }

        [StringLength(60)]
        public string? 住所2 { get; set; }

        [StringLength(20)]
        public string? 電話番号 { get; set; }

        [StringLength(20)]
        [JsonPropertyName("FAX番号")]
        public string? FAX番号 { get; set; }

        public DateTime? 取引開始日 { get; set; }
        public DateTime? 取引終了日 { get; set; }

        [StringLength(200)]
        public string? 備考 { get; set; }

        [StringLength(200)]
        public string? MAIL { get; set; }

        public string? 部門コード { get; set; }

        // ---- Tab 2: 支払設定 (Payment Settings) ----
        [Required(ErrorMessage = "締め日を入力して下さい。")]
        [StringLength(2)]
        public string 締め日 { get; set; } = string.Empty;

        [Required(ErrorMessage = "精算先を入力して下さい。")]
        [StringLength(10)]
        public string 請求先コード { get; set; } = string.Empty;

        public string? 請求区分 { get; set; }

        [StringLength(2)]
        public string? 回収サイト { get; set; }

        [StringLength(2)]
        public string? 回収日 { get; set; }

        [StringLength(2)]
        public string? 支払方法1 { get; set; }

        public decimal? 支払条件 { get; set; }

        [StringLength(2)]
        public string? 支払方法2 { get; set; }

        [StringLength(40)]
        public string? 銀行コード { get; set; }

        [StringLength(40)]
        public string? 銀行１ { get; set; }

        [StringLength(40)]
        public string? 銀行２ { get; set; }

        // ---- Tab 3: 計算設定 (Calculation Settings) ----
        [Required(ErrorMessage = "端数桁数を入力して下さい。")]
        public string 端数桁数 { get; set; } = "0";

        [Required(ErrorMessage = "下払端数を入力して下さい。")]
        public string 売上端数 { get; set; } = "1";

        [Required(ErrorMessage = "消費税区分を入力して下さい。")]
        public string 税区分 { get; set; } = "1";

        [Required(ErrorMessage = "消費税端数を入力して下さい。")]
        public string 税端数 { get; set; } = "0";

        public decimal? 値引率 { get; set; }
        public string 課税割増 { get; set; } = "1";
        public string 非課税割増 { get; set; } = "1";
        public string 値引端数 { get; set; } = "0";
        public string 請求日設定 { get; set; } = "0";
        public int? 数量小数点 { get; set; }
        public int? 重量小数点 { get; set; }
        public int? 小数点 { get; set; }

        // ---- Checkbox flags — confirmed against the real schema (a save attempt with
        // "Unchecked" threw "String or binary data would be truncated... column
        // 単価表示... truncated value: 'U'", i.e. the column is 1 character wide).
        public string 単価表示 { get; set; } = "0";     // ChkDsp
        public string 請求残計算 { get; set; } = "0";   // ChkCal0
        public string 売掛残計算 { get; set; } = "0";   // ChkCal1

        // ---- Tab 6: 給与オプション設定 (Payroll Option Settings) ----
        public string? 手当掛率 { get; set; }

        // ---- Tab 7: デジタコオプション設定 (Digital Tachograph Option Settings) ----
        [StringLength(15)]
        public string? デジタココード { get; set; }


        // ---- Display-only lookups (joined in for the form, not persisted) ----
        public string? 精算先名称 { get; set; }     // LblSeikyuNm
        public string? 回収方法1名称 { get; set; }  // CmbSel0
        public string? 回収方法2名称 { get; set; }  // CmbSel1
    }

}
