using Dapper;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public class ProductClassificationSearchRepository
        : IProductClassificationSearchRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public ProductClassificationSearchRepository(
            IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<ProductClassificationSearchResultDto>>
            SearchAsync(string? productCategoryName)
        {
            const string sql = @"
    SELECT
        RIGHT('0000' + RTRIM(コード), 4) AS Code,
        名称 AS ProductCategoryName
    FROM 品名区分マスタ WITH(NOLOCK)
    WHERE 削除 = '0'
        AND (
            @ProductCategoryName IS NULL
            OR 名称 LIKE N'%' + @ProductCategoryName + N'%'
        )
    ORDER BY コード;
";

            using var connection = _connectionFactory.CreateConnection();
            connection.Open();

            var result =
                await connection.QueryAsync<ProductClassificationSearchResultDto>(
                    sql,
                    new
                    {
                        ProductCategoryName =
                            string.IsNullOrWhiteSpace(productCategoryName)
                                ? null
                                : productCategoryName.Trim()
                    });

            return result;
        }
    }
}