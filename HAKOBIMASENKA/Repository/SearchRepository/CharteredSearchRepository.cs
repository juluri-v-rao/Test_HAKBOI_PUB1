using Dapper;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public class CharteredSearchRepository : ICharteredSearchRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public CharteredSearchRepository(
            IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<CharteredSearchResultDto>> SearchAsync(
            string? furigana,
            string? abbreviation,
            string? phoneNumber,
            bool activeOnly = false)
        {
            const string sql = @"
                SELECT
    RIGHT('0000000000' + RTRIM(傭車コード), 10) AS CharteredCode,
    略称 AS Abbreviation,
    電話番号 AS PhoneNumber,
    取引終了日 AS TradeEndDate,
    ISNULL(傭車名1, '') + ISNULL(傭車名2, '') AS CharteredName,
    ISNULL(住所1, '') + ISNULL(住所2, '') AS Address
FROM 傭車マスタ WITH(NOLOCK)
WHERE 削除 = '0'
  AND (@Furigana IS NULL OR ふりがな LIKE N'%' + @Furigana + N'%')
  AND (@Name IS NULL OR (ISNULL(傭車名1, '') + ISNULL(傭車名2, '')) LIKE N'%' + @Name + N'%')
  AND (@PhoneNumber IS NULL OR 電話番号 LIKE N'%' + @PhoneNumber + N'%')
  AND (@ActiveOnly = 0 OR 取引終了日 IS NULL)
ORDER BY 傭車コード;
            ";

            using var connection = _connectionFactory.CreateConnection();
            connection.Open();

            var result = await connection.QueryAsync<CharteredSearchResultDto>(
                sql,
                new
                {
                    Furigana = string.IsNullOrWhiteSpace(furigana)
                        ? null : furigana.Trim(),

                    Name = string.IsNullOrWhiteSpace(abbreviation)
            ? null : abbreviation.Trim(),

                    PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber)
                        ? null : phoneNumber.Trim(),

                    ActiveOnly = activeOnly
                });

            return result;
        }
    }
}