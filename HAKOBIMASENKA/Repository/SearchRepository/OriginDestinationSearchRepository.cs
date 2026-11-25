
using Dapper;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public class OriginDestinationSearchRepository
        : IOriginDestinationSearchRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public OriginDestinationSearchRepository(
            IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<OriginDestinationSearchResultDto>> SearchAsync(
            string? shipperCode,
            string? nameFurigana,
            string? originDestinationName,
            string? areaCode,
            int commonMode)
        {
            const string sql = @"
                SELECT
                    RIGHT('0000000000' + RTRIM(発着地マスタ.発着地コード), 10)
                        AS OriginDestinationCode,
                    発着地マスタ.発着地名 AS OriginDestinationName,
                    地区マスタ.名称 AS AreaName,
                    発着地マスタ.電話番号 AS PhoneNumber,
                    ISNULL(発着地マスタ.住所1, '') +
                    ISNULL(発着地マスタ.住所2, '') AS Address1
                FROM 発着地マスタ WITH(NOLOCK)
                LEFT JOIN 地区マスタ WITH(NOLOCK)
                    ON 発着地マスタ.地区コード = 地区マスタ.コード
                WHERE
                    (
                        (@CommonMode = 1
                            AND 発着地マスタ.荷主コード = '')
                        OR
                        (@CommonMode = 0
                            AND (
                                @ShipperCode IS NULL
                                OR 発着地マスタ.荷主コード = @ShipperCode
                            )
                        )
                    )
                    AND
                    (@Furigana IS NULL
                        OR 発着地マスタ.ふりがな LIKE N'%' + @Furigana + N'%')
                    AND
                    (@Name IS NULL
                        OR 発着地マスタ.発着地名 LIKE N'%' + @Name + N'%')
                    AND
                    (@AreaCode IS NULL
                        OR 発着地マスタ.地区コード = @AreaCode)
                ORDER BY 発着地マスタ.発着地コード;
            ";

            using var connection = _connectionFactory.CreateConnection();
            connection.Open();

            return await connection.QueryAsync<OriginDestinationSearchResultDto>(
                sql,
                new
                {
                    ShipperCode = string.IsNullOrWhiteSpace(shipperCode)
                        ? null
                        : shipperCode.Trim(),

                    Furigana = string.IsNullOrWhiteSpace(nameFurigana)
    ? null
    : nameFurigana,

                    Name = string.IsNullOrWhiteSpace(originDestinationName)
    ? null
    : originDestinationName,

                    AreaCode = string.IsNullOrWhiteSpace(areaCode)
    ? null
    : areaCode,

                    CommonMode = commonMode
                });
        }

        public async Task<OriginDestinationSearchResultDto?> GetAreaByCodeAsync(
            string code)
        {
            const string sql = @"
                SELECT
                    コード AS GetAreaCode,
                    名称 AS GetAreaName
                FROM 地区マスタ
                WHERE コード = @Code;
            ";

            using var connection = _connectionFactory.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<
                OriginDestinationSearchResultDto>(
                sql,
                new { Code = code });
        }
    }
}
