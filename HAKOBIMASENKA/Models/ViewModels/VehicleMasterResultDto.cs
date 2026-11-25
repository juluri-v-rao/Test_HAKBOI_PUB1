using System.ComponentModel.DataAnnotations;

namespace HAKOBIMASENKA.ViewModels
{
    public class VehicleMasterResultDto
    {
        // Department Master properties.
        public string DepartmentCode { get; set; } = string.Empty;

        public string DepartmentName { get; set; } = string.Empty;

        // Expense Master properties.
        public string ExpenseCode { get; set; } = string.Empty;

        public string ExpenseName { get; set; } = string.Empty;

        // Driver Master.
        public string DriverCode { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        // Expense Category Master properties.
        public string ExpenseCategoryCode { get; set; } = string.Empty;
        public string ExpenseCategoryName { get; set; } = string.Empty;

        // Transport Type Master
        public string? TransportTypeCode { get; set; }
        public string? TransportTypeName { get; set; }

        // Main Vehicle Details Properties
        public string? VehicleCode { get; set; }
        public string? VehicleCarNumber { get; set; }
        public string? VehicleMakerName { get; set; }
        public string? VehicleModel { get; set; }
        public string? VehicleChassisNumber { get; set; }
        public string? VehicleEngine { get; set; }

        public DateTime? VehicleFirstYear { get; set; }
        public DateTime? VehicleRegistrationDate { get; set; }
        public DateTime? VehicleInspectionDate { get; set; }

        public decimal? VehicleTotalDistanceKm { get; set; }
        public decimal? VehicleMaximumLoadCapacity { get; set; }

        public string? VehicleTransportTypeCode { get; set; }
        public string? VehicleTransportTypeName { get; set; }

        public DateTime? VehicleDeliveryDate { get; set; }
        public DateTime? VehicleDeregistrationDate { get; set; }

        public string? VehicleTypeCode { get; set; }

        public string? VehicleDriverCode { get; set; }
        public string? VehicleDriverName1 { get; set; }
        public string? VehicleDriverCode2 { get; set; }
        public string? VehicleDriverName2 { get; set; }

        public string? VehicleDepartmentCode { get; set; }
        public string? VehicleDepartmentName { get; set; }

        public decimal? VehicleAllowanceRate { get; set; }
        public string? VehicleDispatchDisplay { get; set; }

        public string? VehicleDigitalTachographCode { get; set; }
        public string? VehicleEtcCard { get; set; }

        public string? VehicleBusinessCategory { get; set; }
        public string? VehicleCategory { get; set; }

        public decimal? VehicleOilCriteriaKm { get; set; }
        public DateTime? VehicleOilExchangeDate { get; set; }
        public decimal? VehicleOilExchangeKm { get; set; }

        // Tab 2 Tire 1 to 22 Record

        // Vehicle Tire Master properties.
        public string VehicleTireVehicleCode { get; set; } = string.Empty;

        public int VehicleTirePositionCode { get; set; }

        public decimal? VehicleTireCriteriaKm { get; set; }

        public DateTime? VehicleTireExchangeDate { get; set; }

        public decimal? VehicleTireExchangeKm { get; set; }

        public DateTime? VehicleTireRegistrationDate { get; set; }

        // Fixed Expense Master properties for Vehicle Master Tab 3.
        public string VehicleFixedExpenseKey { get; set; } = string.Empty;

        public string VehicleFixedExpenseVehicleCode { get; set; } = string.Empty;

        public string VehicleFixedExpenseCode { get; set; } = string.Empty;

        public string? VehicleFixedExpenseName { get; set; }

        public string VehicleFixedExpenseDriverCode { get; set; } = string.Empty;

        public string? VehicleFixedExpenseDriverName { get; set; }

        public string? VehicleFixedExpenseSplitMethod { get; set; }

        public decimal? VehicleFixedExpenseAmount { get; set; }

        public decimal? VehicleFixedExpenseAmount1 { get; set; }
        public decimal? VehicleFixedExpenseAmount2 { get; set; }
        public decimal? VehicleFixedExpenseAmount3 { get; set; }
        public decimal? VehicleFixedExpenseAmount4 { get; set; }
        public decimal? VehicleFixedExpenseAmount5 { get; set; }
        public decimal? VehicleFixedExpenseAmount6 { get; set; }
        public decimal? VehicleFixedExpenseAmount7 { get; set; }
        public decimal? VehicleFixedExpenseAmount8 { get; set; }
        public decimal? VehicleFixedExpenseAmount9 { get; set; }
        public decimal? VehicleFixedExpenseAmount10 { get; set; }
        public decimal? VehicleFixedExpenseAmount11 { get; set; }
        public decimal? VehicleFixedExpenseAmount12 { get; set; }

        // Vehicle Master tab licence settings.
        public bool ShowVehicleManagementTab { get; set; }

        public bool ShowFixedCostTab { get; set; }

        public bool ShowDigitalTachographTab { get; set; }

        public bool ShowSalaryTab { get; set; }

        //DeleteVehicleRequest  VehicleCode
        public string DeleteVehicleRequest { get; set; } = string.Empty;
    }

    public class VehicleMasterSaveDto
    {
        [Required]
        [RegularExpression(@"^\d{10}$")]
        public string VehicleCode { get; set; } = string.Empty;

        public string? CarNumber { get; set; }
        public string? MakerName { get; set; }
        public string? Model { get; set; }
        public string? ChassisNumber { get; set; }
        public string? Engine { get; set; }

        public DateTime? FirstYear { get; set; }
        public DateTime? RegistrationDate { get; set; }
        public DateTime? InspectionDate { get; set; }

        public decimal TotalDistanceTraveled { get; set; }
        public decimal MaximumLoadCapacity { get; set; }
        public string? TransportTypeCode { get; set; }

        public DateTime? DeliveryDate { get; set; }
        public DateTime? DeregistrationDate { get; set; }

        public string? VehicleTypeCode { get; set; }
        public string? DepartmentCode { get; set; }
        [Range(typeof(decimal), "0.00", "100.00")]
        public decimal VehicleAllowanceRate { get; set; } = 100.00m;
        // The checkbox label says "表示しない".
        // True means the vehicle should not appear in the dispatch display.
        public bool HideFromDispatch { get; set; }

        public decimal OilExchangeCriteriaKm { get; set; }
        public DateTime? OilLastExchangeDate { get; set; }
        public decimal OilAfterReplacementKm { get; set; }

        public string? DigitalTachographCode { get; set; }
        public string? EtcCardNumber { get; set; }

        public List<VehicleTireSaveDto> Tires { get; set; } = new();

        public List<VehicleFixedExpenseSaveDto> FixedExpenses { get; set; } = new();
    }

    public class VehicleTireSaveDto
    {
        public int PositionCode { get; set; }
        public decimal CriteriaKm { get; set; }
        public DateTime? ExchangeDate { get; set; }
        public decimal AfterReplacementKm { get; set; }
    }

    public class VehicleFixedExpenseSaveDto
    {
        // Confirm the source of this value in your existing expense grid.
        public int Key { get; set; }

        public string? DriverCode { get; set; }
        public string ExpenseCode { get; set; } = string.Empty;
        public string? SplitMethod { get; set; }

        public decimal? Amount { get; set; }

        public decimal? Amount1 { get; set; }
        public decimal? Amount2 { get; set; }
        public decimal? Amount3 { get; set; }
        public decimal? Amount4 { get; set; }
        public decimal? Amount5 { get; set; }
        public decimal? Amount6 { get; set; }
        public decimal? Amount7 { get; set; }
        public decimal? Amount8 { get; set; }
        public decimal? Amount9 { get; set; }
        public decimal? Amount10 { get; set; }
        public decimal? Amount11 { get; set; }
        public decimal? Amount12 { get; set; }
    }

    public class VehicleMasterSaveResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class VehicleRepairHistoryDto
    {
        public DateTime? SettlementDate { get; set; }
        public string? DriverCode { get; set; }
        public string? DriverName { get; set; }
        public string? ExpenseName { get; set; }

        public decimal? Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? Amount { get; set; }

        public string? DailyReportNo { get; set; }

        // Mapped from 日報HEAD.帰庫M.
        public decimal? ReturnMileage { get; set; }
    }
}