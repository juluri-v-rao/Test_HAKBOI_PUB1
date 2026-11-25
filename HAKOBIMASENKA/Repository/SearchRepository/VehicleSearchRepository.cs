
using System.Data;
using Dapper;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public class VehicleSearchRepository : IVehicleSearchRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public VehicleSearchRepository(
            IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory
        ?? throw new ArgumentNullException(nameof(connectionFactory));
        }

        public async Task<IEnumerable<VehicleSearchResultDto>> SearchAsync(
            string? vehicleNumber,
            string? makerName,
            string? model,
            string? vehicleCategory,
            decimal? loadMin,
            decimal? loadMax,
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
                    RIGHT('0000000000' + LTRIM(RTRIM(CAST(車輌コード AS VARCHAR(10)))), 10) AS VehicleCode,
                    車番 AS VehicleNumber,
                    メーカー名 AS MakerName,

                    CASE
                        WHEN 廃車日 IS NOT NULL THEN N'[済]'
                        ELSE N''
                    END AS RetiredStatus,

                    形式 AS Model,
                    登録年月日 AS RegistrationYear,
                    最大積載重量 AS LoadWeight,
                    車輌区分 AS VehicleCategory

                FROM 車輌マスタ  WITH(NOLOCK)

                WHERE
                    (@VehicleNumber IS NULL
                     OR 車番 LIKE N'%' + @VehicleNumber + N'%')

                    AND (@MakerName IS NULL
                         OR メーカー名 LIKE N'%' + @MakerName + N'%')

                    AND (@Model IS NULL
                         OR 形式 LIKE N'%' + @Model + N'%')

                    AND (@VehicleCategory IS NULL
                         OR 車輌区分 = @VehicleCategory)

                    AND (@LoadMin IS NULL
                         OR 最大積載重量 >= @LoadMin)

                    AND (@LoadMax IS NULL
                         OR 最大積載重量 <= @LoadMax)

                    -- legacy SelMX = ""9"": only vehicles not retired
                    AND (@ActiveOnly = 0 OR 廃車日 IS NULL)

                ORDER BY 車輌コード;
            ";

            var parameters = new
            {
                VehicleNumber = string.IsNullOrWhiteSpace(vehicleNumber)
                    ? null : vehicleNumber.Trim(),

                MakerName = string.IsNullOrWhiteSpace(makerName)
                    ? null : makerName.Trim(),

                Model = string.IsNullOrWhiteSpace(model)
                    ? null : model.Trim(),

                VehicleCategory = string.IsNullOrWhiteSpace(vehicleCategory)
                    ? null : vehicleCategory.Trim(),

                LoadMin = loadMin,
                LoadMax = loadMax,
                ActiveOnly = activeOnly
            };

            return await connection.QueryAsync<VehicleSearchResultDto>(
                sql, parameters);
        }
    }
}
