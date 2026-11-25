/// <summary>
/// Management Master View Model
///
/// Used By:
/// ManagementMaster.cshtml
///
/// Migrated From:
/// FrmM_Kanri.vb
/// </summary>
using HAKOBIMASENKA.Repository;

namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ManagementMasterViewModel
{
    public class ManagementMasterViewModel:ManagementMasterResultDto
    {
        #region Screen Control
        public bool IsNewRecord { get; set; }
        public bool IsReadOnly { get; set; }
        #endregion
    }
}