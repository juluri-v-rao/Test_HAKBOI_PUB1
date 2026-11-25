namespace HAKOBIMASENKA.Models.ViewModels
{
    public class UnitMasterResultDto
    {
        public string UnitCode { get; set; } = string.Empty;

        public string UnitName { get; set; } = string.Empty;

        public string? CalculationType { get; set; }

        public string? DigitalCode { get; set; }

        public DateTime? RegistrationDate { get; set; }

        public string? Sent { get; set; }

        public string? InputTerminal { get; set; }

        public string? Deleted { get; set; }
    }
}