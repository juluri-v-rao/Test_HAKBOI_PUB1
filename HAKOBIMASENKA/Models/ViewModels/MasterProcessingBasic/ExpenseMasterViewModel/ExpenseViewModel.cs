using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ExpenseMasterViewModel
{
    public class ExpenseViewModel
    {
        [Required(ErrorMessage = "Expense code is required.")]
        [StringLength(4, MinimumLength = 1)]
        public string 経費コード { get; set; } = string.Empty;

        public bool IsNewRecord { get; set; }

        [Required(ErrorMessage = "Expense name is required.")]
        [StringLength(28)]
        public string 名称 { get; set; } = string.Empty;

        [StringLength(2)]
        public string? 経費区分コード { get; set; }
        public string? 経費区分名 { get; set; }

        [Range(typeof(decimal), "0", "9999999.99")]
        public decimal? 単価 { get; set; }

        [StringLength(15)]
        public string? デジタココード { get; set; }
    }
}
