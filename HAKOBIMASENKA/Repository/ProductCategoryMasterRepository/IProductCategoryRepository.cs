using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ProductCategoryMasterViewModel;

namespace HAKOBIMASENKA.Repository.ProductCategoryMasterRepository
    {
        public interface IProductCategoryRepository
        {
        Task<List<ProductCategoryResultDto>> GetListAsync();

        Task<ProductCategoryViewModel?> GetByCodeAsync(string code); 

        Task<bool> ExistsAsync(string code);

        Task<string?> GetNextCodeAsync();

        Task SaveAsync(ProductCategoryViewModel model, string terminalCode);

        Task<bool> HasProductReferenceAsync(string code);

        Task<bool> HasOriginDestChargeReferenceAsync(string code);

        Task<bool> HasCompOriginDestReferenceAsync(string code);

        Task<bool> HasAreaChargeReferenceAsync(string code);

        Task<bool> HasCompAreaChargeReferenceAsync(string code);

        Task DeleteAsync(string code);

        }
    }
