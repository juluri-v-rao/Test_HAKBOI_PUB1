
using Dapper;
using HAKOBIMASENKA.Models.ViewModels;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public class ShipperSearchRepository : IShipperSearchRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public ShipperSearchRepository(
            IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<ShipperSearchPopUpResultDto>> SearchAsync(
            string? furigana,
            string? name,
            string? phoneNumber,
            bool activeOnly = false)
        {
            const string sql = @"
                SELECT
                    RIGHT('0000000000' + RTRIM(荷主コード), 10) AS ShipperCode,
                    略称 AS Abbreviation,
取引終了日 AS TradeEndDate,
                    ふりがな AS Furigana,
                    電話番号 AS PhoneNumber,
                    (
                        COALESCE(荷主名1, N'') +
                        COALESCE(荷主名2, N'')
                    ) AS ShipperName,
                    (
                        COALESCE(住所1, N'') +
                        COALESCE(住所2, N'')
                    ) AS Address
                FROM 荷主マスタ WITH(NOLOCK)
                            WHERE
                削除 = '0'

                AND (@Furigana IS NULL
                     OR ふりがな LIKE N'%' + @Furigana + N'%')

                AND (@Name IS NULL
                     OR (ISNULL(荷主名1, N'') + ISNULL(荷主名2, N'')) LIKE N'%' + @Name + N'%')

                AND (@PhoneNumber IS NULL
                     OR 電話番号 LIKE N'%' + @PhoneNumber + N'%')

                -- legacy SelMX = ""9"": only 荷主 still trading
                AND (@ActiveOnly = 0 OR 取引終了日 IS NULL)
                ORDER BY 荷主コード;
            ";

            using var connection = _connectionFactory.CreateConnection();
            connection.Open();

            var result = await connection.QueryAsync<ShipperSearchPopUpResultDto>(
                sql,
                new
                {
                    Furigana = string.IsNullOrWhiteSpace(furigana) ? null : furigana.Trim(),
                    Name = string.IsNullOrWhiteSpace(name) ? null : name.Trim(),
                    PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim(),
                    ActiveOnly = activeOnly
                });

            return result;
        }
    }
}
