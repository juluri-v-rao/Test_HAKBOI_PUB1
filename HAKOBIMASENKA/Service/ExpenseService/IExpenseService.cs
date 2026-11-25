using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ExpenseMasterViewModel;

namespace HAKOBIMASENKA.Service.ExpenseService
{
    public class ExpenseSaveResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public string? NextCode { get; set; }
    }

    public class ExpenseDeleteResult
    {
        public bool Success { get; set; }
        public string? BlockedReason { get; set; }
    }
    public interface IExpenseService
    {
        Task<List<ExpenseResultDto>> GetListAsync();
        Task<ExpenseViewModel?> GetByCodeAsync(string code);
        Task<List<ExpenseCategoryOption>> GetCategoryOptionsAsync();
        Task<string?> LookupCategoryNameAsync(string categoryCode);
        Task<bool> CodeExistsAsync(string code);
        Task<string?> GetNextCodeAsync();

        /// <summary>FrmSeek_Keihi search modal — name/category filtered grid.</summary>
       /* Task<List<ExpenseSearchResultItem>> SearchAsync(ExpenseSearchCriteria criteria);*/

        /// <summary>Validate the values and save(Insert or update)</summary>
        Task<ExpenseSaveResult> SaveAsync(ExpenseViewModel model, string terminalCode);

        /// <summary>Delete the data.</summary>
        Task<ExpenseDeleteResult> DeleteAsync(string code);

        Task<ExpenseDeleteResult> DeleteCheckAsync(string code);
    }
}
