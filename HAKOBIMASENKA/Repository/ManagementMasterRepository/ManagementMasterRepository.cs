/// <summary>
/// Management Master Repository
///
/// Database Access Layer.
///
/// Related Table(s):
/// 管理マスタ
/// 管理OPマスタ
/// 運賃形態マスタ
/// 補償マスタ
///
/// Migrated From:
/// FrmM_Kanri.vb
/// </summary>

using Dapper;
using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ManagementMasterViewModel;
using System.Data;

namespace HAKOBIMASENKA.Repository.ManagementMasterRepository.ManagementMasterRepository
    {
        public class ManagementMasterRepository : IManagementMasterRepository
        {
            private readonly IDbConnectionFactory _connectionFactory;

        public ManagementMasterRepository(IDbConnectionFactory connectionFactory)
            {
                _connectionFactory = connectionFactory;
            }

        public async Task<List<ManagementMasterResultDto>>GetListAsync()
            {
                const string sql = @"
                SELECT 自社コード,
                略称
                FROM 管理マスタ WITH(NOLOCK)
                -- every row, as legacy Dsp_List (no 削除 filter)
                ORDER BY 自社コード";

                using var conn = _connectionFactory.CreateConnection();

                var rows = await conn.QueryAsync<ManagementMasterResultDto>(sql);

                return [.. rows];
            }

            public async Task<ManagementMasterViewModel?> GetByCodeAsync(string code)
            {
                using var conn = _connectionFactory.CreateConnection();

                var model = new ManagementMasterViewModel();

                //
                // 管理マスタ (Dsp_Data)
                //
                const string managementSql = @"
                SELECT *
                FROM 管理マスタ WITH(NOLOCK)
                WHERE 自社コード = @Code";

                var management = await conn.QueryFirstOrDefaultAsync(managementSql, new { Code = code });

                if (management == null)
                {
                    return null;
                }

                // 顧客No / サーバーパス are not in the table: the controller fills them from the settings (legacy E_CODE / SQL_Name)
                model.自社コード = management.自社コード ?? "";
                model.自社名1 = management.自社名1 ?? "";
                model.自社名2 = management.自社名2 ?? "";
                model.略称 = management.略称 ?? "";
                model.郵便番号 = management.郵便 ?? "";
                model.住所1 = management.住所1 ?? "";
                model.住所2 = management.住所2 ?? "";
                model.電話番号 = management.電話番号 ?? "";
                // Column name is FAX番号 (dynamic rows are case-sensitive).
                model.faX番号 = management.FAX番号 ?? "";
                model.銀行1 = management.銀行1 ?? "";
                model.銀行2 = management.銀行2 ?? "";
                model.運行管理者 = management.運行管理者 ?? "";
                model.登録番号 = management.登録番号 ?? "";

                //
                // System settings are always on 自社コード '01' (Dsp_Data2)
                //
                const string settingsSql = @"
                SELECT *
                FROM 管理マスタ WITH(NOLOCK)
                WHERE 自社コード = '01'";

                var settings =
                    await conn.QueryFirstOrDefaultAsync(
                        settingsSql);

                if (settings == null)
                {
                    return model;
                }

                model.新消費税率施行日 = settings.消費税施工日;
                model.旧消費税率 = settings.旧消費税 == null ? null : (int?)Convert.ToInt32(settings.旧消費税);
                model.新消費税率 = settings.新消費税 == null ? null : (int?)Convert.ToInt32(settings.新消費税);

                model.新軽油税施行日 = settings.軽油税施工日;
                // 軽油税 keeps its decimals (legacy GcNumber ##0.00).
                model.旧軽油税 = settings.旧軽油税 == null ? null : (decimal?)Convert.ToDecimal(settings.旧軽油税);
                model.新軽油税 = settings.新軽油税 == null ? null : (decimal?)Convert.ToDecimal(settings.新軽油税);

                model.対象月度 = settings.対象月度;

                // 伝票番号1-10 = legacy TxtDNo1-10, numbered across each row of the two columns
                // (受注 運転日報 / 仕入 入金 / 傭車 仕入支払 / 経費 有料 / 作業 予備); other screens read these counters
                model.受注伝票 = settings.伝票番号1 == null ? null : (int?)Convert.ToInt32(settings.伝票番号1);
                model.運転日報 = settings.伝票番号2 == null ? null : (int?)Convert.ToInt32(settings.伝票番号2);
                model.仕入伝票 = settings.伝票番号3 == null ? null : (int?)Convert.ToInt32(settings.伝票番号3);
                model.入金伝票 = settings.伝票番号4 == null ? null : (int?)Convert.ToInt32(settings.伝票番号4);
                model.傭車伝票 = settings.伝票番号5 == null ? null : (int?)Convert.ToInt32(settings.伝票番号5);
                model.仕入支払 = settings.伝票番号6 == null ? null : (int?)Convert.ToInt32(settings.伝票番号6);
                model.経費伝票 = settings.伝票番号7 == null ? null : (int?)Convert.ToInt32(settings.伝票番号7);
                model.支払伝票 = settings.伝票番号8 == null ? null : (int?)Convert.ToInt32(settings.伝票番号8);
                model.作業伝票 = settings.伝票番号9 == null ? null : (int?)Convert.ToInt32(settings.伝票番号9);
                model.予約番号 = settings.伝票番号10 == null ? null : (int?)Convert.ToInt32(settings.伝票番号10);

                model.売上端数 = ToNullableInt(settings.売上端数);
                model.消費税区分 = ToNullableInt(settings.税区分);
                model.消費税端数 = ToNullableInt(settings.税端数);

                model.発着地区分 = ToNullableInt(settings.発着地区分);
                model.日付区分 = ToNullableInt(settings.和西暦);
                model.部門管理 = ToNullableInt(settings.部門管理);

                model.宛先敬称 = settings.宛先敬称 ?? "";

                model.送信先1 = settings.送信先1 ?? "";
                model.送信先2 = settings.送信先2 ?? "";

                model.実車区分 = ToNullableInt(settings.実車区分);
                model.課税割増 = ToNullableInt(settings.課税割増);
                model.非課税割増 = ToNullableInt(settings.非課税割増);
                model.請求日設定 = ToNullableInt(settings.請求日設定);
                model.警告日数 = ToNullableInt(settings.警告日数);

                model.シリアルNO1 = settings.ｼﾘｱﾙNO1 ?? "";
                model.シリアルNO2 = settings.ｼﾘｱﾙNO2 ?? "";
                model.シリアルNO3 = settings.ｼﾘｱﾙNO3 ?? "";
                model.シリアルNO4 = settings.ｼﾘｱﾙNO4 ?? "";
                model.シリアルNO5 = settings.ｼﾘｱﾙNO5 ?? "";
                model.シリアルNO6 = settings.ｼﾘｱﾙNO6 ?? "";
                model.シリアルNO7 = settings.ｼﾘｱﾙNO7 ?? "";
                model.シリアルNO8 = settings.ｼﾘｱﾙNO8 ?? "";
                model.シリアルNO9 = settings.ｼﾘｱﾙNO9 ?? "";
                model.シリアルNO10 = settings.ｼﾘｱﾙNO10 ?? "";

                // SEC flags: a licensed serial is locked on screen (legacy SEC(i) = 1 → Enabled = False)
                var settingsRow = (IDictionary<string, object?>)settings;

                for (var i = 1; i <= 10; i++)
                {
                    model.シリアルロック[i - 1] = Convert.ToString(settingsRow[$"SEC{i}"])?.Trim() == "1";
                }

                //
                // 管理OPマスタ
                //
                const string opSql = @"
                SELECT *
                FROM 管理OPマスタ WITH(NOLOCK)
                WHERE 自社コード = '01'";

                var op = await conn.QueryFirstOrDefaultAsync(opSql);

                    if (op != null)
                    {
                        model.給与締切日 = ToNullableInt(op.給与締切日);

                        // Columns are 給与ファイル / 財務ファイル (full-width カナ).
                        model.給与ファイル = op.給与ファイル ?? "";
                        model.財務ファイル = op.財務ファイル ?? "";

                        model.給与掛率1 = op.給与掛率1 == null ? null : (decimal?)Convert.ToDecimal(op.給与掛率1);
                        model.給与掛率2 = op.給与掛率2 == null ? null : (decimal?)Convert.ToDecimal(op.給与掛率2);
                        model.給与掛率3 = op.給与掛率3 == null ? null : (decimal?)Convert.ToDecimal(op.給与掛率3);
                        model.給与掛率4 = op.給与掛率4 == null ? null : (decimal?)Convert.ToDecimal(op.給与掛率4);

                        model.カード優先 = ToNullableInt(op.カード優先);

                        model.手当1 = op.手当1 ?? "";
                        model.手当2 = op.手当2 ?? "";
                        model.手当3 = op.手当3 ?? "";
                        model.手当4 = op.手当4 ?? "";
                        model.手当5 = op.手当5 ?? "";
                        model.手当6 = op.手当6 ?? "";
                        model.手当7 = op.手当7 ?? "";

                        model.支給1 = op.支給1 ?? "";
                        model.支給2 = op.支給2 ?? "";
                        model.支給3 = op.支給3 ?? "";
                        model.支給4 = op.支給4 ?? "";
                        model.支給5 = op.支給5 ?? "";

                        // Legacy stored '1 ' (with a space) in some rows.
                        model.財務区分1 = ((string?)op.財務区分1 ?? "").Trim();
                        model.財務区分2 = ((string?)op.財務区分2 ?? "").Trim();
                        model.財務区分3 = ((string?)op.財務区分3 ?? "").Trim();
                        model.財務区分4 = ((string?)op.財務区分4 ?? "").Trim();
                        model.財務区分5 = ((string?)op.財務区分5 ?? "").Trim();
                        model.財務区分6 = ((string?)op.財務区分6 ?? "").Trim();
                        model.財務区分7 = ((string?)op.財務区分7 ?? "").Trim();
                        model.財務区分8 = ((string?)op.財務区分8 ?? "").Trim();
                    }

                    //
                    // 運賃形態マスタ: each name goes in the box of its コード 1-9 (legacy TxtSize(コード))
                    //
                    var fares = await GetNamesByCodeAsync(conn, "SELECT コード, 名称 FROM 運賃形態マスタ WITH(NOLOCK)");

                model.運賃形態1 = fares[1];
                model.運賃形態2 = fares[2];
                model.運賃形態3 = fares[3];
                model.運賃形態4 = fares[4];
                model.運賃形態5 = fares[5];
                model.運賃形態6 = fares[6];
                model.運賃形態7 = fares[7];
                model.運賃形態8 = fares[8];
                model.運賃形態9 = fares[9];

                    //
                    // 補償マスタ: same, by コード (legacy TxtHosho(コード))
                    //
                    var compensations = await GetNamesByCodeAsync(conn, "SELECT コード, 名称 FROM 補償マスタ WITH(NOLOCK)");

                model.補償1 = compensations[1];
                model.補償2 = compensations[2];
                model.補償3 = compensations[3];
                model.補償4 = compensations[4];
                model.補償5 = compensations[5];
                model.補償6 = compensations[6];
                model.補償7 = compensations[7];
                model.補償8 = compensations[8];
                model.補償9 = compensations[9];

                return model;
            }

            public async Task<bool> ExistsAsync(string code)
            {
                const string sql = @"
                SELECT 自社コード
                FROM 管理マスタ WITH(NOLOCK)
                WHERE 自社コード = @Code";

                using var conn = _connectionFactory.CreateConnection();

                var hit = await conn.QueryFirstOrDefaultAsync<string>(sql,
                            new { Code = code });

                return hit != null;
            }

            public async Task<string?> GetNextCodeAsync()
            {
                // Set_Code
                const string sql = @"
                SELECT TOP 1 自社コード
                FROM 管理マスタ WITH(NOLOCK)
                WHERE 自社コード >= '00'
                ORDER BY 自社コード DESC";

                using var conn = _connectionFactory.CreateConnection();

                var top = await conn.QueryFirstOrDefaultAsync<string>(sql);

                long current = 0;

                if (top != null)
                {
                    long.TryParse(top, out current);
                }

                var next = current + 1;

                // 2-digit codes only: nothing offered after 99 (legacy).
                if (next >= 100)
                {
                    return string.Empty;
                }

                return next
                    .ToString()
                    .PadLeft(2, '0');
            }

            public async Task SaveAsync(ManagementMasterViewModel model, string terminalCode)
            {
                using var conn = _connectionFactory.CreateConnection();

                conn.Open();

                using var tran = conn.BeginTransaction();

                try
                {
                //
                // 管理マスタ: company row (insert when the code is new, then update)
                //
                const string sql = @"
                IF NOT EXISTS (SELECT 1 FROM 管理マスタ WITH(UPDLOCK, HOLDLOCK) WHERE 自社コード = @自社コード)
                    INSERT INTO 管理マスタ (自社コード) VALUES (@自社コード);

                UPDATE 管理マスタ
                SET
                     自社名1     = @自社名1
                    ,自社名2     = @自社名2
                    ,略称        = @略称
                    ,郵便        = @郵便番号
                    ,住所1       = @住所1
                    ,住所2       = @住所2
                    ,電話番号    = @電話番号
                    ,FAX番号     = @FAX番号
                    ,銀行1       = @銀行1
                    ,銀行2       = @銀行2
                    ,運行管理者  = @運行管理者
                    ,宛先敬称    = @宛先敬称
                    ,登録番号    = @登録番号
                    ,登録日      = GETDATE()
                    ,送信済      = '1'
                    ,入力端末    = @Terminal
                    ,削除        = '0'
                WHERE 自社コード = @自社コード";

                await conn.ExecuteAsync(
                    sql,
                        new
                            {
                            model.自社コード,
                            model.自社名1,
                            model.自社名2,
                            model.略称,
                            model.郵便番号,
                            model.住所1,
                            model.住所2,
                            model.電話番号,
                            FAX番号 = model.faX番号,
                            model.銀行1,
                            model.銀行2,
                            model.運行管理者,
                            model.宛先敬称,
                            model.登録番号,
                            Terminal = terminalCode
                        },
                    tran);

                //
                // 管理マスタ '01': system settings
                //
                const string settingsSql = @"
                IF NOT EXISTS (SELECT 1 FROM 管理マスタ WITH(UPDLOCK, HOLDLOCK) WHERE 自社コード = '01')
                    INSERT INTO 管理マスタ (自社コード) VALUES ('01');

                UPDATE 管理マスタ
                SET
                     消費税施工日 = @新消費税率施行日
                    ,旧消費税     = @旧消費税率
                    ,新消費税     = @新消費税率

                    ,軽油税施工日 = @新軽油税施行日
                    ,旧軽油税     = @旧軽油税
                    ,新軽油税     = @新軽油税

                    ,対象月度     = @対象月度

                    -- legacy TxtDNo1-10 (across each row): same pairs as the load
                    ,伝票番号1    = @受注伝票
                    ,伝票番号2    = @運転日報
                    ,伝票番号3    = @仕入伝票
                    ,伝票番号4    = @入金伝票
                    ,伝票番号5    = @傭車伝票
                    ,伝票番号6    = @仕入支払
                    ,伝票番号7    = @経費伝票
                    ,伝票番号8    = @支払伝票
                    ,伝票番号9    = @作業伝票
                    ,伝票番号10   = @予約番号

                    ,売上端数     = @売上端数
                    ,税区分       = @消費税区分
                    ,税端数       = @消費税端数

                    ,発着地区分   = @発着地区分
                    ,和西暦       = @日付区分
                    ,部門管理     = @部門管理
                    ,宛先敬称     = @宛先敬称

                    ,送信先1      = @送信先1
                    ,送信先2      = @送信先2

                    ,実車区分     = @実車区分
                    ,課税割増     = @課税割増
                    ,非課税割増   = @非課税割増
                    ,請求日設定   = @請求日設定
                    ,警告日数     = @警告日数

                    ,ｼﾘｱﾙNO1      = @シリアルNO1
                    ,ｼﾘｱﾙNO2      = @シリアルNO2
                    ,ｼﾘｱﾙNO3      = @シリアルNO3
                    ,ｼﾘｱﾙNO4      = @シリアルNO4
                    ,ｼﾘｱﾙNO5      = @シリアルNO5
                    ,ｼﾘｱﾙNO6      = @シリアルNO6
                    ,ｼﾘｱﾙNO7      = @シリアルNO7
                    ,ｼﾘｱﾙNO8      = @シリアルNO8
                    ,ｼﾘｱﾙNO9      = @シリアルNO9
                    ,ｼﾘｱﾙNO10     = @シリアルNO10

                    ,SEC1         = @SEC1
                    ,SEC2         = @SEC2
                    ,SEC3         = @SEC3
                    ,SEC4         = @SEC4
                    ,SEC5         = @SEC5
                    ,SEC6         = @SEC6
                    ,SEC7         = @SEC7
                    ,SEC8         = @SEC8
                    ,SEC9         = @SEC9
                    ,SEC10        = @SEC10

                    ,登録日       = GETDATE()
                    ,送信済       = '1'
                    ,入力端末     = @Terminal
                    ,削除         = '0'

                WHERE 自社コード = '01'";

                // 警告日数 not numeric (blank) is saved as 0 (legacy Data_Repl)
                model.警告日数 ??= 0;

                var settingsParameters = new DynamicParameters(model);
                settingsParameters.Add("Terminal", terminalCode);

                // SEC: '1' when the serial's character codes add up to 1000 (legacy Data_Repl)
                settingsParameters.Add("SEC1", SerialSec(model.シリアルNO1));
                settingsParameters.Add("SEC2", SerialSec(model.シリアルNO2));
                settingsParameters.Add("SEC3", SerialSec(model.シリアルNO3));
                settingsParameters.Add("SEC4", SerialSec(model.シリアルNO4));
                settingsParameters.Add("SEC5", SerialSec(model.シリアルNO5));
                settingsParameters.Add("SEC6", SerialSec(model.シリアルNO6));
                settingsParameters.Add("SEC7", SerialSec(model.シリアルNO7));
                settingsParameters.Add("SEC8", SerialSec(model.シリアルNO8));
                settingsParameters.Add("SEC9", SerialSec(model.シリアルNO9));
                settingsParameters.Add("SEC10", SerialSec(model.シリアルNO10));

                await conn.ExecuteAsync(settingsSql,
                                        settingsParameters,
                                        tran);
                //
                // 管理OPマスタ '01'
                //
                const string opSql = @"
                    IF NOT EXISTS (SELECT 1 FROM 管理OPマスタ WITH(UPDLOCK, HOLDLOCK) WHERE 自社コード = '01')
                        INSERT INTO 管理OPマスタ (自社コード) VALUES ('01');

                    UPDATE 管理OPマスタ
                    SET
                         手当1        = @手当1
                        ,手当2        = @手当2
                        ,手当3        = @手当3
                        ,手当4        = @手当4
                        ,手当5        = @手当5
                        ,手当6        = @手当6
                        ,手当7        = @手当7
                        ,支給1        = @支給1
                        ,支給2        = @支給2
                        ,支給3        = @支給3
                        ,支給4        = @支給4
                        ,支給5        = @支給5
                        ,給与締切日   = @給与締切日
                        ,給与ファイル = @給与ファイル
                        ,財務区分1    = @財務区分1
                        ,財務区分2    = @財務区分2
                        ,財務区分3    = @財務区分3
                        ,財務区分4    = @財務区分4
                        ,財務区分5    = @財務区分5
                        ,財務区分6    = @財務区分6
                        ,財務区分7    = @財務区分7
                        ,財務区分8    = @財務区分8
                        ,財務ファイル = @財務ファイル
                        ,給与掛率1    = @給与掛率1
                        ,給与掛率2    = @給与掛率2
                        ,給与掛率3    = @給与掛率3
                        ,給与掛率4    = @給与掛率4
                        ,カード優先   = @カード優先
                        ,登録日       = GETDATE()
                        ,送信済       = '1'
                        ,入力端末     = @Terminal
                        ,削除         = '0'
                    WHERE 自社コード = '01'";

                    await conn.ExecuteAsync(opSql, new
                    {
                        model.手当1,
                        model.手当2,
                        model.手当3,
                        model.手当4,
                        model.手当5,
                        model.手当6,
                        model.手当7,
                        model.支給1,
                        model.支給2,
                        model.支給3,
                        model.支給4,
                        model.支給5,
                        給与締切日 = model.給与締切日?.ToString() ?? "",
                        model.給与ファイル,
                        // legacy writes "…" & TxtSwiake(i).Text & " '": a trailing space after a value(e.g., '1 '), blank stays blank, review point
                        財務区分1 = SiwakeValue(model.財務区分1),
                        財務区分2 = SiwakeValue(model.財務区分2),
                        財務区分3 = SiwakeValue(model.財務区分3),
                        財務区分4 = SiwakeValue(model.財務区分4),
                        財務区分5 = SiwakeValue(model.財務区分5),
                        財務区分6 = SiwakeValue(model.財務区分6),
                        財務区分7 = SiwakeValue(model.財務区分7),
                        財務区分8 = SiwakeValue(model.財務区分8),
                        model.財務ファイル,
                        // blank 給与掛率 is stored as 100 (legacy)
                        給与掛率1 = model.給与掛率1 ?? 100,
                        給与掛率2 = model.給与掛率2 ?? 100,
                        給与掛率3 = model.給与掛率3 ?? 100,
                        給与掛率4 = model.給与掛率4 ?? 100,
                        カード優先 = model.カード優先?.ToString() ?? "",
                        Terminal = terminalCode
                    }, tran);

                    //
                    // 運賃形態マスタ
                    //
                    await SaveFareTypesAsync(conn, tran, model, terminalCode);

                    //
                    // 補償マスタ
                    //
                    await SaveCompensationsAsync(conn, tran, model, terminalCode);

                    tran.Commit();
                }
                catch
                {
                    tran.Rollback();
                    throw;
                }
            }

            public async Task<string?> GetDeleteBlockReasonAsync(string companyCode)
            {
                // Del_Chk migration: each table has its own legacy message
                using var conn = _connectionFactory.CreateConnection();

                const string dailyReportSql = @"
                SELECT TOP 1 日報NO
                FROM 日報BODY WITH(NOLOCK)
                WHERE 支店コード = @Code";

                var dailyReport = await conn.QueryFirstOrDefaultAsync<string>(dailyReportSql, new { Code = companyCode });

                if (dailyReport != null)
                {
                    return "日報データが登録されていますので、削除出来ません！！";
                }

                const string receiptSql = @"
                SELECT TOP 1 伝票NO
                FROM 入金データ WITH(NOLOCK)
                WHERE 支店コード = @Code";

                var receipt = await conn.QueryFirstOrDefaultAsync<string>(receiptSql, new { Code = companyCode });

                if (receipt != null)
                {
                    return "入金データが登録されていますので、削除出来ません！！";
                }

                return null;
            }

            public async Task DeleteAsync(string companyCode)
            {
                using var conn = _connectionFactory.CreateConnection();

                    await conn.ExecuteAsync(
                    @"DELETE
                      FROM 管理マスタ
                      WHERE 自社コード = @Code",
                    new
                    {
                        Code = companyCode
                    });
            }

            private static Task SaveFareTypesAsync(IDbConnection conn, IDbTransaction tran, ManagementMasterViewModel model, string terminalCode)
            {
                // Data_Repl() 運賃形態マスタ migration
                var names = new[]
                {
                    model.運賃形態1, model.運賃形態2, model.運賃形態3,
                    model.運賃形態4, model.運賃形態5, model.運賃形態6,
                    model.運賃形態7, model.運賃形態8, model.運賃形態9
                };

                return SaveNamesByCodeAsync(conn, tran, "運賃形態マスタ", names, terminalCode);
            }

            private static Task SaveCompensationsAsync(IDbConnection conn, IDbTransaction tran, ManagementMasterViewModel model, string terminalCode)
            {
                // Data_Repl() 補償マスタ migration
                var names = new[]
                {
                    model.補償1, model.補償2, model.補償3,
                    model.補償4, model.補償5, model.補償6,
                    model.補償7, model.補償8, model.補償9
                };

                return SaveNamesByCodeAsync(conn, tran, "補償マスタ", names, terminalCode);
            }

            // コード 1-9: a filled name is inserted or updated, an empty one deletes that コード (legacy Data_Repl).
            // table is one of the two fixed names above, never from the request.
            private static async Task SaveNamesByCodeAsync(IDbConnection conn, IDbTransaction tran, string table, string?[] names, string terminalCode)
            {
                for (var i = 0; i < names.Length; i++)
                {
                    var code = (i + 1).ToString();
                    var name = names[i] ?? "";

                    if (name != "")
                    {
                        await conn.ExecuteAsync($@"
                            IF NOT EXISTS (SELECT 1 FROM {table} WITH(UPDLOCK, HOLDLOCK) WHERE コード = @Code)
                                INSERT INTO {table} (コード) VALUES (@Code);

                            UPDATE {table}
                            SET
                                 名称     = @Name
                                ,登録日   = GETDATE()
                                ,送信済   = '1'
                                ,入力端末 = @Terminal
                                ,削除     = '0'
                            WHERE コード = @Code",
                            new { Code = code, Name = name, Terminal = terminalCode },
                            tran);
                    }
                    else
                    {
                        await conn.ExecuteAsync(
                            $"DELETE FROM {table} WHERE コード = @Code",
                            new { Code = code },
                            tran);
                    }
                }
            }

            // Names indexed 1-9 by コード; "" where a コード has no row.
            private static async Task<string[]> GetNamesByCodeAsync(IDbConnection conn, string sql)
            {
                var names = Enumerable.Repeat("", 10).ToArray();

                foreach (var row in await conn.QueryAsync(sql))
                {
                    if (int.TryParse((string?)row.コード, out int code) && code >= 1 && code <= 9)
                    {
                        names[code] = (string?)row.名称 ?? "";
                    }
                }

                return names;
            }

            // 財務区分 as legacy saves it: "1" → "1 ", "" → "" (legacy Data_Repl).
            // On a column narrower than the value SQL Server drops the trailing space; it is read back trimmed.
            private static string SiwakeValue(string? value)
            {
                var text = (value ?? "").Trim();

                return text == "" ? "" : text + " ";
            }

            private static string SerialSec(string? serial)
            {
                if (string.IsNullOrEmpty(serial))
                    return "0";

                long total = 0;

                foreach (var c in serial)
                {
                    total += c;
                }

                return total == 1000 ? "1" : "0";
            }

            private static int? ToNullableInt(object? value)
            {
                if (value == null)
                    return null;

                var text = value.ToString();

                if (string.IsNullOrWhiteSpace(text))
                    return null;

                return Convert.ToInt32(text);
            }

        }
    }
