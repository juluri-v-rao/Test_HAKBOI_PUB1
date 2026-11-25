namespace HAKOBIMASENKA.Models.ViewModels.SearchResultDto
{
    public class VehicleSearchResultDto
    {
        public string VehicleCode { get; set; } = string.Empty;
        public string VehicleNumber { get; set; } = string.Empty;
        public string MakerName { get; set; } = string.Empty;
        public string RetiredStatus { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public DateTime? RegistrationYear { get; set; }
        public decimal? LoadWeight { get; set; }
        public string VehicleCategory { get; set; } = string.Empty;
    }
}
