using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.AspNetCore.Connections;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Dapper;
using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ExpenseMasterViewModel;


namespace HAKOBIMASENKA.Repository.ExpenseRepository
{
    public class ExpenseRepository : IExpenseRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public ExpenseRepository(IDbConnectionFactory connnectionfactory)
        {
            _connectionFactory = connnectionfactory;
        }

        public async Task<List<ExpenseResultDto>> GetListAsync()
        {
            var sql = new StringBuilder();
            sql.AppendLine("SELECT ");
            sql.AppendLine("経費マスタ.経費コード");
            sql.AppendLine(",経費マスタ.名称");
            sql.AppendLine(",経費区分マスタ.名称 AS 経費区分名 ");
            sql.AppendLine("FROM 経費マスタ WITH(NOLOCK) ");
            sql.AppendLine("LEFT JOIN 経費区分マスタ WITH(NOLOCK) ");
            sql.AppendLine("ON 経費マスタ.経費区分コード = 経費区分マスタ.コード");
            sql.AppendLine("ORDER BY 経費マスタ.経費コード;");

            using var conn = _connectionFactory.CreateConnection();
            var rows = await conn.QueryAsync<ExpenseResultDto>(sql.ToString());
            return rows.ToList();
        }

        public async Task<ExpenseViewModel?> GetByCodeAsync(string code)
        {
            var sql = new StringBuilder();
            sql.AppendLine("SELECT ");
            sql.AppendLine("[経費コード]");
            sql.AppendLine(",[名称]");
            sql.AppendLine(",[経費区分コード]");
            sql.AppendLine(",[単価]");
            sql.AppendLine(",[デジタココード] ");
            /*sql.AppendLine("LEFT JOIN 経費区分マスタ WITH(NOLOCK) ");*/
            sql.AppendLine("FROM 経費マスタ WITH(NOLOCK)");
            sql.AppendLine("WHERE 経費コード = @Code;");

            using var conn = _connectionFactory.CreateConnection();
            var row = await conn.QuerySingleOrDefaultAsync<ExpenseViewModel>(sql.ToString(), new { Code = code });
            if (row != null)
            {
                row.経費コード = code;
                row.IsNewRecord = false;
            }
            return row;
        }

        public async Task<bool> ExistsAsync(string code)
        {
            const string sql = "SELECT 経費コード FROM 経費マスタ WITH(NOLOCK) WHERE 経費コード = @Code;";
            using var conn = _connectionFactory.CreateConnection();
            var hit = await conn.QueryFirstOrDefaultAsync<string>(sql, new { Code = code });
            return hit != null;
        }

        public async Task<List<ExpenseCategoryOption>> GetCategoryOptionsAsync()
        {
            var sql = new StringBuilder();
            sql.AppendLine("SELECT ");
            sql.AppendLine("コード AS Code");
            sql.AppendLine(",名称   AS Name ");
            sql.AppendLine("FROM 経費区分マスタ WITH(NOLOCK) ");
            sql.AppendLine("ORDER BY コード;");

            using var conn = _connectionFactory.CreateConnection();
            var rows = await conn.QueryAsync<ExpenseCategoryOption>(sql.ToString());
            return rows.ToList();
        }

        public async Task<string?> GetCategoryNameAsync(string categoryCode)
        {
            var sql = new StringBuilder();
            sql.AppendLine("SELECT 名称 ");
            sql.AppendLine("FROM 経費区分マスタ WITH(NOLOCK) ");
            sql.AppendLine("WHERE コード = @Code;");

            using var conn = _connectionFactory.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<string>(sql.ToString(), new { Code = categoryCode });
        }

        public async Task<string?> GetNextCodeAsync()
        {
            // Get the TOP 1 Code which is greater than '0000'
            var sql = new StringBuilder();
            sql.AppendLine("SELECT TOP 1 経費コード ");
            sql.AppendLine("FROM 経費マスタ WITH(NOLOCK) ");
            sql.AppendLine("WHERE 経費コード >= '0000' ");
            sql.AppendLine("ORDER BY 経費コード DESC;");

            using var conn = _connectionFactory.CreateConnection();
            var top = await conn.QueryFirstOrDefaultAsync<string>(sql.ToString());

            var current = 0L;
            if (top != null && long.TryParse(top, out var parsed))
            {
                current = parsed;
            }

            var next = current + 1;
            // if Code >= 10000 then (no code offered — 4-digit range exhausted).
            if (next >= 10000)
            {
                return null;
            }

            return next.ToString().PadLeft(4, '0');
        }

        public async Task SaveAsync(ExpenseViewModel model, string terminalCode)
        {
            using var conn = _connectionFactory.CreateConnection();

            const string saveSql = @"
            IF EXISTS (SELECT 1 FROM 経費マスタ WHERE 経費コード = @Code)
            BEGIN
                UPDATE 経費マスタ SET
                    名称             = @Name
                    ,経費区分コード   = @CategoryCode
                    ,単価            = @UnitPrice
                    ,在庫数          = 0
                    ,デジタココード  = @DigiCode
                    ,登録日          = GETDATE()
                    ,送信済          = '1'
                    ,入力端末        = @Terminal
                    ,削除            = '0'
                WHERE 経費コード = @Code;
            END
            ELSE
            BEGIN
                INSERT INTO 経費マスタ (
                    経費コード
                    ,名称
                    ,経費区分コード
                    ,単価
                    ,在庫数
                    ,デジタココード
                    ,登録日
                    ,送信済
                    ,入力端末
                    ,削除
                )
                VALUES (
                    @Code
                    ,@Name
                    ,@CategoryCode
                    ,@UnitPrice
                    ,0
                    ,@DigiCode
                    ,GETDATE()
                    ,'1'
                    ,@Terminal
                    ,'0'
                );
            END";

            await conn.ExecuteAsync(saveSql, new
            {
                Code = model.経費コード,
                Name = model.名称,
                CategoryCode = model.経費区分コード,
                UnitPrice = model.単価,
                DigiCode = model.デジタココード,
                Terminal = terminalCode
            });

        }

        public async Task<bool> HasFixedExpenseReferenceAsync(string code)
        {
            const string sql = "SELECT 経費コード FROM 固定経費マスタ WITH(NOLOCK) WHERE 経費コード = @Code;";
            using var conn = _connectionFactory.CreateConnection();
            var hit = await conn.QueryFirstOrDefaultAsync<string>(sql, new { Code = code });
            return hit != null;
        }

        public async Task<bool> HasExpenseDataReferenceAsync(string code)
        {
            const string sql = "SELECT 経費コード FROM 経費データ WITH(NOLOCK) WHERE 経費コード = @Code;";
            using var conn = _connectionFactory.CreateConnection();
            var hit = await conn.QueryFirstOrDefaultAsync<string>(sql, new { Code = code });
            return hit != null;
        }

        public async Task DeleteAsync(string code)
        {
            // Legacy wraps the single DELETE in SET XACT_ABORT ON / BEGIN..COMMIT TRANSACTION.
            const string sql = @"
                SET XACT_ABORT ON;
                BEGIN TRANSACTION;
                DELETE FROM 経費マスタ WHERE 経費コード = @Code;
                COMMIT TRANSACTION;";

            using var conn = _connectionFactory.CreateConnection();
            await conn.ExecuteAsync(sql, new { Code = code });
        }
    }
}
