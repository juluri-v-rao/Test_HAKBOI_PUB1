using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Service.SearchService
{
    public interface IProductClassificationSearchService
    {
        Task<IEnumerable<ProductClassificationSearchResultDto>> SearchAsync(
            string? productCategoryName);
    }
}