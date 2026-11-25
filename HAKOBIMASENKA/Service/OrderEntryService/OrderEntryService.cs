using HAKOBIMASENKA.Models.ViewModels.DailyProcessingEntryViewModels.OrderEntryViewModel;
using HAKOBIMASENKA.Repository.OrderEntryRepository;

namespace HAKOBIMASENKA.Service.OrderEntryService
{
    public class OrderEntryService(IOrderEntryRepository repository, IOrderEntryLookupRepository lookupRepository) : IOrderEntryService
    {
        private readonly IOrderEntryRepository _repository = repository;

        private readonly IOrderEntryLookupRepository _lookupRepository = lookupRepository;

        public async Task<OrderEntryViewModel?> GetByOrderNoAsync(string orderNo)
        {
            var dto = await _repository.GetByOrderNoAsync(orderNo);
            return dto != null ? ToViewModel(dto) : null;
        }

        public async Task<OrderEntryViewModel?> GetNextOrderAsync(string orderNo)
        {
            var dto = await _repository.GetNextOrderAsync(orderNo);
            return dto != null ? ToViewModel(dto) : null;
        }

        public async Task<OrderEntryViewModel?> GetPreviousOrderAsync(string orderNo)
        {
            var dto = await _repository.GetPreviousOrderAsync(orderNo);
            return dto != null ? ToViewModel(dto) : null;
        }

        public async Task<OrderEntrySaveResult> SaveAsync(OrderEntryViewModel model)
        {
            var errorMessage = Validate(model);

            if (errorMessage != null)
            {
                return new OrderEntrySaveResult { ErrorMessage = errorMessage };
            }

            await _repository.SaveAsync(ToDto(model));

            return new OrderEntrySaveResult { Success = true };
        }

        // Migrated from Input_Chk (FrmN_Juchu.vb).
        private static string? Validate(OrderEntryViewModel model)
        {
            if (string.IsNullOrEmpty(model.OrderNo))
            {
                return "伝票番号がありません！！";
            }

            if (model.OrderDate == null)
            {
                return "受注日を正しく入力して下さい！！";
            }

            if (string.IsNullOrEmpty(model.BranchCode))
            {
                return "自社支店を入力してください！！";
            }

            if (!model.Details.Any(x => !string.IsNullOrEmpty(x.SupplierCode)))
            {
                return "明細行がありませんので、登録出来ません！！";
            }

            return null;
        }

        public async Task DeleteAsync(string orderNo)
        {
            await _repository.DeleteAsync(orderNo);
        }

        public async Task<string> GetNewOrderNoAsync()
        {
            return await _repository.GetNewOrderNoAsync();
        }

        public async Task<string> GetNewWorkVoucherNoAsync()
        {
            return await _repository.GetNewWorkVoucherNoAsync();
        }

        // Mapping Methods
        private OrderEntryViewModel ToViewModel(OrderEntryDto dto)
        {
            return new OrderEntryViewModel
            {
                OrderNo = dto.OrderNo,
                OrderDate = dto.OrderDate,
                BranchCode = dto.BranchCode,
                BranchName = dto.BranchName,
                WorkVoucherNo = dto.WorkVoucherNo,

                Details = dto.Details
                    .Select(ToDetailViewModel)
                    .ToList()
            };
        }

        private OrderEntryDto ToDto(OrderEntryViewModel model)
        {
            return new OrderEntryDto
            {
                OrderNo = model.OrderNo,
                OrderDate = model.OrderDate,
                BranchCode = model.BranchCode,
                BranchName = model.BranchName,
                WorkVoucherNo = model.WorkVoucherNo,
                IsNew = model.IsNew,

                Details = model.Details
                    .Select(ToDetailDto)
                    .ToList()
            };
        }

        private static OrderDetailViewModel ToDetailViewModel(OrderDetailDto dto)
        {
            return new OrderDetailViewModel
            {
                RowNo = dto.RowNo,
                WorkVoucherNo = dto.WorkVoucherNo,
                DailyReportNo = dto.DailyReportNo,
                DailyReportRowNo = dto.DailyReportRowNo,
                SupplierCode = dto.SupplierCode,
                SupplierName = dto.SupplierName,

                LoadingDate = dto.LoadingDate,
                LoadingNotes = dto.LoadingNotes,

                UnloadingDate = dto.UnloadingDate,
                UnloadingNotes = dto.UnloadingNotes,

                DepartureCode = dto.DepartureCode,
                DepartureName = dto.DepartureName,
                DepartureAddress = dto.DepartureAddress,

                ArrivalCode = dto.ArrivalCode,
                ArrivalName = dto.ArrivalName,
                ArrivalAddress = dto.ArrivalAddress,

                ProductCode = dto.ProductCode,
                ProductName = dto.ProductName,
                ProductType = dto.ProductType,

                Quantity = dto.Quantity,
                Weight = dto.Weight,

                BillingUnitCode = dto.BillingUnitCode,
                BillingUnitName = dto.BillingUnitName,

                BillingUnitPrice = dto.BillingUnitPrice,
                FreightCharge = dto.FreightCharge,
                Surcharge = dto.Surcharge,
                TollCharge = dto.TollCharge,

                PaymentUnitCode = dto.PaymentUnitCode,
                PaymentUnitName = dto.PaymentUnitName,

                PaymentUnitPrice = dto.PaymentUnitPrice,
                FreightPay = dto.FreightPay,
                TollPay = dto.TollPay,
                SurchargePay = dto.SurchargePay,

                DriverCode = dto.DriverCode,
                DriverName = dto.DriverName,
                DriverContact = dto.DriverContact,

                VehicleCode = dto.VehicleCode,
                VehicleNumber = dto.VehicleNumber,

                VehicleTypeCode = dto.VehicleTypeCode,
                VehicleTypeName = dto.VehicleTypeName,

                CharteredVehicleCode = dto.CharteredVehicleCode,
                CharteredVehicleName = dto.CharteredVehicleName,

                SubcontractedVehicleName = dto.SubcontractedVehicleName,

                ActualOperation = dto.ActualOperation,

                DepartureAdminName = dto.DepartureAdminName,
                DepartureAdminPhone = dto.DepartureAdminPhone,

                ArrivalAdminName = dto.ArrivalAdminName,
                ArrivalAdminPhone = dto.ArrivalAdminPhone,

                InternalNotes = dto.InternalNotes,
                ReportNotes = dto.ReportNotes
            };
        }

        private static OrderDetailDto ToDetailDto(OrderDetailViewModel model)
        {
            return new OrderDetailDto
            {
                RowNo = model.RowNo,
                WorkVoucherNo = model.WorkVoucherNo,
                DailyReportNo = model.DailyReportNo,
                DailyReportRowNo = model.DailyReportRowNo,
                SupplierCode = model.SupplierCode,
                SupplierName = model.SupplierName,

                LoadingDate = model.LoadingDate,
                LoadingNotes = model.LoadingNotes,

                UnloadingDate = model.UnloadingDate,
                UnloadingNotes = model.UnloadingNotes,

                DepartureCode = model.DepartureCode,
                DepartureName = model.DepartureName,
                DepartureAddress = model.DepartureAddress,

                ArrivalCode = model.ArrivalCode,
                ArrivalName = model.ArrivalName,
                ArrivalAddress = model.ArrivalAddress,

                ProductCode = model.ProductCode,
                ProductName = model.ProductName,
                ProductType = model.ProductType,

                Quantity = model.Quantity,
                Weight = model.Weight,

                BillingUnitCode = model.BillingUnitCode,
                BillingUnitName = model.BillingUnitName,

                BillingUnitPrice = model.BillingUnitPrice,
                FreightCharge = model.FreightCharge,
                Surcharge = model.Surcharge,
                TollCharge = model.TollCharge,

                PaymentUnitCode = model.PaymentUnitCode,
                PaymentUnitName = model.PaymentUnitName,

                PaymentUnitPrice = model.PaymentUnitPrice,
                FreightPay = model.FreightPay,
                TollPay = model.TollPay,
                SurchargePay = model.SurchargePay,

                DriverCode = model.DriverCode,
                DriverName = model.DriverName,
                DriverContact = model.DriverContact,

                VehicleCode = model.VehicleCode,
                VehicleNumber = model.VehicleNumber,

                VehicleTypeCode = model.VehicleTypeCode,
                VehicleTypeName = model.VehicleTypeName,

                CharteredVehicleCode = model.CharteredVehicleCode,
                CharteredVehicleName = model.CharteredVehicleName,

                SubcontractedVehicleName = model.SubcontractedVehicleName,

                ActualOperation = model.ActualOperation,

                DepartureAdminName = model.DepartureAdminName,
                DepartureAdminPhone = model.DepartureAdminPhone,

                ArrivalAdminName = model.ArrivalAdminName,
                ArrivalAdminPhone = model.ArrivalAdminPhone,

                InternalNotes = model.InternalNotes,
                ReportNotes = model.ReportNotes
            };
        }

        public async Task<(string BranchCode, string BranchName)>GetDefaultBranchAsync()
        {
            return await _repository.GetDefaultBranchAsync();
        }

        // Lookups (Enter on a code input)

        public Task<bool> IsPlaceByShipperAsync()
        {
            return _lookupRepository.IsPlaceByShipperAsync();
        }

        public Task<IEnumerable<OrderEntryLookupDto>> GetVehicleTypesAsync()
        {
            return _lookupRepository.GetVehicleTypesAsync();
        }

        // Looks up one code typed on the screen. The screen has already zero-padded it.
        // Returns null for an unknown type, and Found = false when the code is not registered.
        public async Task<OrderEntryLookupDto?> LookupAsync(string type, string code, string? shipperCode, bool isNew)
        {
            Task<OrderEntryLookupDto?>? query = type switch
            {
                "branch" => _lookupRepository.FindBranchAsync(code),
                "shipper" => _lookupRepository.FindShipperAsync(code, isNew),
                "place" => FindPlaceAsync(code, shipperCode),
                "product" => _lookupRepository.FindProductAsync(code),
                "driver" => _lookupRepository.FindDriverAsync(code, isNew),
                "vehicle" => _lookupRepository.FindVehicleAsync(code, isNew),
                "vehicleType" => _lookupRepository.FindVehicleTypeAsync(code),
                "chartered" => _lookupRepository.FindCharteredAsync(code, isNew),
                "unit" => _lookupRepository.FindUnitAsync(code),
                _ => null
            };

            if (query == null)
            {
                return null;
            }

            var result = await query;

            if (result == null)
            {
                return new OrderEntryLookupDto { Found = false };
            }

            result.Found = true;

            return result;
        }

        // Prices and fares

        // The automatic 請求単価 and 下払単価 for a row (legacy Dsp_Tanka). 0 when none is registered.
        // Legacy tries the route in both directions, with and without the 品名区分, and keeps the last price that is not 0.
        // That gives this order, last wins: blank 品名区分 reversed, blank normal, 品名区分 reversed, 品名区分 normal.
        public async Task<OrderEntryUnitPriceDto> GetUnitPricesAsync(string? shipperCode, string? departureCode, string? arrivalCode,
            string? productCode, string? vehicleTypeCode, string? billingUnitCode, string? paymentUnitCode)
        {
            var result = new OrderEntryUnitPriceDto();

            // Legacy stops when the 車種 is not 1 to 9, as it picks the price column
            if (!int.TryParse(vehicleTypeCode, out var vehicleType) || vehicleType < 1 || vehicleType > 9)
            {
                return result;
            }

            var departure = PadCode(departureCode);
            var arrival = PadCode(arrivalCode);
            var category = await _lookupRepository.GetProductCategoryAsync(productCode ?? "");
            var billingUnit = billingUnitCode ?? "";
            var paymentUnit = paymentUnitCode ?? "";

            var rows = await _lookupRepository.FindUnitPricesAsync(
                PadCode(shipperCode), departure, arrival, category, vehicleType, billingUnit, paymentUnit);

            // Higher rank is tried later in legacy, so it wins
            int Rank(OrderEntryUnitPriceRow row) =>
                (category != "" && row.ProductCategory == category ? 2 : 0) + (row.DepartureCode == departure ? 1 : 0);

            foreach (var row in rows.OrderBy(Rank))
            {
                if (row.UnitCode == billingUnit && row.UnitPrice is decimal price && price != 0)
                {
                    result.UnitPrice = price;
                }

                if (row.UnitCode == paymentUnit && row.PaymentUnitPrice is decimal paymentPrice && paymentPrice != 0)
                {
                    result.PaymentUnitPrice = paymentPrice;
                }
            }

            return result;
        }

        // 運賃 (kind "bill", legacy Cal_King) or 下払運賃 (kind "pay", legacy Cal_YKing).
        // The formula comes from 単位マスタ.計算区分, and the rounding from the 荷主 or 傭車. Returns null for an unknown kind.
        public async Task<decimal?> CalculateFareAsync(string kind, string? partyCode, string? unitCode,
            decimal quantity, decimal weight, decimal unitPrice)
        {
            var rule = kind switch
            {
                "bill" => await _lookupRepository.GetShipperRoundingAsync(partyCode ?? ""),
                "pay" => await _lookupRepository.GetCharteredRoundingAsync(partyCode ?? ""),
                _ => null
            };

            if (kind != "bill" && kind != "pay")
            {
                return null;
            }

            // 0: 切捨, 1: 四捨五入, 2: 切上 (legacy adds 0.999 rather than a true ceiling)
            var rounding = rule?.Rounding switch
            {
                "1" => 0.5m,
                "2" => 0.999m,
                _ => 0m
            };

            // 0: 1円, 1: 10円, 2: 100円
            var step = rule?.Digits switch
            {
                "1" => 10m,
                "2" => 100m,
                _ => 1m
            };

            // 1: 重量×単価, 2: 数量×単価, 3: 単価, 4: 未計算. No unit, or no 計算区分, means 3.
            var calculationType = await _lookupRepository.GetCalculationTypeAsync(unitCode ?? "");

            if (!int.TryParse(calculationType, out var type))
            {
                type = 3;
            }

            var amount = type switch
            {
                2 => quantity * unitPrice,
                3 => unitPrice,
                4 => 0m,
                _ => weight * unitPrice
            };

            return Math.Sign(amount) * Math.Floor(Math.Abs(amount) / step + rounding) * step;
        }

        // Legacy ZeroPad: blank stays blank
        private static string PadCode(string? code)
        {
            return string.IsNullOrEmpty(code) ? "" : code.PadLeft(10, '0');
        }

        // When 発着地 are registered per 荷主, the row's 荷主 is part of the key and is required (legacy Dsp_From, Dsp_To).
        // Otherwise they are stored with a blank 荷主コード.
        private async Task<OrderEntryLookupDto?> FindPlaceAsync(string code, string? shipperCode)
        {
            if (!await _lookupRepository.IsPlaceByShipperAsync())
            {
                return await _lookupRepository.FindPlaceAsync("", code);
            }

            if (string.IsNullOrEmpty(shipperCode))
            {
                return null;
            }

            return await _lookupRepository.FindPlaceAsync(shipperCode.PadLeft(10, '0'), code);
        }

    }
}
