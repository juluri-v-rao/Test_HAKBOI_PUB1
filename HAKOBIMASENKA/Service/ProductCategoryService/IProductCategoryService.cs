using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ProductCategoryMasterViewModel;

namespace HAKOBIMASENKA.Service.ProductCategoryService.ProductCategoryService
{
    public class ProductCategorySaveResult
    {
        public bool Success { get; set; }

        public string? ErrorMessage { get; set; }

        public string? NextCode { get; set; }
    }

    public class ProductCategoryDeleteResult
    {
        public bool Success { get; set; }

        public string? BlockedReason { get; set; }
    }

    public interface IProductCategoryService
    {
        Task<List<ProductCategoryResultDto>> GetListAsync();

        Task<ProductCategoryViewModel?> GetByCodeAsync(string code);

        Task<bool> CodeExistsAsync(string code);

        Task<string?> GetNextCodeAsync();

        Task<ProductCategorySaveResult> SaveAsync(ProductCategoryViewModel model, string terminalCode);

        Task<ProductCategoryDeleteResult>CanDeleteAsync(string code);

        Task<ProductCategoryDeleteResult> DeleteAsync(string code);
    }
}