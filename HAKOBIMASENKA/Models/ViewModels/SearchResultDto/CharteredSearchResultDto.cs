namespace HAKOBIMASENKA.Models.ViewModels.SearchResultDto
{
    public class CharteredSearchResultDto
    {
        public string CharteredCode { get; set; } = "";
        public string Abbreviation { get; set; } = "";
        public string Furigana { get; set; } = "";
        public string PhoneNumber { get; set; } = "";
        public DateTime? TradeEndDate { get; set; }
        public string CharteredName { get; set; } = "";
        public string Address { get; set; } = "";
    }
}