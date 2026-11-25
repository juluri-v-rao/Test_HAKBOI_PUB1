using HAKOBIMASENKA.Models.ViewModels.SearchResultDto;
using HAKOBIMASENKA.Repository.SearchRepository;

namespace HAKOBIMASENKA.Service.SearchService
{
    public class VehicleSearchService : IVehicleSearchService
    {
        private readonly IVehicleSearchRepository _repository;

        public VehicleSearchService(IVehicleSearchRepository repository)
        {
            _repository = repository
                ?? throw new ArgumentNullException(nameof(repository));
        }

        public Task<IEnumerable<VehicleSearchResultDto>> SearchAsync(
            string? vehicleNumber,
            string? makerName,
            string? model,
            string? vehicleCategory,
            decimal? loadMin,
            decimal? loadMax,
            bool activeOnly = false)
        {
            return _repository.SearchAsync(
                vehicleNumber,
                makerName,
                model,
                vehicleCategory,
                loadMin,
                loadMax,
                activeOnly);
        }
    }
}
