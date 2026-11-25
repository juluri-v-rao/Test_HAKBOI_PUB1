using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Repository.SearchRepository;

namespace HAKOBIMASENKA.Service.SearchService
{
    public class ProductNameSearchService : IProductNameSearchService
    {
        private readonly IProductNameSearchRepository _repository;

        public ProductNameSearchService(
            IProductNameSearchRepository repository)
        {
            _repository = repository;
        }

        // Search product name master records.
        public Task<IEnumerable<ProductNameSearchResultDto>> SearchAsync(
            string? productNameFurigana,
            string? productName,
            string? productCategoryCode,
            string? transportationRecordCode)
        {
            return _repository.SearchAsync(
                productNameFurigana,
                productName,
                productCategoryCode,
                transportationRecordCode);
        }

        // Get product category name.
        public Task<string?> GetProductCategoryByCodeAsync(string code)
        {
            return _repository.GetProductCategoryByCodeAsync(code);
        }

        // Get transportation record name.
        public Task<string?> GetTransportationRecordByCodeAsync(
            string code)
        {
            return _repository.GetTransportationRecordByCodeAsync(code);
        }
    }
}