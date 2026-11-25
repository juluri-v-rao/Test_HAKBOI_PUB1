namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.OriginDestMasterViewModel
{
    public class OriginDestinationViewModel
    {
        // Mode
        public string RegistrationMode { get; set; } = "0";
        public bool IsCommonMode { get; set; } = false;
        public bool IsNewRecord { get; set; } = true;

        // Customer
        public string CustomerCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;

        // Destination
        public string DestinationCode { get; set; } = string.Empty;
        public string DestinationName { get; set; } = string.Empty;
        public string Furigana { get; set; } = string.Empty;
        public string Abbreviation { get; set; } = string.Empty;

        // Address
        public string PostalCode { get; set; } = string.Empty;
        public string Address1 { get; set; } = string.Empty;
        public string Address2 { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string FaxNumber { get; set; } = string.Empty;

        // District (地区コード)
        public string DistrictCode { get; set; } = string.Empty;
        public string DistrictName { get; set; } = string.Empty;

        // Other
        public string DigitacoCode { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;

        // List
        public List<OriginDestinationListItem> List { get; set; } = new();
    }

    public class OriginDestinationListItem
    {
        public string DestinationCode { get; set; } = string.Empty;
        public string Abbreviation { get; set; } = string.Empty;
    }

    public class PostalAddressResult
    {
        public string Address1 { get; set; } = string.Empty;
        public string Address2 { get; set; } = string.Empty;
    }
}
