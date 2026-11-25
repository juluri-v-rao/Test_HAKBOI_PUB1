/// <summary>
/// Product Category Master Service
///
/// Handles:
/// - Save
/// - Delete
/// - Get By Code
/// - Next Code
/// - List
/// - Exists
///
/// Migrated From:
/// FrmM_Mast1.vb
/// </summary>

using HAKOBIMASENKA.Helpers;
using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ProductCategoryMasterViewModel;
using HAKOBIMASENKA.Repository.ProductCategoryMasterRepository;

namespace HAKOBIMASENKA.Service.ProductCategoryService.ProductCategoryService
    {
    public class ProductCategoryService : IProductCategoryService
    {
        private readonly IProductCategoryRepository _repository;

        public ProductCategoryService(IProductCategoryRepository repository)
        {
            _repository = repository;
        }

        public Task<List<ProductCategoryResultDto>> GetListAsync()
                => _repository.GetListAsync();

        public Task<ProductCategoryViewModel?> GetByCodeAsync(string code)
                => _repository.GetByCodeAsync(CommonHelper.ZeroPad(code, 4));

        public Task<bool> CodeExistsAsync(string code)
                => _repository.ExistsAsync(CommonHelper.ZeroPad(code, 4));

        public Task<string?> GetNextCodeAsync()
                => _repository.GetNextCodeAsync();

        public async Task<ProductCategorySaveResult> SaveAsync(ProductCategoryViewModel model, string terminalCode)
        {
                // digits only (ZeroPad converts to a number)
                if (string.IsNullOrWhiteSpace(model.コード) ||
                    model.コード.Trim().Length > 4 ||
                    !model.コード.Trim().All(char.IsAsciiDigit))
                {
                    return new ProductCategorySaveResult
                    {
                        Success = false,
                        ErrorMessage = "品名区分を入力してください"
                    };
                }

                model.コード = CommonHelper.ZeroPad(model.コード.Trim(),4);

                // An existing code is updated, as legacy Data_Repl does (the screen refuses a taken code after F2).
                // The name is checked = "" only: a name of spaces is saved as typed.
                if (string.IsNullOrEmpty(model.名称))
                {
                    return new ProductCategorySaveResult
                    {
                        Success = false,
                        ErrorMessage = "品名区分名を入力してください"
                    };
                }

                await _repository.SaveAsync(model,terminalCode);
                
                return new ProductCategorySaveResult
                {
                    Success = true,
                    NextCode = await _repository.GetNextCodeAsync()
                };
        }

        public async Task<ProductCategoryDeleteResult>CanDeleteAsync(string code)
        {
            var normalized = CommonHelper.ZeroPad(code, 4);

            if (await _repository.HasProductReferenceAsync(normalized))
            {
                return new ProductCategoryDeleteResult
                {
                    Success = false,
                    BlockedReason =
                        "品名マスタが登録されていますので、削除出来ません！！"
                };
            }

            if (await _repository.HasOriginDestChargeReferenceAsync(normalized))
            {
                return new ProductCategoryDeleteResult
                {
                    Success = false,
                    BlockedReason =
                        "発着地運賃マスタが登録されていますので、削除出来ません！！"
                };
            }

            if (await _repository.HasCompOriginDestReferenceAsync(normalized))
            {
                return new ProductCategoryDeleteResult
                {
                    Success = false,
                    BlockedReason =
                        "発着地運賃マスタが登録されていますので、削除出来ません！！"
                };
            }

            if (await _repository.HasAreaChargeReferenceAsync(normalized))
            {
                return new ProductCategoryDeleteResult
                {
                    Success = false,
                    BlockedReason =
                        "エリア運賃マスタが登録されていますので、削除出来ません！！"
                };
            }

            if (await _repository.HasCompAreaChargeReferenceAsync(normalized))
            {
                return new ProductCategoryDeleteResult
                {
                    Success = false,
                    BlockedReason =
                        "エリア運賃マスタが登録されていますので、削除出来ません！！"
                };
            }

            return new ProductCategoryDeleteResult
            {
                Success = true
            };
        }

        public async Task<ProductCategoryDeleteResult>DeleteAsync(string code)
        {
            var normalized = CommonHelper.ZeroPad(code, 4);

            var canDelete = await CanDeleteAsync(normalized);

            if (!canDelete.Success)
            {
                return canDelete;
            }

            await _repository.DeleteAsync(normalized);

            return new ProductCategoryDeleteResult
            {
                Success = true
            };
        }
    }
}