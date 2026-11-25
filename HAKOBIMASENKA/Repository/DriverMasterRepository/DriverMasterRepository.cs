using System.Data;
using Dapper;
using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.DriverMasterViewModel;

namespace HAKOBIMASENKA.Repository.DriverMasterRepository
{
    /// <summary>
    /// 運転手マスタ data access (legacy FrmM_Tanto), all tabs including 運転者台帳 1-4.
    /// All SQL is parameterized; legacy concatenated the values into the SQL text.
    /// </summary>
    public class DriverMasterRepository : IDriverMasterRepository
    {
        private readonly IDbConnectionFactory _factory;

        public DriverMasterRepository(IDbConnectionFactory factory)
        {
            _factory = factory;
        }

        // =========================================
        //          運転者台帳 histories
        // =========================================
        // The 8 history tables (legacy wk運転免許証履歴 … wk異動履歴), each keyed by 運転手コード + 日付.

        private sealed record HistoryTable(
            string Table,
            string[] Columns,
            Func<DriverMasterViewModel, List<DriverHistoryDto>?> Get,
            Action<DriverMasterViewModel, List<DriverHistoryDto>> Set);

        private static readonly Dictionary<string, HistoryTable> HistoryTables = new()
        {
            ["license"] = new("運転免許証履歴", new[] { "番号" },
                m => m.運転免許証履歴, (m, rows) => m.運転免許証履歴 = rows),
            ["accident"] = new("事故履歴", new[] { "車番", "事故種類", "責任", "事故記録NO", "概要" },
                m => m.事故履歴, (m, rows) => m.事故履歴 = rows),
            ["violation"] = new("違反履歴", new[] { "内容" },
                m => m.違反履歴, (m, rows) => m.違反履歴 = rows),
            ["certificate"] = new("運転経歴証明書", new[] { "種類", "内容" },
                m => m.運転経歴証明書, (m, rows) => m.運転経歴証明書 = rows),
            ["aptitude"] = new("適性診断履歴", new[] { "区分", "概要" },
                m => m.適性診断履歴, (m, rows) => m.適性診断履歴 = rows),
            ["education"] = new("教育実施履歴", new[] { "内容", "区分" },
                m => m.教育実施履歴, (m, rows) => m.教育実施履歴 = rows),
            ["medical"] = new("健康診断履歴", new[] { "種類" },
                m => m.健康診断履歴, (m, rows) => m.健康診断履歴 = rows),
            ["transfer"] = new("異動履歴", new[] { "異動事項", "備考" },
                m => m.異動履歴, (m, rows) => m.異動履歴 = rows)
        };

        private static string HistorySelectSql(HistoryTable table)
        {
            return $@"
                SELECT 日付, {string.Join(", ", table.Columns)}
                FROM {table.Table} WITH(NOLOCK)
                WHERE 運転手コード = @Code
                ORDER BY 日付 DESC;";
        }

        // legacy Dsp_Data: each history copied to its wk table, shown newest first (Dsp_UList … Dsp_IDoList)
        public async Task LoadHistoriesAsync(DriverMasterViewModel model)
        {
            using var conn = _factory.CreateConnection();

            foreach (var table in HistoryTables.Values)
            {
                var rows = await conn.QueryAsync<DriverHistoryDto>(HistorySelectSql(table), new { Code = model.運転手コード });
                table.Set(model, rows.ToList());
            }
        }

        // =========================================
        //          Load (Dsp_Data)
        // =========================================

        public async Task<DriverMasterViewModel?> GetByCodeAsync(string code)
        {
            // legacy Dsp_Data: 運転手マスタ with the names of its 車輌 / 傭車 / 部門 / 所属
            const string sql = @"
                SELECT
                     運転手マスタ.運転手コード
                    ,運転手マスタ.運転手名
                    ,運転手マスタ.ふりがな
                    ,運転手マスタ.郵便
                    ,運転手マスタ.住所1
                    ,運転手マスタ.住所2
                    ,運転手マスタ.電話番号
                    ,運転手マスタ.携帯番号
                    ,運転手マスタ.生年月日
                    ,運転手マスタ.入社日
                    ,運転手マスタ.退社日
                    ,運転手マスタ.運転手区分
                    ,運転手マスタ.車輌コード
                    ,車輌マスタ.車番
                    ,運転手マスタ.傭車コード
                    ,傭車マスタ.略称 AS 傭車略称
                    ,運転手マスタ.部門コード
                    ,部門マスタ.名称 AS 部門名称
                    ,運転手マスタ.所属コード
                    ,所属マスタ.名称 AS 所属名称
                    ,運転手マスタ.所定労働
                    ,運転手マスタ.雇用区分
                    ,運転手マスタ.配車表示
                    ,運転手マスタ.手当掛率
                    ,運転手マスタ.備考
                    ,運転手マスタ.ETCカード
                    ,運転手マスタ.デジタココード
                    -- 運転者台帳1
                    ,運転手マスタ.性別
                    ,運転手マスタ.選任年月日
                    ,運転手マスタ.撮影日
                    ,運転手マスタ.写真パス
                    ,運転手マスタ.免許証番号
                    ,運転手マスタ.取得年月日
                    ,運転手マスタ.条件
                    ,運転手マスタ.大型
                    ,運転手マスタ.普通
                    ,運転手マスタ.大特
                    ,運転手マスタ.けん引
                    ,運転手マスタ.大2
                    ,運転手マスタ.普2
                    ,運転手マスタ.大特2
                    ,運転手マスタ.けん引2
                    ,運転手マスタ.中型
                    ,運転手マスタ.中型限定
                    ,運転手マスタ.準中型
                    ,運転手マスタ.準中型限定
                    ,運転手マスタ.中2
                    ,運転手マスタ.中2限定
                    ,運転手マスタ.ユニック
                    ,運転手マスタ.玉掛け
                    ,運転手マスタ.フォーク
                    ,運転手マスタ.職歴日付1
                    ,運転手マスタ.職歴日付2
                    ,運転手マスタ.職歴日付3
                    ,運転手マスタ.職歴日付4
                    ,運転手マスタ.職歴日付5
                    ,運転手マスタ.職歴1
                    ,運転手マスタ.職歴2
                    ,運転手マスタ.職歴3
                    ,運転手マスタ.職歴4
                    ,運転手マスタ.職歴5
                    ,運転手マスタ.自動車種類1
                    ,運転手マスタ.自動車種類2
                    ,運転手マスタ.定員数1
                    ,運転手マスタ.定員数2
                    ,運転手マスタ.積載量1
                    ,運転手マスタ.積載量2
                    ,運転手マスタ.経験年数1
                    ,運転手マスタ.経験年数2
                    ,運転手マスタ.経験月数1
                    ,運転手マスタ.経験月数2
                    ,運転手マスタ.経験事業所名1
                    ,運転手マスタ.経験事業所名2
                    -- 運転者台帳4
                    ,運転手マスタ.健保加入年月日
                    ,運転手マスタ.厚保加入年月日
                    ,運転手マスタ.雇保加入年月日
                    ,運転手マスタ.労災加入年月日
                    ,運転手マスタ.健保番号
                    ,運転手マスタ.厚保番号
                    ,運転手マスタ.雇保番号
                    ,運転手マスタ.労災番号
                    ,運転手マスタ.徒歩
                    ,運転手マスタ.自動車
                    ,運転手マスタ.バス
                    ,運転手マスタ.電車
                    ,運転手マスタ.自転車
                    ,運転手マスタ.その他
                    ,運転手マスタ.通勤方法その他
                    ,運転手マスタ.通勤h
                    ,運転手マスタ.通勤m
                    ,運転手マスタ.緊急連絡先
                    ,運転手マスタ.緊急連絡先番号
                    ,運転手マスタ.退社理由1
                    ,運転手マスタ.退社理由2
                    ,運転手マスタ.台帳備考1
                    ,運転手マスタ.台帳備考2
                    ,運転手マスタ.台帳備考3
                    ,運転手マスタ.台帳備考4
                    ,運転手マスタ.台帳備考5
                    ,運転手マスタ.台帳備考6
                    ,運転手マスタ.台帳備考7
                    ,運転手マスタ.台帳備考8
                FROM 運転手マスタ WITH(NOLOCK)
                LEFT JOIN 車輌マスタ WITH(NOLOCK)
                    ON 運転手マスタ.車輌コード = 車輌マスタ.車輌コード
                LEFT JOIN 傭車マスタ WITH(NOLOCK)
                    ON 運転手マスタ.傭車コード = 傭車マスタ.傭車コード
                LEFT JOIN 部門マスタ WITH(NOLOCK)
                    ON 運転手マスタ.部門コード = 部門マスタ.コード
                LEFT JOIN 所属マスタ WITH(NOLOCK)
                    ON 運転手マスタ.所属コード = 所属マスタ.コード
                WHERE 運転手マスタ.運転手コード = @Code;";

            using var conn = _factory.CreateConnection();
            return await conn.QuerySingleOrDefaultAsync<DriverMasterViewModel>(sql, new { Code = code });
        }

        // legacy INS_Kotei + Dsp_List: the driver's 固定経費 rows, in the grid order
        public async Task<List<DriverFixedExpenseDto>> GetFixedExpensesAsync(string code)
        {
            const string sql = @"
                SELECT
                     固定経費マスタ.キー
                    ,固定経費マスタ.経費コード
                    ,経費マスタ.名称 AS 経費名称
                    ,固定経費マスタ.車輌コード
                    ,車輌マスタ.車番
                    ,固定経費マスタ.分割方法
                    ,固定経費マスタ.金額
                    ,固定経費マスタ.金額1
                    ,固定経費マスタ.金額2
                    ,固定経費マスタ.金額3
                    ,固定経費マスタ.金額4
                    ,固定経費マスタ.金額5
                    ,固定経費マスタ.金額6
                    ,固定経費マスタ.金額7
                    ,固定経費マスタ.金額8
                    ,固定経費マスタ.金額9
                    ,固定経費マスタ.金額10
                    ,固定経費マスタ.金額11
                    ,固定経費マスタ.金額12
                FROM 固定経費マスタ WITH(NOLOCK)
                LEFT JOIN 経費マスタ WITH(NOLOCK)
                    ON 固定経費マスタ.経費コード = 経費マスタ.経費コード
                LEFT JOIN 車輌マスタ WITH(NOLOCK)
                    ON 固定経費マスタ.車輌コード = 車輌マスタ.車輌コード
                WHERE 固定経費マスタ.運転手コード = @Code
                ORDER BY 固定経費マスタ.経費コード, 固定経費マスタ.運転手コード, 固定経費マスタ.キー;";

            using var conn = _factory.CreateConnection();
            return (await conn.QueryAsync<DriverFixedExpenseDto>(sql, new { Code = code })).ToList();
        }

        public async Task<bool> ExistsAsync(string code)
        {
            const string sql = "SELECT COUNT(1) FROM 運転手マスタ WITH(NOLOCK) WHERE 運転手コード = @Code;";

            using var conn = _factory.CreateConnection();
            return await conn.ExecuteScalarAsync<int>(sql, new { Code = code }) > 0;
        }

        // =========================================
        //     Codes (Set_Code / Data_Move)
        // =========================================

        public async Task<long> GetMaxCodeAsync()
        {
            const string sql = @"
                SELECT TOP 1 運転手コード
                FROM 運転手マスタ WITH(NOLOCK)
                WHERE 運転手コード >= '0000000000'
                ORDER BY 運転手コード DESC;";

            using var conn = _factory.CreateConnection();
            var code = await conn.ExecuteScalarAsync<string?>(sql);

            return long.TryParse(code, out var value) ? value : 0;
        }

        public async Task<string?> GetPreviousCodeAsync(string code)
        {
            const string sql = @"
                SELECT TOP 1 運転手コード
                FROM 運転手マスタ WITH(NOLOCK)
                WHERE 運転手コード < @Code
                ORDER BY 運転手コード DESC;";

            using var conn = _factory.CreateConnection();
            return await conn.ExecuteScalarAsync<string?>(sql, new { Code = code });
        }

        public async Task<string?> GetNextCodeAsync(string code)
        {
            const string sql = @"
                SELECT TOP 1 運転手コード
                FROM 運転手マスタ WITH(NOLOCK)
                WHERE 運転手コード > @Code
                ORDER BY 運転手コード ASC;";

            using var conn = _factory.CreateConnection();
            return await conn.ExecuteScalarAsync<string?>(sql, new { Code = code });
        }

        // =========================================
        //          Dropdowns (Set_Cmb)
        // =========================================

        public async Task<IEnumerable<DriverMasterOptionDto>> GetVehiclesAsync()
        {
            const string sql = @"
                SELECT ISNULL(車輌コード, '') AS Code, ISNULL(車番, '') AS Name
                FROM 車輌マスタ WITH(NOLOCK)
                ORDER BY 車輌コード;";

            using var conn = _factory.CreateConnection();
            return await conn.QueryAsync<DriverMasterOptionDto>(sql);
        }

        public async Task<IEnumerable<DriverMasterOptionDto>> GetCharteredAsync()
        {
            const string sql = @"
                SELECT ISNULL(傭車コード, '') AS Code, ISNULL(略称, '') AS Name
                FROM 傭車マスタ WITH(NOLOCK)
                ORDER BY 傭車コード;";

            using var conn = _factory.CreateConnection();
            return await conn.QueryAsync<DriverMasterOptionDto>(sql);
        }

        // =========================================
        //              Lookups
        // =========================================
        // Each returns null when the code is not registered, "" when it is but has no name.
        // Legacy reads these without a 削除 filter.

        public Task<string?> FindVehicleNumberAsync(string code)
        {
            return FindNameAsync("SELECT ISNULL(車番, '') FROM 車輌マスタ WITH(NOLOCK) WHERE 車輌コード = @Code;", code);
        }

        public Task<string?> FindCharteredNameAsync(string code)
        {
            return FindNameAsync("SELECT ISNULL(略称, '') FROM 傭車マスタ WITH(NOLOCK) WHERE 傭車コード = @Code;", code);
        }

        public Task<string?> FindDepartmentNameAsync(string code)
        {
            return FindNameAsync("SELECT ISNULL(名称, '') FROM 部門マスタ WITH(NOLOCK) WHERE コード = @Code;", code);
        }

        public Task<string?> FindAffiliationNameAsync(string code)
        {
            return FindNameAsync("SELECT ISNULL(名称, '') FROM 所属マスタ WITH(NOLOCK) WHERE コード = @Code;", code);
        }

        public Task<string?> FindExpenseNameAsync(string code)
        {
            return FindNameAsync("SELECT ISNULL(名称, '') FROM 経費マスタ WITH(NOLOCK) WHERE 経費コード = @Code;", code);
        }

        public Task<string?> FindAddressAsync(string postalCode)
        {
            return FindNameAsync("SELECT ISNULL(住所, '') FROM 郵便番号マスタ WITH(NOLOCK) WHERE 郵便番号 = @Code;", postalCode);
        }

        private async Task<string?> FindNameAsync(string sql, string code)
        {
            using var conn = _factory.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<string?>(sql, new { Code = code });
        }

        // =========================================
        //          管理マスタ '01'
        // =========================================

        public async Task<DriverMasterLicenseDto> GetLicenseAsync()
        {
            const string sql = @"
                SELECT SEC3, SEC4, SEC5, SEC9
                FROM 管理マスタ WITH(NOLOCK)
                WHERE 自社コード = '01';";

            using var conn = _factory.CreateConnection();
            var row = await conn.QueryFirstOrDefaultAsync(sql);

            // legacy FrmMain: a NULL SEC reads as 0 (licence off)
            static bool On(object? value) => Convert.ToString(value)?.Trim() == "1";

            return row == null
                ? new DriverMasterLicenseDto()
                : new DriverMasterLicenseDto
                {
                    FixedCost = On(row.SEC3),
                    Digitaco = On(row.SEC4),
                    Etc = On(row.SEC5),
                    Payroll = On(row.SEC9)
                };
        }

        // legacy NINPUT_Chk = 管理マスタ 01 発着地区分 (0 or 1)
        public async Task<string> GetArrivalDepartureTypeAsync()
        {
            const string sql = "SELECT TOP 1 発着地区分 FROM 管理マスタ WITH(NOLOCK) WHERE 自社コード = '01';";

            using var conn = _factory.CreateConnection();
            var value = await conn.ExecuteScalarAsync<object?>(sql);

            return Convert.ToString(value)?.Trim() ?? "";
        }

        // =========================================
        //          Save (Data_Repl)
        // =========================================

        public async Task SaveAsync(DriverMasterViewModel model, string terminalCode, byte[]? photo)
        {
            using var conn = _factory.CreateConnection();
            conn.Open();
            using var tran = conn.BeginTransaction();

            try
            {
                var isNew = await conn.ExecuteScalarAsync<int>(
                    "SELECT COUNT(1) FROM 運転手マスタ WITH(UPDLOCK, HOLDLOCK) WHERE 運転手コード = @Code;",
                    new { Code = model.運転手コード }, tran) == 0;

                // legacy: insert the key, then update every column
                if (isNew)
                {
                    await conn.ExecuteAsync(
                        "INSERT INTO 運転手マスタ (運転手コード) VALUES (@Code);",
                        new { Code = model.運転手コード }, tran);
                }

                var parameters = new DynamicParameters(model);
                parameters.Add("入力端末", terminalCode);

                await conn.ExecuteAsync(UpdateDriverSql, parameters, tran);

                // legacy: when 写真パス is set, 運転手写真 = the file's image (OPENROWSET BULK on the SQL Server).
                // The web server reads the file instead; a blank 写真パス leaves the stored image as it is.
                if (photo != null)
                {
                    var photoParameters = new DynamicParameters();
                    photoParameters.Add("Code", model.運転手コード);
                    photoParameters.Add("Photo", photo, DbType.Binary, size: -1);

                    await conn.ExecuteAsync(
                        "UPDATE 運転手マスタ SET 運転手写真 = @Photo WHERE 運転手コード = @Code;",
                        photoParameters, tran);
                }

                await SaveFixedExpensesAsync(conn, tran, model, terminalCode);

                await SaveHistoriesAsync(conn, tran, model, terminalCode);

                tran.Commit();
            }
            catch
            {
                tran.Rollback();
                throw;
            }
        }

        // Every column legacy Data_Repl writes (the 運転者台帳 columns included).
        private const string UpdateDriverSql = @"
            UPDATE 運転手マスタ SET
                 運転手名 = @運転手名
                ,ふりがな = @ふりがな
                ,郵便 = @郵便
                ,住所1 = @住所1
                ,住所2 = @住所2
                ,電話番号 = @電話番号
                ,携帯番号 = @携帯番号
                ,生年月日 = @生年月日
                ,入社日 = @入社日
                ,退社日 = @退社日
                ,運転手区分 = @運転手区分
                ,車輌コード = @車輌コード
                ,傭車コード = @傭車コード
                ,部門コード = @部門コード
                ,所属コード = @所属コード
                ,所定労働 = @所定労働
                ,雇用区分 = @雇用区分
                ,配車表示 = @配車表示
                ,手当掛率 = @手当掛率
                ,ETCカード = @ETCカード
                ,デジタココード = @デジタココード
                ,備考 = @備考
                ,免許証番号 = @免許証番号
                ,条件 = @条件
                ,取得年月日 = @取得年月日
                ,大型 = @大型
                ,普通 = @普通
                ,大特 = @大特
                ,けん引 = @けん引
                ,大2 = @大2
                ,普2 = @普2
                ,大特2 = @大特2
                ,けん引2 = @けん引2
                ,中型 = @中型
                ,中型限定 = @中型限定
                ,準中型 = @準中型
                ,準中型限定 = @準中型限定
                ,中2 = @中2
                ,中2限定 = @中2限定
                ,ユニック = @ユニック
                ,玉掛け = @玉掛け
                ,フォーク = @フォーク
                ,自動車種類1 = @自動車種類1
                ,定員数1 = @定員数1
                ,積載量1 = @積載量1
                ,経験年数1 = @経験年数1
                ,経験月数1 = @経験月数1
                ,経験事業所名1 = @経験事業所名1
                ,自動車種類2 = @自動車種類2
                ,定員数2 = @定員数2
                ,積載量2 = @積載量2
                ,経験年数2 = @経験年数2
                ,経験月数2 = @経験月数2
                ,経験事業所名2 = @経験事業所名2
                ,職歴日付1 = @職歴日付1
                ,職歴1 = @職歴1
                ,職歴日付2 = @職歴日付2
                ,職歴2 = @職歴2
                ,職歴日付3 = @職歴日付3
                ,職歴3 = @職歴3
                ,職歴日付4 = @職歴日付4
                ,職歴4 = @職歴4
                ,職歴日付5 = @職歴日付5
                ,職歴5 = @職歴5
                ,台帳備考1 = @台帳備考1
                ,台帳備考2 = @台帳備考2
                ,台帳備考3 = @台帳備考3
                ,台帳備考4 = @台帳備考4
                ,台帳備考5 = @台帳備考5
                ,台帳備考6 = @台帳備考6
                ,台帳備考7 = @台帳備考7
                ,台帳備考8 = @台帳備考8
                ,性別 = @性別
                ,選任年月日 = @選任年月日
                ,退社理由1 = @退社理由1
                ,退社理由2 = @退社理由2
                ,健保加入年月日 = @健保加入年月日
                ,厚保加入年月日 = @厚保加入年月日
                ,雇保加入年月日 = @雇保加入年月日
                ,労災加入年月日 = @労災加入年月日
                ,健保番号 = @健保番号
                ,厚保番号 = @厚保番号
                ,雇保番号 = @雇保番号
                ,労災番号 = @労災番号
                ,写真パス = @写真パス
                ,撮影日 = @撮影日
                ,徒歩 = @徒歩
                ,自動車 = @自動車
                ,バス = @バス
                ,電車 = @電車
                ,自転車 = @自転車
                ,その他 = @その他
                ,通勤方法その他 = @通勤方法その他
                ,通勤h = @通勤h
                ,通勤m = @通勤m
                ,緊急連絡先 = @緊急連絡先
                ,緊急連絡先番号 = @緊急連絡先番号
                ,登録日 = GETDATE()
                ,送信済 = '1'
                ,入力端末 = @入力端末
                ,削除 = '0'
            WHERE 運転手コード = @運転手コード;";

        // legacy Data_Repl (23.02.11): DELETE the driver's 固定経費 and INSERT the screen's rows (wk固定経費マスタ表示).
        // A row keeps its キー; a row added on screen gets the next free one (legacy Set_No: MAX(キー) + 1).
        private static async Task SaveFixedExpensesAsync(
            IDbConnection conn, IDbTransaction tran, DriverMasterViewModel model, string terminalCode)
        {
            // null = the 固定経費 tab is not licensed / not sent: leave the stored rows as they are
            if (model.固定経費 == null)
            {
                return;
            }

            var ownKeys = (await conn.QueryAsync<int>(
                "SELECT キー FROM 固定経費マスタ WITH(UPDLOCK, HOLDLOCK) WHERE 運転手コード = @Code;",
                new { Code = model.運転手コード }, tran)).ToHashSet();

            var nextKey = await conn.ExecuteScalarAsync<int>(
                "SELECT ISNULL(MAX(キー), 0) FROM 固定経費マスタ WITH(UPDLOCK, HOLDLOCK);", transaction: tran);

            var usedKeys = new HashSet<int>();

            var rows = model.固定経費.Select(row =>
            {
                // a key of another driver (or a repeated one) cannot be kept: it gets a new key
                var key = row.キー > 0 && ownKeys.Contains(row.キー) && usedKeys.Add(row.キー)
                    ? row.キー
                    : ++nextKey;

                usedKeys.Add(key);

                return new
                {
                    キー = key,
                    運転手コード = model.運転手コード,
                    row.経費コード,
                    row.車輌コード,
                    row.分割方法,
                    row.金額,
                    row.金額1,
                    row.金額2,
                    row.金額3,
                    row.金額4,
                    row.金額5,
                    row.金額6,
                    row.金額7,
                    row.金額8,
                    row.金額9,
                    row.金額10,
                    row.金額11,
                    row.金額12,
                    入力端末 = terminalCode
                };
            }).ToList();

            await conn.ExecuteAsync(
                "DELETE FROM 固定経費マスタ WHERE 運転手コード = @Code;",
                new { Code = model.運転手コード }, tran);

            if (rows.Count == 0)
            {
                return;
            }

            const string insertSql = @"
                INSERT INTO 固定経費マスタ (
                     キー, 運転手コード, 経費コード, 車輌コード, 分割方法
                    ,金額, 金額1, 金額2, 金額3, 金額4, 金額5, 金額6, 金額7, 金額8, 金額9, 金額10, 金額11, 金額12
                    ,登録日, 送信済, 入力端末, 削除
                ) VALUES (
                     @キー, @運転手コード, @経費コード, @車輌コード, @分割方法
                    ,@金額, @金額1, @金額2, @金額3, @金額4, @金額5, @金額6, @金額7, @金額8, @金額9, @金額10, @金額11, @金額12
                    ,GETDATE(), '1', @入力端末, '0'
                );";

            await conn.ExecuteAsync(insertSql, rows, tran);
        }

        // legacy Data_Repl: for each history, DELETE the driver's rows and INSERT the screen's rows (its wk table)
        // with 登録日 = now, 送信済 '1', 入力端末, 削除 '0'.
        private static async Task SaveHistoriesAsync(
            IDbConnection conn, IDbTransaction tran, DriverMasterViewModel model, string terminalCode)
        {
            foreach (var table in HistoryTables.Values)
            {
                var screenRows = table.Get(model);

                // null = not sent: the stored rows stay
                if (screenRows == null)
                {
                    continue;
                }

                await conn.ExecuteAsync(
                    $"DELETE FROM {table.Table} WHERE 運転手コード = @Code;",
                    new { Code = model.運転手コード }, tran);

                // one row per date (the table key); the screen already keeps one, the last one wins here as well
                var rows = screenRows
                    .GroupBy(row => row.日付.Date)
                    .Select(group => group.Last())
                    .Select(row => new
                    {
                        Code = model.運転手コード,
                        日付 = row.日付.Date,
                        row.番号,
                        row.種類,
                        row.内容,
                        row.車番,
                        row.事故種類,
                        row.責任,
                        row.事故記録NO,
                        row.概要,
                        row.区分,
                        row.異動事項,
                        row.備考,
                        入力端末 = terminalCode
                    })
                    .ToList();

                if (rows.Count == 0)
                {
                    continue;
                }

                var columns = string.Join("", table.Columns.Select(column => $", {column}"));
                var values = string.Join("", table.Columns.Select(column => $", @{column}"));

                var insertSql = $@"
                    INSERT INTO {table.Table} (運転手コード, 日付{columns}, 登録日, 送信済, 入力端末, 削除)
                    VALUES (@Code, @日付{values}, GETDATE(), '1', @入力端末, '0');";

                await conn.ExecuteAsync(insertSql, rows, tran);
            }
        }

        // =========================================
        //      Delete (Del_Chk + Data_Del)
        // =========================================

        public async Task<string?> GetDeleteBlockReasonAsync(string code, bool checkVehicleMaster)
        {
            // Checked in the legacy order; the first table in use gives the message.
            var checks = new List<(string Sql, string Message)>();

            // legacy: only when 管理マスタ 発着地区分 (NINPUT_Chk) = 0
            if (checkVehicleMaster)
            {
                checks.Add(("SELECT TOP 1 1 FROM 車輌マスタ WITH(NOLOCK) WHERE 運転手コード = @Code;",
                    "車輌マスタに登録されていますので、削除出来ません！！"));
            }

            checks.Add(("SELECT TOP 1 1 FROM 作業明細 WITH(NOLOCK) WHERE 運転手コード = @Code;",
                "受注データに登録されていますので、削除出来ません！！"));
            checks.Add(("SELECT TOP 1 1 FROM 日報HEAD WITH(NOLOCK) WHERE 運転手コード = @Code;",
                "運転日報データに登録されていますので、削除出来ません！！"));
            checks.Add(("SELECT TOP 1 1 FROM 経費データ WITH(NOLOCK) WHERE 運転手コード = @Code;",
                "経費データに登録されていますので、削除出来ません！！"));
            checks.Add(("SELECT TOP 1 1 FROM 高速データ WITH(NOLOCK) WHERE 運転手コード = @Code;",
                "高速データに登録されていますので、削除出来ません！！"));

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
            // legacy Data_Del: the driver and its 8 histories in one transaction.
            // Legacy does not delete the driver's 固定経費マスタ rows; kept as legacy.
            const string sql = @"
                DELETE FROM 運転手マスタ WHERE 運転手コード = @Code;
                DELETE FROM 運転免許証履歴 WHERE 運転手コード = @Code;
                DELETE FROM 事故履歴 WHERE 運転手コード = @Code;
                DELETE FROM 違反履歴 WHERE 運転手コード = @Code;
                DELETE FROM 教育実施履歴 WHERE 運転手コード = @Code;
                DELETE FROM 運転経歴証明書 WHERE 運転手コード = @Code;
                DELETE FROM 適性診断履歴 WHERE 運転手コード = @Code;
                DELETE FROM 健康診断履歴 WHERE 運転手コード = @Code;
                DELETE FROM 異動履歴 WHERE 運転手コード = @Code;";

            using var conn = _factory.CreateConnection();
            conn.Open();
            using var tran = conn.BeginTransaction();

            try
            {
                await conn.ExecuteAsync(sql, new { Code = code }, tran);
                tran.Commit();
            }
            catch
            {
                tran.Rollback();
                throw;
            }
        }
    }
}
