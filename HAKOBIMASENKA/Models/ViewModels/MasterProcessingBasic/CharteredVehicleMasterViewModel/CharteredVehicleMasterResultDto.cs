namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.CharteredVehicleMasterViewModel
{
    /// <summary>
    /// One code/name pair for the 精算区分 (単位マスタ) and
    /// 支払方法 (支払区分マスタ) lists (legacy Set_Cmb).
    /// </summary>
    public class CharteredVehicleMasterResultDto
    {
        public string コード { get; set; } = "";
        public string 名称 { get; set; } = "";
    }
}
