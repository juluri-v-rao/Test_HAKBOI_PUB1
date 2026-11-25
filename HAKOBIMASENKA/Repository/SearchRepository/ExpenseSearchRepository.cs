using Dapper;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public class ExpenseSearchRepository : IExpenseSearchRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public ExpenseSearchRepository(
            IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<ExpenseSearchResultDto>> SearchAsync(
            string? expenseName,
            string? expenseCategory)
        {
            const string sql = @"
                SELECT
                    経費マスタ.経費コード AS ExpenseCode,
                    経費マスタ.名称 AS ExpenseName,
                    経費区分マスタ.名称 AS ExpenseCategory,
                    経費マスタ.単価 AS UnitPrice
                FROM 経費マスタ
                LEFT JOIN 経費区分マスタ
                    ON 経費区分マスタ.コード =
                       経費マスタ.経費区分コード
                WHERE
                    (@ExpenseName IS NULL
                     OR 経費マスタ.名称 LIKE N'%' + @ExpenseName + N'%')
                    AND
                    (@ExpenseCategory IS NULL
                     OR 経費区分マスタ.名称 LIKE
                        N'%' + @ExpenseCategory + N'%')
                ORDER BY 経費マスタ.経費コード;
            ";

            using var connection = _connectionFactory.CreateConnection();
            connection.Open();

            return await connection.QueryAsync<ExpenseSearchResultDto>(
                sql,
                new
                {
                    ExpenseName = string.IsNullOrWhiteSpace(expenseName)
                        ? null
                        : expenseName.Trim(),

                    ExpenseCategory = string.IsNullOrWhiteSpace(expenseCategory)
                        ? null
                        : expenseCategory.Trim()
                });
        }
    }
}