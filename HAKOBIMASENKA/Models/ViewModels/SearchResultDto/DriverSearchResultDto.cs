namespace HAKOBIMASENKA.Models.ViewModels.SearchResultDto
{
    // Holds one driver record displayed in the Driver Search grid.
    public class DriverSearchResultDto
    {
        public string? DriverCode { get; set; }
        public string? DriverName { get; set; }
        public string? MobileNumber { get; set; }
        public string? DriverCategory { get; set; }
        public DateTime? RetirementDate { get; set; }
        public string? VehicleCode { get; set; }
        public string? SubcontractorName { get; set; }
    }
    public class DriverCodeOptionDto
    {
        public string? Code { get; set; }

        public string? DisplayName { get; set; }
    }
}
