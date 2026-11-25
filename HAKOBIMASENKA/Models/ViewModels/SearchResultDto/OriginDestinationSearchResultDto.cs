namespace HAKOBIMASENKA.Models.ViewModels.SearchResultDto
{
    // Holds origin/destination search results.
    public class OriginDestinationSearchResultDto
    {
        public string OriginDestinationCode { get; set; } = "";
        public string OriginDestinationName { get; set; } = "";
        public string? AreaName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address1 { get; set; }

        public string? GetAreaCode { get; set; }
        public string? GetAreaName { get; set; }
    }
}