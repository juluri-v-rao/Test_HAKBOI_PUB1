using System.Globalization;
using System.Data;
using Dapper;
using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.OriginDestMasterViewModel;

namespace HAKOBIMASENKA.Repository.OriginDestRepository
{
    public class OriginDestinationRepository : IOriginDestinationRepository
    {
        private readonly IDbConnectionFactory _factory;

        public OriginDestinationRepository(IDbConnectionFactory factory)
        {
            _factory = factory;
        }

        // ---------------------------------------------------------
        // Place_RKbn()
        // Get individual/common registration mode
        // ---------------------------------------------------------

        public async Task<string?> GetRegistrationModeAsync()
        {
            const string sql = @"
                SELECT TOP (1) 発着地区分
                FROM 管理マスタ WITH (NOLOCK)
                WHERE 自社コード = '01';";

            using var connection = _factory.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<string?>(
                sql);
        }

        // ---------------------------------------------------------
        // Dsp_User()
        // Get customer abbreviation
        // ---------------------------------------------------------

        public async Task<string?> GetCustomerShortNameAsync(string customerCode)
        {
            const string sql = @"
                SELECT TOP (1) 略称
                FROM 荷主マスタ WITH (NOLOCK)
                WHERE 荷主コード = @CustomerCode;";

            using var connection = _factory.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<string?>(
                sql,
                new { CustomerCode = customerCode });
        }

        // ---------------------------------------------------------
        // Dsp_Erea()
        // Get district name
        // ---------------------------------------------------------

        public async Task<string?> GetDistrictNameAsync(string districtCode)
        {
            const string sql = @"
                SELECT TOP (1) 名称
                FROM 地区マスタ WITH (NOLOCK)
                WHERE コード = @DistrictCode;";

            using var connection = _factory.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<string?>(
                sql,
                new { DistrictCode = districtCode });
        }

        // ---------------------------------------------------------
        // Dsp_Post()
        // Get address from postal code
        // ---------------------------------------------------------

        public async Task<PostalAddressResult?> GetAddressByPostalCodeAsync(
            string postalCode)
        {
            string normalizedPostalCode = (postalCode ?? string.Empty)
                .Replace("-", "")
                .Trim();

            const string sql = @"
                SELECT TOP (1) 住所
                FROM 郵便番号マスタ WITH (NOLOCK)
                WHERE 郵便番号 = @PostalCode;";

            using var connection = _factory.CreateConnection();

            string? address = await connection.QueryFirstOrDefaultAsync<string?>(
                sql,
                new { PostalCode = normalizedPostalCode });

            if (string.IsNullOrWhiteSpace(address))
                return null;

            /*// Legacy Separate_Chara(..., 32) behavior:
            // Split the address into two fields, each up to 32 characters.
            address = address.Trim();

            var result = new PostalAddressResult();

            if (address.Length <= 32)
            {
                result.Address1 = address;
                result.Address2 = string.Empty;
            }
            else
            {
                result.Address1 = address[..32].Trim();
                result.Address2 = address[32..].Trim();

                // Database field Address2 is nvarchar(32).
                if (result.Address2.Length > 32)
                    result.Address2 = result.Address2[..32];
            }*/
            // Legacy Separate_Chara(..., 32) behavior:
            // Half-width characters count as 1 unit.
            // Full-width characters count as 2 units.
            address = address.Trim();

            var result = new PostalAddressResult();

            int splitIndex = 0;
            int widthCount = 0;

            foreach (char character in address)
            {
                int characterWidth =
                    character <= '\u007E' ||
                    (character >= '\uFF61' && character <= '\uFF9F')
                        ? 1
                        : 2;

                if (widthCount + characterWidth > 32)
                {
                    break;
                }

                widthCount += characterWidth;
                splitIndex++;
            }

            result.Address1 = address[..splitIndex].Trim();
            result.Address2 = splitIndex < address.Length
                ? address[splitIndex..].Trim()
                : string.Empty;

            // Address2 is nvarchar(32).
            int address2Length = 0;
            int address2EndIndex = 0;

            foreach (char character in result.Address2)
            {
                int characterWidth =
                    character <= '\u007E' ||
                    (character >= '\uFF61' && character <= '\uFF9F')
                        ? 1
                        : 2;

                if (address2Length + characterWidth > 32)
                {
                    break;
                }

                address2Length += characterWidth;
                address2EndIndex++;
            }

            result.Address2 = result.Address2[..address2EndIndex];

            return result;
        }

        // ---------------------------------------------------------
        // Set_Code()
        // Generate next destination code
        // ---------------------------------------------------------

        public async Task<string> GetNextCodeAsync(string customerCode)
        {

            const string sql = @"
                SELECT TOP (1) 発着地コード
                FROM 発着地マスタ WITH (NOLOCK)
                WHERE 荷主コード = @CustomerCode
                  AND 発着地コード >= '0000000000'
                ORDER BY 発着地コード DESC;";

            using var connection = _factory.CreateConnection();

            string? maxCode =
                await connection.QueryFirstOrDefaultAsync<string?>(
                    sql,
                    new { CustomerCode = customerCode });

            var current = 0L;

            if (maxCode != null && long.TryParse(maxCode, out var parsed))
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

        // ---------------------------------------------------------
        // Dsp_Data()
        // Load one destination record
        // ---------------------------------------------------------

        public async Task<OriginDestinationViewModel?> GetByCodeAsync(
            string customerCode,
            string destinationCode)
        {
            const string sql = @"
                SELECT
                    P.荷主コード AS CustomerCode,
                    P.発着地コード AS DestinationCode,
                    P.発着地名 AS DestinationName,
                    P.ふりがな AS Furigana,
                    P.略称 AS Abbreviation,
                    P.郵便 AS PostalCode,
                    P.住所1 AS Address1,
                    P.住所2 AS Address2,
                    P.電話番号 AS PhoneNumber,
                    P.FAX番号 AS FaxNumber,
                    P.地区コード AS DistrictCode,
                    D.名称 AS DistrictName,
                    P.デジタココード AS DigitacoCode,
                    P.備考 AS Remarks,
                    P.URL AS Url
                FROM 発着地マスタ P WITH (NOLOCK)
                LEFT JOIN 地区マスタ D WITH (NOLOCK)
                    ON P.地区コード = D.コード
                WHERE P.荷主コード = @CustomerCode
                  AND P.発着地コード = @DestinationCode;";

            using var connection = _factory.CreateConnection();

            var model =
                await connection.QueryFirstOrDefaultAsync<OriginDestinationViewModel>(
                    sql,
                    new
                    {
                        CustomerCode = customerCode,
                        DestinationCode = destinationCode
                    });

            if (model == null)
                return null;

            model.IsNewRecord = false;

            return model;
        }

        // ---------------------------------------------------------
        // Dsp_List()
        // Get destination list for the selected customer
        // ---------------------------------------------------------

        public async Task<List<OriginDestinationListItem>> GetListAsync(
            string customerCode)
        {
            const string sql = @"
                SELECT
                    発着地コード AS DestinationCode,
                    略称 AS Abbreviation
                FROM 発着地マスタ WITH (NOLOCK)
                WHERE 荷主コード = @CustomerCode
                ORDER BY 発着地コード;";

            using var connection = _factory.CreateConnection();

            var rows = await connection.QueryAsync<OriginDestinationListItem>(
                sql,
                new { CustomerCode = customerCode });

            return rows.ToList();
        }

        // ---------------------------------------------------------
        // Data_Chk()
        // Check duplicate destination code
        // ---------------------------------------------------------

        public async Task<bool> ExistsAsync(
            string customerCode,
            string destinationCode)
        {
            const string sql = @"
                SELECT CASE
                    WHEN EXISTS
                    (
                        SELECT 1
                        FROM 発着地マスタ WITH (NOLOCK)
                        WHERE 荷主コード = @CustomerCode
                          AND 発着地コード = @DestinationCode
                    )
                    THEN CAST(1 AS bit)
                    ELSE CAST(0 AS bit)
                END;";

            using var connection = _factory.CreateConnection();

            return await connection.QuerySingleAsync<bool>(
                sql,
                new
                {
                    CustomerCode = customerCode,
                    DestinationCode = destinationCode
                });
        }

        // ---------------------------------------------------------
        // Data_Repl()
        // Insert or update destination
        // ---------------------------------------------------------

        public async Task SaveAsync(
            OriginDestinationViewModel model,
            string clientCode)
        {

            using var connection = _factory.CreateConnection();
            connection.Open();

            using var transaction = connection.BeginTransaction();

            try
            {
                const string existsSql = @"
                    SELECT CASE
                        WHEN EXISTS
                        (
                            SELECT 1
                            FROM 発着地マスタ
                            WHERE 荷主コード = @CustomerCode
                              AND 発着地コード = @DestinationCode
                        )
                        THEN CAST(1 AS bit)
                        ELSE CAST(0 AS bit)
                    END;";

                bool exists = await connection.QuerySingleAsync<bool>(
                    existsSql,
                    new
                    {
                        CustomerCode = model.CustomerCode,
                        DestinationCode = model.DestinationCode
                    },
                    transaction);

                if (!exists)
                {
                    const string insertSql = @"
                        INSERT INTO 発着地マスタ
                        (
                            荷主コード,
                            発着地コード
                        )
                        VALUES
                        (
                            @CustomerCode,
                            @DestinationCode
                        );";

                    await connection.ExecuteAsync(
                        insertSql,
                        new
                        {
                            CustomerCode = model.CustomerCode,
                            DestinationCode = model.DestinationCode
                        },
                        transaction);
                }

                // Important:
                // The current HTML has no separate 配車エリア field.
                // On an existing record, its database value is preserved.
                // On a new record, the column remains NULL/default.

                const string updateSql = @"
                    UPDATE 発着地マスタ
                    SET
                        発着地名 = @DestinationName,
                        ふりがな = @Furigana,
                        略称 = @Abbreviation,
                        郵便 = @PostalCode,
                        住所1 = @Address1,
                        住所2 = @Address2,
                        電話番号 = @PhoneNumber,
                        FAX番号 = @FaxNumber,
                        地区コード = @DistrictCode,
                        配車エリアコード = '',
                        デジタココード = @DigitacoCode,
                        備考 = @Remarks,
                        URL = @Url,
                        荷発着コード = @CombinedCode,
                        登録日 = @RegisteredAt,
                        送信済 = '1',
                        入力端末 = @ClientCode,
                        削除 = '0'
                    WHERE 荷主コード = @CustomerCode
                      AND 発着地コード = @DestinationCode;";

                await connection.ExecuteAsync(
                    updateSql,
                    new
                    {
                        CustomerCode = model.CustomerCode ?? string.Empty,
                        DestinationCode = model.DestinationCode ?? string.Empty,

                        DestinationName = model.DestinationName ?? string.Empty,
                        Furigana = model.Furigana ?? string.Empty,
                        Abbreviation = model.Abbreviation ?? string.Empty,
                        PostalCode = model.PostalCode ?? string.Empty,
                        Address1 = model.Address1 ?? string.Empty,
                        Address2 = model.Address2 ?? string.Empty,
                        PhoneNumber = model.PhoneNumber ?? string.Empty,
                        FaxNumber = model.FaxNumber ?? string.Empty,
                        DistrictCode = model.DistrictCode ?? string.Empty,
                        DigitacoCode = model.DigitacoCode ?? string.Empty,
                        Remarks = model.Remarks ?? string.Empty,
                        Url = model.Url ?? string.Empty,

                        CombinedCode = model.CustomerCode + model.DestinationCode,
                        RegisteredAt = DateTime.Now,
                        ClientCode = clientCode ?? string.Empty
                    },
                    transaction);

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        // ---------------------------------------------------------
        // Del_Chk()
        // Prevent deletion when the destination is referenced
        // by any of the five legacy tables.
        // ---------------------------------------------------------

        public async Task<string?> GetDeleteBlockMessageAsync(
            string customerCode,
            string destinationCode,
            bool isCommonMode)
        {
            using var connection = _factory.CreateConnection();

            const string referenceSql = @"
                SELECT CASE
                    WHEN EXISTS
                    (
                        SELECT 1
                        FROM {0} WITH (NOLOCK)
                        WHERE (発地コード = @DestinationCode
                            OR 着地コード = @DestinationCode)
                        {1}
                    )
                    THEN CAST(1 AS bit)
                    ELSE CAST(0 AS bit)
                END;";

            string customerCondition = isCommonMode
                ? string.Empty
                : "AND 荷主コード = @CustomerCode";

            var parameters = new
            {
                CustomerCode = customerCode,
                DestinationCode = destinationCode
            };

            var checks = new (string Table, string Message)[]
            {
                ("発着地単価マスタ",
                 "発着地運賃マスタが登録されていますので、削除出来ません！！"),

                ("補償発着地単価マスタ",
                 "発着地変動運賃マスタが登録されていますので、削除出来ません！！"),

                ("荷主テンプレートマスタ",
                 "荷主テンプレートマスタが登録されていますので、削除出来ません！！"),

                ("作業明細",
                 "受注データが登録されていますので、削除出来ません！！"),

                ("日報BODY",
                 "日報データが登録されていますので、削除出来ません！！")
            };

            foreach (var check in checks)
            {
                // Table names are fixed constants from the legacy source.
                // Only parameter values are supplied by the request.
                string sql = string.Format(
                    CultureInfo.InvariantCulture,
                    referenceSql,
                    check.Table,
                    customerCondition);

                bool exists = await connection.QuerySingleAsync<bool>(
                    sql,
                    parameters);

                if (exists)
                    return check.Message;
            }

            return null;
        }

        // ---------------------------------------------------------
        // Data_Del()
        // Delete destination
        // ---------------------------------------------------------

        public async Task DeleteAsync(
            string customerCode,
            string destinationCode)
        {
            const string sql = @"
                DELETE FROM 発着地マスタ
                WHERE 荷主コード = @CustomerCode
                  AND 発着地コード = @DestinationCode;";

            using var connection = _factory.CreateConnection();

            await connection.ExecuteAsync(
                sql,
                new
                {
                    CustomerCode = customerCode,
                    DestinationCode = destinationCode
                });
        }
    }
}
