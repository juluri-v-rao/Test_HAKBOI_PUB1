using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Service.SearchService
{
    public interface IVehicleSearchService
    {
        Task<IEnumerable<VehicleSearchResultDto>> SearchAsync(
            string? vehicleNumber,
            string? makerName,
            string? model,
            string? vehicleCategory,
            decimal? loadMin,
            decimal? loadMax,
            bool activeOnly = false);
    }
}
