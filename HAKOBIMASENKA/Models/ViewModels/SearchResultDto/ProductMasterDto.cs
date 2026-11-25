
namespace HAKOBIMASENKA.Models.ViewModels
{
    public class ProductMasterDto
    {
        public string ProductCode { get; set; } = "";

        public string ProductName { get; set; } = "";

        public string Furigana { get; set; } = "";

        public string Abbreviation { get; set; } = "";

        public string ProductCategoryCode { get; set; } = "";

        public string TransportCategoryCode { get; set; } = "";

        // Screen field 単位重量 maps to database column 単価.
        public decimal? UnitPrice { get; set; }

        public decimal? Capacity { get; set; }
        public decimal? AllowanceRate { get; set; }
        public string DigitacoCode { get; set; } = "";

        public string ProductCategoryName { get; set; } = "";
        public string TransportCategoryName { get; set; } = "";

       
    }
}
