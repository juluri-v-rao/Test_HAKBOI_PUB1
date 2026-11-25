using Dapper;
using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.CharteredVehicleMasterViewModel;

namespace HAKOBIMASENKA.Repository.CharteredVehicleMasterRepository
{
    /// <summary>
    /// 傭車マスタ data access (legacy FrmM_Yosha).
    /// All SQL is parameterized; legacy concatenated the values into the SQL text.
    /// </summary>
    public class CharteredVehicleMasterRepository : ICharteredVehicleMasterRepository
    {
        private readonly IDbConnectionFactory _factory;

        public CharteredVehicleMasterRepository(IDbConnectionFactory factory)
        {
            _factory = factory;
        }

        // =========================================
        //          Load (Dsp_Data)
        // =========================================

        public async Task<CharteredVehicleMasterViewModel?> GetByCodeAsync(string code)
        {
            const string sql = @"
                SELECT
                     YOS.*
                    ,CASE WHEN YOS.精算先コード = YOS.傭車コード THEN YOS.略称
                          ELSE SEI.略称 END AS 精算先名称
                FROM 傭車マスタ AS YOS WITH(NOLOCK)
                LEFT JOIN 傭車マスタ AS SEI WITH(NOLOCK)
                    ON YOS.精算先コード = SEI.傭車コード
                WHERE YOS.傭車コード = @Code;";

            using var conn = _factory.CreateConnection();
            return await conn.QuerySingleOrDefaultAsync<CharteredVehicleMasterViewModel>(sql, new { Code = code });
        }

        public async Task<bool> ExistsAsync(string code)
        {
            const string sql = "SELECT COUNT(1) FROM 傭車マスタ WITH(NOLOCK) WHERE 傭車コード = @Code;";

            using var conn = _factory.CreateConnection();
            return await conn.ExecuteScalarAsync<int>(sql, new { Code = code }) > 0;
        }

        // =========================================
        //     Codes (Set_Code / Data_Move)
        // =========================================

        public async Task<long> GetMaxCodeAsync()
        {
            const string sql = @"
                SELECT TOP 1 傭車コード
                FROM 傭車マスタ WITH(NOLOCK)
                WHERE 傭車コード >= '0000000000'
                ORDER BY 傭車コード DESC;";

            using var conn = _factory.CreateConnection();
            var code = await conn.ExecuteScalarAsync<string?>(sql);

            return long.TryParse(code, out var value) ? value : 0;
        }

        public async Task<string?> GetPreviousCodeAsync(string code)
        {
            const string sql = @"
                SELECT TOP 1 傭車コード
                FROM 傭車マスタ WITH(NOLOCK)
                WHERE 傭車コード < @Code
                ORDER BY 傭車コード DESC;";

            using var conn = _factory.CreateConnection();
            return await conn.ExecuteScalarAsync<string?>(sql, new { Code = code });
        }

        public async Task<string?> GetNextCodeAsync(string code)
        {
            const string sql = @"
                SELECT TOP 1 傭車コード
                FROM 傭車マスタ WITH(NOLOCK)
                WHERE 傭車コード > @Code
                ORDER BY 傭車コード ASC;";

            using var conn = _factory.CreateConnection();
            return await conn.ExecuteScalarAsync<string?>(sql, new { Code = code });
        }

        // =========================================
        //              Lookups
        // =========================================

        public async Task<string?> FindSettlementNameAsync(string code, bool activeOnly)
        {
            // On a new 傭車, a 精算先 whose 取引終了日 is set is not accepted (legacy Sink_Flg).
            const string sql = @"
                SELECT ISNULL(略称, '')
                FROM 傭車マスタ WITH(NOLOCK)
                WHERE 傭車コード = @Code
                  AND (@ActiveOnly = 0 OR 取引終了日 IS NULL);";

            using var conn = _factory.CreateConnection();
            return await conn.ExecuteScalarAsync<string?>(sql, new { Code = code, ActiveOnly = activeOnly });
        }

        public async Task<IEnumerable<CharteredVehicleMasterResultDto>> GetUnitsAsync()
        {
            const string sql = @"
                SELECT コード, 名称
                FROM 単位マスタ WITH(NOLOCK)
                WHERE 名称 IS NOT NULL
                ORDER BY コード;";

            using var conn = _factory.CreateConnection();
            return await conn.QueryAsync<CharteredVehicleMasterResultDto>(sql);
        }

        public async Task<IEnumerable<CharteredVehicleMasterResultDto>> GetPaymentMethodsAsync()
        {
            const string sql = @"
                SELECT コード, 名称
                FROM 支払区分マスタ WITH(NOLOCK)
                WHERE 名称 IS NOT NULL
                ORDER BY コード;";

            using var conn = _factory.CreateConnection();
            return await conn.QueryAsync<CharteredVehicleMasterResultDto>(sql);
        }

        public async Task<bool> UnitExistsAsync(string code)
        {
            const string sql = "SELECT COUNT(1) FROM 単位マスタ WITH(NOLOCK) WHERE コード = @Code;";

            using var conn = _factory.CreateConnection();
            return await conn.ExecuteScalarAsync<int>(sql, new { Code = code }) > 0;
        }

        public async Task<bool> PaymentMethodExistsAsync(string code)
        {
            const string sql = "SELECT COUNT(1) FROM 支払区分マスタ WITH(NOLOCK) WHERE コード = @Code;";

            using var conn = _factory.CreateConnection();
            return await conn.ExecuteScalarAsync<int>(sql, new { Code = code }) > 0;
        }

        public async Task<string?> FindAddressAsync(string postalCode)
        {
            const string sql = @"
                SELECT TOP 1 ISNULL(住所, '')
                FROM 郵便番号マスタ WITH(NOLOCK)
                WHERE 郵便番号 = @PostalCode;";

            using var conn = _factory.CreateConnection();
            return await conn.ExecuteScalarAsync<string?>(sql, new { PostalCode = postalCode });
        }

        public async Task<CharteredVehicleDefaultsDto> GetDefaultsAsync()
        {
            const string sql = @"
                SELECT
                     ISNULL(売上端数, '0')   AS 下払端数
                    ,ISNULL(税区分, '0')     AS 税区分
                    ,ISNULL(税端数, '0')     AS 税端数
                    ,ISNULL(請求日設定, '0') AS 支払日設定
                    ,ISNULL(課税割増, '0')   AS 値引課税
                    ,ISNULL(非課税割増, '0') AS 値引非課税
                    -- licence flags (legacy UNKOU_Chk = SEC2, DIGI_Chk = SEC4, ETC_Chk = SEC5)
                    ,CAST(CASE WHEN SEC2 = '1' THEN 1 ELSE 0 END AS bit) AS 運行管理
                    ,CAST(CASE WHEN SEC4 = '1' OR SEC5 = '1' THEN 1 ELSE 0 END AS bit) AS デジタコ
                FROM 管理マスタ WITH(NOLOCK)
                WHERE 自社コード = '01';";

            using var conn = _factory.CreateConnection();
            return await conn.QuerySingleOrDefaultAsync<CharteredVehicleDefaultsDto>(sql)
                   ?? new CharteredVehicleDefaultsDto();
        }

        // =========================================
        //          Save (Data_Repl)
        // =========================================

        public async Task SaveAsync(CharteredVehicleMasterViewModel model, string terminalCode)
        {
            // Same as legacy: insert the key when it is missing, then update every column.
            const string sql = @"
                IF NOT EXISTS (SELECT 1 FROM 傭車マスタ WITH(UPDLOCK, HOLDLOCK) WHERE 傭車コード = @傭車コード)
                    INSERT INTO 傭車マスタ (傭車コード) VALUES (@傭車コード);

                UPDATE 傭車マスタ SET
                     傭車名1 = @傭車名1
                    ,傭車名2 = @傭車名2
                    ,ふりがな = @ふりがな
                    ,略称 = @略称
                    ,郵便 = @郵便
                    ,住所1 = @住所1
                    ,住所2 = @住所2
                    ,電話番号 = @電話番号
                    ,FAX番号 = @FAX番号
                    ,取引開始日 = @取引開始日
                    ,取引終了日 = @取引終了日
                    ,締め日 = @締め日
                    ,精算先コード = @精算先コード
                    ,精算区分 = @精算区分
                    ,支払サイト = @支払サイト
                    ,支払日 = @支払日
                    ,支払方法1 = @支払方法1
                    ,支払条件 = @支払条件
                    ,支払方法2 = @支払方法2
                    ,銀行名 = @銀行名
                    ,支店名 = @支店名
                    ,口座種別 = @口座種別
                    ,口座番号 = @口座番号
                    ,口座名義 = @口座名義
                    ,端数桁数 = @端数桁数
                    ,下払端数 = @下払端数
                    ,税区分 = @税区分
                    ,税端数 = @税端数
                    ,値引率 = @値引率
                    ,値引課税 = @値引課税
                    ,値引非課税 = @値引非課税
                    ,値引端数 = @値引端数
                    ,備考 = @備考
                    ,MAIL = @MAIL
                    ,デジタココード = @デジタココード
                    ,単価表示 = @単価表示
                    ,支払残計算 = @支払残計算
                    ,買掛残計算 = @買掛残計算
                    ,支払日設定 = @支払日設定
                    ,数量小数点 = @数量小数点
                    ,重量小数点 = @重量小数点
                    ,小数点 = @小数点
                    ,登録日 = GETDATE()
                    ,送信済 = '1'
                    ,入力端末 = @入力端末
                    ,削除 = '0'
                WHERE 傭車コード = @傭車コード;";

            var parameters = new DynamicParameters(model);
            parameters.Add("入力端末", terminalCode);

            using var conn = _factory.CreateConnection();
            conn.Open();
            using var transaction = conn.BeginTransaction();

            await conn.ExecuteAsync(sql, parameters, transaction);

            if (model.支払履歴 != null)
            {
                await SaveHistoryAsync(conn, transaction, model, model.支払履歴, terminalCode, payment: true);
            }

            if (model.買掛履歴 != null)
            {
                await SaveHistoryAsync(conn, transaction, model, model.買掛履歴, terminalCode, payment: false);
            }

            transaction.Commit();
        }

        // =========================================
        //      History (Dsp_List / Data_Repl)
        // =========================================

        public async Task<List<CharteredVehicleHistoryDto>> GetHistoryAsync(string code, bool payment)
        {
            // Table names are fixed here, never taken from the request.
            var sql = $@"
                SELECT
                     RIR.開始日
                    ,RIR.更新日
                    ,RIR.前回買掛額
                    ,RIR.今回支払額
                    ,RIR.今回調整額
                    ,RIR.今回繰越額
                    ,RIR.今回仕入額
                    ,RIR.今回割増額
                    ,RIR.今回非割増
                    ,RIR.課税値引額
                    ,RIR.非課税値引
                    ,RIR.今回消費税
                    ,RIR.今回値引額
                    ,RIR.今回合計額
                    ,RIR.今回買掛額
                    ,RIR.支払日付
                    ,RIR.支払方法
                    ,SHI.名称 AS 支払方法名称
                FROM {HistoryTable(payment)} AS RIR WITH(NOLOCK)
                LEFT JOIN 支払区分マスタ AS SHI WITH(NOLOCK)
                    ON RIR.支払方法 = SHI.コード
                WHERE RIR.傭車コード = @Code
                ORDER BY RIR.更新日 DESC;";

            using var conn = _factory.CreateConnection();
            var rows = await conn.QueryAsync<CharteredVehicleHistoryDto>(sql, new { Code = code });

            return rows.ToList();
        }

        // Legacy deleted this 傭車's rows and re-inserted them from the wk table.
        // Here rows removed on the screen are deleted, the rest are updated or inserted,
        // so 売上 / 明細数 (not on the screen) stay on rows that already existed.
        // Every row gets the 傭車's current settings, as legacy did.
        private static async Task SaveHistoryAsync(
            System.Data.IDbConnection conn,
            System.Data.IDbTransaction transaction,
            CharteredVehicleMasterViewModel model,
            List<CharteredVehicleHistoryDto> rows,
            string terminalCode,
            bool payment)
        {
            var table = HistoryTable(payment);

            await conn.ExecuteAsync(
                $"DELETE FROM {table} WHERE 傭車コード = @Code AND 更新日 NOT IN @Keep;",
                new { Code = model.傭車コード, Keep = rows.Select(row => row.更新日).ToList() },
                transaction);

            var sql = $@"
                IF EXISTS (SELECT 1 FROM {table} WITH(UPDLOCK, HOLDLOCK) WHERE 傭車コード = @傭車コード AND 更新日 = @更新日)
                    UPDATE {table} SET
                         略称 = @略称
                        ,締め日 = @締め日
                        ,開始日 = @開始日
                        ,前回買掛額 = @前回買掛額
                        ,今回支払額 = @今回支払額
                        ,今回調整額 = @今回調整額
                        ,今回繰越額 = @今回繰越額
                        ,今回仕入額 = @今回仕入額
                        ,今回割増額 = @今回割増額
                        ,今回非割増 = @今回非割増
                        ,課税値引額 = @課税値引額
                        ,非課税値引 = @非課税値引
                        ,今回値引額 = @今回値引額
                        ,今回消費税 = @今回消費税
                        ,今回合計額 = @今回合計額
                        ,今回買掛額 = @今回買掛額
                        ,精算区分 = @精算区分
                        ,端数桁数 = @端数桁数
                        ,下払端数 = @下払端数
                        ,税区分 = @税区分
                        ,税端数 = @税端数
                        ,値引率 = @値引率
                        ,値引課税 = @値引課税
                        ,値引非課税 = @値引非課税
                        ,値引端数 = @値引端数
                        ,残計算 = @残計算
                        ,支払サイト = @支払サイト
                        ,支払日 = @支払日
                        ,支払方法1 = @支払方法1
                        ,支払条件 = @支払条件
                        ,支払方法2 = @支払方法2
                        ,支払日付 = @支払日付
                        ,支払方法 = @支払方法
                        ,登録日 = GETDATE()
                        ,送信済 = '1'
                        ,入力端末 = @入力端末
                        ,削除 = '0'
                    WHERE 傭車コード = @傭車コード AND 更新日 = @更新日;
                ELSE
                    INSERT INTO {table} (
                         傭車コード, 略称, 締め日, 開始日, 更新日
                        ,前回買掛額, 今回支払額, 今回調整額, 今回繰越額, 今回仕入額, 今回割増額, 今回非割増
                        ,課税値引額, 非課税値引, 今回値引額, 今回消費税, 今回合計額, 今回買掛額
                        ,精算区分, 端数桁数, 下払端数, 税区分, 税端数, 値引率, 値引課税, 値引非課税, 値引端数, 残計算
                        ,支払サイト, 支払日, 支払方法1, 支払条件, 支払方法2, 支払日付, 支払方法
                        ,登録日, 送信済, 入力端末, 削除
                    ) VALUES (
                         @傭車コード, @略称, @締め日, @開始日, @更新日
                        ,@前回買掛額, @今回支払額, @今回調整額, @今回繰越額, @今回仕入額, @今回割増額, @今回非割増
                        ,@課税値引額, @非課税値引, @今回値引額, @今回消費税, @今回合計額, @今回買掛額
                        ,@精算区分, @端数桁数, @下払端数, @税区分, @税端数, @値引率, @値引課税, @値引非課税, @値引端数, @残計算
                        ,@支払サイト, @支払日, @支払方法1, @支払条件, @支払方法2, @支払日付, @支払方法
                        ,GETDATE(), '1', @入力端末, '0'
                    );";

            foreach (var row in rows)
            {
                await conn.ExecuteAsync(sql, new
                {
                    model.傭車コード,
                    model.略称,
                    model.締め日,
                    row.開始日,
                    row.更新日,
                    前回買掛額 = row.前回買掛額 ?? 0,
                    今回支払額 = row.今回支払額 ?? 0,
                    今回調整額 = row.今回調整額 ?? 0,
                    今回繰越額 = row.今回繰越額 ?? 0,
                    今回仕入額 = row.今回仕入額 ?? 0,
                    今回割増額 = row.今回割増額 ?? 0,
                    今回非割増 = row.今回非割増 ?? 0,
                    課税値引額 = row.課税値引額 ?? 0,
                    非課税値引 = row.非課税値引 ?? 0,
                    今回値引額 = row.今回値引額 ?? 0,
                    今回消費税 = row.今回消費税 ?? 0,
                    今回合計額 = row.今回合計額 ?? 0,
                    今回買掛額 = row.今回買掛額 ?? 0,
                    model.精算区分,
                    model.端数桁数,
                    model.下払端数,
                    model.税区分,
                    model.税端数,
                    model.値引率,
                    model.値引課税,
                    model.値引非課税,
                    model.値引端数,

                    // Payment settings go on 支払履歴 rows only (legacy Data_Repl).
                    残計算 = payment ? model.支払残計算 : model.買掛残計算,
                    支払サイト = payment ? model.支払サイト : "",
                    支払日 = payment ? model.支払日 : "",
                    支払方法1 = payment ? model.支払方法1 : "",
                    支払条件 = payment ? model.支払条件 : 0,
                    支払方法2 = payment ? model.支払方法2 : "",
                    支払日付 = payment ? row.支払日付 : null,
                    支払方法 = payment ? (row.支払方法 ?? "") : "",

                    入力端末 = terminalCode
                }, transaction);
            }
        }

        private static string HistoryTable(bool payment)
        {
            return payment ? "傭車支払履歴" : "傭車買掛履歴";
        }

        // =========================================
        //      Delete (Del_Chk / Data_Del)
        // =========================================

        public async Task<string?> GetDeleteBlockReasonAsync(string code)
        {
            // Checked in the legacy order; the first table in use gives the message.
            var checks = new (string Sql, string Message)[]
            {
                ("SELECT TOP 1 1 FROM 運転手マスタ WITH(NOLOCK) WHERE 傭車コード = @Code;",
                 "運転手マスタが登録されていますので、削除出来ません！！"),
                ("SELECT TOP 1 1 FROM 作業明細 WITH(NOLOCK) WHERE 傭車コード = @Code;",
                 "受注データが登録されていますので、削除出来ません！！"),
                ("SELECT TOP 1 1 FROM 日報HEAD WITH(NOLOCK) WHERE 傭車コード = @Code;",
                 "運転日報データが登録されていますので、削除出来ません！！"),
                ("SELECT TOP 1 1 FROM 傭車支払データ WITH(NOLOCK) WHERE 対象コード = @Code;",
                 "傭車支払データが登録されていますので、削除出来ません！！"),
            };

            using var conn = _factory.CreateConnection();

            foreach (var check in checks)
            {
                if (await conn.ExecuteScalarAsync<int?>(check.Sql, new { Code = code }) != null)
                {
                    return check.Message;
                }
            }

            return null;
        }

        public async Task DeleteAsync(string code)
        {
            const string sql = @"
                DELETE FROM 傭車マスタ WHERE 傭車コード = @Code;
                DELETE FROM 傭車買掛履歴 WHERE 傭車コード = @Code;
                DELETE FROM 傭車支払履歴 WHERE 傭車コード = @Code;";

            using var conn = _factory.CreateConnection();
            conn.Open();
            using var transaction = conn.BeginTransaction();

            await conn.ExecuteAsync(sql, new { Code = code }, transaction);

            transaction.Commit();
        }
    }
}
