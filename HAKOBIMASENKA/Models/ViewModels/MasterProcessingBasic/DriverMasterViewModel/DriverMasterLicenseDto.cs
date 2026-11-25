namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.DriverMasterViewModel
{
    /// <summary>
    /// 管理マスタ '01' settings the screen needs (legacy FrmMain globals).
    /// Each tab is removed when its licence is off (legacy FrmM_Tanto_Load).
    /// </summary>
    public class DriverMasterLicenseDto
    {
        /// <summary>SEC3 = 1: 固定経費設定 tab (legacy SYARYO_Chk).</summary>
        public bool FixedCost { get; set; }

        /// <summary>SEC9 = 1: 給与ｵﾌﾟｼｮﾝ設定 tab (legacy KYUYO_Chk).</summary>
        public bool Payroll { get; set; }

        /// <summary>SEC4 = 1: ﾃﾞｼﾞﾀｺｵﾌﾟｼｮﾝ設定 tab (legacy DIGI_Chk).</summary>
        public bool Digitaco { get; set; }

        /// <summary>SEC5 = 1: ETCｵﾌﾟｼｮﾝ設定 tab (legacy ETC_Chk).</summary>
        public bool Etc { get; set; }
    }
}
