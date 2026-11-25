
using HAKOBIMASENKA.Models.ViewModels;

namespace HAKOBIMASENKA.Repository
{
    public interface IProductMasterRepository
    {
        Task<string> GetNextCodeAsync();

        Task<ProductMasterDto?> GetByCodeAsync(string productCode);

        Task<IEnumerable<ProductMasterDto>> GetAllAsync();

        Task<ProductMasterDto?> GetPreviousAsync(string productCode);

        Task<ProductMasterDto?> GetNextAsync(string productCode);

        Task<bool> SaveAsync(ProductMasterDto product);

        Task<bool> DeleteAsync(string productCode);

        Task<ProductMasterDto?> GetProductCategoryAsync(string code);

        Task<ProductMasterDto?> GetTransportResultCategoryAsync(string code);

        Task<string?> CheckDeleteAsync(string productCode);
    }
}
