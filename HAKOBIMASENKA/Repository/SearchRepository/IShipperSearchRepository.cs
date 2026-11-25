using HAKOBIMASENKA.Models.ViewModels;
using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public interface IShipperSearchRepository
    {
        Task<IEnumerable<ShipperSearchPopUpResultDto>> SearchAsync(
            string? furigana,
            string? abbreviation,
            string? phoneNumber,
            bool activeOnly = false);
    }
}