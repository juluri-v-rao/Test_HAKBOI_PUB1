using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Repository.SearchRepository;

namespace HAKOBIMASENKA.Service.SearchService
{
    public class ProductClassificationSearchService
        : IProductClassificationSearchService
    {
        private readonly IProductClassificationSearchRepository _repository;

        public ProductClassificationSearchService(
            IProductClassificationSearchRepository repository)
        {
            _repository = repository;
        }

        public Task<IEnumerable<ProductClassificationSearchResultDto>>
            SearchAsync(string? productCategoryName)
        {
            return _repository.SearchAsync(productCategoryName);
        }
    }
}