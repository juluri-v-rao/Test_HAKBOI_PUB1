document.addEventListener("DOMContentLoaded", function () { 
    // Get Screen Name 

    let screenName = "";

    /*
     * Partial View is now inside the Master page.
     * Therefore we can directly get the screen name
     * from the Master page body.
     */

    screenName = document.body.dataset.screenName || "";
    console.log("List Screen:", screenName); 

    // Master Screen Settings 

    if (screenName === "エリアマスタ") {
        RemovePrintTypeSection();
        SetPopupTitle("エリアマスタ印刷");
        SetRangeLabel("エリア");
    }
    else if (screenName === "品名区分マスタ") {
        RemovePrintTypeSection();
        SetPopupTitle("品名区分マスタ印刷");
        SetRangeLabel("品名区分");
    }
    else if (screenName === "単位マスタ") {
        RemovePrintTypeSection();
        SetPopupTitle("単位マスタ印刷");
        SetRangeLabel("単位");
    }
    else if (screenName === "部門マスタ") {
        RemovePrintTypeSection();
        SetPopupTitle("部門マスタ印刷");
        SetRangeLabel("部門");
    }
    else if (screenName === "傭車マスタ") {
        SetPopupTitle("傭車マスタ印刷");
        SetRangeLabel("傭車");
    }
    else if (screenName === "仕入先マスタ") {
        SetPopupTitle("仕入先マスタ印刷");
        SetRangeLabel("仕入先");
    }
    else if (screenName === "車輌マスタ") {
        SetPopupTitle("車輌マスタ印刷");
        SetRangeLabel("車輌");
    }
    else if (screenName === "品名マスタ") {
        SetPopupTitle("品名マスタ印刷");
        SetRangeLabel("品名");
    }
    else if (screenName === "発着地マスタ") {
        SetPopupTitle("発着地マスタ印刷");
        SetRangeLabel("発着地");
    }
    else if (screenName === "経費マスタ") {
        SetPopupTitle("経費マスタ印刷");
        SetRangeLabel("経費");
    }
    else if (screenName === "ルートマスタ") {
        RemovePrintTypeSection();
        SetPopupTitle("ルートマスタ印刷");
        SetRangeLabel("ルート");
    }

    // Popup Controls

    const btnMinimize =
        document.getElementById("btnMinimize");

    if (btnMinimize) {
        btnMinimize.addEventListener("click", function () {
            MinimizePopup();
        });
    }

    const btnMaximize =
        document.getElementById("btnMaximize");

    if (btnMaximize) {
        btnMaximize.addEventListener("click", function () {
            MaximizePopup();
        });
    }

    const btnClose =
        document.getElementById("btnClose");

    if (btnClose) {
        btnClose.addEventListener("click", function () {
            ClosePrintPopup();
        });
    }

    const btnPopupCloseFooter =
        document.getElementById("btnPopupCloseFooter");

    if (btnPopupCloseFooter) {
        btnPopupCloseFooter.addEventListener("click", function () {
            ClosePrintPopup();
        });
    }

});

// Remove 印刷形式選択

function RemovePrintTypeSection() {

    const printTypeSection =
        document.getElementById("printTypeSection");

    if (printTypeSection) {
        printTypeSection.remove();
    }
}

// Set Popup Title
function SetPopupTitle(title) {

    const popupHeading =
        document.getElementById("screen-heading");

    if (popupHeading) {
        popupHeading.textContent = title;
    }

    const popupTitle =
        document.getElementById("popupTitle");

    if (popupTitle) {
        popupTitle.textContent = title;
    }
}

// Set Range Label
function SetRangeLabel(label) {

    const rangeFieldLabel =
        document.getElementById("rangeFieldLabel");

    if (rangeFieldLabel) {
        rangeFieldLabel.textContent = label;
    }
}

// Popup State

let IsMaximized = false;
let IsMinimized = false;

// CLOSE POPUP
function ClosePrintPopup() {

    const popup =
        document.getElementById("printPopup");

    if (popup) {
        popup.style.display = "none";
    }


    const popupWindow =
        document.getElementById("printPopupWindow");

    if (popupWindow) {
        popupWindow.classList.remove("maximized");
        popupWindow.style.height = "";
    }

    IsMaximized = false;
    IsMinimized = false;
}

// MAXIMIZE POPUP
function MaximizePopup() {

    const popupWindow =
        document.getElementById("printPopupWindow");

    if (!popupWindow) {
        return;
    }

    if (!IsMaximized) {
        popupWindow.classList.add("maximized");
        IsMaximized = true;
    }
    else {
        popupWindow.classList.remove("maximized");
        IsMaximized = false;
    }
}
// MINIMIZE POPUP
function MinimizePopup() {

    const popupWindow =
        document.getElementById("printPopupWindow");

    if (!popupWindow) {
        return;
    }

    if (!IsMinimized) {
        popupWindow.style.height = "100px";
        IsMinimized = true;
    }
    else {
        popupWindow.style.height = "526px";
        IsMinimized = false;
    }
}