using System.Reflection.Emit;
using System.Text;
using Dapper;
using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ShipperMasterViewModel;

namespace HAKOBIMASENKA.Repository.ShipperRepository
{
    public class ShipperRepository : IShipperRepository
    {
        private readonly IDbConnectionFactory _factory;
        private readonly IConfiguration _configuration;

        public ShipperRepository(IDbConnectionFactory factory, IConfiguration configuration)
        {
            _factory = factory;
            _configuration = configuration;
        }

        public async Task<ShipperViewModel?> GetByCodeAsync(string code)
        {
            var s_SQL = new StringBuilder();
            s_SQL.Clear();
            s_SQL.AppendLine("SELECT");
            s_SQL.AppendLine(" 荷主マスタ.*");
            s_SQL.AppendLine(",荷主マスタ.回収方法1 AS 支払方法1");
            s_SQL.AppendLine(",荷主マスタ.回収方法2 AS 支払方法2");
            s_SQL.AppendLine(",荷主マスタ.回収条件 AS 支払条件");
            s_SQL.AppendLine(",荷主マスタ.値引課税 AS 課税割増");
            s_SQL.AppendLine(",荷主マスタ.値引非課税 AS 非課税割増");
            s_SQL.AppendLine(",請求先マスタ.略称 AS 精算先名称");
            s_SQL.AppendLine(",単位マスタ.名称 AS 単位名称");
            s_SQL.AppendLine(",回収方法1.名称 AS 回収方法1名称");
            s_SQL.AppendLine(",回収方法2.名称 AS 回収方法2名称");
            s_SQL.AppendLine(",銀行マスタ.銀行1 AS 銀行１");
            s_SQL.AppendLine(",銀行マスタ.銀行2 AS 銀行２");
            s_SQL.AppendLine(",部門マスタ.名称 AS 部門名称");
            s_SQL.AppendLine("FROM 荷主マスタ WITH(NOLOCK)");
            s_SQL.AppendLine("LEFT JOIN 荷主マスタ AS 請求先マスタ WITH(NOLOCK)");
            s_SQL.AppendLine("ON 荷主マスタ.請求先コード = 請求先マスタ.荷主コード");
            s_SQL.AppendLine("LEFT JOIN 単位マスタ WITH(NOLOCK)");
            s_SQL.AppendLine("ON 荷主マスタ.請求区分 = 単位マスタ.コード");
            s_SQL.AppendLine("LEFT JOIN 入金区分マスタ AS 回収方法1 WITH(NOLOCK)");
            s_SQL.AppendLine("ON 荷主マスタ.回収方法1 = 回収方法1.コード");
            s_SQL.AppendLine("LEFT JOIN 入金区分マスタ AS 回収方法2 WITH(NOLOCK)");
            s_SQL.AppendLine("ON 荷主マスタ.回収方法2 = 回収方法2.コード");
            s_SQL.AppendLine("LEFT JOIN 銀行マスタ WITH(NOLOCK)");
            s_SQL.AppendLine("ON 荷主マスタ.銀行コード = 銀行マスタ.コード");
            s_SQL.AppendLine("LEFT JOIN 部門マスタ WITH(NOLOCK)");
            s_SQL.AppendLine("ON 荷主マスタ.部門コード = 部門マスタ.コード");
            s_SQL.AppendLine("WHERE 荷主マスタ.荷主コード = @Code");
            //s_SQL.AppendLine("AND (荷主マスタ.削除 = '0')")
            s_SQL.AppendLine(";");
            using var conn = _factory.CreateConnection();

            var model = await conn.QuerySingleOrDefaultAsync<ShipperViewModel>(
                s_SQL.ToString(),
                new { Code = code });

            if (model != null)
            {
                await CopyHistoryToWorkTablesAsync(conn, code);

            }

            return model;
        }

        public async Task<bool> ExistsAsync(string code)
        {
            // Data_Chk()
            const string sql = @"
                SELECT COUNT(1) FROM 荷主マスタ WITH (NOLOCK)
                WHERE 荷主コード = @Code";
            using var conn = _factory.CreateConnection();
            return await conn.ExecuteScalarAsync<int>(sql, new { Code = code }) > 0;
        }

        public async Task<string> GetMaxCodeAsync()
        {
            var s_SQL = new StringBuilder();

            s_SQL.Clear();
            s_SQL.AppendLine("SELECT TOP 1");
            s_SQL.AppendLine("荷主コード AS S_コード");
            s_SQL.AppendLine("FROM 荷主マスタ WITH(NOLOCK)");
            s_SQL.AppendLine("WHERE 荷主コード >= '0000000000'");
            //s_SQL.AppendLine("AND (削除 = '0')")
            s_SQL.AppendLine("ORDER BY 荷主コード DESC");
            s_SQL.AppendLine(";");

            using var conn = _factory.CreateConnection();

            var result = await conn.ExecuteScalarAsync<string?>(s_SQL.ToString());

            var current = 0L;
            if (result != null && long.TryParse(result, out var parsed))
            {
                current = parsed;
            }

            var next = current + 1;
            // if Code >= 10000000000 then (no code offered — 10-digit range exhausted).
            if (next >= 10000000000)
            {
                return string.Empty;
            }

            return next.ToString().PadLeft(10, '0');
        }

        public async Task<string> GetNextCodeAsync(string currentCode)
        {
            var s_SQL = new StringBuilder();
            s_SQL.Clear();
            s_SQL.AppendLine("SELECT TOP 1");
            s_SQL.AppendLine("荷主コード AS S_荷主コード");
            s_SQL.AppendLine("FROM 荷主マスタ WITH(NOLOCK)");
            s_SQL.AppendLine("WHERE 荷主コード > @CurrentCode");
            s_SQL.AppendLine("ORDER BY 荷主コード ASC");
            s_SQL.AppendLine(";");

            using var conn = _factory.CreateConnection();

            var result = await conn.QuerySingleOrDefaultAsync<string>(
                s_SQL.ToString(),
                new { CurrentCode = currentCode });

            return result ?? string.Empty;
        }

        public async Task<string> GetPrevCodeAsync(string currentCode)
        {
            var s_SQL = new StringBuilder();
            s_SQL.Clear();
            s_SQL.AppendLine("SELECT TOP 1");
            s_SQL.AppendLine("荷主コード AS S_荷主コード");
            s_SQL.AppendLine("FROM 荷主マスタ WITH(NOLOCK)");
            s_SQL.AppendLine("WHERE 荷主コード < @CurrentCode");
            s_SQL.AppendLine("ORDER BY 荷主コード DESC");
            s_SQL.AppendLine(";");

            using var conn = _factory.CreateConnection();

            var result = await conn.QuerySingleOrDefaultAsync<string>(
                s_SQL.ToString(),
                new { CurrentCode = currentCode });

            return result ?? string.Empty;
        }

        public async Task<(bool valid, string? 略称)> ValidateSettlementDestinationAsync(string code, bool isNewRecord)
        {
            var s_SQL = new StringBuilder();
            s_SQL.AppendLine("SELECT TOP (1) 略称");
            s_SQL.AppendLine("FROM 荷主マスタ");
            s_SQL.AppendLine("WHERE 荷主コード = @Code");
            s_SQL.AppendLine("AND (@RequireActive = 0 OR 取引終了日 IS NULL);");

            using var conn = _factory.CreateConnection();

            var name = await conn.QuerySingleOrDefaultAsync<string?>(
                s_SQL.ToString(),
                new
                {
                    Code = code,
                    RequireActive = isNewRecord
                });

            return (name != null, name);
        }

        public async Task UpsertAsync(ShipperViewModel model, string clientNo)
        {
            const string sql = @"
        IF NOT EXISTS (
            SELECT 1
            FROM 荷主マスタ
            WHERE 荷主コード = @荷主コード
        )
        BEGIN
            INSERT INTO 荷主マスタ (荷主コード)
            VALUES (@荷主コード);
        END;

        UPDATE 荷主マスタ
        SET
            荷主名1       = @荷主名1,
            荷主名2       = @荷主名2,
            ふりがな       = @ふりがな,
            略称           = @略称,
            郵便           = @郵便,
            住所1          = @住所1,
            住所2          = @住所2,
            電話番号       = @電話番号,
            FAX番号        = @FAX番号,
            取引開始日     = @取引開始日,
            取引終了日     = @取引終了日,
            締め日         = @締め日,
            請求先コード   = @請求先コード,
            請求区分       = @請求区分,
            回収サイト     = @回収サイト,
            回収日         = @回収日,
            回収方法1      = @支払方法1,
            回収条件       = @支払条件,
            回収方法2      = @支払方法2,
            銀行コード     = @銀行コード,
            端数桁数       = @端数桁数,
            売上端数       = @売上端数,
            税区分         = @税区分,
            税端数         = @税端数,
            値引率         = @値引率,
            値引課税       = @課税割増,
            値引非課税     = @非課税割増,
            値引端数       = @値引端数,
            備考           = @備考,
            手当掛率       = @手当掛率,
            MAIL           = @MAIL,
            デジタココード = @デジタココード,
            単価表示       = @単価表示,
            請求残計算     = @請求残計算,
            売掛残計算     = @売掛残計算,
            部門コード     = @部門コード,
            請求日設定     = @請求日設定,
            数量小数点     = @数量小数点,
            重量小数点     = @重量小数点,
            小数点         = @小数点,
            登録日         = SYSDATETIME(),
            送信済         = '1',
            入力端末       = @入力端末,
            削除           = '0'
        WHERE 荷主コード = @荷主コード;
    ";

            var parameters = new
            {
                model.荷主コード,
                model.荷主名1,
                model.荷主名2,
                model.ふりがな,
                model.略称,
                model.郵便,
                model.住所1,
                model.住所2,
                model.電話番号,
                model.FAX番号,
                model.取引開始日,
                model.取引終了日,
                model.締め日,
                model.請求先コード,
                model.請求区分,
                model.回収サイト,
                model.回収日,
                支払方法1 = model.支払方法1,
                支払条件 = model.支払条件 ?? 0m,
                支払方法2 = model.支払方法2,
                model.銀行コード,
                model.端数桁数,
                model.売上端数,
                model.税区分,
                model.税端数,
                値引率 = model.値引率 ?? 0m,
                model.課税割増,
                model.非課税割増,
                model.値引端数,
                model.備考,
                手当掛率 = decimal.TryParse(
                    model.手当掛率, out var rate) ? rate : 0m,
                model.MAIL,
                model.デジタココード,
                model.単価表示,
                model.請求残計算,
                model.売掛残計算,
                model.部門コード,
                model.請求日設定,
                model.数量小数点,
                model.重量小数点,
                model.小数点,

                // Replace this placeholder with the actual logged-in terminal/user code.
                入力端末 = clientNo
            };

            using var conn = _factory.CreateConnection();
            conn.Open();

            using var transaction = conn.BeginTransaction();

            try
            {
                // 1. Save Shipper Master.
                await conn.ExecuteAsync(
                    sql,
                    parameters,
                    transaction: transaction);

                // 2. Legacy Data_Repl() equivalent.
                await RefreshHistoryTablesAsync(
                    conn,
                    transaction,
                    model,
                    clientNo);

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        private async Task CopyHistoryToWorkTablesAsync(
    System.Data.IDbConnection conn,
    string code)
        {
            const string billingSql = @"
        DELETE FROM [HAKOBIMASENKAClient01].[dbo].[wk請求履歴表示];

        INSERT INTO [HAKOBIMASENKAClient01].[dbo].[wk請求履歴表示]
        (
            荷主コード,
            支店コード,
            略称,
            締め日,
            開始日,
            更新日,
            前回請求額,
            今回入金額,
            今回調整額,
            今回繰越額,
            今回売上額,
            今回割増額,
            今回非割増,
            課税値引額,
            非課税値引,
            今回値引額,
            今回消費税,
            今回合計額,
            今回請求額,
            原価,
            明細数,
            請求区分,
            端数桁数,
            売上端数,
            税区分,
            税端数,
            値引率,
            値引課税,
            値引非課税,
            値引端数,
            残計算,
            回収サイト,
            回収日,
            回収方法1,
            回収条件,
            回収方法2,
            回収日付,
            回収方法,
            登録日,
            送信済,
            入力端末,
            削除
        )
        SELECT
            荷主コード,
            支店コード,
            略称,
            締め日,
            開始日,
            更新日,
            前回請求額,
            今回入金額,
            今回調整額,
            今回繰越額,
            今回売上額,
            今回割増額,
            今回非割増,
            課税値引額,
            非課税値引,
            今回値引額,
            今回消費税,
            今回合計額,
            今回請求額,
            原価,
            明細数,
            請求区分,
            端数桁数,
            売上端数,
            税区分,
            税端数,
            値引率,
            値引課税,
            値引非課税,
            値引端数,
            残計算,
            回収サイト,
            回収日,
            回収方法1,
            回収条件,
            回収方法2,
            回収日付,
            回収方法,
            登録日,
            送信済,
            入力端末,
            削除
        FROM dbo.請求履歴 WITH (NOLOCK)
        WHERE 荷主コード = @Code;
    ";

            const string receivableSql = @"
        DELETE FROM [HAKOBIMASENKAClient01].[dbo].[wk売掛履歴表示];

        INSERT INTO [HAKOBIMASENKAClient01].[dbo].[wk売掛履歴表示]
        (
            荷主コード,
            支店コード,
            略称,
            締め日,
            開始日,
            更新日,
            前回請求額,
            今回入金額,
            今回調整額,
            今回繰越額,
            今回売上額,
            今回割増額,
            今回非割増,
            課税値引額,
            非課税値引,
            今回値引額,
            今回消費税,
            今回合計額,
            今回請求額,
            原価,
            明細数,
            請求区分,
            端数桁数,
            売上端数,
            税区分,
            税端数,
            値引率,
            値引課税,
            値引非課税,
            値引端数,
            残計算,
            回収サイト,
            回収日,
            回収方法1,
            回収条件,
            回収方法2,
            回収日付,
            回収方法,
            登録日,
            送信済,
            入力端末,
            削除
        )
        SELECT
            荷主コード,
            支店コード,
            略称,
            締め日,
            開始日,
            更新日,
            前回請求額,
            今回入金額,
            今回調整額,
            今回繰越額,
            今回売上額,
            今回割増額,
            今回非割増,
            課税値引額,
            非課税値引,
            今回値引額,
            今回消費税,
            今回合計額,
            今回請求額,
            原価,
            明細数,
            請求区分,
            端数桁数,
            売上端数,
            税区分,
            税端数,
            値引率,
            値引課税,
            値引非課税,
            値引端数,
            残計算,
            回収サイト,
            回収日,
            回収方法1,
            回収条件,
            回収方法2,
            回収日付,
            回収方法,
            登録日,
            送信済,
            入力端末,
            削除
        FROM dbo.売掛履歴 WITH (NOLOCK)
        WHERE 荷主コード = @Code;
    ";

            await conn.ExecuteAsync(
                billingSql,
                new { Code = code });

            await conn.ExecuteAsync(
                receivableSql,
                new { Code = code });
        }

        private async Task RefreshHistoryTablesAsync(
    System.Data.IDbConnection conn,
    System.Data.IDbTransaction transaction,
    ShipperViewModel model,
    string clientNo)
        {
            // -----------------------------------------
            // 1. Rebuild 請求履歴 (Billing History)
            // -----------------------------------------

            const string billingSql = @"
        DELETE FROM dbo.請求履歴
        WHERE 荷主コード = @荷主コード;

        INSERT INTO dbo.請求履歴
        (
            荷主コード,
            支店コード,
            略称,
            締め日,
            開始日,
            更新日,
            前回請求額,
            今回入金額,
            今回調整額,
            今回繰越額,
            今回売上額,
            今回割増額,
            今回非割増,
            課税値引額,
            非課税値引,
            今回値引額,
            今回消費税,
            今回合計額,
            今回請求額,
            原価,
            明細数,
            請求区分,
            端数桁数,
            売上端数,
            税区分,
            税端数,
            値引率,
            値引課税,
            値引非課税,
            値引端数,
            残計算,
            回収サイト,
            回収日,
            回収方法1,
            回収条件,
            回収方法2,
            回収日付,
            回収方法,
            登録日,
            送信済,
            入力端末,
            削除
        )
        SELECT
            @荷主コード,
            支店コード,
            @略称,
            @締め日,
            開始日,
            更新日,
            前回請求額,
            今回入金額,
            今回調整額,
            今回繰越額,
            今回売上額,
            今回割増額,
            今回非割増,
            課税値引額,
            非課税値引,
            今回値引額,
            今回消費税,
            今回合計額,
            今回請求額,
            原価,
            明細数,
            @請求区分,
            @端数桁数,
            @売上端数,
            @税区分,
            @税端数,
            @値引率,
            @値引課税,
            @値引非課税,
            @値引端数,
            @請求残計算,
            @回収サイト,
            @回収日,
            @回収方法1,
            @回収条件,
            @回収方法2,
            回収日付,
            回収方法,
            @登録日,
            '1',
            @入力端末,
            '0'
        FROM [HAKOBIMASENKAClient01].[dbo].[wk請求履歴表示]
        WHERE 荷主コード = @荷主コード
          AND 更新日 IS NOT NULL;
    ";

            // -----------------------------------------
            // 2. Rebuild 売掛履歴 (Receivable History)
            // -----------------------------------------

            const string receivableSql = @"
        DELETE FROM dbo.売掛履歴
        WHERE 荷主コード = @荷主コード;

        INSERT INTO dbo.売掛履歴
        (
            荷主コード,
            支店コード,
            略称,
            締め日,
            開始日,
            更新日,
            前回請求額,
            今回入金額,
            今回調整額,
            今回繰越額,
            今回売上額,
            今回割増額,
            今回非割増,
            課税値引額,
            非課税値引,
            今回値引額,
            今回消費税,
            今回合計額,
            今回請求額,
            原価,
            明細数,
            請求区分,
            端数桁数,
            売上端数,
            税区分,
            税端数,
            値引率,
            値引課税,
            値引非課税,
            値引端数,
            残計算,
            回収サイト,
            回収日,
            回収方法1,
            回収条件,
            回収方法2,
            回収日付,
            回収方法,
            登録日,
            送信済,
            入力端末,
            削除
        )
        SELECT
            @荷主コード,
            支店コード,
            @略称,
            @締め日,
            開始日,
            更新日,
            前回請求額,
            今回入金額,
            今回調整額,
            今回繰越額,
            今回売上額,
            今回割増額,
            今回非割増,
            課税値引額,
            非課税値引,
            今回値引額,
            今回消費税,
            今回合計額,
            今回請求額,
            原価,
            明細数,
            @請求区分,
            @端数桁数,
            @売上端数,
            @税区分,
            @税端数,
            @値引率,
            @値引課税,
            @値引非課税,
            @値引端数,
            @売掛残計算,
            '',
            '',
            '',
            0,
            '',
            NULL,
            '',
            @登録日,
            '1',
            @入力端末,
            '0'
        FROM [HAKOBIMASENKAClient01].[dbo].[wk売掛履歴表示]
        WHERE 荷主コード = @荷主コード
          AND 更新日 IS NOT NULL;
    ";

            var parameters = new
            {
                model.荷主コード,
                model.略称,
                model.締め日,
                model.請求区分,
                model.端数桁数,
                model.売上端数,
                model.税区分,
                model.税端数,
                値引率 = model.値引率 ?? 0m,
                値引課税 = model.課税割増,
                値引非課税 = model.非課税割増,
                値引端数 = model.値引端数,
                登録日 = DateTime.Now,
                入力端末 = clientNo,

                // Legacy ChkCal(0) and ChkCal(1).
                // Billing uses 請求残計算; receivable uses 売掛残計算.
                請求残計算 = model.請求残計算,
                売掛残計算 = model.売掛残計算,

                // Legacy billing collection settings.
                回収サイト = model.回収サイト ?? "",
                回収日 = model.回収日 ?? "",
                回収方法1 = model.支払方法1 ?? string.Empty,
                回収条件 = model.支払条件 ?? 0m,
                回収方法2 = model.支払方法2 ?? string.Empty
            };

            // Billing history first.
            await conn.ExecuteAsync(
                billingSql,
                parameters,
                transaction: transaction);

            // Payable history second.
            await conn.ExecuteAsync(
                receivableSql,
                parameters,
                transaction: transaction);
        }

        public async Task ClearHistoryWorkTablesAsync()
        {
            const string sql = @"
        DELETE FROM wk請求履歴表示;
        DELETE FROM wk売掛履歴表示;
    ";

            using var conn = _factory.CreateClientConnection();

            await conn.ExecuteAsync(sql);
        }

        public async Task<string?> CheckDeleteAsync(string code, string kanriPlKbn)
        {
            using var conn = _factory.CreateConnection();
            conn.Open();

            // 発着地マスタ
            // Old application checks this table only when Kanri_PLKbn = "0".
            if (kanriPlKbn == "0")
            {
                const string sql = @"
            SELECT TOP 1 荷主コード
            FROM 発着地マスタ WITH(NOLOCK)
            WHERE 荷主コード = @Code;";

                var exists = await conn.QueryFirstOrDefaultAsync<string?>(
                    sql, new { Code = code });

                if (!string.IsNullOrEmpty(exists))
                {
                    return "発着地マスタが登録されていますので、削除出来ません！！";
                }
            }

            // 発着地単価マスタ
            {
                const string sql = @"
            SELECT TOP 1 荷主コード
            FROM 発着地単価マスタ WITH(NOLOCK)
            WHERE 荷主コード = @Code;";

                var exists = await conn.QueryFirstOrDefaultAsync<string?>(
                    sql, new { Code = code });

                if (!string.IsNullOrEmpty(exists))
                {
                    return "発着地運賃マスタの自社単価、傭車単価の部分が登録されていますので、削除出来ません！！";
                }
            }

            // 補償発着地単価マスタ
            {
                const string sql = @"
            SELECT TOP 1 荷主コード
            FROM 補償発着地単価マスタ WITH(NOLOCK)
            WHERE 荷主コード = @Code;";

                var exists = await conn.QueryFirstOrDefaultAsync<string?>(
                    sql, new { Code = code });

                if (!string.IsNullOrEmpty(exists))
                {
                    return "発着地運賃マスタの自社変動単価、傭車変動単価の部分が登録されていますので、削除出来ません！！";
                }
            }

            // 地区単価マスタ
            {
                const string sql = @"
            SELECT TOP 1 荷主コード
            FROM 地区単価マスタ WITH(NOLOCK)
            WHERE 荷主コード = @Code;";

                var exists = await conn.QueryFirstOrDefaultAsync<string?>(
                    sql, new { Code = code });

                if (!string.IsNullOrEmpty(exists))
                {
                    return "エリア運賃マスタの自社単価、傭車単価の部分が登録されていますので、削除出来ません！！";
                }
            }

            // 補償地区単価マスタ
            {
                const string sql = @"
            SELECT TOP 1 荷主コード
            FROM 補償地区単価マスタ WITH(NOLOCK)
            WHERE 荷主コード = @Code;";

                var exists = await conn.QueryFirstOrDefaultAsync<string?>(
                    sql, new { Code = code });

                if (!string.IsNullOrEmpty(exists))
                {
                    return "エリア運賃マスタの自社変動単価、傭車変動単価が登録されていますので、削除出来ません！！";
                }
            }

            // 荷主テンプレートマスタ
            {
                const string sql = @"
            SELECT TOP 1 荷主コード
            FROM 荷主テンプレートマスタ WITH(NOLOCK)
            WHERE 荷主コード = @Code;";

                var exists = await conn.QueryFirstOrDefaultAsync<string?>(
                    sql, new { Code = code });

                if (!string.IsNullOrEmpty(exists))
                {
                    return "荷主テンプレートマスタが登録されていますので、削除出来ません！！";
                }
            }

            // 受注データ: 作業明細
            {
                const string sql = @"
            SELECT TOP 1 荷主コード
            FROM 作業明細 WITH(NOLOCK)
            WHERE 荷主コード = @Code;";

                var exists = await conn.QueryFirstOrDefaultAsync<string?>(
                    sql, new { Code = code });

                if (!string.IsNullOrEmpty(exists))
                {
                    return "受注データが登録されていますので、削除出来ません！！";
                }
            }

            // 日報データ: 日報BODY
            {
                const string sql = @"
            SELECT TOP 1 荷主コード
            FROM 日報BODY WITH(NOLOCK)
            WHERE 荷主コード = @Code;";

                var exists = await conn.QueryFirstOrDefaultAsync<string?>(
                    sql, new { Code = code });

                if (!string.IsNullOrEmpty(exists))
                {
                    return "運転日報データが登録されていますので、削除出来ません！！";
                }
            }

            // 入金データ
            {
                const string sql = @"
            SELECT TOP 1 対象コード
            FROM 入金データ WITH(NOLOCK)
            WHERE 対象コード = @Code;";

                var exists = await conn.QueryFirstOrDefaultAsync<string?>(
                    sql, new { Code = code });

                if (!string.IsNullOrEmpty(exists))
                {
                    return "入金データが登録されていますので、削除出来ません！！";
                }
            }

            // No references found: deletion is allowed.
            return null;
        }

        public async Task DeleteAsync(string code)
        {
            const string sql = @"
        DELETE FROM 売掛履歴
        WHERE 荷主コード = @Code;

        DELETE FROM 請求履歴
        WHERE 荷主コード = @Code;

        DELETE FROM 荷主マスタ
        WHERE 荷主コード = @Code;
    ";

            using var conn = _factory.CreateConnection();
            conn.Open();

            using var transaction = conn.BeginTransaction();

            try
            {
                await conn.ExecuteAsync(
                    sql,
                    new { Code = code },
                    transaction: transaction);

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        private static string GetHistoryTable(string kind)
        {
            return kind.ToLowerInvariant() switch
            {
                "billing" => "[HAKOBIMASENKAClient01].[dbo].[wk請求履歴表示]",
                "receivable" => "[HAKOBIMASENKAClient01].[dbo].[wk売掛履歴表示]",

                _ => throw new ArgumentException(
                    "Unsupported history kind.",
                    nameof(kind))
            };
        }

        public async Task<IEnumerable<ShipperHistoryDto>> GetHistoryAsync(string code, string branchCode, string kind)
        {
            var table = GetHistoryTable(kind);

            bool isBilling = kind.Equals("billing", StringComparison.OrdinalIgnoreCase);

            string historyColumns;

            if (isBilling)
            {
                historyColumns = @"
            H.前回請求額 AS 前回請求額,
            H.今回入金額 AS 今回入金額,
            H.今回調整額 AS 入金調整額,
            H.今回繰越額 AS 今回繰越額,
            H.今回売上額 AS 今回運賃額,
            H.今回割増額 AS 割増額課,
            H.今回非割増 AS 割増額非,
            H.課税値引額 AS 課税値引額,
            H.非課税値引 AS 非課税値引,
            H.今回消費税 AS 今回消費税,
            H.今回値引額 AS 今回値引額,
            H.今回合計額 AS 今回合計額,
            H.今回請求額 AS 今回請求額,
            H.回収日付 AS 回収予定日,
            H.回収方法 AS 回収方法,
            P.名称 AS 回収方法名称";
            }
            else
            {
                historyColumns = @"
            H.前回請求額 AS 前月売掛残,
            H.今回入金額 AS 今月入金額,
            H.今回調整額 AS 入金調整額,
            H.今回繰越額 AS 今月繰越額,
            H.今回売上額 AS 今月運賃額,
            H.今回割増額 AS 割増額課,
            H.今回非割増 AS 割増額非,
            H.課税値引額 AS 課税値引額,
            H.非課税値引 AS 非課税値引,
            H.今回消費税 AS 今月消費税,
            H.今回値引額 AS 今月値引額,
            H.今回合計額 AS 今月合計額,
            H.今回請求額 AS 今月売掛残";
            }

            var sql = $@"
        SELECT
           H.荷主コード,
            H.支店コード,
            H.略称,
            H.締め日,
            H.開始日,
            H.更新日,
            {historyColumns}
        FROM {table} AS H WITH (NOLOCK)
        LEFT JOIN 入金区分マスタ AS P WITH (NOLOCK)
            ON H.回収方法 = P.コード
        WHERE H.荷主コード = @Code
          AND H.支店コード = @BranchCode
        ORDER BY
            H.荷主コード,
            H.更新日 DESC;
    ";

            using var conn = _factory.CreateConnection();

            return await conn.QueryAsync<ShipperHistoryDto>(
                sql,
                new { Code = code, BranchCode = branchCode });

        }

        public async Task<ShipperHistoryDto?> GetHistoryRowAsync(string code, string branchCode, string kind, DateTime updateDate)
        {
            var table = GetHistoryTable(kind);

            bool isBilling = kind.Equals("billing", StringComparison.OrdinalIgnoreCase);

            string historyColumns;

            if (isBilling)
            {
                historyColumns = @"
            H.前回請求額 AS 前回請求額,
            H.今回入金額 AS 今回入金額,
            H.今回調整額 AS 入金調整額,
            H.今回繰越額 AS 今回繰越額,
            H.今回売上額 AS 今回運賃額,
            H.今回割増額 AS 割増額課,
            H.今回非割増 AS 割増額非,
            H.課税値引額 AS 課税値引額,
            H.非課税値引 AS 非課税値引,
            H.今回消費税 AS 今回消費税,
            H.今回値引額 AS 今回値引額,
            H.今回合計額 AS 今回合計額,
            H.今回請求額 AS 今回請求額,
            H.回収日付 AS 回収予定日,
            H.回収方法 AS 回収方法,
            P.名称 AS 回収方法名称";
            }
            else
            {
                historyColumns = @"
            H.前回請求額 AS 前月売掛残,
            H.今回入金額 AS 今月入金額,
            H.今回調整額 AS 入金調整額,
            H.今回繰越額 AS 今月繰越額,
            H.今回売上額 AS 今月運賃額,
            H.今回割増額 AS 割増額課,
            H.今回非割増 AS 割増額非,
            H.課税値引額 AS 課税値引額,
            H.非課税値引 AS 非課税値引,
            H.今回消費税 AS 今月消費税,
            H.今回値引額 AS 今月値引額,
            H.今回合計額 AS 今月合計額,
            H.今回請求額 AS 今月売掛残";
            }

            var sql = $@"
        SELECT
            H.荷主コード,
            H.支店コード,
            H.略称,
            H.締め日,
            H.開始日,
            H.更新日,
            {historyColumns}
        FROM {table} AS H WITH (NOLOCK)
        LEFT JOIN 入金区分マスタ AS P WITH (NOLOCK)
            ON H.回収方法 = P.コード
        WHERE H.荷主コード = @Code
          AND H.支店コード = @BranchCode
          AND H.更新日 = @UpdateDate;
    ";

            using var conn = _factory.CreateConnection();

            return await conn.QuerySingleOrDefaultAsync<ShipperHistoryDto>(
                sql,
                new
                {
                    Code = code,
                    BranchCode = branchCode,
                    UpdateDate = updateDate
                });
        }

        public async Task UpsertHistoryRowAsync(ShipperHistoryDto row, string kind, string terminalCode)
        {
            var table = GetHistoryTable(kind);

            bool isBilling = kind.Equals(
        "billing",
        StringComparison.OrdinalIgnoreCase);

            var sql = $@"
        IF NOT EXISTS
        (
            SELECT 1
            FROM {table} WITH (NOLOCK)
            WHERE 荷主コード = @荷主コード
              AND 支店コード = @支店コード
              AND 更新日 = @更新日
        )
        BEGIN
            INSERT INTO {table}
            (
                荷主コード,
                支店コード,
                更新日
            )
            VALUES
            (
                @荷主コード,
                @支店コード,
                @更新日
            );
        END;

        UPDATE {table}
        SET
            開始日 = @開始日,
            前回請求額 = @前回請求額,
            今回入金額 = @今回入金額,
            今回調整額 = @今回調整額,
            今回繰越額 = @今回繰越額,
            今回売上額 = @今回売上額,
            今回割増額 = @今回割増額,
            今回非割増 = @今回非割増,
            課税値引額 = @課税値引額,
            非課税値引 = @非課税値引,
            今回消費税 = @今回消費税,
            今回値引額 = @今回値引額,
            今回合計額 = @今回合計額,
            今回請求額 = @今回請求額,
            {(isBilling ? "回収日付 = @回収日付,\n            回収方法 = @回収方法," : "")}
            削除 = '0'
        WHERE 荷主コード = @荷主コード
          AND 支店コード = @支店コード
          AND 更新日 = @更新日;
    ";

            var parameters = new
            {
                row.荷主コード,
                支店コード = row.支店コード ?? string.Empty,
                row.更新日,
                row.開始日,

                前回請求額 = isBilling ? row.前回請求額 : row.前月売掛残,
                今回入金額 = isBilling ? row.今回入金額 : row.今月入金額,
                今回調整額 = row.入金調整額,
                今回繰越額 = isBilling ? row.今回繰越額 : row.今月繰越額,
                今回売上額 = isBilling ? row.今回運賃額 : row.今月運賃額,
                今回割増額 = row.割増額課,
                今回非割増 = row.割増額非,
                row.課税値引額,
                row.非課税値引,
                今回消費税 = isBilling ? row.今回消費税 : row.今月消費税,
                今回値引額 = isBilling ? row.今回値引額 : row.今月値引額,
                今回合計額 = isBilling ? row.今回合計額 : row.今月合計額,
                今回請求額 = isBilling ? row.今回請求額 : row.今月売掛残,

                回収日付 = row.回収予定日,
                回収方法 = row.回収方法
            };


            using var conn = _factory.CreateConnection();
            conn.Open();

            using var transaction = conn.BeginTransaction();

            try
            {
                await conn.ExecuteAsync(
                    sql,
                    parameters,
                    transaction: transaction);

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task DeleteHistoryRowAsync(string code, string branchCode, string kind, DateTime updateDate)
        {
            var table = GetHistoryTable(kind);

            var sql = $@"
        DELETE FROM {table}
        WHERE 荷主コード = @Code
          AND 支店コード = @BranchCode
          AND 更新日 = @UpdateDate;";

            using var conn = _factory.CreateConnection();

            await conn.ExecuteAsync(
                sql,
                new
                {
                    Code = code,
                    BranchCode = branchCode,
                    UpdateDate = updateDate
                });
        }

        public async Task<IEnumerable<PaymentCategoryOption>> GetPaymentCategoriesAsync()
        {
            var s_SQL = new StringBuilder();
            s_SQL.AppendLine("SELECT");
            s_SQL.AppendLine("コード AS 入金区分コード,");
            s_SQL.AppendLine("名称 AS 入金区分名称");
            s_SQL.AppendLine("FROM 入金区分マスタ");
            s_SQL.AppendLine("ORDER BY コード;");

            using var conn = _factory.CreateConnection();

            return await conn.QueryAsync<PaymentCategoryOption>(s_SQL.ToString());
        }

        public async Task<DepartmentCodeResult?> GetDepartmentAsync(string code)
        {
            const string sql = @"
        SELECT
            コード AS 部門コード,
            名称 AS 部門名称
        FROM 部門マスタ WITH (NOLOCK)
        WHERE コード = @Code;
    ";

            using var conn = _factory.CreateConnection();

            return await conn.QuerySingleOrDefaultAsync<DepartmentCodeResult>(
                sql,
                new { Code = code });
        }

        public async Task<string?> GetManagementNameAsync(string code)
        {
            const string sql = @"
        SELECT 略称
        FROM 管理マスタ WITH (NOLOCK)
        WHERE 自社コード = @Code;
    ";

            using var conn = _factory.CreateConnection();

            return await conn.QuerySingleOrDefaultAsync<string>(
                sql,
                new { Code = code });
        }

        public async Task<BankNameResult?> GetBankNameAsync(string code)
        {

            const string sql = @"
        SELECT
            銀行1 AS 銀行１,
            銀行2 AS 銀行２
        FROM 銀行マスタ WITH (NOLOCK)
        WHERE コード = @Code;
    ";

            using var conn = _factory.CreateConnection();

            return await conn.QuerySingleOrDefaultAsync<BankNameResult>(
                sql,
                new { Code = code });
        }

        public async Task<IEnumerable<UnitCategoryOption>> GetUnitsAsync()
        {
            const string sql = @"
        SELECT
            コード AS 請求コード,
            名称 AS 請求名称
        FROM 単位マスタ WITH (NOLOCK)
        ORDER BY コード;
    ";

            using var conn = _factory.CreateConnection();

            return await conn.QueryAsync<UnitCategoryOption>(sql);
        }

        public async Task<(string uriHasu, string zeiKbn, string zeiHasu, string seikyuBiSettei, string kazeiWarimashi, string hikazeiWarimashi, bool unkoukanri, bool digitco)> GetSystemDefaultsAsync()
        {
            const string sql = @"
        SELECT
            売上端数,
            税区分,
            税端数,
            請求日設定,
            課税割増,
            非課税割増,
            CAST(
                CASE
                    WHEN SEC2 = '1'
                    THEN 1
                    ELSE 0
                END AS bit
            ) AS 運行管理,

            CAST(
                CASE
                    WHEN SEC4 = '1'
                        OR SEC5 = '1'
                    THEN 1
                    ELSE 0
                END AS bit
            ) AS デジタコ
        FROM 管理マスタ
        WHERE 自社コード = @CompanyCode;";

            using var conn = _factory.CreateConnection();

            var row = await conn.QuerySingleOrDefaultAsync<SystemDefaultsRow>(
                sql,
                new { CompanyCode = "01" });

            // Fallback values match the defaults currently declared
            // in ShipperViewModel. Confirm them against the legacy app.
            return (
                row?.売上端数 ?? "0",
                row?.税区分 ?? "0",
                row?.税端数 ?? "0",
                row?.請求日設定 ?? "0",
                row?.課税割増 ?? "0",
                row?.非課税割増 ?? "0",
                row?.運行管理 ?? false,
                row?.デジタコ ?? false
            );
        }

        public async Task<string?> GetKanriPlKbnAsync()
        {
            const string sql = @"
        SELECT 発着地区分
        FROM 管理マスタ
        WHERE 自社コード='01';";

            using var conn =
                _factory.CreateConnection();

            return await conn
                .QuerySingleOrDefaultAsync<string>(
                    sql);
        }
    }
}
