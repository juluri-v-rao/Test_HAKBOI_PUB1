
using Dapper;
using HAKOBIMASENKA.Models.ViewModels;
using HAKOBIMASENKA.Repository;
using Microsoft.Extensions.Configuration;

namespace HAKOBIMASENKA.Repository
{
    public class ProductMasterRepository : IProductMasterRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;
        private readonly IConfiguration _configuration;

        public ProductMasterRepository(
     IDbConnectionFactory connectionFactory,
     IConfiguration configuration)
        {
            _connectionFactory = connectionFactory;
            _configuration = configuration;
        }

        // Get MAX Product Code + 1.
        // Get MAX Product Code + 1.
        public async Task<string> GetNextCodeAsync()
        {
            const string sql = @"
        SELECT TOP 1 品名コード
      FROM 品名マスタ WITH (NOLOCK)
        WHERE 品名コード >= '0000000000'
        ORDER BY 品名コード DESC;
    ";

            using var connection = _connectionFactory.CreateConnection();

            var topCode = await connection.ExecuteScalarAsync<string?>(sql);

            long nextCode = long.TryParse(topCode, out var n)
                ? n + 1
                : 1;

            // Return blank when the next code reaches 10 digits plus one.
            if (nextCode >= 10000000000)
            {
                return string.Empty;
            }

            return nextCode.ToString("D10");
        }

        // Get one Product Master record.
        public async Task<ProductMasterDto?> GetByCodeAsync(
            string productCode)
        {
            const string sql = @"
                SELECT
                    品名コード AS ProductCode,
                    品名 AS ProductName,
                    ふりがな AS Furigana,
                    略称 AS Abbreviation,
                    品名区分コード AS ProductCategoryCode,
                    輸送区分コード AS TransportCategoryCode,
                    単価 AS UnitPrice,
                    容量 AS Capacity,
手当掛率 AS AllowanceRate,
                    デジタココード AS DigitacoCode
                FROM 品名マスタ WITH (NOLOCK)
                WHERE 品名コード = @ProductCode;
            ";

            using var connection = _connectionFactory.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<ProductMasterDto>(
                sql,
                new { ProductCode = NormalizeCode(productCode) });
        }

        // Get all Product Master records.
        public async Task<IEnumerable<ProductMasterDto>> GetAllAsync()
        {
            const string sql = @"
                SELECT
                    品名コード AS ProductCode,
                    品名 AS ProductName,
                    ふりがな AS Furigana,
                    略称 AS Abbreviation,
                    品名区分コード AS ProductCategoryCode,
                    輸送区分コード AS TransportCategoryCode,
                    単価 AS UnitPrice,
                    容量 AS Capacity,
手当掛率 AS AllowanceRate,
                    デジタココード AS DigitacoCode
           FROM 品名マスタ WITH (NOLOCK)
                ORDER BY 品名コード;
            ";

            using var connection = _connectionFactory.CreateConnection();

            return await connection.QueryAsync<ProductMasterDto>(sql);
        }


        // F7: Get previous Product Code.
        public async Task<ProductMasterDto?> GetPreviousAsync(
            string productCode)
        {
            var code = string.IsNullOrWhiteSpace(productCode)
                ? ""
                : NormalizeCode(productCode);

            const string sql = @"
        SELECT TOP 1
            品名コード AS ProductCode,
            品名 AS ProductName,
            ふりがな AS Furigana,
            略称 AS Abbreviation,
            品名区分コード AS ProductCategoryCode,
            輸送区分コード AS TransportCategoryCode,
            単価 AS UnitPrice,
           容量 AS Capacity,
手当掛率 AS AllowanceRate,
デジタココード AS DigitacoCode
    FROM 品名マスタ WITH (NOLOCK)
        WHERE 品名コード < @ProductCode
        ORDER BY 品名コード DESC;
    ";

            using var connection = _connectionFactory.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<ProductMasterDto>(
                sql,
                new { ProductCode = code });
        }



        // F8: Get next Product Code.
        public async Task<ProductMasterDto?> GetNextAsync(
            string productCode)
        {
            var code = string.IsNullOrWhiteSpace(productCode)
                ? ""
                : NormalizeCode(productCode);

            const string sql = @"
        SELECT TOP 1
            品名コード AS ProductCode,
            品名 AS ProductName,
            ふりがな AS Furigana,
            略称 AS Abbreviation,
            品名区分コード AS ProductCategoryCode,
            輸送区分コード AS TransportCategoryCode,
            単価 AS UnitPrice,
           容量 AS Capacity,
手当掛率 AS AllowanceRate,
デジタココード AS DigitacoCode
     FROM 品名マスタ WITH (NOLOCK)
        WHERE 品名コード > @ProductCode
        ORDER BY 品名コード ASC;
    ";

            using var connection = _connectionFactory.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<ProductMasterDto>(
                sql,
                new { ProductCode = code });
        }


        // F1: Insert new record or update existing record.
        public async Task<bool> SaveAsync(ProductMasterDto product)
        {
            const string sql = @"
                
            IF EXISTS
            (
                SELECT 1
                FROM 品名マスタ WITH (NOLOCK)
                WHERE 品名コード = @ProductCode
            )
            BEGIN
                UPDATE 品名マスタ
                SET
                    品名 = @ProductName,
                    ふりがな = @Furigana,
                    略称 = @Abbreviation,
                    品名区分コード = @ProductCategoryCode,
                    輸送区分コード = @TransportCategoryCode,
                    単価 = ISNULL(@UnitPrice, 0.00),
                    容量 = ISNULL(@Capacity, 0.00),
                    デジタココード = @DigitacoCode,
                    手当掛率 = ISNULL(@AllowanceRate, 100.00),
                    
                    登録日 = GETDATE(),
                    送信済 = 1,
                   入力端末 = @ClientNo,
                    削除 = 0
                WHERE 品名コード = @ProductCode;
            END
            ELSE
            BEGIN
                INSERT INTO 品名マスタ
                (
                    品名コード,
                    品名,
                    ふりがな,
                    略称,
                    品名区分コード,
                    輸送区分コード,
                    単価,
                    容量,
                    デジタココード,
                    手当掛率,
                    登録日,
                    送信済,
                    入力端末,
                    削除
                )
                VALUES
                (
                    @ProductCode,
                    @ProductName,
                    @Furigana,
                    @Abbreviation,
                    @ProductCategoryCode,
                    @TransportCategoryCode,
                    ISNULL(@UnitPrice, 0.00),
                    ISNULL(@Capacity, 0.00),
                    @DigitacoCode,
                   ISNULL(@AllowanceRate, 100.00),
                    GETDATE(),
                    1,
                   @ClientNo,
                    0
                );
            END

            ";

            using var connection = _connectionFactory.CreateConnection();

            var parameters = new DynamicParameters(product);

            parameters.Add(
                "@ClientNo",
                _configuration["Terminal:ClientNo"] ?? "01"
            );

            var rowsAffected = await connection.ExecuteAsync(sql, parameters);

            return rowsAffected > 0;
        }

        // F4: Permanently delete Product Master record.
        public async Task<bool> DeleteAsync(string productCode)
        {
            const string sql = @"
                DELETE FROM 品名マスタ
                WHERE 品名コード = @ProductCode;
            ";

            using var connection = _connectionFactory.CreateConnection();

            var rowsAffected = await connection.ExecuteAsync(
                sql,
                new { ProductCode = NormalizeCode(productCode) });

            return rowsAffected > 0;
        }

        // Normalize Product Code to 10 digits.
        private static string NormalizeCode(string code)
        {
            if (string.IsNullOrWhiteSpace(code) ||
                !code.All(char.IsDigit) ||
                code.Length > 10)
            {
                throw new ArgumentException("品名コードが正しくありません。");
            }

            return code.PadLeft(10, '0');
        }

        // =========================================
        // 品名区分マスタ Lookup
        // =========================================

        public async Task<ProductMasterDto?> GetProductCategoryAsync(string code)
        {
            const string sql = @"
        SELECT
            コード AS ProductCategoryCode,
            名称 AS ProductCategoryName
    FROM 品名区分マスタ WITH (NOLOCK)
        WHERE コード = @Code;
    ";

            using var connection = _connectionFactory.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<ProductMasterDto>(
                sql,
                new { Code = code }
            );
        }


        // =========================================
        // 輸送実績区分マスタ Lookup
        // =========================================

        public async Task<ProductMasterDto?> GetTransportResultCategoryAsync(string code)
        {
            const string sql = @"
        SELECT
            コード AS TransportCategoryCode,
            名称 AS TransportCategoryName
      FROM 輸送実績区分マスタ WITH (NOLOCK)
        WHERE コード = @Code;
    ";

            using var connection = _connectionFactory.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<ProductMasterDto>(
                sql,
                new { Code = code }
            );
        }


        public async Task<string?> CheckDeleteAsync(string productCode)
        {
            const string sql = @"
        SELECT
            CASE
                WHEN EXISTS (
                    SELECT 1
                FROM 荷主テンプレートマスタ WITH (NOLOCK)
                    WHERE 品名コード = @ProductCode
                )
                THEN N'荷主テンプレートマスタが登録されていますので、削除出来ません！！'

                WHEN EXISTS (
                    SELECT 1
                   FROM 作業明細 WITH (NOLOCK)
                    WHERE 品名コード = @ProductCode
                )
                THEN N'受注データが登録されていますので、削除出来ません！！'

                WHEN EXISTS (
                    SELECT 1
                    FROM 日報BODY WITH (NOLOCK)
                    WHERE 品名コード = @ProductCode
                )
                THEN N'日報データが登録されていますので、削除出来ません！！'

                ELSE NULL
            END;
    ";

            using var connection = _connectionFactory.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<string?>(
                sql,
                new { ProductCode = NormalizeCode(productCode) }
            );
        }

    }
}
