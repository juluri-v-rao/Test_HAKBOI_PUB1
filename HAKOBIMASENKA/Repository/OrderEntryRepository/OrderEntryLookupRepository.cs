using Dapper;
using HAKOBIMASENKA.Models.ViewModels.DailyProcessingEntryViewModels.OrderEntryViewModel;

namespace HAKOBIMASENKA.Repository.OrderEntryRepository
{
    // The queries from legacy UC_JuchuGyo.vb and FrmN_Juchu.vb, with parameters instead of joined strings.
    public class OrderEntryLookupRepository(IDbConnectionFactory connectionFactory) : IOrderEntryLookupRepository
    {
        private readonly IDbConnectionFactory _connectionFactory = connectionFactory;

        private async Task<OrderEntryLookupDto?> FindAsync(string sql, object parameters)
        {
            using var conn = _connectionFactory.CreateConnection();

            return await conn.QueryFirstOrDefaultAsync<OrderEntryLookupDto>(sql, parameters);
        }

        // Legacy SHUKEI.vb reads this once into Kanri_PLKbn
        public async Task<bool> IsPlaceByShipperAsync()
        {
            const string sql = @"
            SELECT 発着地区分
            FROM 管理マスタ WITH(NOLOCK)
            WHERE 自社コード = '01'";

            using var conn = _connectionFactory.CreateConnection();

            return await conn.ExecuteScalarAsync<string?>(sql) == "0";
        }

        // 自社支店 (legacy Dsp_Bumon in FrmN_Juchu.vb)
        public Task<OrderEntryLookupDto?> FindBranchAsync(string code) => FindAsync(@"
            SELECT 略称 AS Name
            FROM 管理マスタ WITH(NOLOCK)
            WHERE 自社コード = @Code",
            new { Code = code });

        // 荷主 (legacy Dsp_User)
        public Task<OrderEntryLookupDto?> FindShipperAsync(string code, bool activeOnly) => FindAsync(@"
            SELECT 略称 AS Name
            FROM 荷主マスタ WITH(NOLOCK)
            WHERE 荷主コード = @Code
            AND (@ActiveOnly = 0 OR 取引終了日 IS NULL)",
            new { Code = code, ActiveOnly = activeOnly });

        // 発地 and 着地 (legacy Dsp_From, Dsp_To). shipperCode is blank when 発着地 are shared by all 荷主.
        public Task<OrderEntryLookupDto?> FindPlaceAsync(string shipperCode, string code) => FindAsync(@"
            SELECT
             発着地名 AS Name
            ,ISNULL(住所1, '') + ISNULL(住所2, '') AS Address
            ,電話番号 AS Phone
            FROM 発着地マスタ WITH(NOLOCK)
            WHERE 荷主コード = @ShipperCode
            AND 発着地コード = @Code",
            new { ShipperCode = shipperCode, Code = code });

        // 品名 (legacy Dsp_Hin)
        public Task<OrderEntryLookupDto?> FindProductAsync(string code) => FindAsync(@"
            SELECT 品名 AS Name
            FROM 品名マスタ WITH(NOLOCK)
            WHERE 品名コード = @Code",
            new { Code = code });

        // 運転手 with the driver's 傭車 and vehicle (legacy Dsp_Tanto).
        // The vehicle values are left out when the vehicle has been retired (廃車日).
        public Task<OrderEntryLookupDto?> FindDriverAsync(string code, bool activeOnly) => FindAsync(@"
            SELECT
             DRI.運転手名 AS Name
            ,DRI.携帯番号 AS Phone
            ,DRI.傭車コード AS CharteredCode
            ,YOU.略称 AS CharteredName
            ,CASE WHEN CAR.廃車日 IS NULL THEN DRI.車輌コード END AS VehicleCode
            ,CASE WHEN CAR.廃車日 IS NULL THEN CAR.車番 END AS VehicleNumber
            ,CASE WHEN CAR.廃車日 IS NULL THEN CAR.運賃形態 END AS VehicleTypeCode
            ,CASE WHEN CAR.廃車日 IS NULL THEN KEI.名称 END AS VehicleTypeName
            FROM 運転手マスタ DRI WITH(NOLOCK)
            LEFT JOIN 車輌マスタ CAR WITH(NOLOCK) ON DRI.車輌コード = CAR.車輌コード
            LEFT JOIN 運賃形態マスタ KEI WITH(NOLOCK) ON CAR.運賃形態 = KEI.コード
            LEFT JOIN 傭車マスタ YOU WITH(NOLOCK) ON DRI.傭車コード = YOU.傭車コード
            WHERE DRI.運転手コード = @Code
            AND (@ActiveOnly = 0 OR DRI.退社日 IS NULL)",
            new { Code = code, ActiveOnly = activeOnly });

        // 車番 (legacy Dsp_Car)
        public Task<OrderEntryLookupDto?> FindVehicleAsync(string code, bool activeOnly) => FindAsync(@"
            SELECT
             A.車番 AS VehicleNumber
            ,A.運賃形態 AS VehicleTypeCode
            ,B.名称 AS VehicleTypeName
            FROM 車輌マスタ A WITH(NOLOCK)
            LEFT JOIN 運賃形態マスタ B WITH(NOLOCK) ON A.運賃形態 = B.コード
            WHERE A.車輌コード = @Code
            AND (@ActiveOnly = 0 OR A.廃車日 IS NULL)",
            new { Code = code, ActiveOnly = activeOnly });

        // 車種 (legacy Dsp_CarKbn). Legacy fills Car_Kbn(i) in row order with the named codes 1 to 9
        // and shows Car_Kbn(code), so the name is the Nth named row, not the row with that code:
        // with codes 1, 2 and 4, typing 3 shows code 4's name and typing 4 is 未登録.
        public Task<OrderEntryLookupDto?> FindVehicleTypeAsync(string code) => FindAsync(@"
            SELECT Name FROM (
                SELECT LTRIM(RTRIM(名称)) AS Name, ROW_NUMBER() OVER (ORDER BY コード) AS n
                FROM 運賃形態マスタ WITH(NOLOCK)
                WHERE コード IN ('1', '2', '3', '4', '5', '6', '7', '8', '9')
                AND LTRIM(RTRIM(ISNULL(名称, ''))) <> ''
            ) x
            WHERE n = @Code",
            new { Code = int.TryParse(code, out var n) ? n : 0 });

        // 運賃形態 1 to 9, shown beside 車種 while it has focus (legacy Set_Ini → Frame1B)
        public async Task<IEnumerable<OrderEntryLookupDto>> GetVehicleTypesAsync()
        {
            const string sql = @"
            SELECT
             コード AS VehicleTypeCode
            ,LTRIM(RTRIM(ISNULL(名称, ''))) AS VehicleTypeName
            FROM 運賃形態マスタ WITH(NOLOCK)
            WHERE コード IN ('1', '2', '3', '4', '5', '6', '7', '8', '9')
            ORDER BY コード";

            using var conn = _connectionFactory.CreateConnection();

            return await conn.QueryAsync<OrderEntryLookupDto>(sql);
        }

        // 傭車 (legacy Dsp_Yosha)
        public Task<OrderEntryLookupDto?> FindCharteredAsync(string code, bool activeOnly) => FindAsync(@"
            SELECT 略称 AS Name
            FROM 傭車マスタ WITH(NOLOCK)
            WHERE 傭車コード = @Code
            AND (@ActiveOnly = 0 OR 取引終了日 IS NULL)",
            new { Code = code, ActiveOnly = activeOnly });

        // 請求 and 下払 単位 (legacy Dsp_Tani, Dsp_YTani)
        public Task<OrderEntryLookupDto?> FindUnitAsync(string code) => FindAsync(@"
            SELECT 名称 AS Name
            FROM 単位マスタ WITH(NOLOCK)
            WHERE コード = @Code",
            new { Code = code });

        // =========================================
        //          Prices and fares
        // =========================================

        // Legacy Dsp_Tanka reads the 品名区分 of the row's 品名 first
        public async Task<string> GetProductCategoryAsync(string productCode)
        {
            const string sql = @"
            SELECT 品名区分コード
            FROM 品名マスタ WITH(NOLOCK)
            WHERE 品名コード = @Code";

            using var conn = _connectionFactory.CreateConnection();

            return await conn.ExecuteScalarAsync<string?>(sql, new { Code = productCode }) ?? "";
        }

        // Legacy Dsp_Tanka runs one query per combination; this reads them all at once and the service picks the winner.
        // Only 発着地単価マスタ is used: the 地区単価マスタ and 補償 loops in legacy never run.
        public async Task<List<OrderEntryUnitPriceRow>> FindUnitPricesAsync(string shipperCode, string departureCode, string arrivalCode,
            string productCategory, int vehicleType, string billingUnitCode, string paymentUnitCode)
        {
            if (vehicleType < 1 || vehicleType > 9)
            {
                throw new ArgumentOutOfRangeException(nameof(vehicleType));
            }

            // The column name comes from the checked number above, never from the request text
            var sql = $@"
            SELECT
             発地コード AS DepartureCode
            ,品名区分 AS ProductCategory
            ,単位コード AS UnitCode
            ,単価{vehicleType} AS UnitPrice
            ,傭車単価{vehicleType} AS PaymentUnitPrice
            FROM 発着地単価マスタ WITH(NOLOCK)
            WHERE 荷主コード = @ShipperCode
            AND ((発地コード = @DepartureCode AND 着地コード = @ArrivalCode)
              OR (発地コード = @ArrivalCode AND 着地コード = @DepartureCode))
            AND 品名区分 IN ('', @ProductCategory)
            AND 行帰区分 = ''
            AND 単位コード IN (@BillingUnitCode, @PaymentUnitCode)";

            using var conn = _connectionFactory.CreateConnection();

            return (await conn.QueryAsync<OrderEntryUnitPriceRow>(sql, new
            {
                ShipperCode = shipperCode,
                DepartureCode = departureCode,
                ArrivalCode = arrivalCode,
                ProductCategory = productCategory,
                BillingUnitCode = billingUnitCode,
                PaymentUnitCode = paymentUnitCode
            })).ToList();
        }

        // Legacy Cal_King
        public async Task<OrderEntryRoundingRule?> GetShipperRoundingAsync(string shipperCode)
        {
            const string sql = @"
            SELECT 売上端数 AS Rounding, 端数桁数 AS Digits
            FROM 荷主マスタ WITH(NOLOCK)
            WHERE 荷主コード = @Code";

            using var conn = _connectionFactory.CreateConnection();

            return await conn.QueryFirstOrDefaultAsync<OrderEntryRoundingRule>(sql, new { Code = shipperCode });
        }

        // Legacy Cal_YKing
        public async Task<OrderEntryRoundingRule?> GetCharteredRoundingAsync(string charteredCode)
        {
            const string sql = @"
            SELECT 下払端数 AS Rounding, 端数桁数 AS Digits
            FROM 傭車マスタ WITH(NOLOCK)
            WHERE 傭車コード = @Code";

            using var conn = _connectionFactory.CreateConnection();

            return await conn.QueryFirstOrDefaultAsync<OrderEntryRoundingRule>(sql, new { Code = charteredCode });
        }

        public async Task<string?> GetCalculationTypeAsync(string unitCode)
        {
            const string sql = @"
            SELECT 計算区分
            FROM 単位マスタ WITH(NOLOCK)
            WHERE コード = @Code";

            using var conn = _connectionFactory.CreateConnection();

            return await conn.ExecuteScalarAsync<string?>(sql, new { Code = unitCode });
        }
    }
}
