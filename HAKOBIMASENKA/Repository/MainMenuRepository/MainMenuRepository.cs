using Dapper;
using System.ComponentModel;

namespace HAKOBIMASENKA.Repository.MainMenuRepository;

public interface IMainMenuRepository
    {
    Task<MainMenuCompany?> GetCompanyAsync();

    Task<bool> IsEraInputAsync();

    Task<int> CountDailyReportsAsync();

    Task<List<string>> GetEnabledMenuIdsAsync(MainMenuCompany company, string clientNo);

    Task<List<CustomMenuSlot>> GetCustomMenuAsync(string clientNo);
    }

// The SEC1 to SEC10 fields in the 管理マスタ (Management Master) table are acting as feature/license flags.
// license information is made into generic columns(legacy concept), where each column became a switch, e.g., SEC* = 1 (* = 1~10) means customer has purchased/activated the Digital Tachograph module and is displayed.
// Module licensing / feature enablement or SEC* flags used to decide which menu items and functionality are available to a customer.
// The 管理マスタ values used in main menu
public class MainMenuCompany
    {
    public string? 略称 { get; set; }

    // "1" = licensed; anything else is the demo version (legacy Demo_Chk)
    public string? SEC1 { get; set; }

    // licence options, "1" = on (legacy UNKOU_Chk, SYARYO_Chk …, see GetEnabledMenuIdsAsync)
    public string? SEC2 { get; set; }
    public string? SEC3 { get; set; }

    // "1" = デジタコ option (legacy DIGI_Chk)
    public string? SEC4 { get; set; }

    public string? SEC5 { get; set; }
    public string? SEC6 { get; set; }
    public string? SEC7 { get; set; }
    public string? SEC8 { get; set; }
    public string? SEC9 { get; set; }
    public string? SEC10 { get; set; }
    }

// One button of the カスタム tab (legacy Custom_Set)
public class CustomMenuSlot
    {
    // button 1-14
    public int 並NO { get; set; }

    // the menu item it opens, e.g. "M1-10"
    public string? 識別NO { get; set; }

    // NULL when the item is not usable (メニュー項目.使用可能 ≠ 0): the button stays blank
    public string? タイトル { get; set; }

    // 1 = turned off for this terminal in 使用制限設定: the button is greyed
    public int Blocked { get; set; }
    }

public class MainMenuRepository(IDbConnectionFactory connectionFactory) : IMainMenuRepository
    {
    // 管理マスタ row of the company itself (legacy FrmMain_Load)
    public async Task<MainMenuCompany?> GetCompanyAsync()
        {
        const string sql = @"
            SELECT 略称, SEC1, SEC2, SEC3, SEC4, SEC5, SEC6, SEC7, SEC8, SEC9, SEC10
            FROM 管理マスタ WITH(NOLOCK)
            WHERE 自社コード = '01';";

        using var conn = connectionFactory.CreateConnection();

        return await conn.QueryFirstOrDefaultAsync<MainMenuCompany>(sql);
        }

    // Legacy DINPUT_Chk (FrmMain_Load): 和西暦 of 01, 1 = 和暦, anything else (or NULL) = 西暦.
    // Every page reads it (_Layout.cshtml), so a saved change shows on the next screen opened, as in legacy.
    public async Task<bool> IsEraInputAsync()
        {
        const string sql = @"
            SELECT CASE WHEN 和西暦 = '1' THEN 1 ELSE 0 END
            FROM 管理マスタ WITH(NOLOCK)
            WHERE 自社コード = '01';";

        using var conn = connectionFactory.CreateConnection();

        return await conn.ExecuteScalarAsync<int?>(sql) == 1;
        }

    // Legacy Chk_Demo: the number of 運転日報 (the demo version stops above 5000)
    public async Task<int> CountDailyReportsAsync()
        {
        const string sql = "SELECT COUNT(*) FROM 日報HEAD WITH(NOLOCK);";

        using var conn = connectionFactory.CreateConnection();

        return await conn.ExecuteScalarAsync<int>(sql);
        }

    // Legacy Button_Set: the menu items that can be used, e.g. "D1-01", "M1-10".
    // An item is usable (使用可能 = 0), not turned off for this terminal (使用制限設定),
    // and belongs to at least one licensed option. With no option licensed, every usable item.
    public async Task<List<string>> GetEnabledMenuIdsAsync(MainMenuCompany company, string clientNo)
        {
        // オプションn column → licence flag, as legacy reads them:
        // SEC8 goes to ZAIM_Chk (オプション9) and SEC9 to KYUYO_Chk (オプション8)
        var options = new (string Column, string? Flag)[]
        {
            ("オプション2", company.SEC2),      // 運行管理
            ("オプション3", company.SEC3),      // 車輌管理
            ("オプション4", company.SEC4),      // デジタコ
            ("オプション5", company.SEC5),      // ＥＴＣ
            ("オプション6", company.SEC6),      // 配送デス
            ("オプション7", company.SEC7),      // メール送受信
            ("オプション8", company.SEC9),      // 給与
            ("オプション9", company.SEC8),      // 財務
            ("オプション10", company.SEC10)     // ＥＣＯ
        };

        // the column names are the fixed ones above; only the terminal number is a parameter
        var licensed = options
            .Where(option => option.Flag == "1")
            .Select(option => $"M.[{option.Column}] = '1'")
            .ToList();

        var sql = @"
            SELECT M.[識別NO]
            FROM メニュー項目 AS M
            LEFT JOIN 使用制限設定 AS C
                ON M.識別NO = C.識別NO AND C.ｸﾗｲｱﾝﾄNO = @clientNo
            WHERE M.使用可能 = '0' AND (C.使用 = '1' OR C.使用 IS NULL)";

        if (licensed.Count > 0)
            {
            sql += $" AND ({string.Join(" OR ", licensed)})";
            }

        sql += " ORDER BY M.[識別NO];";

        using var conn = connectionFactory.CreateConnection();

        return (await conn.QueryAsync<string>(sql, new { clientNo })).ToList();
        }

    // Legacy Custom_Set: this terminal's カスタム buttons (カスタムメニュー.マシンNO = E_CODE)
    public async Task<List<CustomMenuSlot>> GetCustomMenuAsync(string clientNo)
        {
        const string sql = @"
            SELECT
                CM.並NO,
                CM.識別NO,
                BS.タイトル,
                CASE WHEN CS.ｸﾗｲｱﾝﾄNO IS NULL THEN 0 ELSE 1 END AS Blocked
            FROM カスタムメニュー AS CM
            LEFT JOIN メニュー項目 AS BS
                ON CM.識別NO = BS.識別NO AND BS.使用可能 = '0'
            LEFT JOIN 使用制限設定 AS CS
                ON CM.識別NO = CS.識別NO AND CS.使用 = '0' AND CS.ｸﾗｲｱﾝﾄNO = @clientNo
            WHERE CM.並NO >= 1 AND CM.並NO <= 14
              AND CM.マシンNO = @clientNo;";

        using var conn = connectionFactory.CreateConnection();

        return (await conn.QueryAsync<CustomMenuSlot>(sql, new { clientNo })).ToList();
        }
    }
