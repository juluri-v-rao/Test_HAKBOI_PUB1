using HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ShipperMasterViewModel;
using HAKOBIMASENKA.Repository.ShipperRepository;

namespace HAKOBIMASENKA.Service.ShipperService
{
    public class ShipperService:IShipperService
    {
        private readonly IShipperRepository _shipperRepository;

        public ShipperService(IShipperRepository shipperRepository)
        {
            _shipperRepository = shipperRepository;
        }

        public Task<ShipperViewModel?> GetByCodeAsync(string code)
        {
            return _shipperRepository.GetByCodeAsync(code);
        }

        public Task<bool> ExistsAsync(string code)
        {
            return _shipperRepository.ExistsAsync(code);
        }

        public Task<string> GetMaxCodeAsync()
        {
            return _shipperRepository.GetMaxCodeAsync();
        }

        public Task<string> GetNextCodeAsync(string currentCode)
        {
            return _shipperRepository.GetNextCodeAsync(currentCode);
        }

        public Task<string> GetPrevCodeAsync(string currentCode)
        {
            return _shipperRepository.GetPrevCodeAsync(currentCode);
        }

        public Task<(bool valid, string? 略称)> ValidateSettlementDestinationAsync(string code, bool isNewRecord)
        {
            return _shipperRepository.ValidateSettlementDestinationAsync(
                code,
                isNewRecord);
        }

        public Task UpsertAsync(ShipperViewModel model, string clientNo)
        {
            return _shipperRepository.UpsertAsync(model, clientNo);
        }

        public Task<string?> CheckDeleteAsync(string code, string kanriPlKbn)
        {
            return _shipperRepository.CheckDeleteAsync(code, kanriPlKbn);
        }

        public async Task<string?> DeleteAsync(string code, string kanriPlKbn)
        {
            // Step 1: Check whether another table references this shipper.
            string? blockedReason =
                await _shipperRepository.CheckDeleteAsync(code, kanriPlKbn);

            // Step 2: Stop deletion if a reference exists.
            if (!string.IsNullOrEmpty(blockedReason))
            {
                return blockedReason;
            }

            // Step 3: Delete the shipper only when all checks pass.
            await _shipperRepository.DeleteAsync(code);

            // null means deletion completed without a service-level error.
            return null;
        }

        public Task<IEnumerable<ShipperHistoryDto>> GetHistoryAsync(string code, string branchCode, string kind)
        {
            return _shipperRepository.GetHistoryAsync(code, branchCode, kind);
        }

        public Task<ShipperHistoryDto?> GetHistoryRowAsync(string code, string branchCode, string kind, DateTime updateDate)
        {
            return _shipperRepository.GetHistoryRowAsync(
                code,
                branchCode,
                kind,
                updateDate);
        }

        public Task UpsertHistoryRowAsync(ShipperHistoryDto row, string kind, string clientNo)
        {
            return _shipperRepository.UpsertHistoryRowAsync(
                row,
                kind,
                clientNo);
        }

        public Task DeleteHistoryRowAsync(string code, string branchCode, string kind, DateTime updateDate)
        {
            return _shipperRepository.DeleteHistoryRowAsync(
                code,
                branchCode,
                kind,
                updateDate);
        }

        public Task<IEnumerable<PaymentCategoryOption>>
            GetPaymentCategoriesAsync()
        {
            return _shipperRepository.GetPaymentCategoriesAsync();
        }

        public Task<DepartmentCodeResult?> GetDepartmentAsync(string code)
        {
            return _shipperRepository.GetDepartmentAsync(code);
        }

        public Task<string?> GetManagementNameAsync(string code)
        {
            return _shipperRepository.GetManagementNameAsync(code);
        }

        public Task<BankNameResult?> GetBankNameAsync(string code)
        {
            return _shipperRepository.GetBankNameAsync(code);
        }

        public Task<IEnumerable<UnitCategoryOption>> GetUnitsAsync()
        {
            return _shipperRepository.GetUnitsAsync();
        }

        public Task<(
            string uriHasu,
            string zeiKbn,
            string zeiHasu,
            string seikyuBiSettei,
            string kazeiWarimashi,
            string hikazeiWarimashi,
            bool unkoukanri,
            bool digitco
        )> GetSystemDefaultsAsync()
        {
            return _shipperRepository.GetSystemDefaultsAsync();
        }

        public Task ClearHistoryWorkTablesAsync()
        {
            return _shipperRepository.ClearHistoryWorkTablesAsync();
        }

        public Task<string?> GetKanriPlKbnAsync()
        {
            return _shipperRepository.GetKanriPlKbnAsync();
        }
    }
}
