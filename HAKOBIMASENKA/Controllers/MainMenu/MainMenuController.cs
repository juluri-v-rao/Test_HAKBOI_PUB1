using HAKOBIMASENKA.Models.ViewModels.MainMenuViewModel;
using HAKOBIMASENKA.Repository.MainMenuRepository;
using Microsoft.AspNetCore.Mvc;

public class MainMenuController(IMainMenuRepository repository, IConfiguration configuration) : Controller
    {
    // the demo version stops above this many 運転日報 (legacy Chk_Demo)
    private const int DemoDailyReportLimit = 5000;

    // this terminal's number (legacy E_CODE)
    private string ClientNo => configuration["Terminal:ClientNo"] ?? "01";

    // Main menu: version and company name in the header, the buttons that can be used (legacy FrmMain_Load)
    public async Task<IActionResult> Main_menu()
        {
        var model = new MainMenuViewModel
            {
            Version = GetVersionText()
            };

        var company = await repository.GetCompanyAsync();

        if (company == null)
            {
            model.ErrorMessage = "管理ファイルに異常発生！！";
            return View(model);
            }

        if (company.SEC1 != "1")
            {
            model.CompanyName = "運びま専科デモ版";

            if (await repository.CountDailyReportsAsync() > DemoDailyReportLimit)
                {
                // legacy shows this and closes: here no button is enabled
                model.ErrorMessage = "デモ版のデータ件数を越えました！！";
                return View(model);
                }
            }
        else
            {
            model.CompanyName = company.略称 ?? "";
            }

        model.CustomMenu = await repository.GetCustomMenuAsync(ClientNo);
        model.EnabledMenuIds = await repository.GetEnabledMenuIdsAsync(company, ClientNo);

        return View(model);
        }

    // "Version 5.1.0.1" from <Version> in HAKOBIMASENKA.csproj.
    // Like legacy, trailing zero parts are left out: 5.1.0.0 shows as "Version 5.1".
    private static string GetVersionText()
        {
        var version = typeof(MainMenuController).Assembly.GetName().Version;

        if (version == null)
            {
            return "";
            }

        var text = $"Version {version.Major}";

        if (version.Minor != 0 || version.Build != 0 || version.Revision != 0)
            {
            text += $".{version.Minor}";
            }

        if (version.Build != 0 || version.Revision != 0)
            {
            text += $".{version.Build}";
            }

        if (version.Revision != 0)
            {
            text += $".{version.Revision}";
            }

        return text;
        }
    }
