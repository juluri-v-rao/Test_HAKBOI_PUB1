using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.OriginDestMasterViewModel;

namespace HAKOBIMASENKA.Service.OriginDestinationService
{
    public interface IOriginDestinationService
    {
        Task<OriginDestinationViewModel> InitializeAsync(
            string? customerCode = null);

        Task<OriginDestinationViewModel?> GetByCodeAsync(
            string customerCode,
            string destinationCode);

        Task<List<OriginDestinationListItem>> GetListAsync(string customerCode);

        Task<string> GetNextCodeAsync(string customerCode);

        Task<string?> GetCustomerShortNameAsync(string customerCode);

        Task<string?> GetDistrictNameAsync(string districtCode);

        //Added by MAdhu
        Task<string?> GetRegistrationModeAsync();

        Task<PostalAddressResult?> GetAddressByPostalCodeAsync(
            string postalCode);

        Task<OriginDestinationServiceResult> SaveAsync(
            OriginDestinationViewModel model,
            string clientCode);

        Task<OriginDestinationServiceResult> DeleteAsync(
            string customerCode,
            string destinationCode,
            bool isCommonMode);

        Task<string?> GetDeleteBlockMessageAsync(string customerCode, string destinationCode, bool isCommonMode);
    }
}
