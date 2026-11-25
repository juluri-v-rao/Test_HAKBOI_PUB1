namespace HAKOBIMASENKA.Models.ViewModels.SearchResultDto
{
    // Holds expense search results.
    public class ExpenseSearchResultDto
    {
        public string ExpenseCode { get; set; } = "";
        public string ExpenseName { get; set; } = "";
        public string? ExpenseCategory { get; set; }
        public decimal? UnitPrice { get; set; }
    }
}