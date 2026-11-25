
using HAKOBIMASENKA.Models.ViewModels;
using HAKOBIMASENKA.Repository; 

namespace HAKOBIMASENKA.Service
{
    public class ProductMasterService : IProductMasterService
    {
        private readonly IProductMasterRepository _repository;

        public ProductMasterService(
            IProductMasterRepository repository)
        {
            _repository = repository;
        }

        public Task<string> GetNextCodeAsync()
        {
            return _repository.GetNextCodeAsync();
        }

        public Task<ProductMasterDto?> GetByCodeAsync(string productCode)
        {
            return _repository.GetByCodeAsync(productCode);
        }

        public Task<IEnumerable<ProductMasterDto>> GetAllAsync()
        {
            return _repository.GetAllAsync();
        }

        public Task<ProductMasterDto?> GetPreviousAsync(string productCode)
        {
            return _repository.GetPreviousAsync(productCode);
        }

        public Task<ProductMasterDto?> GetNextAsync(string productCode)
        {
            return _repository.GetNextAsync(productCode);
        }

        public Task<bool> SaveAsync(ProductMasterDto product)
        {
            return _repository.SaveAsync(product);
        }

        public Task<bool> DeleteAsync(string productCode)
        {
            return _repository.DeleteAsync(productCode);
        }
        // =========================================
        // 品名区分マスタ Lookup
        // =========================================

        public async Task<ProductMasterDto?> GetProductCategoryAsync(string code)
        {
            return await _repository.GetProductCategoryAsync(code);
        }


        // =========================================
        // 輸送実績区分マスタ Lookup
        // =========================================

        public async Task<ProductMasterDto?> GetTransportResultCategoryAsync(string code)
        {
            return await _repository.GetTransportResultCategoryAsync(code);
        }

        public async Task<string?> CheckDeleteAsync(string productCode)
        {
            return await _repository.CheckDeleteAsync(productCode);
        }
    }
}
