using HAKOBIMASENKA.Helpers;
using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.OriginDestMasterViewModel;
using HAKOBIMASENKA.Repository.OriginDestRepository;
using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace HAKOBIMASENKA.Service.OriginDestinationService
{
    public class OriginDestinationService : IOriginDestinationService
    {
        private readonly IOriginDestinationRepository _repository;

        public OriginDestinationService(
            IOriginDestinationRepository repository)
        {
            _repository = repository;
        }

        // ---------------------------------------------------------
        // Initialize screen
        // ---------------------------------------------------------
        public async Task<OriginDestinationViewModel> InitializeAsync(
            string? customerCode = null)
        {
            string? registrationMode = await _repository.GetRegistrationModeAsync();

            registrationMode ??= "";

            bool isCommonMode = registrationMode == "1";

            string normalizedCustomerCode = string.Empty;
            string customerName = string.Empty;
            string nextCode = string.Empty;
            var list = new List<OriginDestinationListItem>();

            if (isCommonMode)
            {
                // Common mode:
                // Empty customer code is intentional.
                nextCode = await _repository.GetNextCodeAsync(
                    normalizedCustomerCode);

                list = await _repository.GetListAsync(
                    normalizedCustomerCode);
            }

            else if (!string.IsNullOrWhiteSpace(customerCode))
            {
                normalizedCustomerCode = customerCode;
                if (!string.IsNullOrWhiteSpace(normalizedCustomerCode))
                {
                    customerName = await _repository.GetCustomerShortNameAsync(
                            normalizedCustomerCode) ?? string.Empty;

                    if (!string.IsNullOrWhiteSpace(customerName))
                    {
                        nextCode = await _repository.GetNextCodeAsync(
                            normalizedCustomerCode);
                        list = await _repository.GetListAsync(
                            normalizedCustomerCode);
                    }
                    else
                    {
                        normalizedCustomerCode = string.Empty;
                    }
                }

            }

            return new OriginDestinationViewModel
            {
                RegistrationMode = registrationMode,
                IsCommonMode = isCommonMode,
                IsNewRecord = true,

                CustomerCode = normalizedCustomerCode,
                CustomerName = customerName,

                DestinationCode = nextCode,

                List = list
            };
        }

        // ---------------------------------------------------------
        // Get one record
        // ---------------------------------------------------------
        public async Task<OriginDestinationViewModel?> GetByCodeAsync(
            string customerCode,
            string destinationCode)
        {

            if (string.IsNullOrWhiteSpace(destinationCode))
            {
                return null;
            }

            return await _repository.GetByCodeAsync(
                customerCode,
                destinationCode);
        }

        // ---------------------------------------------------------
        // Get a list
        // ---------------------------------------------------------
        public Task<List<OriginDestinationListItem>> GetListAsync(string customerCode)
        {
            return _repository.GetListAsync(customerCode);
        }


        // ---------------------------------------------------------
        // Generate next destination code
        // ---------------------------------------------------------
        public async Task<string> GetNextCodeAsync(string customerCode)
        {

            return await _repository.GetNextCodeAsync(customerCode);
        }

        // ---------------------------------------------------------
        // Customer lookup
        // ---------------------------------------------------------
        public async Task<string?> GetCustomerShortNameAsync(
            string customerCode)
        {
            if (string.IsNullOrWhiteSpace(customerCode))
            {
                return null;
            }

            return await _repository.GetCustomerShortNameAsync(customerCode);
        }

        // ---------------------------------------------------------
        // District lookup
        // ---------------------------------------------------------
        public async Task<string?> GetDistrictNameAsync(
            string districtCode)
        {

            if (string.IsNullOrWhiteSpace(districtCode))
            {
                return null;
            }

            return await _repository.GetDistrictNameAsync(districtCode);
        }

        // ---------------------------------------------------------
        // Postal code lookup
        // ---------------------------------------------------------
        public async Task<PostalAddressResult?> GetAddressByPostalCodeAsync(
            string postalCode)
        {
            if (string.IsNullOrWhiteSpace(postalCode))
            {
                return null;
            }

            string normalizedPostalCode =
                postalCode.Trim().Replace("-", "");

            return await _repository.GetAddressByPostalCodeAsync(
                normalizedPostalCode);
        }

        // ---------------------------------------------------------
        // Save / Register / Update
        // ---------------------------------------------------------
        public async Task<OriginDestinationServiceResult> SaveAsync(
            OriginDestinationViewModel model,
            string clientCode)
        {
            if (model == null)
            {
                return Failure("登録データがありません。");
            }

            // Get the actual registration mode from the database.
            string? registrationMode = await _repository.GetRegistrationModeAsync();

            registrationMode ??= "";

            bool isCommonMode = registrationMode == "1";

            // -----------------------------------------------------
            // Customer code
            // -----------------------------------------------------
            string customerCode = model.CustomerCode?.Trim() ?? string.Empty;

            if (!isCommonMode)
            {
                string? customerName =
                    await _repository.GetCustomerShortNameAsync(
                        customerCode);

                if (string.IsNullOrWhiteSpace(customerName))
                {
                    return Failure($"指定した荷主『{customerCode}』は未登録です！！");
                }

                model.CustomerName = customerName;
            }

            string destinationCode = CommonHelper.ZeroPad(model.DestinationCode, 10);

            // Legacy behaviour: if abbreviation is empty,
            // automatically copy the destination name.
            model.Abbreviation =
                model.Abbreviation?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(model.Abbreviation))
            {
                model.Abbreviation = model.DestinationName;
            }

            //string districtCode = CommonHelper.ZeroPad(model.DistrictCode,4);
            string districtCode = CommonHelper.ZeroPad(model.DistrictCode, 4);

            // -------------------------------------------------
            // 6. Assign values to the model
            // -------------------------------------------------
            model.CustomerCode = customerCode;
            model.DestinationCode = destinationCode;
            model.DistrictCode = districtCode;
            model.DistrictName = model.DistrictName ?? string.Empty;
            model.IsCommonMode = isCommonMode;
            model.PostalCode = model.PostalCode ?? string.Empty;
            model.Address1 = model.Address1 ?? string.Empty;
            model.Address2 = model.Address2 ?? string.Empty;
            model.PhoneNumber = model.PhoneNumber ?? string.Empty;
            model.FaxNumber = model.FaxNumber ?? string.Empty;
            model.DigitacoCode = model.DigitacoCode ?? string.Empty;
            model.Remarks = model.Remarks ?? string.Empty;
            model.Url = model.Url ?? string.Empty;

            // -----------------------------------------------------
            // Save to database
            // -----------------------------------------------------
            await _repository.SaveAsync(model, clientCode);

            return Success("登録しました。");
        }

        // ---------------------------------------------------------
        // Delete
        // ---------------------------------------------------------
        public async Task<OriginDestinationServiceResult> DeleteAsync(
            string customerCode,
            string destinationCode,
            bool isCommonMode)
        {

            if (string.IsNullOrWhiteSpace(destinationCode))
            {
                return Failure("発着地コードが正しくありません。");
            }

            // Check whether this destination is referenced by
            // other tables before deleting it.
            string? blockMessage =
                await _repository.GetDeleteBlockMessageAsync(
                    customerCode,
                    destinationCode,
                    isCommonMode);

            if (!string.IsNullOrWhiteSpace(blockMessage))
            {
                return Failure(blockMessage);
            }

            await _repository.DeleteAsync(
                customerCode,
                destinationCode);

            return Success("削除しました。");
        }

        public Task<string?> GetDeleteBlockMessageAsync(string customerCode, string destinationCode, bool isCommonMode)
        {
            return _repository.GetDeleteBlockMessageAsync(
                customerCode,
                destinationCode,
                isCommonMode);
        }

        // ---------------------------------------------------------
        // Result helpers
        // ---------------------------------------------------------
        private static OriginDestinationServiceResult Success(
            string message)
        {
            return new OriginDestinationServiceResult
            {
                Success = true,
                Message = message
            };
        }

        private static OriginDestinationServiceResult Failure(
            string message)
        {
            return new OriginDestinationServiceResult
            {
                Success = false,
                Message = message
            };
        }

        
        public Task<string?> GetRegistrationModeAsync()
        {
            return _repository.GetRegistrationModeAsync();
        }
    }
}
