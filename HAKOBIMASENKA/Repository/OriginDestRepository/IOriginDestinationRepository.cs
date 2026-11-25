using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.OriginDestMasterViewModel;

namespace HAKOBIMASENKA.Repository.OriginDestRepository
{
    public interface IOriginDestinationRepository
    {
        Task<string?> GetRegistrationModeAsync();

        Task<string?> GetCustomerShortNameAsync(string customerCode);

        Task<string?> GetDistrictNameAsync(string districtCode);

        Task<PostalAddressResult?> GetAddressByPostalCodeAsync(string postalCode);

        Task<string> GetNextCodeAsync(string customerCode);

        Task<OriginDestinationViewModel?> GetByCodeAsync(
            string customerCode,
            string destinationCode);

        Task<List<OriginDestinationListItem>> GetListAsync(
            string customerCode);

        Task<bool> ExistsAsync(
            string customerCode,
            string destinationCode);

        Task SaveAsync(
            OriginDestinationViewModel model,
            string clientCode);

        Task<string?> GetDeleteBlockMessageAsync(
            string customerCode,
            string destinationCode,
            bool isCommonMode);

        Task DeleteAsync(
            string customerCode,
            string destinationCode);
    }
}
