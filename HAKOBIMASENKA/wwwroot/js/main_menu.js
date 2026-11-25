// Please see documentation at in the docs folder of this solution
// for details on configuring this project to bundle and minify static web assets.

//the menu names written here is hardcoded and should not be used for actual purpose
//no business logic is to be written in javascript files.
// (the カスタム tab is not here: its buttons come from the server, see loadCustomMenu)
const menus = {

    "daily-input": [
        //"受 注 オ ー ダ ー 入 力",
        {
            text: "受 注 オ ー ダ ー 入 力",
            url: "/OrderEntry/Order_entry"
        },
        "配 車 入 力（ 車 輌 ）",
        "配 車 入 力（ 運 転 手 ）",
        "運 転 日 報 入 力",
        "経 費 伝 票 入 力",
        "有 料 代（経）入 力",
        "仕 入 伝 票 入 力",
        "入 金 伝 票 入 力",
        "傭 車 支 払 伝 票 入 力",
        "仕 入 先 支 払 伝 票 入 力",
        "",
        "",
        "",
        ""
    ],

    "daily-print": [
        "運 転 日 報 一 覧 表",
        "経 費 伝 票 一 覧 表",
        "有 料 代（経）一 覧 表",
        "仕 入 伝 票 一 覧 表",
        "入 金 伝 票 一 覧 表",
        "傭 車 支 払 伝 票 一 覧 表",
        "仕 入 先 支 払 伝 票 一 覧 表",
        "日 計 表",
        "輸 送 依 頼 書",
        "作 業 指 示 書",
        "配 車 報 告 書",
        "",
        "",
        ""
    ],

    "daily-view": [
        "受 注 オ ー ダ ー 照 会",
        "運 転 日 報 照 会",
        "経 費 伝 票 照 会",
        "有 料 代（経）照 会",
        "仕 入 伝 票 照 会",
        "入 金 伝 票 照 会",
        "傭 車 支 払 伝 票照 会",
        "仕 入 先 支 払 伝 票照 会",
        "",
        "",
        "",
        "",
        "",
        ""
    ],

    "daily-other": [
        "点 呼 記 録 表",
        "ＥＴＣデ ー タ 取 込",
        "デ ジ タ コ デ ー タ 取 込（富士通 ITP Web 手動）",
        "デ ジ タ コ デ ー タ 取 込（いすゞ みまもりくん）",
        "デ ジ タ コ デ ー タ 取 込（矢崎 ESTRA-Web2）",
        "デ ジ タ コ デ ー タ 取 込（NPシステム 地球号）",
        "デ ジ タ コ デ ー タ 取 込（富士通 上位連携）",
        "運 転 日 報 印 刷",
        "",
        "",
        "",
        "",
        "",
        ""
    ],

    "billing": [
        "未 定 運 賃 照 会",
        "請 求 一 覧 表",
        "請 求 書 発 行",
        "回 収 予 定 表",
        "請 求 締 切 処 理",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
    ],

    "payment": [
        "傭 車 支 払 一 覧 表",
        "傭 車 支 払 元 帳",
        "傭 車 支 払 明 細 表",
        "傭 車 支 払 予 定 表",
        "",
        "",
        "",
        "仕 入 先 支 払 一 覧 表",
        "仕 入 先 支 払 元 帳",
        "仕 入 先 支 払 明 細 表",
        "仕 入 先 支 払 予 定 表",
        "支 払 締 切 処 理",
        "",
        ""
    ],

    "vehicle": [
        "車 輌 別 元 帳",
        "車 輌 集 計 表",
        "車 輌 経 費 表",
        "車 輌 損 益 一 覧 表",
        "車 輌 運 行 効 率 表",
        "輸 送 実 績 報 告 書",
        "品 目 別 輸 送 実 績 表",
        "車 輌 別 燃 費 集 計 表",
        "",
        "",
        "",
        "",
        "",
        ""
    ],

    "driver": [
        "運 転 手 別 元 帳",
        "運 転 手 集 計 表",
        "運 転 手 経 費 表",
        "運 転 手 損 益 一 覧 表",
        "運 転 手 運 行 効率 表",
        "運 転 手 運 行 手 当 表",
        "運 転 手 時 間 集 計 表",
        "運 転 手 経 費 支 給 表",
        "運 転 手 管 理 台 帳",
        "",
        "",
        "勤 怠 入 力",
        "勤 怠 明 細 表",
        ""
    ],

    "consignor": [
        "荷 主 元 帳",
        "荷 主 管 理 表",
        "荷 主 推 移 表",
        "",
        "傭 車 元 帳",
        "傭 車 管 理 表",
        "傭 車 推 移 表",
        "仕 入 先 元 帳",
        "仕 入 先 管 理 表",
        "仕 入 先 推 移 表",
        "",
        "部 門 別 集 計 表",
        "固 定 経 費 計 上 処 理",
        "月 次 締 切 処 理"
    ],

    "analysis": [
        "月 別 推 移 表",
        "３ ヵ 年 月 別 推 移 表",
        "３ ヵ 年 対 比 表",
        "ＡＢＣ 分 析",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
    ],

    "master-basic": [
        {
            text: "荷 主 マ ス タ",
            url: "/ShipperMaster/Shipper_master"
        },
        {
            text: "車 輌 マ ス タ",
            url: "/VehicleMaster/Vehicle_master"
        },
        {
            text: "運 転 手 マ ス タ",
            url: "/DriverMaster/Driver_master"
        },
        {
            text: "品 名 マ ス タ",
            url: "/ProductMaster/Product_master"
        },
        {
            text: "発 着 地 マ ス タ",
            url: "/OriginDestinationMaster/OriginDest_master"
        },
        {
            text: "経 費 マ ス タ",
            url: "/ExpenseMaster/Expense_master"
        },
        {
           text: "傭 車 マ ス タ",
           url: "/CharteredVehicleMaster/Chartered_Vehicle_Master"
        },
        "仕 入 先 マ ス タ",   // screen only, no backend yet: /SupplierMaster/Supplier_master
        {
            text: "エ リ ア マ ス タ",
            url: "/AreaMaster/Area_Master"
        },
        {
            text: "品 名 区 分 マ ス タ",
            url: "/ProductCategoryMaster/Product_Category_Master"
        },
        {
            text: "単 位 マ ス タ",
            url: "/UnitMaster/Unit_Master"
        },
        "部 門 マ ス タ",
        // {
        //     text: "部 門 マ ス タ",
        //     url: "/DepartmentMaster/Department_Master"
        // },
        "ル ー ト マ ス タ",   // screen only, no backend yet: /RouteMaster/Route_master

        {
            text: "管 理 マ ス タ",
            url: "/ManagementMaster/Management_master"
        },
    ],

    "master-functional": [
        {
            text: "発 着 地 運 賃 マ ス タ",
            url: "/OriginDestinationFreightRateMaster/OriginDestinationFreightRate_master"
        },
        "エ リ ア 運 賃 マ ス タ",
        "路 線 マ ス タ",
        "イ ン タ ー マ ス タ",
        "入 金 区 分 マ ス タ",
        "支 払 区 分 マ ス タ",
        "経 費 区 分 マ ス タ",
        "有 料 区 分 マ ス タ",
        "輸 送 実 績 区 分 マ ス タ",
        "有 料 ル ー ト（経）マ ス タ",
        "荷 主 テ ン プ レ ー ト マ ス タ",
        "出 勤 区 分 マ ス タ",
        "銀 行 マ ス タ",
        "所 属 マ ス タ"
    ],

    "master-functional2": [
        "点 呼 執 行 者 マ ス タ",
        "指 示 伝 達 事 項 マ ス タ",
        "利 用 者 マ ス タ",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
    ],

    "ad-hoc": [
        "デ ー タ 変 換 処 理",
        "郵 便 番 号 デ ー タ 取 込",
        "バ ッ ク ア ッ プ 処 理",
        "デ ー タ 復 旧 処 理",
        "カ ス タ ム メ ニ ュ ー 設 定",
        "使 用 制 限 設 定",
        "デ ー タ 一 括 削 除 処 理",
        "給 与 デ ー タ 作 成",
        "財 務 デ ー タ 作 成",
        "給 与 デ ー タ 出 力 設 定",
        "財 務 デ ー タ 出 力 設 定",
        "ク ラ ウ ド バ ッ ク ア ッ プ 処 理",
        "ク ラ ウ ド デ ー タ 復 旧 処 理",
        "リ モ ー ト メ ン テ ナ ン ス"
    ]
};

// The 識別NO prefix of each tab: button n of a tab is menu item "<prefix>-<nn>", e.g. 品名区分マスタ = "M1-10"
const menuPrefixes = {
    "daily-input": "D1",
    "daily-print": "D2",
    "daily-view": "D3",
    "daily-other": "D4",
    "billing": "S1",
    "payment": "P1",
    "vehicle": "T1",
    "driver": "T2",
    "consignor": "T3",
    "analysis": "T4",
    "master-basic": "M1",
    "master-functional": "M2",
    "master-functional2": "M3",
    "ad-hoc": "Z1"
};

// From the server (Main_menu.cshtml): the items that can be used, and this terminal's カスタム buttons
const enabledMenuIds = new Set(window.mainMenuAccess?.enabled ?? []);
const customMenu = window.mainMenuAccess?.custom ?? [];

function menuId(category, number) {
    return `${menuPrefixes[category]}-${String(number).padStart(2, "0")}`;
}

// the page of a menu item, e.g. "M1-10" → 品名区分マスタ's url ("" when not ported yet)
function menuUrl(id) {

    const category = Object.keys(menuPrefixes).find(key => menuPrefixes[key] === id?.slice(0, 2));
    const item = category ? menus[category][Number(id.slice(3)) - 1] : null;

    return item && typeof item !== "string" ? item.url ?? "" : "";
}

// legacy Custom_Set: the item's title, greyed when turned off for this terminal (使用制限設定)
function loadCustomMenu() {

    for (let i = 1; i <= 14; i++) {

        const button = document.getElementById(`menu${i}`);
        const slot = customMenu.find(item => item.number === i);

        button.textContent = slot?.title ?? "";
        button.dataset.url = slot?.title ? menuUrl(slot.id) : "";
        button.disabled = !!slot?.blocked || !button.dataset.url;
        button.onclick = openMenu;
    }
}

function openMenu() {

    if (!this.dataset.url)
        return;

    // Save the button that opened the screen
    sessionStorage.setItem(
        "selectedMenuUrl",
        this.dataset.url
    );

    window.location.href = this.dataset.url;
}

//important part(Menu loading) -- this function loads the hardcoded data into the button controls for selected menu category
function loadMenu(category) {

    if (category === "custom") {
        loadCustomMenu();
        return;
    }

    const items = menus[category] || [];

    for (let i = 1; i <= 14; i++) {

        const button = document.getElementById(`menu${i}`);

        const item = items[i - 1];

        // a plain text item has no screen yet (only { text, url } items open a screen)
        const url = typeof item === "string" ? "" : item?.url ?? "";

        button.textContent = typeof item === "string" ? item : item?.text ?? "";
        button.dataset.url = url;

        // legacy Button_Set: only the items the server allows can be clicked, and only when the screen exists
        button.disabled = !url || !enabledMenuIds.has(menuId(category, i));

        button.onclick = openMenu;
    }
}

// -- goes to menu loading for that selected category
function selectCategory(button) {

    document
        .querySelectorAll(".menu-category")
        .forEach(x => x.classList.remove("active"));

    button.classList.add("active");

    const category = button.dataset.category;

    // Save selected tab - new
    sessionStorage.setItem("selectedMenuCategory", category);

    // Load the menu items for the selected category
    loadMenu(category);
}

//this function is called when the page is loaded and it adds click event listener to all the category buttons and also loads the last selected category from session storage
document.addEventListener("DOMContentLoaded", function () {

    document
        .querySelectorAll(".menu-category")
        .forEach(button => {

            button.addEventListener("click", function () {

                selectCategory(this);

            });

        });

    const savedCategory = sessionStorage.getItem("selectedMenuCategory") || "custom";

    const activeButton = document.querySelector(`[data-category="${savedCategory}"]`);

    if (activeButton) {
        selectCategory(activeButton);
    }

    const lastUrl = sessionStorage.getItem("selectedMenuUrl");

    if (lastUrl) {

        setTimeout(() => {

            for (let i = 1; i <= 14; i++) {

                const button = document.getElementById(`menu${i}`);

                if (button && button.dataset.url === lastUrl) {

                    button.focus();
                    button.classList.add("active-menu");

                    break;
                }
            }

        }, 50);

    }

    //exit button click event listener(exit to home page), also before any screen was opened
    const exitButton = document.getElementById("X");

    if (exitButton) {

        exitButton.addEventListener("click", function () {

            if (!confirm("運びま専科を終了しますか？"))
                return;

            window.location.href = "/Home/Title";

        });

    }
});
