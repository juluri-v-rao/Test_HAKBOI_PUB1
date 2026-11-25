namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ManagementMasterViewModel
{
    public class ManagementMasterResultDto
    {
        #region 自社情報

        public string 自社コード { get; set; } = string.Empty;
        public string 自社名1 { get; set; } = string.Empty;
        public string 自社名2 { get; set; } = string.Empty;
        public string 略称 { get; set; } = string.Empty;
        public string 郵便番号 { get; set; } = string.Empty;
        public string 住所1 { get; set; } = string.Empty;
        public string 住所2 { get; set; } = string.Empty;
        public string 電話番号 { get; set; } = string.Empty;
        public string faX番号 { get; set; } = string.Empty;
        public string 銀行1 { get; set; } = string.Empty;
        public string 銀行2 { get; set; } = string.Empty;
        public string 運行管理者 { get; set; } = string.Empty;
        public string 登録番号 { get; set; } = string.Empty;

        #endregion

        #region 税率設定

        public DateTime? 新消費税率施行日 { get; set; }

        public decimal? 旧消費税率 { get; set; }

        public decimal? 新消費税率 { get; set; }

        public DateTime? 新軽油税施行日 { get; set; }

        public decimal? 旧軽油税 { get; set; }

        public decimal? 新軽油税 { get; set; }

        #endregion

        #region 対象月度

        public DateTime? 対象月度 { get; set; }

        #endregion

        #region 伝票番号設定

        public int? 受注伝票 { get; set; }
        public int? 仕入伝票 { get; set; }
        public int? 傭車伝票 { get; set; }
        public int? 経費伝票 { get; set; }
        public int? 作業伝票 { get; set; }

        public int? 運転日報 { get; set; }
        public int? 入金伝票 { get; set; }
        public int? 仕入支払 { get; set; }
        public int? 支払伝票 { get; set; }
        public int? 予約番号 { get; set; }

        #endregion

        #region 端数設定

        public int? 売上端数 { get; set; }
        public int? 消費税区分 { get; set; }
        public int? 消費税端数 { get; set; }

        #endregion

        #region マシン設定

        public string 顧客No { get; set; } = string.Empty;
        public string サーバーパス { get; set; } = string.Empty;

        #endregion

        #region 入力設定

        public int? 発着地区分 { get; set; }
        public int? 日付区分 { get; set; }

        #endregion

        #region 部門管理

        public int? 部門管理 { get; set; }

        #endregion

        #region 請求書設定

        public string 宛先敬称 { get; set; } = string.Empty;

        #endregion

        #region 環境設定

        public int? 実車区分 { get; set; }

        public int? 課税割増 { get; set; }

        public int? 非課税割増 { get; set; }

        public int? 請求日設定 { get; set; }

        public int? 警告日数 { get; set; }

        public string 送信先1 { get; set; } = string.Empty;

        public string 送信先2 { get; set; } = string.Empty;

        #endregion

        #region 手当

        public string 手当1 { get; set; } = string.Empty;
        public string 手当2 { get; set; } = string.Empty;
        public string 手当3 { get; set; } = string.Empty;
        public string 手当4 { get; set; } = string.Empty;
        public string 手当5 { get; set; } = string.Empty;
        public string 手当6 { get; set; } = string.Empty;
        public string 手当7 { get; set; } = string.Empty;

        #endregion

        #region 支給

        public string 支給1 { get; set; } = string.Empty;
        public string 支給2 { get; set; } = string.Empty;
        public string 支給3 { get; set; } = string.Empty;
        public string 支給4 { get; set; } = string.Empty;
        public string 支給5 { get; set; } = string.Empty;

        #endregion

        #region 給与設定

        public int? 給与締切日 { get; set; }

        public decimal? 給与掛率1 { get; set; }
        public decimal? 給与掛率2 { get; set; }
        public decimal? 給与掛率3 { get; set; }
        public decimal? 給与掛率4 { get; set; }

        public string 給与ファイル { get; set; } = string.Empty;

        #endregion

        #region 財務設定

        public string 財務区分1 { get; set; } = string.Empty;
        public string 財務区分2 { get; set; } = string.Empty;
        public string 財務区分3 { get; set; } = string.Empty;
        public string 財務区分4 { get; set; } = string.Empty;
        public string 財務区分5 { get; set; } = string.Empty;
        public string 財務区分6 { get; set; } = string.Empty;
        public string 財務区分7 { get; set; } = string.Empty;
        public string 財務区分8 { get; set; } = string.Empty;

        public string 財務ファイル { get; set; } = string.Empty;

        #endregion

        #region カード設定

        public int? カード優先 { get; set; }

        #endregion

        #region 運賃形態

        public string 運賃形態1 { get; set; } = string.Empty;
        public string 運賃形態2 { get; set; } = string.Empty;
        public string 運賃形態3 { get; set; } = string.Empty;
        public string 運賃形態4 { get; set; } = string.Empty;
        public string 運賃形態5 { get; set; } = string.Empty;
        public string 運賃形態6 { get; set; } = string.Empty;
        public string 運賃形態7 { get; set; } = string.Empty;
        public string 運賃形態8 { get; set; } = string.Empty;
        public string 運賃形態9 { get; set; } = string.Empty;

        #endregion

        #region 補償

        public string 補償1 { get; set; } = string.Empty;
        public string 補償2 { get; set; } = string.Empty;
        public string 補償3 { get; set; } = string.Empty;
        public string 補償4 { get; set; } = string.Empty;
        public string 補償5 { get; set; } = string.Empty;
        public string 補償6 { get; set; } = string.Empty;
        public string 補償7 { get; set; } = string.Empty;
        public string 補償8 { get; set; } = string.Empty;
        public string 補償9 { get; set; } = string.Empty;

        #endregion

        #region シリアル番号

        public string シリアルNO1 { get; set; } = string.Empty;
        public string シリアルNO2 { get; set; } = string.Empty;
        public string シリアルNO3 { get; set; } = string.Empty;
        public string シリアルNO4 { get; set; } = string.Empty;
        public string シリアルNO5 { get; set; } = string.Empty;
        public string シリアルNO6 { get; set; } = string.Empty;
        public string シリアルNO7 { get; set; } = string.Empty;
        public string シリアルNO8 { get; set; } = string.Empty;
        public string シリアルNO9 { get; set; } = string.Empty;
        public string シリアルNO10 { get; set; } = string.Empty;

        // SEC1–SEC10 = 1: that serial box is locked (legacy Dsp_Data2: TxtSerial(i).Enabled = False). Load only.
        public bool[] シリアルロック { get; set; } = new bool[10];

        #endregion
    }
}