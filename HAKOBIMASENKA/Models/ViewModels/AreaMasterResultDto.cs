namespace HAKOBIMASENKA.Models.ViewModels
{
    public class AreaMasterResultDto
    {
        public string AreaCode { get; set; } = string.Empty;

        public string AreaName { get; set; } = string.Empty;

        public string? DigitalCode { get; set; }

        public DateTime? RegistrationDate { get; set; }

        public int Sent { get; set; }

        public string? InputTerminal { get; set; }

        public int Deleted { get; set; }
    }
}