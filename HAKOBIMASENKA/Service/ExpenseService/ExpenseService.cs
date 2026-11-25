using HAKOBIMASENKA.Helpers;
using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ExpenseMasterViewModel;
using HAKOBIMASENKA.Repository.ExpenseRepository;

namespace HAKOBIMASENKA.Service.ExpenseService
{
    public class ExpenseService : IExpenseService
    {
        private readonly IExpenseRepository _expenseRepository;
        public ExpenseService(IExpenseRepository expenseRepository)
        {
            _expenseRepository = expenseRepository;
        }

        public Task<List<ExpenseResultDto>> GetListAsync() => _expenseRepository.GetListAsync();

        public Task<ExpenseViewModel?> GetByCodeAsync(string code) =>
            _expenseRepository.GetByCodeAsync(CommonHelper.ZeroPad(code, 4));

        public Task<List<ExpenseCategoryOption>> GetCategoryOptionsAsync() => _expenseRepository.GetCategoryOptionsAsync();

        public Task<string?> LookupCategoryNameAsync(string categoryCode) =>
            _expenseRepository.GetCategoryNameAsync(CommonHelper.ZeroPad(categoryCode, 2));

        public Task<bool> CodeExistsAsync(string code) => _expenseRepository.ExistsAsync(CommonHelper.ZeroPad(code, 4));

        public Task<string?> GetNextCodeAsync() => _expenseRepository.GetNextCodeAsync();

        public async Task<ExpenseSaveResult> SaveAsync(ExpenseViewModel model, string terminalCode)
        {
            // Input Check
            model.経費コード = CommonHelper.ZeroPad(model.経費コード, 4);

            if (model.経費コード == "0000")
            {
                return new ExpenseSaveResult
                {
                    Success = false,
                    ErrorMessage = "経費コード：0000 は手入力用コードなのでマスタ登録はできません"
                };
            }

            if (string.IsNullOrWhiteSpace(model.経費コード))
            {
                return new ExpenseSaveResult { Success = false, ErrorMessage = "経費コードを入力してください" };
            }

            if (string.IsNullOrEmpty(model.名称))
            {
                return new ExpenseSaveResult { Success = false, ErrorMessage = "経費名を入力してください" };
            }

            if (!string.IsNullOrWhiteSpace(model.経費区分コード))
            {
                model.経費区分コード = CommonHelper.ZeroPad(model.経費区分コード, 2);
                // NOTE (parity with legacy): the category code is NOT re-validated for existence
                // here — the legacy screen only warns on TxtKkbn LostFocus and does not block F1-save
                // if that focus event is skipped. Carried over as-is; flag if you want it enforced.
            }

            // ---- Data_Repl() ----
            await _expenseRepository.SaveAsync(model, terminalCode);

            var nextCode = await _expenseRepository.GetNextCodeAsync();
            return new ExpenseSaveResult { Success = true, NextCode = nextCode };
        }

        public async Task<ExpenseDeleteResult> DeleteAsync(string code)
        {
            var normalized = CommonHelper.ZeroPad(code, 4);

            /*// ---- Del_Chk() — 2 tables ----
            if (await _expenseRepository.HasFixedExpenseReferenceAsync(normalized))
            {
                return new ExpenseDeleteResult
                {
                    Success = false,
                    BlockedReason = "固定経費データで登録されていますので、削除出来ません！！"
                };
            }

            if (await _expenseRepository.HasExpenseDataReferenceAsync(normalized))
            {
                return new ExpenseDeleteResult
                {
                    Success = false,
                    BlockedReason = "経費データで登録されていますので、削除出来ません！！"
                };
            }*/

            await _expenseRepository.DeleteAsync(normalized);
            return new ExpenseDeleteResult { Success = true };
        }

        public async Task<ExpenseDeleteResult> DeleteCheckAsync(string code)
        {
            var normalized = CommonHelper.ZeroPad(code, 4);

            if (await _expenseRepository.HasFixedExpenseReferenceAsync(normalized))
            {
                return new ExpenseDeleteResult
                {
                    Success = false,
                    BlockedReason =
                        "固定経費データで登録されていますので、削除出来ません！！"
                };
            }

            if (await _expenseRepository.HasExpenseDataReferenceAsync(normalized))
            {
                return new ExpenseDeleteResult
                {
                    Success = false,
                    BlockedReason =
                        "経費データで登録されていますので、削除出来ません！！"
                };
            }

            return new ExpenseDeleteResult
            {
                Success = true
            };
        }
    }
}
