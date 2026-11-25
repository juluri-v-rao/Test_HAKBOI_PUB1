
using Dapper;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public class OrderSearchRepository : IOrderSearchRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public OrderSearchRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<OrderSearchResultDto>> SearchAsync(
            OrderSearchRequestDto request)
        {
            using var connection = _connectionFactory.CreateConnection();

            // Select the date column based on DateType.
            string dateColumn = request.DateType switch
            {
                0 => "受注日",
                1 => "積日",
                2 => "卸日",
                _ => "受注日"
            };

            const string manualSearchCode = "0000000000";

            // Normalize entered codes.
            var driverCode = NormalizeCode(request.DriverCode);
            var vehicleCode = NormalizeCode(request.VehicleCode);
            var originCode = NormalizeCode(request.OriginCode);
            var destinationCode = NormalizeCode(request.DestinationCode);
            var productCode = NormalizeCode(request.ProductCode);

            // Check manual name-search mode.
            bool manualDriverSearch = driverCode == manualSearchCode;
            bool manualVehicleSearch = vehicleCode == manualSearchCode;
            bool manualOriginSearch = originCode == manualSearchCode;
            bool manualDestinationSearch = destinationCode == manualSearchCode;
            bool manualProductSearch = productCode == manualSearchCode;

            string sql = $@"
                SELECT
                    ISNULL(受注NO, N'') AS OrderNo,
                    ISNULL(内容, N'') AS Content,
                    CONCAT(
                        ISNULL(受注NO, N''),
                        N'-',
                        ISNULL(受注行NO, N'')
                    ) AS OrderDisplayNo,
                    積日 AS LoadingDate,
                    ISNULL(積時間, N'') AS LoadingTime,
                    卸日 AS UnloadingDate,
                    ISNULL(卸時間, N'') AS UnloadingTime,
                    ISNULL(傭車名, N'') AS CharteringCompany,
                    ISNULL(孫請傭車名, N'') AS TransportationCompany,
                    ISNULL(運転手名, N'') AS DriverName,
                    ISNULL(車番, N'') AS VehicleNumber,
                    ISNULL(車種名, N'') AS VehicleType,
                    ISNULL(荷主名, N'') AS ShipperName,
                    ISNULL(発地名, N'') AS OriginName,
                    ISNULL(着地名, N'') AS DestinationName,
                    ISNULL(品名, N'') AS ProductName,
                    数量 AS Quantity,
                    重量 AS Weight,
                    ISNULL(単位名, N'') AS UnitName,
                    単価 AS UnitPrice,
                    請求運賃 AS BillingFreight,
                    割増 AS Surcharge,
                    有料請求 AS TollFeeBilling,
                    ISNULL(下払単位名, N'') AS PaymentUnitName,
                    下払単価 AS PaymentUnitPrice,
                    支払運賃 AS PaymentFreight,
                    下払割増 AS PaymentSurcharge,
                    有料支払 AS TollFeePayment,
                    ISNULL(荷姿, N'') AS Packaging,
                    ISNULL(社内備考, N'') AS InternalRemarks,
                    ISNULL(備考, N'') AS DailyReportRemarks
                FROM 作業明細
                WHERE
                    (@ShipperCode IS NULL
                        OR 荷主コード = @ShipperCode)

                    AND (@CharteringCompanyCode IS NULL
                        OR 傭車コード = @CharteringCompanyCode)

                    -- Driver
                    AND (@DriverCode IS NULL
                        OR 運転手コード = @DriverCode)

                    AND (@DriverName IS NULL
                        OR 運転手名 LIKE N'%' + @DriverName + N'%')

                    -- Vehicle
                    AND (@VehicleCode IS NULL
                        OR 車輌コード = @VehicleCode)

                    AND (@VehicleName IS NULL
                        OR 車番 LIKE N'%' + @VehicleName + N'%')

                    -- Origin
                    AND (@OriginCode IS NULL
                        OR 発地コード = @OriginCode)

                    AND (@OriginName IS NULL
                        OR 発地名 LIKE N'%' + @OriginName + N'%')

                    -- Destination
                    AND (@DestinationCode IS NULL
                        OR 着地コード = @DestinationCode)

                    AND (@DestinationName IS NULL
                        OR 着地名 LIKE N'%' + @DestinationName + N'%')

                    -- Product
                    AND (@ProductCode IS NULL
                        OR 品名コード = @ProductCode)

                    AND (@ProductName IS NULL
                        OR 品名 LIKE N'%' + @ProductName + N'%')

                    -- Date range
                    AND (@StartDate IS NULL
                        OR {dateColumn} >= @StartDate)

                    AND (@EndDate IS NULL
                        OR {dateColumn} < DATEADD(DAY, 1, @EndDate))

                ORDER BY 受注NO ASC, 受注行NO ASC;
            ";

            var parameters = new
            {
                ShipperCode = NormalizeCode(request.ShipperCode),
                CharteringCompanyCode = NormalizeCode(request.CharteringCompanyCode),

                // Normal code = code search.
                // 0000000000 = name search only.
                DriverCode = manualDriverSearch ? null : driverCode,
                DriverName = manualDriverSearch
                    ? NormalizeText(request.DriverName)
                    : null,

                VehicleCode = manualVehicleSearch ? null : vehicleCode,
                VehicleName = manualVehicleSearch
                    ? NormalizeText(request.VehicleName)
                    : null,

                OriginCode = manualOriginSearch ? null : originCode,
                OriginName = manualOriginSearch
                    ? NormalizeText(request.OriginName)
                    : null,

                DestinationCode = manualDestinationSearch ? null : destinationCode,
                DestinationName = manualDestinationSearch
                    ? NormalizeText(request.DestinationName)
                    : null,

                // Legacy exception:
                // Product code 0000000000 must remain in the code condition.
                ProductCode = productCode,
                ProductName = manualProductSearch
                    ? NormalizeText(request.ProductName)
                    : null,

                StartDate = request.StartDate?.Date,
                EndDate = request.EndDate?.Date
            };

            var result = await connection.QueryAsync<OrderSearchResultDto>(
                sql,
                parameters);

            return result;
        }

        private static string? NormalizeCode(string? code)
        {
            return string.IsNullOrWhiteSpace(code)
                ? null
                : code.Trim();
        }

        private static string? NormalizeText(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim();
        }

        public async Task<OrderSearchResultDto?> FindMasterAsync(
            string masterType,
            string code)
        {
            using var connection = _connectionFactory.CreateConnection();

            string sql = masterType switch
            {
                "shipper" => @"
                    SELECT
                        荷主コード AS OrderNo,
                        略称 AS ShipperName
                    FROM 荷主マスタ
                    WHERE 荷主コード = @Code",

                "charteringCompany" => @"
                    SELECT
                        傭車コード AS OrderNo,
                        略称 AS CharteringCompany
                    FROM 傭車マスタ
                    WHERE 傭車コード = @Code",

                "driver" => @"
                    SELECT
                        運転手コード AS OrderNo,
                        運転手名 AS DriverName
                    FROM 運転手マスタ
                    WHERE 運転手コード = @Code",

                "vehicle" => @"
                    SELECT
                        車輌コード AS OrderNo,
                        車番 AS VehicleNumber
                    FROM 車輌マスタ
                    WHERE 車輌コード = @Code",

                "origin" or "destination" => @"
                    SELECT
                        発着地コード AS OrderNo,
                        略称 AS OriginName
                    FROM 発着地マスタ
                    WHERE 発着地コード = @Code",

                "product" => @"
                    SELECT
                        品名コード AS OrderNo,
                        品名 AS ProductName
                    FROM 品名マスタ
                    WHERE 品名コード = @Code",

                _ => throw new ArgumentException(
                    "Invalid master type.",
                    nameof(masterType))
            };

            return await connection.QueryFirstOrDefaultAsync<OrderSearchResultDto>(
                sql,
                new { Code = code });
        }

        public async Task<DateTime?> GetTargetMonthAsync()
        {
            using var connection = _connectionFactory.CreateConnection();

            const string sql = @"
                SELECT 対象月度
                FROM 管理マスタ WITH(NOLOCK)
                WHERE 自社コード = '01';
            ";

            return await connection.QueryFirstOrDefaultAsync<DateTime?>(
                sql);
        }
    }
}
