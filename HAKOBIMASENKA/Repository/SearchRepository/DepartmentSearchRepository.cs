using Dapper;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public class DepartmentSearchRepository : IDepartmentSearchRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public DepartmentSearchRepository(
            IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<DepartmentSearchResultDto>> SearchAsync()
        {
            const string sql = @"
                SELECT
                    コード AS Code,
                    名称 AS DepartmentName
                FROM 部門マスタ
                ORDER BY コード;
            ";

            using var connection = _connectionFactory.CreateConnection();
            connection.Open();

            var result =
                await connection.QueryAsync<DepartmentSearchResultDto>(sql);

            return result;
        }
    }
}