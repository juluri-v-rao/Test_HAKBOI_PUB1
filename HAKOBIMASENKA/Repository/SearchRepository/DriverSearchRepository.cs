
using System.Data;
using Dapper;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    // Retrieves matching driver records from the database.
    public class DriverSearchRepository : IDriverSearchRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public DriverSearchRepository(
            IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory
                ?? throw new ArgumentNullException(
                    nameof(connectionFactory));
        }

        // Search drivers using the entered conditions.
        public async Task<IEnumerable<DriverSearchResultDto>> SearchAsync(
            string? furigana,
            string? driverName,
            string? driverCategory,
            string? subcontractorCode,
            bool activeOnly = false)
        {
            using var connection = _connectionFactory.CreateConnection()
                ?? throw new InvalidOperationException(
                    "IDbConnectionFactory returned a null connection.");

            if (connection.State != ConnectionState.Open)
            {
                connection.Open();
            }

            const string sql = @"
    SELECT
    RIGHT('0000000000' + RTRIM(D.運転手コード), 10) AS DriverCode,
    D.運転手名 AS DriverName,
    D.携帯番号 AS MobileNumber,
    D.運転手区分 AS DriverCategory,
    D.退社日 AS RetirementDate,
    C.車番 AS VehicleCode,
    Y.略称 AS SubcontractorName
FROM 運転手マスタ D WITH(NOLOCK)
LEFT JOIN 車輌マスタ C WITH(NOLOCK)
    ON D.車輌コード = C.車輌コード
LEFT JOIN 傭車マスタ Y WITH(NOLOCK)
    ON D.傭車コード = Y.傭車コード
WHERE
    (@Furigana IS NULL
        OR D.ふりがな LIKE N'%' + @Furigana + N'%')
    AND (@DriverName IS NULL
        OR D.運転手名 LIKE N'%' + @DriverName + N'%')
    AND (@DriverCategory IS NULL
        OR D.運転手区分 = @DriverCategory)
    AND (
        @Code IS NULL
        OR (
            @DriverCategory = '0'
            AND D.車輌コード = @Code
        )
        OR (
            @DriverCategory IN ('1', '2')
            AND D.傭車コード = @Code
        )
    )
    AND (@ActiveOnly = 0 OR D.退社日 IS NULL)
ORDER BY D.運転手コード;
";

            var parameters = new
            {
                // Preserve the exact search text entered by the user.
                Furigana = string.IsNullOrWhiteSpace(furigana)
        ? null : furigana,

                DriverName = string.IsNullOrWhiteSpace(driverName)
        ? null : driverName,

                // Keep existing normalization for category and code.
                DriverCategory = string.IsNullOrWhiteSpace(driverCategory)
        ? null : driverCategory.Trim(),

                Code = string.IsNullOrWhiteSpace(subcontractorCode)
        ? null : subcontractorCode.Trim(),

                ActiveOnly = activeOnly
            };

            return await connection.QueryAsync<DriverSearchResultDto>(
                sql, parameters);
        }

        public async Task<IEnumerable<DriverCodeOptionDto>>
    GetDriverCodeOptionsAsync(string driverCategory)
        {
            using var connection = _connectionFactory.CreateConnection()
                ?? throw new InvalidOperationException(
                    "IDbConnectionFactory returned a null connection.");

            if (connection.State != ConnectionState.Open)
            {
                connection.Open();
            }

            const string vehicleSql = @"
    SELECT
        RTRIM(CONVERT(VARCHAR(20), 車輌コード)) AS Code,
        RTRIM(車番) AS DisplayName
    FROM 車輌マスタ WITH(NOLOCK)
    WHERE 車番 IS NOT NULL
    ORDER BY 車輌コード;
";

            const string charteredSql = @"
    SELECT
        RTRIM(CONVERT(VARCHAR(20), 傭車コード)) AS Code,
        RTRIM(略称) AS DisplayName
    FROM 傭車マスタ WITH(NOLOCK)
    WHERE 略称 IS NOT NULL
    ORDER BY 傭車コード;
";

            if (driverCategory == "0")
            {
                return await connection.QueryAsync<DriverCodeOptionDto>(
                    vehicleSql);
            }

            if (driverCategory == "1" || driverCategory == "2")
            {
                return await connection.QueryAsync<DriverCodeOptionDto>(
                    charteredSql);
            }

            return Enumerable.Empty<DriverCodeOptionDto>();
        }
    }
}
