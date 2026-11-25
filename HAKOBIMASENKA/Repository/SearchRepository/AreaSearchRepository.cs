using Dapper;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public class AreaSearchRepository : IAreaSearchRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public AreaSearchRepository(
            IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<AreaSearchResultDto>> SearchAsync(
            string? areaName)
        {
            const string sql = @"
    SELECT
        RIGHT('0000' + RTRIM(コード), 4) AS Code,
        名称 AS AreaName
    FROM 地区マスタ WITH(NOLOCK)
    WHERE 削除 = '0'
        AND (
            @AreaName IS NULL
            OR 名称 LIKE N'%' + @AreaName + N'%'
        )
    ORDER BY コード;
";

            using var connection = _connectionFactory.CreateConnection();
            connection.Open();

            var result = await connection.QueryAsync<AreaSearchResultDto>(
                sql,
                new
                {
                    AreaName = string.IsNullOrWhiteSpace(areaName)
                        ? null
                        : areaName.Trim()
                });

            return result;
        }
    }
}