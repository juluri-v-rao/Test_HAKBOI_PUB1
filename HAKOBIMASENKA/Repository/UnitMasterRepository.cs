using System.Text;
using Dapper;
using HAKOBIMASENKA.Models.ViewModels;

namespace HAKOBIMASENKA.Repository
{
    public class UnitMasterRepository : IUnitMasterRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;
        private readonly string _inputTerminal;

        public UnitMasterRepository(
      IDbConnectionFactory connectionFactory,
      IConfiguration configuration)
        {
            _connectionFactory = connectionFactory;

            // 入力端末: this terminal's number (legacy E_CODE)
            _inputTerminal = configuration["Terminal:ClientNo"] ?? "01";
        }
        public async Task<List<UnitMasterResultDto>> GetListAsync()
        {
            var sql = new StringBuilder();

            sql.AppendLine("SELECT ");
            sql.AppendLine("コード AS UnitCode");
            sql.AppendLine(",名称 AS UnitName");
            sql.AppendLine(",計算区分 AS CalculationType");
            sql.AppendLine(",デジタココード AS DigitalCode");
            sql.AppendLine(",登録日 AS RegistrationDate");
            sql.AppendLine(",送信済 AS Sent");
            sql.AppendLine(",入力端末 AS InputTerminal");
            sql.AppendLine(",削除 AS Deleted");
            sql.AppendLine("FROM 単位マスタ WITH(NOLOCK)"); 
            sql.AppendLine("ORDER BY コード;");

            using var conn =
                _connectionFactory.CreateConnection();

            var rows =
                await conn.QueryAsync<UnitMasterResultDto>(
                    sql.ToString());

            return rows.ToList();
        }
        public async Task<string?> GetNextCodeAsync()
        {
            var sql = new StringBuilder();

            sql.AppendLine("SELECT TOP 1");
            sql.AppendLine("コード");
            sql.AppendLine("FROM 単位マスタ WITH(NOLOCK)");
            sql.AppendLine("WHERE コード >= '0'");
            sql.AppendLine("ORDER BY コード DESC;");

            using var conn =
                _connectionFactory.CreateConnection();

            var maxCode =
                await conn.ExecuteScalarAsync<string>(
                    sql.ToString());

            var code = 0;

            if (!string.IsNullOrWhiteSpace(maxCode) &&
                int.TryParse(maxCode, out var numericCode))
            {
                code = numericCode;
            }

            code++;

            if (code >= 10)
            {
                return null;
            }

            return code.ToString();
        }
        public async Task<string?> CheckDeleteAsync(string unitCode)
        {
            var sql = new StringBuilder();

            sql.AppendLine("IF EXISTS (");
            sql.AppendLine("    SELECT TOP 1 請求区分");
            sql.AppendLine("    FROM 荷主マスタ WITH(NOLOCK)");
            sql.AppendLine("    WHERE 請求区分 = @UnitCode");
            sql.AppendLine(")");
            sql.AppendLine("BEGIN");
            sql.AppendLine("    SELECT N'荷主マスタが登録されていますので、削除出来ません！！';");
            sql.AppendLine("    RETURN;");
            sql.AppendLine("END;");

            sql.AppendLine("IF EXISTS (");
            sql.AppendLine("    SELECT TOP 1 精算区分");
            sql.AppendLine("    FROM 傭車マスタ WITH(NOLOCK)");
            sql.AppendLine("    WHERE 精算区分 = @UnitCode");
            sql.AppendLine(")");
            sql.AppendLine("BEGIN");
            sql.AppendLine("    SELECT N'傭車マスタが登録されていますので、削除出来ません！！';");
            sql.AppendLine("    RETURN;");
            sql.AppendLine("END;");

            sql.AppendLine("IF EXISTS (");
            sql.AppendLine("    SELECT TOP 1 精算区分");
            sql.AppendLine("    FROM 仕入先マスタ WITH(NOLOCK)");
            sql.AppendLine("    WHERE 精算区分 = @UnitCode");
            sql.AppendLine(")");
            sql.AppendLine("BEGIN");
            sql.AppendLine("    SELECT N'仕入先マスタが登録されていますので、削除出来ません！！';");
            sql.AppendLine("    RETURN;");
            sql.AppendLine("END;");

            sql.AppendLine("IF EXISTS (");
            sql.AppendLine("    SELECT TOP 1 単位コード");
            sql.AppendLine("    FROM 地区単価マスタ WITH(NOLOCK)");
            sql.AppendLine("    WHERE 単位コード = @UnitCode");
            sql.AppendLine(")");
            sql.AppendLine("BEGIN");
            sql.AppendLine("    SELECT N'エリア運賃マスタが登録されていますので、削除出来ません！！';");
            sql.AppendLine("    RETURN;");
            sql.AppendLine("END;");

            sql.AppendLine("IF EXISTS (");
            sql.AppendLine("    SELECT TOP 1 単位コード");
            sql.AppendLine("    FROM 補償地区単価マスタ WITH(NOLOCK)");
            sql.AppendLine("    WHERE 単位コード = @UnitCode");
            sql.AppendLine(")");
            sql.AppendLine("BEGIN");
            sql.AppendLine("    SELECT N'エリア運賃マスタが登録されていますので、削除出来ません！！';");
            sql.AppendLine("    RETURN;");
            sql.AppendLine("END;");

            sql.AppendLine("IF EXISTS (");
            sql.AppendLine("    SELECT TOP 1 単位コード");
            sql.AppendLine("    FROM 発着地単価マスタ WITH(NOLOCK)");
            sql.AppendLine("    WHERE 単位コード = @UnitCode");
            sql.AppendLine(")");
            sql.AppendLine("BEGIN");
            sql.AppendLine("    SELECT N'発着地運賃マスタが登録されていますので、削除出来ません！！';");
            sql.AppendLine("    RETURN;");
            sql.AppendLine("END;");

            sql.AppendLine("IF EXISTS (");
            sql.AppendLine("    SELECT TOP 1 単位コード");
            sql.AppendLine("    FROM 補償発着地単価マスタ WITH(NOLOCK)");
            sql.AppendLine("    WHERE 単位コード = @UnitCode");
            sql.AppendLine(")");
            sql.AppendLine("BEGIN");
            sql.AppendLine("    SELECT N'発着地運賃マスタが登録されていますので、削除出来ません！！';");
            sql.AppendLine("    RETURN;");
            sql.AppendLine("END;");

            sql.AppendLine("IF EXISTS (");
            sql.AppendLine("    SELECT TOP 1 単位");
            sql.AppendLine("    FROM 荷主テンプレートマスタ WITH(NOLOCK)");
            sql.AppendLine("    WHERE 単位 = @UnitCode");
            sql.AppendLine(")");
            sql.AppendLine("BEGIN");
            sql.AppendLine("    SELECT N'荷主テンプレートマスタが登録されていますので、削除出来ません！！';");
            sql.AppendLine("    RETURN;");
            sql.AppendLine("END;");

            sql.AppendLine("IF EXISTS (");
            sql.AppendLine("    SELECT TOP 1 単位");
            sql.AppendLine("    FROM 日報BODY WITH(NOLOCK)");
            sql.AppendLine("    WHERE 単位 = @UnitCode");
            sql.AppendLine("       OR 下払単位 = @UnitCode");
            sql.AppendLine(")");
            sql.AppendLine("BEGIN");
            sql.AppendLine("    SELECT N'日報データが登録されていますので、削除出来ません！！';");
            sql.AppendLine("    RETURN;");
            sql.AppendLine("END;");

            sql.AppendLine("SELECT CAST(NULL AS NVARCHAR(200));");

            using var conn = _connectionFactory.CreateConnection();

            return await conn.ExecuteScalarAsync<string?>(
                sql.ToString(),
                new
                {
                    UnitCode = unitCode
                });
        }
        public async Task<int> DeleteAsync(string unitCode)
        {
            var sql = new StringBuilder();

            sql.AppendLine("SET XACT_ABORT ON;");
            sql.AppendLine("BEGIN TRANSACTION;");

            sql.AppendLine("DELETE FROM 単位マスタ");
            sql.AppendLine("WHERE コード = @UnitCode;");

            sql.AppendLine("COMMIT TRANSACTION;");

            using var conn =
                _connectionFactory.CreateConnection();

            return await conn.ExecuteAsync(
                sql.ToString(),
                new
                {
                    UnitCode = unitCode
                });
        }
        public async Task<int> SaveAsync(string unitCode,string unitName,string calculationType)
        {
            var sql = new StringBuilder();

            sql.AppendLine("IF NOT EXISTS (");
            sql.AppendLine("    SELECT 1");
            sql.AppendLine("    FROM 単位マスタ WITH(NOLOCK)");
            sql.AppendLine("    WHERE コード = @UnitCode");
            sql.AppendLine(")");
            sql.AppendLine("BEGIN");

            sql.AppendLine("    INSERT INTO 単位マスタ");
            sql.AppendLine("    (コード)");
            sql.AppendLine("    VALUES");
            sql.AppendLine("    (@UnitCode);");

            sql.AppendLine("END;");


            sql.AppendLine("UPDATE 単位マスタ");
            sql.AppendLine("SET 名称 = @UnitName");
            sql.AppendLine("   ,計算区分 = @CalculationType");
            sql.AppendLine("   ,登録日 = GETDATE()");
            sql.AppendLine("   ,送信済 = '1'");
            sql.AppendLine("   ,入力端末 = @InputTerminal");
            sql.AppendLine("   ,削除 = '0'");
            sql.AppendLine("WHERE コード = @UnitCode;");

            using var conn =
                _connectionFactory.CreateConnection();

            return await conn.ExecuteAsync(
                sql.ToString(),
                new
                {
                    UnitCode = unitCode,
                    UnitName = unitName,
                    CalculationType = calculationType,
                    InputTerminal = _inputTerminal
                });
        }
    }
}