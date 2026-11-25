using Dapper;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public class TransportationRecordSearchRepository
        : ITransportationRecordSearchRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public TransportationRecordSearchRepository(
            IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<TransportationRecordSearchResultDto>>
            SearchAsync(string? transportationRecordName)
        {
            const string sql = @"
                SELECT
    RIGHT('0000' + RTRIM(コード), 4) AS Code,
    名称 AS TransportationRecordName
FROM 輸送実績区分マスタ WITH(NOLOCK)
WHERE 削除 = '0'
    AND (
        @TransportationRecordName IS NULL
        OR 名称 LIKE N'%' + @TransportationRecordName + N'%'
    )
ORDER BY コード;
            ";

            using var connection = _connectionFactory.CreateConnection();
            connection.Open();

            var result =
                await connection.QueryAsync<TransportationRecordSearchResultDto>(
                    sql,
                    new
                    {
                        TransportationRecordName =
                            string.IsNullOrWhiteSpace(transportationRecordName)
                                ? null
                                : transportationRecordName.Trim()
                    });

            return result;
        }
    }
}