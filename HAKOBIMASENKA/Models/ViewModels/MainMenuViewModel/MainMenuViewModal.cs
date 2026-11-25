using HAKOBIMASENKA.Repository.MainMenuRepository;

namespace HAKOBIMASENKA.Models.ViewModels.MainMenuViewModel;

public class MainMenuViewModel
    {
    // Top left: program version, e.g. "Version 5.1.0.1" (legacy lblVersion)
    public string Version { get; set; } = "";

    // Top right: 管理マスタ.略称, or 運びま専科デモ版 on a demo licence (legacy LblCompany)
    public string CompanyName { get; set; } = "";

    // Shown when the 管理マスタ row is missing (legacy 管理ファイルに異常発生！！)
    // or the demo version has too many 運転日報 (legacy デモ版のデータ件数を越えました！！); no button is enabled then
    public string? ErrorMessage { get; set; }

    // The menu items that can be used, e.g. "D1-01", "M1-10" (legacy Button_Set); every other button is greyed
    public List<string> EnabledMenuIds { get; set; } = new();

    // This terminal's カスタム buttons (legacy Custom_Set)
    public List<CustomMenuSlot> CustomMenu { get; set; } = new();

    /*public List<MenuCategory> Categories { get; set; }
        = new();*/

    //public List<MenuItem> MenuItems { get; set; }
    //    = new();
    }
