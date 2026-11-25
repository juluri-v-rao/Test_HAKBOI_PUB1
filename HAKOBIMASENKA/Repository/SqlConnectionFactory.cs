using System.Data;
using Microsoft.Data.SqlClient;

namespace HAKOBIMASENKA.Repository
{
    public class SqlConnectionFactory:IDbConnectionFactory
    {
        private readonly string _connectionString;
        private readonly string _clientConnectionString;
        public SqlConnectionFactory(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connectionstring missing: Hakobimasenka in appsetting.json ");

            _clientConnectionString = configuration.GetConnectionString("ClientConnection") ?? throw new InvalidOperationException("Connectionstring missing: ClientConnection");
        }
        public IDbConnection CreateConnection() => new SqlConnection(_connectionString);

        public IDbConnection CreateClientConnection() => new SqlConnection(_clientConnectionString);

    }
}
