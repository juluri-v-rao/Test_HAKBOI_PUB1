using System.Data;

namespace HAKOBIMASENKA.Repository
{
    public interface IDbConnectionFactory
    {
        IDbConnection CreateConnection();

        IDbConnection CreateClientConnection();
    }
}
