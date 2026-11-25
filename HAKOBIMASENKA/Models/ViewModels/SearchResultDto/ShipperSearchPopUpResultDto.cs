namespace HAKOBIMASENKA.Models.ViewModels.SearchResultDto
{
    public class ShipperSearchPopUpResultDto
    {
        public string ShipperCode { get; set; } = "";
        public string Abbreviation { get; set; } = "";
        public DateTime? TradeEndDate { get; set; }
        public string Furigana { get; set; } = "";
        public string PhoneNumber { get; set; } = "";
        public string ShipperName { get; set; } = "";
        public string Address { get; set; } = "";

     
    }
}