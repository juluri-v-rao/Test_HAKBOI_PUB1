using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Service.SearchService
{
    public interface IProductNameSearchService
    {
        Task<IEnumerable<ProductNameSearchResultDto>> SearchAsync(
            string? productNameFurigana,
            string? productName,
            string? productCategoryCode,
            string? transportationRecordCode);

        Task<string?> GetProductCategoryByCodeAsync(string code);

        Task<string?> GetTransportationRecordByCodeAsync(string code);
    }
}