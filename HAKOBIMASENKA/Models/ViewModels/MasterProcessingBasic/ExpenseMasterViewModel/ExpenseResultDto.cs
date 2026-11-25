namespace HAKOBIMASENKA.Models.ViewModels.MasterProcessingBasic.ExpenseMasterViewModel
{
    public class ExpenseResultDto
    {
        public string 経費コード { get; set; } = string.Empty;
        public string 名称 { get; set; } = string.Empty;
        public string? 経費区分名 { get; set; }
    }

    public class ExpenseCategoryOption
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }
}
