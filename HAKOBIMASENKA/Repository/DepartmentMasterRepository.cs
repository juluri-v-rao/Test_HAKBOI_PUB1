using Dapper;
using HAKOBIMASENKA.Models.ViewModels;
using System.Text;

namespace HAKOBIMASENKA.Repository
{
    public class DepartmentMasterRepository
        : IDepartmentMasterRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public DepartmentMasterRepository(
            IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }


        // =========================================
        // Get Department List
        // =========================================

        public async Task<List<DepartmentMasterResultDto>> GetListAsync()
        {
            var sql = new StringBuilder();

            sql.AppendLine("SELECT");
            sql.AppendLine("    コード AS DepartmentCode");
            sql.AppendLine("   ,名称 AS DepartmentName");
            sql.AppendLine("   ,登録日 AS RegistrationDate");
            sql.AppendLine("   ,送信済 AS Sent");
            sql.AppendLine("   ,入力端末 AS InputTerminal");
            sql.AppendLine("   ,削除 AS Deleted");
            sql.AppendLine("FROM 部門マスタ WITH(NOLOCK)");
            sql.AppendLine("WHERE 削除 = '0'");
            sql.AppendLine("ORDER BY TRY_CONVERT(INT, コード);");

            using var conn =
                _connectionFactory.CreateConnection();

            var rows =
                await conn.QueryAsync<DepartmentMasterResultDto>(
                    sql.ToString());

            return rows.ToList();
        }


        // =========================================
        // Get MAX Department Code + 1
        // =========================================

        public async Task<string?> GetNextCodeAsync()
        {
            var sql = new StringBuilder();

            sql.AppendLine("SELECT TOP 1");
            sql.AppendLine("    コード");
            sql.AppendLine("FROM 部門マスタ WITH(NOLOCK)");
            sql.AppendLine("WHERE コード >= '00'");
            sql.AppendLine("ORDER BY TRY_CONVERT(INT, コード) DESC;");

            using var conn =
                _connectionFactory.CreateConnection();

            var maxCode =
                await conn.QueryFirstOrDefaultAsync<string>(
                    sql.ToString());

            int nextCode = 1;

            if (!string.IsNullOrWhiteSpace(maxCode)
                && int.TryParse(maxCode, out int currentCode))
            {
                nextCode = currentCode + 1;
            }


            // =========================================
            // Legacy Set_Code():
            //
            // If code >= 100
            // → blank
            // =========================================

            if (nextCode >= 100)
            {
                return null;
            }


            // 2-digit zero padding
            return nextCode.ToString("D2");
        }
        public async Task<int> DeleteAsync(string departmentCode)
        {
            var sql = new StringBuilder();

            sql.AppendLine("DELETE FROM 部門マスタ");
            sql.AppendLine("WHERE コード = @DepartmentCode;");

            using var conn = _connectionFactory.CreateConnection();

            var result = await conn.ExecuteAsync(
                sql.ToString(),
                new
                {
                    DepartmentCode = departmentCode
                });

            return result;
        }
        public async Task<int> SaveAsync(
    string departmentCode,
    string departmentName)
        {
            var sql = new StringBuilder();

            sql.AppendLine("IF NOT EXISTS (");
            sql.AppendLine("    SELECT 1");
            sql.AppendLine("    FROM 部門マスタ WITH(NOLOCK)");
            sql.AppendLine("    WHERE コード = @DepartmentCode");
            sql.AppendLine(")");
            sql.AppendLine("BEGIN");

            sql.AppendLine("    INSERT INTO 部門マスタ");
            sql.AppendLine("    (コード)");
            sql.AppendLine("    VALUES");
            sql.AppendLine("    (@DepartmentCode);");

            sql.AppendLine("END;");

            sql.AppendLine("UPDATE 部門マスタ");
            sql.AppendLine("SET 名称 = @DepartmentName");
            sql.AppendLine("   ,登録日 = GETDATE()");
            sql.AppendLine("   ,送信済 = '1'");
            sql.AppendLine("   ,入力端末 = @InputTerminal");
            sql.AppendLine("   ,削除 = '0'");
            sql.AppendLine("WHERE コード = @DepartmentCode;");

            using var conn =
                _connectionFactory.CreateConnection();

            return await conn.ExecuteAsync(
                sql.ToString(),
                new
                {
                    DepartmentCode = departmentCode,
                    DepartmentName = departmentName,

                    // Replace when the new equivalent
                    // of legacy E_CODE is confirmed.
                    InputTerminal = "01"
                });
        }
    }
}