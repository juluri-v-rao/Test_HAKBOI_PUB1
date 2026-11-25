using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;

namespace HAKOBIMASENKA.Repository.SearchRepository
{
    public interface IVehicleSearchRepository
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
