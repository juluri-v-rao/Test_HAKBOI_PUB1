using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public interface IProductClassificationSearchRepository
    {
        Task<IEnumerable<ProductClassificationSearchResultDto>> SearchAsync(
            string? productCategoryName);
    }
}