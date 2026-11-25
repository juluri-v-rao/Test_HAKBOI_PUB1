using Dapper;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto; 

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public class UnitSearchRepository : IUnitSearchRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public UnitSearchRepository(
            IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<UnitSearchResultDto>> SearchAsync()
        {
            const string sql = @"
                SELECT
                    コード AS Code,
                    名称 AS UnitName
                FROM 単位マスタ
                ORDER BY コード;
            ";

            using var connection = _connectionFactory.CreateConnection();
            connection.Open();

            var result = await connection.QueryAsync<UnitSearchResultDto>(sql);

            return result;
        }
    }
}