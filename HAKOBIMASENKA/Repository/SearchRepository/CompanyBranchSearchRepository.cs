using Dapper;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public class CompanyBranchSearchRepository
        : ICompanyBranchSearchRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public CompanyBranchSearchRepository(
            IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<CompanyBranchSearchResultDto>> SearchAsync()
        {
            const string sql = @"
               SELECT
    RIGHT('00' + RTRIM(自社コード), 2) AS CompanyCode,
    略称 AS Abbreviation
FROM 管理マスタ WITH(NOLOCK)
                ORDER BY 自社コード;
            ";

            using var connection = _connectionFactory.CreateConnection();
            connection.Open();

            return await connection.QueryAsync<CompanyBranchSearchResultDto>(sql);
        }
    }
}