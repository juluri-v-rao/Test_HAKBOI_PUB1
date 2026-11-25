using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ExpenseMasterViewModel;

namespace HAKOBIMASENKA.Repository.ExpenseRepository
{
    public interface IExpenseRepository
    {
        /// <summary>List Display.</summary>
        Task<List<ExpenseResultDto>> GetListAsync();

        /// <summary>Get a single record by code.</summary>
        Task<ExpenseViewModel?> GetByCodeAsync(string code);

        /// <summary>Data Existence check.</summary>
        Task<bool> ExistsAsync(string code);

        /// <summary>Get the Category option for dropdown.</summary>
        Task<List<ExpenseCategoryOption>> GetCategoryOptionsAsync();

        /// <summary>Dsp_Kbn() — single category name lookup by code, for the LostFocus soft-warning.</summary>
        Task<string?> GetCategoryNameAsync(string categoryCode);

        /// <summary>
        /// FrmSeek_Keihi.vb Dsp_List() — search modal grid (code/name/category/unit price),
        /// filtered by optional name (LIKE) and/or exact category code.
        /// NOTE: this screen's own F5/F6 are disabled by default in FrmM_Keihi.vb (Fkey.ButtonEnabled
        /// index 5/6 = False) — this search dialog is normally invoked from OTHER screens that pick
        /// an expense code. Wired to F5 here anyway per explicit request, for completeness.
        /// </summary>
        /*Task<List<ExpenseSearchResultItem>> SearchAsync(ExpenseSearchCriteria criteria);*/

        /// <summary>Set_Code() — MAX(経費コード) + 1, zero-padded to 4 digits; null once it would overflow (&gt;= 10000).</summary>
        Task<string?> GetNextCodeAsync();

        /// <summary>
        /// Save the input data into the database
        /// </summary>
        Task SaveAsync(ExpenseViewModel model, string terminalCode);

        /// <summary>固定経費マスタ existence check (Del_Chk, table 1 of 2).</summary>
        Task<bool> HasFixedExpenseReferenceAsync(string code);

        /// <summary>経費データ existence check (Del_Chk, table 2 of 2).</summary>
        Task<bool> HasExpenseDataReferenceAsync(string code);

        /// <summary>Data_Del() — DELETE wrapped in SET XACT_ABORT ON / BEGIN..COMMIT TRANSACTION.</summary>
        Task DeleteAsync(string code);
    }
}
