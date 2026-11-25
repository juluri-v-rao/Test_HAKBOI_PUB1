namespace HAKOBIMASENKA.Models.ViewModels.DailyProcessingEntryViewModels.OrderEntryViewModel
{
    // Result of an Enter lookup on one code input (legacy Dsp_User, Dsp_From, Dsp_Tanto, ...).
    // Each lookup fills only the values it has. Null means the master has no value, and the screen keeps what it shows.
    public class OrderEntryLookupDto
    {
        public bool Found { get; set; }

        // 略称, 発着地名, 品名, 運転手名 or 名称, depending on the master
        public string? Name { get; set; }

        // 発着地: 住所1 + 住所2
        public string? Address { get; set; }

        // 発着地: 電話番号. 運転手: 携帯番号.
        public string? Phone { get; set; }

        // 運転手: the driver's 傭車
        public string? CharteredCode { get; set; }
        public string? CharteredName { get; set; }

        // 運転手 and 車輌: the vehicle and its 運賃形態 (車種)
        public string? VehicleCode { get; set; }
        public string? VehicleNumber { get; set; }
        public string? VehicleTypeCode { get; set; }
        public string? VehicleTypeName { get; set; }
    }
}
