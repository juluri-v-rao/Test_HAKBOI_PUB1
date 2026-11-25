using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Service.SearchService
{
    public interface IExpenseSearchService
    {
        Task<IEnumerable<ExpenseSearchResultDto>> SearchAsync(
            string? expenseName,
            string? expenseCategory);
    }
}