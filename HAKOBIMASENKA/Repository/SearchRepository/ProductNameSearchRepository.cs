using Dapper;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public class ProductNameSearchRepository : IProductNameSearchRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public ProductNameSearchRepository(
            IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        // Search product name master records.
        public async Task<IEnumerable<ProductNameSearchResultDto>> SearchAsync(
            string? productNameFurigana,
            string? productName,
            string? productCategoryCode,
            string? transportationRecordCode)
        {
            const string sql = @"
    SELECT
        RIGHT('0000000000' + RTRIM(品名マスタ.品名コード), 10) AS Code,
        品名マスタ.品名 AS ProductName,
        品名区分マスタ.名称 AS ProductCategory,
        輸送実績区分マスタ.名称 AS TransportationRecord
    FROM 品名マスタ WITH(NOLOCK)
    LEFT JOIN 品名区分マスタ WITH(NOLOCK)
        ON 品名区分マスタ.コード =
           品名マスタ.品名区分コード
    LEFT JOIN 輸送実績区分マスタ
        ON 輸送実績区分マスタ.コード =
           品名マスタ.輸送区分コード
    WHERE
        (@ProductNameFurigana IS NULL
         OR 品名マスタ.ふりがな LIKE
            N'%' + @ProductNameFurigana + N'%')

        AND (@ProductName IS NULL
             OR 品名マスタ.品名 LIKE
                N'%' + @ProductName + N'%')

        AND (@ProductCategoryCode IS NULL
             OR 品名マスタ.品名区分コード =
                @ProductCategoryCode)

        AND (@TransportationRecordCode IS NULL
             OR 品名マスタ.輸送区分コード =
                @TransportationRecordCode)

    ORDER BY 品名マスタ.品名コード;
";

            using var connection = _connectionFactory.CreateConnection();
            connection.Open();

            var result =
                await connection.QueryAsync<ProductNameSearchResultDto>(
                    sql,
                    new
                    {
                        ProductNameFurigana =
                            string.IsNullOrWhiteSpace(productNameFurigana)
                                ? null : productNameFurigana.Trim(),

                        ProductName =
                            string.IsNullOrWhiteSpace(productName)
                                ? null : productName.Trim(),

                        ProductCategoryCode =
                            string.IsNullOrWhiteSpace(productCategoryCode)
                                ? null : productCategoryCode.Trim(),

                        TransportationRecordCode =
                            string.IsNullOrWhiteSpace(transportationRecordCode)
                                ? null : transportationRecordCode.Trim()
                    });

            return result;
        }

        // Get product category name using its code.
        public async Task<string?> GetProductCategoryByCodeAsync(string code)
        {
            const string sql = @"
                SELECT 名称
                FROM 品名区分マスタ
                WHERE コード = @Code;
            ";

            using var connection = _connectionFactory.CreateConnection();
            connection.Open();

            return await connection.QueryFirstOrDefaultAsync<string>(
                sql,
                new { Code = code });
        }

        // Get transportation record name using its code.
        public async Task<string?> GetTransportationRecordByCodeAsync(
            string code)
        {
            const string sql = @"
                SELECT 名称
                FROM 輸送実績区分マスタ
                WHERE コード = @Code;
            ";

            using var connection = _connectionFactory.CreateConnection();
            connection.Open();

            return await connection.QueryFirstOrDefaultAsync<string>(
                sql,
                new { Code = code });
        }
    }
}