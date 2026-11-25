/// <summary>
/// Product Category Master Repository
///
/// Database Access Layer.
///
/// Related Table:
/// 品名区分マスタ
///
/// Migrated From:
/// FrmM_Mast1.vb
/// </summary>

using Dapper;
using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ProductCategoryMasterViewModel;
using System.Text;

namespace HAKOBIMASENKA.Repository.ProductCategoryMasterRepository
{
        public class ProductCategoryRepository(IDbConnectionFactory connectionFactory) : IProductCategoryRepository
        {
            private readonly IDbConnectionFactory _connectionFactory = connectionFactory;

            public async Task<List<ProductCategoryResultDto>> GetListAsync()
            {
                var sql = new StringBuilder();
                sql.AppendLine("SELECT");
                sql.AppendLine(" コード");
                sql.AppendLine(",名称");
                sql.AppendLine("FROM 品名区分マスタ WITH(NOLOCK)");
                sql.AppendLine("WHERE 削除 = '0'");   // legacy Dsp_List
                sql.AppendLine("ORDER BY コード;");

                using var conn =
                    _connectionFactory.CreateConnection();

                var rows =
                    await conn.QueryAsync<ProductCategoryResultDto>(sql.ToString());

                return rows.ToList();
            }

            public async Task<ProductCategoryViewModel?> GetByCodeAsync(string code)
            {
                var sql = new StringBuilder();

                sql.AppendLine("SELECT");
                sql.AppendLine(" コード");
                sql.AppendLine(",名称");
                sql.AppendLine(",デジタココード");
                sql.AppendLine("FROM 品名区分マスタ WITH(NOLOCK)");
                sql.AppendLine("WHERE コード = @Code;");

                using var conn =
                    _connectionFactory.CreateConnection();

                var row = await conn.QuerySingleOrDefaultAsync<ProductCategoryViewModel>(sql.ToString(), new { Code = code });

                if (row != null)
                {
                    row.コード = code;
                    row.IsNewRecord = false;
                }

                return row;
            }

            public async Task<bool> ExistsAsync(string code)
            {
                const string sql =
                    @"SELECT コード
                      FROM 品名区分マスタ WITH(NOLOCK)
                      WHERE コード = @Code;";

                using var conn =
                    _connectionFactory.CreateConnection();

                var hit = await conn.QueryFirstOrDefaultAsync<string>( sql, new { Code = code });

                return hit != null;
            }

            public async Task<string?> GetNextCodeAsync()
            {
                var sql = new StringBuilder();

                sql.AppendLine("SELECT TOP 1 コード");
                sql.AppendLine("FROM 品名区分マスタ WITH(NOLOCK)");
                sql.AppendLine("WHERE コード >= '0000'");
                sql.AppendLine("ORDER BY コード DESC;");

                using var conn = _connectionFactory.CreateConnection();

                var top = await conn.QueryFirstOrDefaultAsync<string>(
                        sql.ToString());

                long current = 0;

                if (top != null &&
                    long.TryParse(top, out var parsed))
                    {
                    current = parsed;
                    }

                var next = current + 1;

                if (next >= 10000)
                    {
                    return null;
                    }

                return next.ToString()
                           .PadLeft(4, '0');
            }

            public async Task SaveAsync(ProductCategoryViewModel model, string terminalCode)
            {
                using var conn = _connectionFactory.CreateConnection();

                const string sql = @"
                IF EXISTS(SELECT 1 FROM 品名区分マスタ WHERE コード = @Code)
                BEGIN
                            UPDATE 品名区分マスタ SET
                                名称           = @Name
                               ,デジタココード = @DigiCode
                               ,登録日         = GETDATE()
                               ,送信済         = '1'
                               ,入力端末       = @Terminal
                               ,削除           = '0'
                            WHERE コード = @Code;
                END
                ELSE
                BEGIN       
                            INSERT INTO 品名区分マスタ
                            (
                                コード
                               ,名称
                               ,デジタココード
                               ,登録日
                               ,送信済
                               ,入力端末
                               ,削除
                            )
                            VALUES
                            (
                                @Code
                               ,@Name
                               ,@DigiCode
                               ,GETDATE()
                               ,'1'
                               ,@Terminal
                               ,'0'
                            );

                END";       

                        await conn.ExecuteAsync(sql,new
                        {
                            Code = model.コード,
                            Name = model.名称,
                            DigiCode = model.デジタココード,
                            Terminal = terminalCode
                        });
            }

            public async Task DeleteAsync(string code)
            {
                const string sql = @"
                    SET XACT_ABORT ON;
                    BEGIN TRANSACTION;
                    DELETE
                    FROM 品名区分マスタ
                    WHERE コード = @Code;
                    COMMIT TRANSACTION;";

                using var conn = _connectionFactory.CreateConnection();

                await conn.ExecuteAsync(sql,
                    new { Code = code });
            }

            // 品名マスタ Check
            public async Task<bool> HasProductReferenceAsync(string code)
            {
                    const string sql =
                        @"SELECT TOP 1 品名区分コード
                          FROM 品名マスタ WITH(NOLOCK)
                          WHERE 品名区分コード = @Code;";

                    using var conn = _connectionFactory.CreateConnection();

                    return await conn.QueryFirstOrDefaultAsync<string>(sql,
                        new { Code = code }) != null;
            }

            // 発着地単価マスタ Check
            public async Task<bool>HasOriginDestChargeReferenceAsync(string code)
            {
                const string sql = @"
                SELECT TOP 1 品名区分
                FROM 発着地単価マスタ WITH(NOLOCK)
                WHERE 品名区分 = @Code";

                using var conn = _connectionFactory.CreateConnection();

                return await conn.QueryFirstOrDefaultAsync<string>(sql,
                    new { Code = code }
                ) != null;
            }

            // 補償発着地単価マスタ Check
            public async Task<bool>HasCompOriginDestReferenceAsync(string code)
            {
                const string sql = @"
                    SELECT TOP 1 品名区分
                    FROM 補償発着地単価マスタ WITH(NOLOCK)
                    WHERE 品名区分 = @Code";

                using var conn = _connectionFactory.CreateConnection();

                return await conn.QueryFirstOrDefaultAsync<string>(sql,
                    new { Code = code }
                ) != null;
            }

            // 地区単価マスタ Check
            public async Task<bool>HasAreaChargeReferenceAsync(string code)
            {
                const string sql = @"
                    SELECT TOP 1 品名区分
                    FROM 地区単価マスタ WITH(NOLOCK)
                    WHERE 品名区分 = @Code";

                using var conn = _connectionFactory.CreateConnection();

                return await conn.QueryFirstOrDefaultAsync<string>(
                    sql,
                    new { Code = code }
                ) != null;
            }

            // 補償地区単価マスタ Check
            public async Task<bool>HasCompAreaChargeReferenceAsync(string code)
            {
                const string sql = @"
                    SELECT TOP 1 品名区分
                    FROM 補償地区単価マスタ WITH(NOLOCK)
                    WHERE 品名区分 = @Code";

                using var conn = _connectionFactory.CreateConnection();

                return await conn.QueryFirstOrDefaultAsync<string>(sql,
                    new { Code = code }
                ) != null;
            }

        }

}