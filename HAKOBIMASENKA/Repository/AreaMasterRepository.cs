using System.Text;
using Dapper;
using HAKOBIMASENKA.Models.ViewModels;

namespace HAKOBIMASENKA.Repository
{
    public class AreaMasterRepository : IAreaMasterRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public AreaMasterRepository(
            IDbConnectionFactory connectionfactory)
        {
            _connectionFactory = connectionfactory;
        }

        public async Task<List<AreaMasterResultDto>> GetListAsync()
        {
            var sql = new StringBuilder();

            sql.AppendLine("SELECT ");
            sql.AppendLine("コード AS AreaCode");
            sql.AppendLine(",名称 AS AreaName");
            sql.AppendLine(",デジタココード AS DigitalCode");
            sql.AppendLine(",登録日 AS RegistrationDate");
            sql.AppendLine(",送信済 AS Sent");
            sql.AppendLine(",入力端末 AS InputTerminal");
            sql.AppendLine(",削除 AS Deleted");
            sql.AppendLine("FROM 地区マスタ WITH(NOLOCK)");
            sql.AppendLine("WHERE 削除 = 0");
            sql.AppendLine("ORDER BY コード;");

            using var conn =
                _connectionFactory.CreateConnection();

            var rows =
                await conn.QueryAsync<AreaMasterResultDto>(
                    sql.ToString());

            return rows.ToList();
        }

        public async Task<int> DeleteAsync(string areaCode)
        {
            var sql = new StringBuilder();

            sql.AppendLine("UPDATE 地区マスタ");
            sql.AppendLine("SET 削除 = 1");
            sql.AppendLine("WHERE コード = @AreaCode");
            sql.AppendLine("AND 削除 = 0;");

            using var conn =
                _connectionFactory.CreateConnection();

            var result = await conn.ExecuteAsync(
                sql.ToString(),
                new
                {
                    AreaCode = areaCode
                });

            return result;
        }

        public async Task<string> GetNextAreaCodeAsync()
        {
            var sql = new StringBuilder();

            sql.AppendLine("SELECT ");
            sql.AppendLine("ISNULL(MAX(TRY_CONVERT(INT, コード)), 0) + 1");
            sql.AppendLine("FROM 地区マスタ WITH(NOLOCK)");
            //sql.AppendLine("WHERE 削除 = 0;");

            using var conn = _connectionFactory.CreateConnection();

            var nextCode =
                await conn.ExecuteScalarAsync<int>(
                    sql.ToString());

            return nextCode.ToString("D4");
        }
        public async Task<int> SaveAsync(
    string areaCode,
    string areaName,
    string? digitalCode)
        {
            var sql = new StringBuilder();

            sql.AppendLine("IF EXISTS (");
            sql.AppendLine("    SELECT 1");
            sql.AppendLine("    FROM 地区マスタ WITH(NOLOCK)");
            sql.AppendLine("    WHERE コード = @AreaCode");
            sql.AppendLine(")");
            sql.AppendLine("BEGIN");

            // ---------------------------------------------
            // UPDATE
            // ---------------------------------------------

            sql.AppendLine("    UPDATE 地区マスタ");
            sql.AppendLine("    SET 名称 = @AreaName");
            sql.AppendLine("       ,デジタココード = @DigitalCode");
            sql.AppendLine("       ,登録日 = GETDATE()");
            sql.AppendLine("       ,送信済 = 1");
            sql.AppendLine("       ,入力端末 = @InputTerminal");
            sql.AppendLine("       ,削除 = 0");
            sql.AppendLine("    WHERE コード = @AreaCode;");

            sql.AppendLine("END");
            sql.AppendLine("ELSE");
            sql.AppendLine("BEGIN");

            // ---------------------------------------------
            // INSERT
            // ---------------------------------------------

            sql.AppendLine("    INSERT INTO 地区マスタ");
            sql.AppendLine("    (");
            sql.AppendLine("         コード");
            sql.AppendLine("        ,名称");
            sql.AppendLine("        ,デジタココード");
            sql.AppendLine("        ,登録日");
            sql.AppendLine("        ,送信済");
            sql.AppendLine("        ,入力端末");
            sql.AppendLine("        ,削除");
            sql.AppendLine("    )");
            sql.AppendLine("    VALUES");
            sql.AppendLine("    (");
            sql.AppendLine("         @AreaCode");
            sql.AppendLine("        ,@AreaName");
            sql.AppendLine("        ,@DigitalCode");
            sql.AppendLine("        ,GETDATE()");
            sql.AppendLine("        ,1");
            sql.AppendLine("        ,@InputTerminal");
            sql.AppendLine("        ,0");
            sql.AppendLine("    );");

            sql.AppendLine("END;");

            using var conn =
                _connectionFactory.CreateConnection();

            var result =
                await conn.ExecuteAsync(
                    sql.ToString(),
                    new
                    {
                        AreaCode = areaCode,
                        AreaName = areaName,
                        DigitalCode = digitalCode,
                        InputTerminal = "01"
                    });

            return result;
        }
    }
}