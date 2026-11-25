namespace HAKOBIMASENKA.Models.ViewModels
{
    public class DepartmentMasterResultDto
    {
        public string DepartmentCode { get; set; } = string.Empty;

        public string DepartmentName { get; set; } = string.Empty;

        public DateTime? RegistrationDate { get; set; }

        public string? Sent { get; set; }

        public string? InputTerminal { get; set; }

        public string? Deleted { get; set; }
    }
}