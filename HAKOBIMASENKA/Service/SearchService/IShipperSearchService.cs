using HAKOBIMASENKA.Models.ViewModels;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Service.SearchService
{
    public interface IShipperSearchService
    {
        Task<IEnumerable<ShipperSearchPopUpResultDto>> SearchAsync(string? furigana,
            string? name,
            string? phoneNumber,
            bool activeOnly = false);
    }
}