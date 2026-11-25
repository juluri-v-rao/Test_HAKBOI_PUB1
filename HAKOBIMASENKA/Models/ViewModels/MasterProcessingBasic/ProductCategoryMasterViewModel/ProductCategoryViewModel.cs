/// <summary>
/// Product Category Master View Model
///
/// Used by:
/// ProductCategory_master.cshtml
///
/// Migrated From:
/// FrmM_Mast1.vb
/// </summary>

using HAKOBIMASENKA.Repository;

namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ProductCategoryMasterViewModel
    {
        public class ProductCategoryViewModel
        {
        public string コード { get; set; } = string.Empty;

        public string 名称 { get; set; } = string.Empty;

        public string デジタココード { get; set; } = string.Empty;

        public bool IsNewRecord { get; set; }
        }

    }