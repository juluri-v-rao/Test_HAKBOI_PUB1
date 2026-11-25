using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Repository.SearchRepository;

namespace HAKOBIMASENKA.Service.SearchService
{
    public class ExpenseSearchService : IExpenseSearchService
    {
        private readonly IExpenseSearchRepository _repository;

        public ExpenseSearchService(IExpenseSearchRepository repository)
        {
            _repository = repository;
        }

        public Task<IEnumerable<ExpenseSearchResultDto>> SearchAsync(
            string? expenseName,
            string? expenseCategory)
        {
            return _repository.SearchAsync(expenseName, expenseCategory);
        }
    }
}