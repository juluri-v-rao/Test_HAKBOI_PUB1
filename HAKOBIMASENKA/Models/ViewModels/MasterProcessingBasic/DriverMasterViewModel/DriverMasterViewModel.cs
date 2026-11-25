using System.Text.Json.Serialization;

namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.DriverMasterViewModel
{
    /// <summary>
    /// 運転手マスタ one record (legacy FrmM_Tanto): header, 基本設定, 固定経費設定, 給与ｵﾌﾟｼｮﾝ設定,
    /// ﾃﾞｼﾞﾀｺｵﾌﾟｼｮﾝ設定, ETCｵﾌﾟｼｮﾝ設定 and 運転者台帳 1-4 with their 8 histories.
    /// Property names match the 運転手マスタ columns so Dapper maps them directly.
    /// </summary>
    public class DriverMasterViewModel
    {
        /// <summary>True when the screen is in 新規 mode (legacy Sink_Flg).</summary>
        public bool IsNewRecord { get; set; }

        public string 運転手コード { get; set; } = "";

        // ---- Header ----
        public string? 運転手名 { get; set; }

        // ---- Tab 1: 基本設定 ----
        public string? ふりがな { get; set; }
        public string? 郵便 { get; set; }
        public string? 住所1 { get; set; }
        public string? 住所2 { get; set; }
        public string? 電話番号 { get; set; }
        public string? 携帯番号 { get; set; }
        public DateTime? 生年月日 { get; set; }
        public DateTime? 入社日 { get; set; }
        public DateTime? 退社日 { get; set; }

        /// <summary>0: 自社 / 1: 傭車 / 2: 契約</summary>
        public string? 運転手区分 { get; set; }

        public string? 車輌コード { get; set; }

        /// <summary>Display only: 車輌マスタ.車番 (not saved).</summary>
        public string? 車番 { get; set; }

        public string? 傭車コード { get; set; }

        /// <summary>Display only: 傭車マスタ.略称 (not saved).</summary>
        public string? 傭車略称 { get; set; }

        public string? 部門コード { get; set; }

        /// <summary>Display only: 部門マスタ.名称 (not saved).</summary>
        public string? 部門名称 { get; set; }

        public string? 備考 { get; set; }

        /// <summary>"1" = 配車表 表示しない (checked).</summary>
        public string? 配車表示 { get; set; }

        // ---- Tab 3: 給与ｵﾌﾟｼｮﾝ設定 ----
        public decimal? 手当掛率 { get; set; }
        public string? 所属コード { get; set; }

        /// <summary>Display only: 所属マスタ.名称 (not saved).</summary>
        public string? 所属名称 { get; set; }

        /// <summary>0-6 (正社員 / 契約社員 / パート / 試用期間 / 臨時ﾊﾞｲﾄ / 派遣 / その他)</summary>
        public string? 雇用区分 { get; set; }

        public decimal? 所定労働 { get; set; }

        // ---- Tab 4: ﾃﾞｼﾞﾀｺｵﾌﾟｼｮﾝ設定 ----
        public string? デジタココード { get; set; }

        // ---- Tab 5: ETCｵﾌﾟｼｮﾝ設定 ----
        // Explicit name: camel-casing would otherwise send "etcカード".
        [JsonPropertyName("ETCカード")]
        public string? ETCカード { get; set; }

        // ---- Tab 2: 固定経費設定 (legacy wk固定経費マスタ表示) ----
        public List<DriverFixedExpenseDto>? 固定経費 { get; set; }

        // =====================================================
        // ---- Tab 6: 運転者台帳1 ----
        // =====================================================

        /// <summary>1: 男 / 2: 女 (legacy TxtNKbn2)</summary>
        public string? 性別 { get; set; }

        public DateTime? 選任年月日 { get; set; }
        public DateTime? 撮影日 { get; set; }

        /// <summary>The photo file (legacy TxtFile). Its image goes to 運転手写真 on F1.</summary>
        public string? 写真パス { get; set; }

        public string? 免許証番号 { get; set; }
        public DateTime? 取得年月日 { get; set; }
        public string? 条件 { get; set; }

        // 免許の種類 (legacy ChkS(0-16)): "1" = checked
        public string? 大型 { get; set; }
        public string? 普通 { get; set; }
        public string? 大特 { get; set; }
        public string? けん引 { get; set; }
        public string? 大2 { get; set; }
        public string? 普2 { get; set; }
        public string? 大特2 { get; set; }
        public string? けん引2 { get; set; }
        public string? 中型 { get; set; }
        public string? 中型限定 { get; set; }
        public string? 準中型 { get; set; }
        public string? 準中型限定 { get; set; }
        public string? 中2 { get; set; }
        public string? 中2限定 { get; set; }
        public string? ユニック { get; set; }
        public string? 玉掛け { get; set; }
        public string? フォーク { get; set; }

        // 履歴・運転経験 (legacy TxtNDate(1-5) / TxtNEtc(1-5))
        public DateTime? 職歴日付1 { get; set; }
        public DateTime? 職歴日付2 { get; set; }
        public DateTime? 職歴日付3 { get; set; }
        public DateTime? 職歴日付4 { get; set; }
        public DateTime? 職歴日付5 { get; set; }
        public string? 職歴1 { get; set; }
        public string? 職歴2 { get; set; }
        public string? 職歴3 { get; set; }
        public string? 職歴4 { get; set; }
        public string? 職歴5 { get; set; }

        // 自動車の種類 / 定員又は積載量 / 経験年数 / 経験した事業所
        // (legacy TxtType / TxtTeiin / TxtCapa / TxtKNen / TxtKTsuki / TxtKJigyosho)
        public string? 自動車種類1 { get; set; }
        public string? 自動車種類2 { get; set; }
        public decimal? 定員数1 { get; set; }
        public decimal? 定員数2 { get; set; }
        public decimal? 積載量1 { get; set; }
        public decimal? 積載量2 { get; set; }
        public decimal? 経験年数1 { get; set; }
        public decimal? 経験年数2 { get; set; }
        public decimal? 経験月数1 { get; set; }
        public decimal? 経験月数2 { get; set; }
        public string? 経験事業所名1 { get; set; }
        public string? 経験事業所名2 { get; set; }

        // =====================================================
        // ---- Tab 9: 運転者台帳4 ----
        // =====================================================

        // 保険関連 (legacy TxtNBanDate(1-4) / TxtNBan(1-4))
        public DateTime? 健保加入年月日 { get; set; }
        public DateTime? 厚保加入年月日 { get; set; }
        public DateTime? 雇保加入年月日 { get; set; }
        public DateTime? 労災加入年月日 { get; set; }
        public string? 健保番号 { get; set; }
        public string? 厚保番号 { get; set; }
        public string? 雇保番号 { get; set; }
        public string? 労災番号 { get; set; }

        // 通勤方法 (legacy ChkTK_1-6): "1" = checked
        public string? 徒歩 { get; set; }
        public string? 自動車 { get; set; }
        public string? バス { get; set; }
        public string? 電車 { get; set; }
        public string? 自転車 { get; set; }
        public string? その他 { get; set; }
        public string? 通勤方法その他 { get; set; }
        public decimal? 通勤h { get; set; }
        public decimal? 通勤m { get; set; }

        // その他 / 退社理由 / 備考 (legacy TxtTKinNm / TxtTKinTel / TxtREtc(1-2) / TxtNEtc2(1-8))
        public string? 緊急連絡先 { get; set; }
        public string? 緊急連絡先番号 { get; set; }
        public string? 退社理由1 { get; set; }
        public string? 退社理由2 { get; set; }
        public string? 台帳備考1 { get; set; }
        public string? 台帳備考2 { get; set; }
        public string? 台帳備考3 { get; set; }
        public string? 台帳備考4 { get; set; }
        public string? 台帳備考5 { get; set; }
        public string? 台帳備考6 { get; set; }
        public string? 台帳備考7 { get; set; }
        public string? 台帳備考8 { get; set; }

        // =====================================================
        // ---- 運転者台帳 histories (legacy wk tables) ----
        // null = not sent: the stored rows stay as they are.
        // =====================================================

        /// <summary>台帳1 運転免許履歴</summary>
        public List<DriverHistoryDto>? 運転免許証履歴 { get; set; }

        /// <summary>台帳2 自動車事故履歴</summary>
        public List<DriverHistoryDto>? 事故履歴 { get; set; }

        /// <summary>台帳2 違反履歴</summary>
        public List<DriverHistoryDto>? 違反履歴 { get; set; }

        /// <summary>台帳2 運転経歴証明書等</summary>
        public List<DriverHistoryDto>? 運転経歴証明書 { get; set; }

        /// <summary>台帳3 適正診断</summary>
        public List<DriverHistoryDto>? 適性診断履歴 { get; set; }

        /// <summary>台帳3 特別教育</summary>
        public List<DriverHistoryDto>? 教育実施履歴 { get; set; }

        /// <summary>台帳3 健康診断(定期・その他)</summary>
        public List<DriverHistoryDto>? 健康診断履歴 { get; set; }

        /// <summary>台帳4 異動履歴</summary>
        public List<DriverHistoryDto>? 異動履歴 { get; set; }
    }
}
