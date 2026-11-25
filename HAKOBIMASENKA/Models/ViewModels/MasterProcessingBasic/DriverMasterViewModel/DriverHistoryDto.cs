namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.DriverMasterViewModel
{
    /// <summary>
    /// One row of a 運転者台帳 history (legacy wk運転免許証履歴 / wk事故履歴 / … / wk異動履歴).
    /// The 8 history tables share 運転手コード + 日付 as their key; each uses only some of these columns:
    ///     運転免許証履歴  番号
    ///     事故履歴        車番, 事故種類, 責任 (1: 有責 / 2: 双 / 3: 無責), 事故記録NO, 概要
    ///     違反履歴        内容
    ///     教育実施履歴    内容, 区分 (1: 初任 / 2: 高齢 / 3: 事故惹起)
    ///     運転経歴証明書  種類, 内容
    ///     適性診断履歴    区分 (1: 一般 / 2: 特別 / 3: 初任 / 4: 適齢 / 5: 特定), 概要
    ///     健康診断履歴    種類
    ///     異動履歴        異動事項, 備考
    /// </summary>
    public class DriverHistoryDto
    {
        public DateTime 日付 { get; set; }

        public string? 番号 { get; set; }
        public string? 種類 { get; set; }
        public string? 内容 { get; set; }
        public string? 車番 { get; set; }
        public string? 事故種類 { get; set; }
        public string? 責任 { get; set; }
        public string? 事故記録NO { get; set; }
        public string? 概要 { get; set; }
        public string? 区分 { get; set; }
        public string? 異動事項 { get; set; }
        public string? 備考 { get; set; }
    }
}
