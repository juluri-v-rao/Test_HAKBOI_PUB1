/**
 * =========================================================================================================================
 * Screen: Order Entry
 *
 * Navigation:
 *     Main Menu
 *         -→ Daily Processing(Entry)
 *         -→ Order Entry
 *
 * Migrated From: FrmN_Juchu.vb
 *
 * Functions:
 *              - Save (F1)
 *              - RowAdd (F2)
 *              - RowDelete (F3)
 *              - Delete (F4) (full voucher with details)
 *              - VoucherSearch (F5)
 *              - MasterSearch (F6)
 *              - BackwardNavigation(PreviousCodeData) (F7)
 *              - ForwardNavigation(NextCodeData) (F8)
 *              - Copy (F10) (copies one row onto another row of the voucher on screen, in two steps: copy, then paste)
 *              - Cancel (F11)
 *              - Exit (F12)
 *              - copy voucher (伝票複写) button (it copies entire voucher data to new voucher and current date)
 * =========================================================================================================================
 */

//Flag to indicate if the current record is new or existing. Sent to the server on save (legacy Sink_Flg).
let isNewRecord = true;

//Flag to indicate if the user is in edit mode. Not used on this screen yet.
let isEditMode = false;

//True when the screen has unsaved changes. Drives the warnings on F7, F8, F11 and F12 (legacy Chg_Flg).
let hasChanges = false;

//Store the currently editing control for restoring uncommitted values. Not used on this screen yet.
let editingControl = null;

// 受注日 shown on a new voucher: today, then the last saved date (legacy Date_Para)
let newVoucherDate = "";

// Row that F2/F3 act on: the last focused row, cleared when a header input gets focus (legacy Body.CurrentRow)
let currentRow = null;

// Row number remembered by F10 until it is pasted, or null when nothing is copied (legacy Copy_GNo)
let copySourceRowNo = null;

// The code input F6 searches for: the last focused input listed in masterSearchInputs
let masterSearchTarget = null;

// Code inputs that enable F6 master search while focused. Every other editable input disables it (legacy GotFocus handlers).
const masterSearchInputs = [
    "#depCmbKey",          // 自社支店 (TxtSiCd)
    ".supplierCmbKey",     // 荷主 (TxtUserCd)
    ".departureCmbKey",    // 発地 (TxtFromCd)
    ".arrivalCmbKey",      // 着地 (TxtToCd)
    ".productCmbKey",      // 品名 (TxtHinCd)
    ".driverCode",         // 運転手 (TxtTantoCd)
    ".vehicleCode",        // 車番 (TxtCarCd)
    ".cVehicleCode",       // 傭車 (TxtYoshaCd)
    ".billCmbKey",         // 請求単位 (TxtTanCd)
    ".payCmbKey"           // 下払単位 (TxtYTanCd)
].join(",");

// =========================================
//              Enter Navigation
// =========================================

// Enter and Tab both move focus to the next editable input, wrapping from the last back to the first.
// In the rows ↓ works like Enter, as in legacy UC_KeyDown.
// Enter and ↓ also commit a code input: it is looked up first, and focus stays on it if the code is not accepted.
// Tab only moves, so the code input goes back to its last accepted code (see Code Lookups).
// Readonly inputs are skipped. Keys pressed outside the input list keep their normal behaviour,
// including in the F5/F6 search popups, which handle their own keys.
// ↑ and Esc go back one input without committing, so the input puts back its kept value (legacy UC_KeyDown).
document.addEventListener("keydown", async function(event) {

    const current = document.activeElement;
    const isRowDown = event.key === "ArrowDown" && current?.closest(".infoGrid");

    if (event.key === "ArrowUp" || event.key === "Escape") {
        moveBack(event, current);
        return;
    }

    // HOME on 荷主: 上段コピー (legacy TxtUserCd_KeyDown)
    if (event.key === "Home" && current?.matches?.(".supplierCmbKey") && isOnScreen(current)) {
        event.preventDefault();
        copyRowAbove(current.closest(".infoGrid"));
        return;
    }

    if (event.key !== "Enter" && event.key !== "Tab" && !isRowDown) {
        return;
    }

    if (!screenInputs().includes(current)) {
        return;
    }

    event.preventDefault();

    // A lookup, price or fare is still waiting for the server
    if (lookupInProgress || pricingInProgress) {
        return;
    }

    if (event.key !== "Tab") {

        if (!await commitLookup(current)) {
            return;
        }

        if (!await commitKeptValue(current)) {
            return;
        }

        // The user clicked somewhere else while the lookup ran
        if (document.activeElement !== current) {
            return;
        }

        committedInput = current;
    }

    focusNextInput(current);

});

// ↑ / Esc (legacy UC_KeyDown and the header KeyDown handlers):
//   - 伝票番号: nothing,
//   - 受注日: 伝票番号,
//   - anything else: the input before it (row N's 荷主 → the last input of row N-1, row 1's 荷主 → 自社支店).
// Esc in an open calendar closes the calendar first.
function moveBack(event, current) {

    if (isCalendarOpen()) {
        return;
    }

    if (current?.id === "voucherNumber") {
        event.preventDefault();
        return;
    }

    const inputs = screenInputs();
    const index = inputs.indexOf(current);

    if (index === -1) {
        return;
    }

    event.preventDefault();

    if (lookupInProgress || pricingInProgress) {
        return;
    }

    const previous = current.id === "orderDate"
        ? document.getElementById("voucherNumber")
        : inputs[index - 1];

    previous?.focus();
}

function isCalendarOpen() {
    return Array.from(document.querySelectorAll(".japanese-calendar"))
        .some(calendar => calendar.style.display === "block");
}

// The editable inputs of the screen in Enter order. The search popups are outside .main-container and are left out.
// 伝票番号 is not in it (legacy TxtDno.TabStop = False): Enter goes 受注日 → 自社支店 → row 1 荷主.
function screenInputs() {

    const screen = document.querySelector(".main-container") ?? document;

    return Array.from(screen.querySelectorAll("input, textarea, .tab-button.active"))
        .filter(x => !x.readOnly && x.id !== "voucherNumber");
}

// Moves focus to the editable input after the given one, wrapping from the last back to the first.
function focusNextInput(current) {

    const inputs = screenInputs();
    const currentIndex = inputs.indexOf(current);

    if (currentIndex !== -1) {
        inputs[(currentIndex + 1) % inputs.length].focus();
    }
}

// True for events from the screen itself rather than from a search popup
function isOnScreen(element) {

    const screen = document.querySelector(".main-container");

    return !screen || screen.contains(element);
}

// =========================================
//          Code Lookups (Enter / ↓)
// =========================================
// Legacy looks a code up only when Enter or ↓ commits it (commitFlg in UC_KeyDown, then the LostFocus handler).
// Leaving a code input any other way (Tab, mouse) puts back the code it had when it got focus (legacy Text = mry(Gyo).X).
// Committing a code:
//   - zero-pads it (legacy ZeroPad; blank stays blank),
//   - blank: clears the name, or is refused for 自社支店,
//   - 0000000000 on 発地/着地/品名/運転手: the name is typed by hand, so nothing is looked up,
//   - the same code as before: nothing is looked up,
//   - otherwise asks the server. Found fills the row; not found shows the message and puts back the old code.
// A changed code can then fill in prices and recalculate fares, as legacy does after each lookup (see Prices and Fares).

// The code that "the screen has accepted" is the value the input had when it got focus
let acceptedCode = "";

// True once the user types in the focused code input, until the code is committed.
// Values set by code (F7/F8, F10, F11) never need putting back, so only typing is undone on leaving.
let codeTyped = false;

// True while a lookup waits for the server or shows its message, so focus events from the alert are ignored
let lookupInProgress = false;

// Code typed by hand with the name entered manually (legacy 手入力用コード)
const MANUAL_CODE = "0000000000";

// One entry per code input. row is the .infoGrid of the input, or null for 自社支店 in the header.
//   isValid:  refuses a code without a lookup when it returns false; onInvalid then runs before the put-back.
//   onBlank:  runs when the code is cleared. Returns false to refuse a blank code.
//   onManual: runs for 0000000000 instead of a lookup. Returns false to keep focus on the code.
//   fill:     shows the values the server found.
//   pricing:  what a changed code recalculates (see applyPricing). Runs after a found code,
//             and after clearing the code too when pricesOnBlank is set.
const lookupFields = [
    {
        // 自社支店 (legacy TxtSiCd_LostFocus, Dsp_Bumon)
        selector: "#depCmbKey", type: "branch", label: "自社支店", padTo: 2,
        // Legacy clears LblSiNm, then stays on the box and puts the code back; the name stays empty
        onBlank: () => {
            setScreenValue(null, "#depCmbValue", "");
            return false;
        },
        fill: (row, data) => setScreenValue(null, "#depCmbValue", data.name ?? "")
    },
    {
        // 荷主 (legacy TxtUserCd_LostFocus, Dsp_User)
        selector: ".supplierCmbKey", type: "shipper", label: "荷主", padTo: 10,
        pricing: "all",
        onBlank: row => {
            setScreenValue(row, ".supplierCmbValue", "");
            clearPlacesOfShipper(row);
        },
        // 発地 / 着地 are cleared in commitLookup, after the prices were looked up with them
        fill: (row, data) => setScreenValue(row, ".supplierCmbValue", data.name ?? "")
    },
    placeField(".departureCmbKey", "発地", ".departureCmbValue", ".departureNotes", ".dAdminNumber"),
    placeField(".arrivalCmbKey", "着地", ".arrivalCmbValue", ".arrivalNotes", ".aAdminNumber"),
    {
        // 品名 (legacy TxtHinCd_LostFocus, Dsp_Hin). A blank code leaves the name as it is.
        selector: ".productCmbKey", type: "product", label: "品名", padTo: 10,
        pricing: "all", pricesOnBlank: true,
        onManual: () => true,
        fill: (row, data) => setScreenValue(row, ".productCmbValue", data.name ?? "")
    },
    {
        // 運転手 with the driver's 傭車 and vehicle (legacy TxtTantoCd_LostFocus, Dsp_Tanto)
        selector: ".driverCode", type: "driver", label: "運転手", padTo: 10,
        onBlank: row => setScreenValue(row, ".driverName", ""),
        onManual: row => {
            if (row.querySelector(".cVehicleCode").value) {
                return true;
            }

            // Legacy keeps the code but stays on it
            lookupInProgress = true;
            alert("運転手の手入力をするためには傭車を指定してください。");
            lookupInProgress = false;
            return false;
        },
        fill: (row, data) => {
            setScreenValue(row, ".driverName", data.name ?? "");
            setScreenValue(row, ".driverContact", data.phone ?? "");
            setScreenValue(row, ".cVehicleCode", data.charteredCode ?? "");
            setScreenValue(row, ".cVehicleNumber", data.charteredName ?? "");

            // Left out by the server when the vehicle has been retired, so the screen keeps what it has
            setScreenValueIfGiven(row, ".vehicleCode", data.vehicleCode);
            setScreenValueIfGiven(row, ".vehicleNumber", data.vehicleNumber);
            setScreenValueIfGiven(row, ".vehicleCmbKey", data.vehicleTypeCode);
            setScreenValueIfGiven(row, ".vehicleCmbValue", data.vehicleTypeName);
        }
    },
    {
        // 車番 (legacy TxtCarCd_LostFocus, Dsp_Car). A blank code also clears the 車番.
        selector: ".vehicleCode", type: "vehicle", label: "車輌", padTo: 10,
        pricing: "all",
        notFoundMessage: code => `このコード${code}はマスタに存在しません`,
        onBlank: row => setScreenValue(row, ".vehicleNumber", ""),
        fill: (row, data) => {
            setScreenValue(row, ".vehicleNumber", data.vehicleNumber ?? "");
            setScreenValue(row, ".vehicleCmbKey", data.vehicleTypeCode ?? "");
            setScreenValue(row, ".vehicleCmbValue", data.vehicleTypeName ?? "");
        }
    },
    {
        // 車種 (legacy TxtCarKbnCd_LostFocus, Dsp_CarKbn). Only 1 to 9; anything else is refused without a message.
        selector: ".vehicleCmbKey", type: "vehicleType", label: "車輌形態", padTo: 0,
        pricing: "all",
        isValid: code => /^[1-9]$/.test(code),
        // Legacy clears LblCarKbn before putting the code back; the name stays empty
        onInvalid: row => setScreenValue(row, ".vehicleCmbValue", ""),
        notFoundMessage: code => `指定した車輌形態『 ${code} 』は未登録です！！`,
        fill: (row, data) => setScreenValue(row, ".vehicleCmbValue", data.name ?? "")
    },
    {
        // 傭車 (legacy TxtYoshaCd_LostFocus, Dsp_Yosha)
        selector: ".cVehicleCode", type: "chartered", label: "傭車", padTo: 10,
        pricing: "pay", pricesOnBlank: true,
        onBlank: row => setScreenValue(row, ".cVehicleNumber", ""),
        fill: (row, data) => setScreenValue(row, ".cVehicleNumber", data.name ?? "")
    },
    unitField(".billCmbKey", ".billCmbValue", "billUnit"),
    unitField(".payCmbKey", ".payCmbValue", "payUnit")
];

// 発地 and 着地 (legacy TxtFromCd/TxtToCd_LostFocus, Dsp_From/Dsp_To).
// The name and phone are only replaced when the master has them; the address always is.
function placeField(selector, label, nameSelector, addressSelector, phoneSelector) {
    return {
        selector, type: "place", label, padTo: 10,
        sendsShipper: true,
        pricing: "all",
        onManual: () => true,
        onBlank: row => {
            setScreenValue(row, nameSelector, "");
            setScreenValue(row, addressSelector, "");
        },
        fill: (row, data) => {
            setScreenValueIfGiven(row, nameSelector, data.name);
            setScreenValue(row, addressSelector, data.address ?? "");
            setScreenValueIfGiven(row, phoneSelector, data.phone);
        }
    };
}

// 請求 and 下払 単位 (legacy TxtTanCd/TxtYTanCd_LostFocus, Dsp_Tani/Dsp_YTani)
function unitField(selector, nameSelector, pricing) {
    return {
        selector, type: "unit", label: "単位コード", padTo: 0,
        pricing, pricesOnBlank: true,
        onBlank: row => setScreenValue(row, nameSelector, ""),
        fill: (row, data) => setScreenValue(row, nameSelector, data.name ?? "")
    };
}

// Returns the lookupFields entry for an input, or undefined when it is not a code input.
function lookupFieldOf(input) {
    return input?.matches ? lookupFields.find(field => input.matches(field.selector)) : undefined;
}

// Remembers the code a code input has when it gets focus.
function rememberAcceptedCode(event) {
    if (!lookupInProgress && lookupFieldOf(event.target)) {
        acceptedCode = event.target.value;
        codeTyped = false;
    }
}

// Notes that the user typed in a code input.
function noteCodeTyped(event) {
    if (lookupFieldOf(event.target)) {
        codeTyped = true;
    }
}

// Leaving a code input without Enter or ↓ puts back the code it had (legacy Err_Exit: Text = mry(Gyo).X).
function restoreUncommittedCode(event) {
    if (!lookupInProgress && codeTyped && lookupFieldOf(event.target)) {
        event.target.value = acceptedCode;
        codeTyped = false;
    }
}

// Takes the focused code input's current value as accepted, after code has changed the screen (load, clear, paste, row moves).
function syncAcceptedCode() {
    if (lookupFieldOf(document.activeElement)) {
        acceptedCode = document.activeElement.value;
        codeTyped = false;
    }

    if (document.activeElement === keptInput) {
        keptValue = keptInput.value;
    }
}

// =========================================
//      Kept values of the other row inputs
// =========================================
// Every row input (名称, 住所, 担当, 電話, 数量, 金額, 備考 …) works like a code input: Enter / ↓ commits it
// (legacy commitFlg), and leaving it any other way puts back the value it had (legacy Err_Exit: Text = mry(Gyo).X).
// A committed value that differs is a change to the voucher (legacy Chg_Flg). Codes and row dates have their own handling.

// The row input that has focus and the value it had then (legacy mry(Gyo))
let keptInput = null;
let keptValue = "";

// The input just committed with Enter / ↓, so its focusout keeps the value
let committedInput = null;

function isKeptInput(input) {
    return !!input?.matches?.(".infoGrid input")
        && !input.readOnly
        && !lookupFieldOf(input)
        && !isRowDateInput(input);
}

function rememberKeptValue(event) {
    if (!lookupInProgress && !pricingInProgress && isKeptInput(event.target)) {
        keptInput = event.target;
        keptValue = event.target.value;
        committedInput = null;
    }
}

// Enter / ↓ on a row input: a changed 数量, 重量, 単価 or 下払単価 recalculates the fares first;
// a price whose fare is out of range is put back and keeps the focus (returns false).
async function commitKeptValue(input) {

    if (input !== keptInput) {
        return true;
    }

    if (input.matches(fareInputs) && !await recalculateFares(input)) {
        keptValue = input.value;
        return false;
    }

    if (!sameKeptValue(input, input.value, keptValue)) {
        hasChanges = true;
    }

    keptValue = input.value;
    return true;
}

// Numbers are compared as numbers: the box shows 1,234.00 but holds 1234 while it has focus
function sameKeptValue(input, a, b) {
    return input.matches(ROW_NUMBER_INPUTS)
        ? (parseDecimalInput(a) ?? 0) === (parseDecimalInput(b) ?? 0)
        : a === b;
}

function restoreUncommittedValue(event) {

    const input = event.target;

    if (input !== keptInput) {
        return;
    }

    // An alert of a lookup or fare took the focus for a moment
    if (lookupInProgress || pricingInProgress) {
        return;
    }

    keptInput = null;

    if (committedInput === input) {
        committedInput = null;
        return;
    }

    input.value = keptValue;

    if (input.matches(ROW_NUMBER_INPUTS)) {
        showNumber(input, parseDecimalInput(keptValue) ?? 0);
    }
}

// HOME on 荷主 of row 2 or later: the row above is copied into this row (legacy TxtUserCd_KeyDown, 上段コピー).
// It is not a change on its own (no Chg_Flg); the pasted row is not on a daily report yet.
function copyRowAbove(row) {

    const rowNo = Number(row?.dataset.row);

    if (!(rowNo > 1) || lookupInProgress || pricingInProgress) {
        return;
    }

    pasteRow(document.querySelector(`.infoGrid[data-row="${rowNo - 1}"]`), row);
    syncAcceptedCode();
}

// Commits the code in the input. Returns true when focus may move on, false to stay on the input.
// Inputs that are not code inputs always return true.
async function commitLookup(input) {

    const field = lookupFieldOf(input);

    if (!field) {
        return true;
    }

    const row = input.closest(".infoGrid");
    const code = field.padTo ? zeroPad(input.value, field.padTo) : input.value;
    input.value = code;

    const previousCode = acceptedCode;
    let accepted;

    // Whether this commit fills in prices and fares (legacy calls Dsp_Tanka only on these paths)
    let priced = false;

    if (field.isValid && !field.isValid(code)) {
        field.onInvalid?.(row);
        accepted = false;
    } else if (code === "") {
        accepted = field.onBlank?.(row) !== false;
        priced = accepted && field.pricesOnBlank === true;
    } else if (field.onManual && code === MANUAL_CODE) {
        // The manual code is kept either way, and onManual decides whether focus moves
        acceptCode(input, code);
        return field.onManual(row);
    } else if (code === acceptedCode) {
        accepted = true;
    } else {
        accepted = await lookUpCode(input, field, row, code);
        priced = accepted;
    }

    if (accepted) {
        acceptCode(input, code);

        if (priced && field.pricing && code !== previousCode) {
            await applyPricing(row, field.pricing);
        }

        // A new 荷主: Dsp_Tanka / Cal_King ran with the old 発地 / 着地, then they are cleared (legacy Kanri_PLKbn = 0)
        if (priced && field.type === "shipper") {
            clearPlacesOfShipper(row);
        }
    } else {
        input.value = acceptedCode;
        codeTyped = false;
        input.focus();
    }

    return accepted;
}

// Asks the server for the code and fills the row. Returns false after showing the not-registered message.
async function lookUpCode(input, field, row, code) {

    lookupInProgress = true;

    try {
        const params = new URLSearchParams({ type: field.type, code, isNew: isNewRecord });

        if (field.sendsShipper) {
            params.set("shipperCode", row.querySelector(".supplierCmbKey").value);
        }

        const response = await fetch(`/OrderEntry/Lookup?${params}`);
        const data = response.ok ? await response.json() : null;

        if (!data) {
            alert("マスタの取得に失敗しました！！");
            return false;
        }

        if (!data.found) {
            alert(field.notFoundMessage
                ? field.notFoundMessage(code)
                : `指定した${field.label}『${code}』は未登録です！！`);
            return false;
        }

        field.fill(row, data);
        return true;

    } catch {
        alert("マスタの取得に失敗しました！！");
        return false;

    } finally {
        lookupInProgress = false;
    }
}

// Keeps a committed code. A different code is a change to the voucher (legacy Chg_Flg).
function acceptCode(input, code) {

    if (code !== acceptedCode) {
        hasChanges = true;
    }

    acceptedCode = code;
    codeTyped = false;
}

// When 発着地 are registered per 荷主 (管理マスタ.発着地区分 = 0), a new 荷主 clears the row's 発地 and 着地,
// except a hand-typed 0000000000 (legacy TxtUserCd_LostFocus with Kanri_PLKbn = "0").
function clearPlacesOfShipper(row) {

    if (document.getElementById("scrollArea")?.dataset.placeByShipper !== "1") {
        return;
    }

    for (const [codeSelector, nameSelector, addressSelector] of [
        [".departureCmbKey", ".departureCmbValue", ".departureNotes"],
        [".arrivalCmbKey", ".arrivalCmbValue", ".arrivalNotes"]
    ]) {
        if (row.querySelector(codeSelector).value !== MANUAL_CODE) {
            setScreenValue(row, codeSelector, "");
            setScreenValue(row, nameSelector, "");
            setScreenValue(row, addressSelector, "");
        }
    }
}

// Sets an input in a row, or in the header when row is null.
function setScreenValue(row, selector, value) {
    (row ?? document).querySelector(selector).value = value;
}

// Sets an input only when the server sent a value, so null keeps what the screen shows.
function setScreenValueIfGiven(row, selector, value) {
    if (value !== null && value !== undefined) {
        setScreenValue(row, selector, value);
    }
}

// =========================================
//            Prices and Fares
// =========================================
// Legacy fills in prices from 発着地単価マスタ (Dsp_Tanka) and recalculates 運賃 and 下払運賃 (Cal_King, Cal_YKing):
//                                                              - after a changed code (pricing in lookupFields),
//                                                              - after a changed 数量, 重量, 単価 or 下払単価 (recalculateFares).
// A price is only filled into an empty or 0 box, so a price typed by the user is never replaced.
// The server does the lookup and the money arithmetic in decimal, as legacy does.

// Largest 運賃 and 下払運賃 (legacy TxtKing/TxtSKing MinValue and MaxValue)
const FARE_LIMIT = 9999999;

// Inputs whose change recalculates the fares
const fareInputs = ".quantity, .weight, .unitBill, .unitPay";

// The value a fare input had when it got focus (legacy mry(Gyo).Suryo, Juryo, Tanka, STanka)
let numberAtFocus = null;

// True while prices or fares wait for the server, so Enter does not run a second commit meanwhile
let pricingInProgress = false;

// Runs legacy's steps for a changed code:
//   "all":      Dsp_Tanka(0), then both fares if it filled a price (荷主, 発地, 着地, 品名, 車番, 車種)
//   "pay":      Dsp_Tanka(2), then 下払運賃 if it filled a price (傭車)
//   "billUnit": Dsp_Tanka(1), then 運賃 always (請求単位)
//   "payUnit":  Dsp_Tanka(2), then 下払運賃 always (下払単位)
async function applyPricing(row, mode) {

    pricingInProgress = true;

    try {
        switch (mode) {
            case "all":
                if (await fillUnitPrices(row, true, true)) {
                    await calculateFare(row, "bill");
                    await calculateFare(row, "pay");
                }
                break;

            case "pay":
                if (await fillUnitPrices(row, false, true)) {
                    await calculateFare(row, "pay");
                }
                break;

            case "billUnit":
                await fillUnitPrices(row, true, false);
                await calculateFare(row, "bill");
                break;

            case "payUnit":
                await fillUnitPrices(row, false, true);
                await calculateFare(row, "pay");
                break;
        }
    } finally {
        pricingInProgress = false;
    }
}

// Fills 単価 and/or 下払単価 from the master (legacy Dsp_Tanka). Returns true only when every requested price was filled.
// As in legacy, a box that already has a price, or no price in the master, stops here and returns false.
// So with both requested, the 下払単価 is not looked at when 単価 was not filled.
async function fillUnitPrices(row, bill, pay) {

    const vehicleType = row.querySelector(".vehicleCmbKey").value;

    // The 車種 picks the price column, so without one there is nothing to look up
    if (!/^[1-9]$/.test(vehicleType)) {
        return false;
    }

    const text = selector => row.querySelector(selector).value;
    const params = new URLSearchParams({
        shipperCode: text(".supplierCmbKey"),
        departureCode: text(".departureCmbKey"),
        arrivalCode: text(".arrivalCmbKey"),
        productCode: text(".productCmbKey"),
        vehicleTypeCode: vehicleType,
        billingUnitCode: text(".billCmbKey"),
        paymentUnitCode: text(".payCmbKey")
    });

    const prices = await fetchJson(`/OrderEntry/UnitPrice?${params}`);

    if (!prices) {
        alert("単価の取得に失敗しました！！");
        return false;
    }

    if (bill && !fillEmptyPrice(row.querySelector(".unitBill"), prices.unitPrice)) {
        return false;
    }

    // Without a 傭車 there is no 下払単価
    if (pay && !fillEmptyPrice(row.querySelector(".unitPay"), text(".cVehicleCode") ? prices.paymentUnitPrice : 0)) {
        return false;
    }

    return true;
}

// Puts a price into an empty or 0 box. Returns false when the box has a price already or the price is 0.
function fillEmptyPrice(input, price) {

    if ((parseDecimalInput(input.value) ?? 0) !== 0 || !price) {
        return false;
    }

    showNumber(input, price);
    hasChanges = true;
    return true;
}

// Recalculates 運賃 (kind "bill") or 下払運賃 (kind "pay") from 数量, 重量 and the price.
// A result outside ±9,999,999 shows the legacy message, leaves the fare as it was, puts focus on the price and returns false.
async function calculateFare(row, kind) {

    const isBill = kind === "bill";
    const priceInput = row.querySelector(isBill ? ".unitBill" : ".unitPay");
    const number = selector => String(parseDecimalInput(row.querySelector(selector).value) ?? 0);

    const params = new URLSearchParams({
        kind,
        partyCode: row.querySelector(isBill ? ".supplierCmbKey" : ".cVehicleCode").value,
        unitCode: row.querySelector(isBill ? ".billCmbKey" : ".payCmbKey").value,
        quantity: number(".quantity"),
        weight: number(".weight"),
        unitPrice: String(parseDecimalInput(priceInput.value) ?? 0)
    });

    const result = await fetchJson(`/OrderEntry/CalculateFare?${params}`);

    if (typeof result?.fare !== "number") {
        alert("運賃の計算に失敗しました！！");
        return false;
    }

    const label = isBill ? "運賃" : "下払運賃";

    if (result.fare < -FARE_LIMIT) {
        alert(`${label}が指定最低金額より下回りました。再入力してください！！`);
        priceInput.focus();
        return false;
    }

    if (result.fare > FARE_LIMIT) {
        alert(`${label}が指定最大金額より上回りました。再入力してください！！`);
        priceInput.focus();
        return false;
    }

    showNumber(row.querySelector(isBill ? ".fCharge" : ".fPay"), result.fare);
    hasChanges = true;
    return true;
}

// Remembers a fare input's value when it gets focus.
function rememberNumberAtFocus(event) {
    if (event.target.matches?.(fareInputs)) {
        numberAtFocus = parseDecimalInput(event.target.value);
    }
}

// A changed 数量 or 重量 recalculates both fares, and a changed 単価 or 下払単価 its own fare
// (legacy TxtSuryo, TxtJuryo, TxtTanka, TxtSTanka_LostFocus, run only on a commit with Enter / ↓).
// A price whose fare is out of range is put back and false is returned, so the focus stays on it.
async function recalculateFares(input) {

    if (!input.matches?.(fareInputs)) {
        return true;
    }

    const before = numberAtFocus;

    // Apply the box's limits now, as the blur formatting runs after this
    normalizeDecimalInput(input);

    const now = parseDecimalInput(input.value);

    if ((before ?? 0) === (now ?? 0)) {
        return true;
    }

    if (document.activeElement === input) {
        numberAtFocus = now;
    }

    const row = input.closest(".infoGrid");

    pricingInProgress = true;

    try {
        if (input.matches(".quantity, .weight")) {
            await calculateFare(row, "bill");
            await calculateFare(row, "pay");
            return true;
        }

        if (!await calculateFare(row, input.matches(".unitBill") ? "bill" : "pay")) {
            input.value = before === null ? "" : String(before);
            normalizeDecimalInput(input);

            if (document.activeElement === input) {
                numberAtFocus = before;
            }

            return false;
        }

        return true;
    } finally {
        pricingInProgress = false;
    }
}

// Shows a number in a decimal input with its decimal places and thousands separators, red when negative.
function showNumber(input, value) {

    const decDigits = parseInt(input.dataset.decDigits ?? "2");

    input.value = value.toLocaleString("en-US", {
        minimumFractionDigits: decDigits,
        maximumFractionDigits: decDigits
    });

    input.style.color = value < 0 ? "red" : "";
}

// GET returning JSON, or null when the request fails.
async function fetchJson(url) {

    try {
        const response = await fetch(url);
        return response.ok ? await response.json() : null;
    } catch {
        return null;
    }
}

// =========================================
//        Initial Screen Load/Events
// =========================================

// Runs once when the page has loaded: applies the input rules and connects the function key buttons to their handlers.
// The page itself is rendered as a new voucher, so nothing needs to be fetched here.
document.addEventListener("DOMContentLoaded", () => {

    // restricting data input to numeric
    InputToNumOnly();

    // comma removal on focus, input limits while typing and formatting on blur for every .decimal-input
    formatAllDecimals();

    // row numbers show 0.000 / 0.00 / 0 like legacy; registered after formatAllDecimals so its blur runs first
    initializeRowNumbers();

    //RegisterButton
    const registerButton = document.getElementById("btnRegister");
    if (registerButton) {
        registerButton.addEventListener("click", saveOrderEntryData);
    }

    //F2/F3/F6/F10 enabling and target row tracking, registered before the first focus below
    document.addEventListener("focusin", trackCurrentRow);

    //Code lookups: remember the accepted code on focus, and put it back when leaving without Enter or ↓
    document.addEventListener("focusin", rememberAcceptedCode);
    document.addEventListener("input", noteCodeTyped);
    document.addEventListener("focusout", restoreUncommittedCode);

    //The other row inputs: the same, with their kept value (legacy mry(Gyo))
    document.addEventListener("focusin", rememberKeptValue);
    document.addEventListener("focusout", restoreUncommittedValue);

    //Fares: a 数量, 重量, 単価 or 下払単価 committed with a new value recalculates 運賃 and 下払運賃 (commitKeptValue)
    document.addEventListener("focusin", rememberNumberAtFocus);

    //Footer message of the focused input (legacy GotFocus)
    document.addEventListener("focusin", showFieldHint);

    //車種: the 運賃形態 list beside it while it has focus (legacy Frame1B)
    initializeVehicleTypeList();

    //F5 伝票検索 and F6 ﾏｽﾀ検索 results
    initializeSearchResults();

    //伝票番号: Enter opens the voucher typed (legacy TxtDno_LostFocus)
    initializeVoucherNumber();

    //RowAddButton
    const addRowButton = document.getElementById("btnAddRow");
    if (addRowButton) {
        addRowButton.addEventListener("click", addRow);
    }

    //RowDeleteButton
    const deleteRowButton = document.getElementById("btnDeleteRow");
    if (deleteRowButton) {
        deleteRowButton.addEventListener("click", deleteRow);
    }

    //RowCopyButton
    const copyRowButton = document.getElementById("btnCopy");
    if (copyRowButton) {
        copyRowButton.addEventListener("click", copyOrPasteRow);
    }

    //VoucherCopyButton
    const copyVoucherButton = document.getElementById("btnCopyVoucher");
    if (copyVoucherButton) {
        copyVoucherButton.addEventListener("click", copyVoucher);
    }

    //DeleteButton
    const deleteButton = document.getElementById("btnDelete");
    if (deleteButton) {
        deleteButton.addEventListener("click", deleteOrderEntryData);
    }

    //btnF7
    const previousData = document.getElementById("btnF7");
    if (previousData) {
        previousData.addEventListener("click", loadPreviousOrder);
    }

    //btnF8
    const nextData = document.getElementById("btnF8");
    if (nextData) {
        nextData.addEventListener("click", loadNextOrder);
    }

    // The server renders today's date into 受注日 (data-actual-value); show it as era text
    initializeOrderDate();
    initializeRowDates();
    newVoucherDate = pageOrderDate;

    // Typing alone is not a change: the change flag is set when a different value is committed (legacy Chg_Flg),
    // by acceptCode, commitKeptValue and the date boxes.

    //F5 - VoucherSearch and F6 - MasterSearch popups (SearchScreenController)
    document.getElementById("btnF5")?.addEventListener("click", openVoucherSearch);
    document.getElementById("btnF6")?.addEventListener("click", openMasterSearch);
    //connectSearchPopups();

    //CancelButton
    const cancelButton = document.getElementById("btnBack");
    if (cancelButton) {
        cancelButton.addEventListener("click", cancelOrderEntry);
    }

    //Code(Auto)
    const codeTextbox = document.getElementById("depCmbKey");
    restrictNumericInput(codeTextbox, 2);
    codeTextbox.focus();

    //F12 - ExitButton with popup
    const btnExit = document.getElementById("btnExit");

    if (btnExit) {

        btnExit.addEventListener("click", function(event) {

            event.preventDefault();

            if (hasChanges) {

                // only is used in each screen(based on whether this popup exist or not in legacy screen),
                // except common button functionality
                if (!confirm("内容が変更されております。よろしいですか？")) {
                    return;
                }
            }

            // Exit manually, without using the common exit function, 
            // to avoid the warning message when there are unsaved changes(from common js or similar file)
            const exitUrl = btnExit.dataset.exitUrl;

            if (exitUrl) {
                window.location.href = exitUrl;
            }

        });

    }

});

// Footer message when an input gets focus, by mouse or Enter (legacy GotFocus). The popups' inputs keep their own messages.
//   荷主: [HOME]キーにて上段コピー
//   受注日 / 積日 / 積時間 / 卸日 / 卸時間: DINPUT_Mess (the era hint in 和暦, nothing in 西暦)
//   anything else: nothing
function showFieldHint(event) {

    const input = event.target;

    if (!input.matches?.("input, textarea") || !isOnScreen(input)) {
        return;
    }

    if (input.matches("#orderDate, .loadingDate, .unloadingDate, .loadingNotes, .unloadingNotes")) {
        showDateHint();
    } else if (input.matches(".supplierCmbKey")) {
        showSupplierCodeKeyMessage();
    } else {
        showClearMessage();
    }
}

// =========================================
//                 Save (F1)
// =========================================

// Saves the whole voucher, then clears the screen for the next one (legacy Input_Chk, Data_Repl).
// The server decides row by row what to insert, update or delete, so only rows with a 荷主 are sent.
async function saveOrderEntryData() {

    const model = collectOrderEntryModel();

    // collectOrderEntryModel has already shown the validation message
    if (!model) {
        return;
    }

    const response = await fetch("/OrderEntry/Save", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "RequestVerificationToken": getAntiForgeryToken()
        },
        body: JSON.stringify(model)
    });

    if (!response.ok) {
        alert("登録に失敗しました！！");
        return;
    }

    const result = await response.json();

    if (!result.success) {
        alert(result.errorMessage);
        return;
    }

    // The next voucher starts with the date just saved (legacy Date_Para)
    newVoucherDate = model.orderDate;

    await resetToNewVoucher();
}

// Reads the screen into the save model. Shows a message and returns null if an input is invalid.
function collectOrderEntryModel() {

    const orderDateInput = document.getElementById("orderDate");
    const orderDate = getOrderDate();

    if (!orderDate) {
        alert("受注日を正しく入力して下さい！！");
        orderDateInput.focus();
        return null;
    }

    const details = [];

    for (const row of document.querySelectorAll(".infoGrid")) {

        const supplierCode = row.querySelector(".supplierCmbKey").value;

        // A row without a 荷主 is not saved, and is deleted if it already exists
        if (!supplierCode) {
            continue;
        }

        // shown as R08/11/16; saved as yyyy-MM-dd. A legacy GcDate cannot hold a bad date, so F1 has no
        // row date message: a date that is not one is saved as none.
        const loadingDate = parseRowDate(row.querySelector(".loadingDate").value) ?? null;
        const unloadingDate = parseRowDate(row.querySelector(".unloadingDate").value) ?? null;

        const rowNo = Number(row.dataset.row);

        // Shorthand for reading this row's inputs as text or as a number
        const text = selector => row.querySelector(selector).value;
        const number = selector => parseDecimalInput(text(selector));

        details.push({
            rowNo,

            // Kept on the row element because they have no input on the screen
            dailyReportNo: row.dataset.dailyReportNo ?? "",
            dailyReportRowNo: Number(row.dataset.dailyReportRowNo ?? 0),

            supplierCode,
            supplierName: text(".supplierCmbValue"),

            loadingDate,
            loadingNotes: text(".loadingNotes"),
            unloadingDate,
            unloadingNotes: text(".unloadingNotes"),

            departureCode: text(".departureCmbKey"),
            departureName: text(".departureCmbValue"),
            departureAddress: text(".departureNotes"),

            arrivalCode: text(".arrivalCmbKey"),
            arrivalName: text(".arrivalCmbValue"),
            arrivalAddress: text(".arrivalNotes"),

            productCode: text(".productCmbKey"),
            productName: text(".productCmbValue"),
            productType: text(".productNotes"),

            quantity: number(".quantity"),
            weight: number(".weight"),

            billingUnitCode: text(".billCmbKey"),
            billingUnitName: text(".billCmbValue"),
            billingUnitPrice: number(".unitBill"),
            freightCharge: number(".fCharge"),
            surcharge: number(".sCharge"),
            tollCharge: number(".tCharge"),

            paymentUnitCode: text(".payCmbKey"),
            paymentUnitName: text(".payCmbValue"),
            paymentUnitPrice: number(".unitPay"),
            freightPay: number(".fPay"),
            surchargePay: number(".sPay"),
            tollPay: number(".tPay"),

            driverCode: text(".driverCode"),
            driverName: text(".driverName"),
            driverContact: text(".driverContact"),

            vehicleCode: text(".vehicleCode"),
            vehicleNumber: text(".vehicleNumber"),
            vehicleTypeCode: text(".vehicleCmbKey"),
            vehicleTypeName: text(".vehicleCmbValue"),

            charteredVehicleCode: text(".cVehicleCode"),
            charteredVehicleName: text(".cVehicleNumber"),

            // The 実運 input holds 実運送会社, stored in 孫請傭車名 (legacy TxtYYoshaNm)
            subcontractedVehicleName: text(".actualMileage"),

            departureAdminName: text(".dAdminName"),
            departureAdminPhone: text(".dAdminNumber"),
            arrivalAdminName: text(".aAdminName"),
            arrivalAdminPhone: text(".aAdminNumber"),

            internalNotes: text(".internalNoteComments"),
            reportNotes: text(".reportNoteComments")
        });
    }

    return {
        orderNo: document.getElementById("voucherNumber").value,
        orderDate,
        branchCode: document.getElementById("depCmbKey").value,
        branchName: document.getElementById("depCmbValue").value,
        isNew: isNewRecord,
        details
    };
}

// Converts a typed date for the server. Accepts yyyy-MM-dd and yyyy/MM/dd.
// Returns yyyy-MM-dd, null when empty, or undefined when the value is not a real date, such as 2026-02-30.
function parseDateInput(value) {

    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    const match = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);

    if (!match) {
        return undefined;
    }

    const isoDate = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
    const date = new Date(`${isoDate}T00:00:00`);

    return date.getMonth() + 1 === Number(match[2]) && date.getDate() === Number(match[3])
        ? isoDate
        : undefined;
}

// Removes thousands separators. Returns null when the value is not a number.
function parseDecimalInput(value) {

    const parsed = parseFloat(value.replace(/,/g, ""));

    return isNaN(parsed) ? null : parsed;
}

// =========================================
//                RowAdd (F2)
// =========================================

// Inserts a blank row at the current row and pushes the rows below it down.
// Row 99 drops off the end and nothing is saved until F1 (legacy InsertAt) is clicked.
async function addRow() {

    if (!currentRow) {
        alert("対象行に移動してから行って下さい。");
        return;
    }

    const targetRow = currentRow;
    const position = targetRow.dataset.row;

    if (await confirmOnRow(targetRow, "対象行に新規行を挿入してもよろしいですか？")) {

        const rowWrappers = document.querySelectorAll(".informationGrids");
        const lastWrapper = rowWrappers[rowWrappers.length - 1];

        clearRow(lastWrapper.querySelector(".infoGrid"));

        // On row 99 the row being cleared is the target itself, so it stays in place
        if (lastWrapper !== targetRow.parentElement) {
            targetRow.parentElement.before(lastWrapper);
        }

        // not a change on its own (legacy sets no Chg_Flg)
        renumberRows();
    }

    focusRow(position);
}

// =========================================
//               RowDelete (F3)
// =========================================

// Removes the current row, pulls the rows below it up and adds a blank row at the end.
// Nothing is saved until F1 (legacy DeleteAt).
async function deleteRow() {

    if (!currentRow) {
        alert("対象行に移動してから行って下さい。");
        return;
    }

    const targetRow = currentRow;
    const position = targetRow.dataset.row;

    if (await confirmOnRow(targetRow, "対象行を削除してもよろしいですか？")) {

        const wrapper = targetRow.parentElement;

        clearRow(targetRow);
        wrapper.parentElement.append(wrapper);

        // not a change on its own (legacy sets no Chg_Flg)
        renumberRows();
    }

    focusRow(position);
}

// Highlights the row while asking for confirmation (legacy Gyo_Color).
async function confirmOnRow(row, message) {

    row.classList.add("row-target");

    // confirm() blocks rendering, so let the highlight paint first
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)));

    const confirmed = confirm(message);

    row.classList.remove("row-target");

    return confirmed;
}

// Enables the function keys that depend on where focus is (legacy GotFocus handlers):
//   F2/F3/F10: enabled in a row, disabled in the header.
//   F6: enabled only in a code input listed in masterSearchInputs.
// Focus on the footer buttons changes nothing, so a button stays usable after it is clicked.
function trackCurrentRow(event) {

    const target = event.target;
    const row = target.closest(".infoGrid");

    if (!row && !target.closest("#firstSection")) {
        return;
    }

    // The 名称 boxes cannot get focus in legacy (TabStop = False), so they never pick the row
    if (target.readOnly) {
        return;
    }

    currentRow = row;

    document.getElementById("btnAddRow").disabled = !row;
    document.getElementById("btnDeleteRow").disabled = !row;
    document.getElementById("btnCopy").disabled = !row;

    if (target.matches("input")) {
        document.getElementById("btnF6").disabled = !target.matches(masterSearchInputs);

        if (target.matches(masterSearchInputs)) {
            masterSearchTarget = target;
        }
    }
}

// Sets row numbers to match the on-screen order after F2/F3 move a row. Save uses these numbers as 受注行NO.
function renumberRows() {

    document
        .querySelectorAll(".infoGrid")
        .forEach((row, index) => {
            row.dataset.row = index + 1;
            row.querySelector(".rowNumber").textContent = index + 1;
        });
}

// Moves focus to the 荷主 code of the given row number (legacy TxtUserCd.Focus).
function focusRow(rowNo) {

    document
        .querySelector(`.infoGrid[data-row="${rowNo}"] .supplierCmbKey`)
        .focus();

    // The 荷主 may already have had focus while the row changed under it
    syncAcceptedCode();
}


// =========================================
//               Delete (F4)
// =========================================

// Deletes the whole voucher and all its rows after confirmation, then clears the screen (legacy Data_Del).
// A new voucher has nothing in the database to delete.
async function deleteOrderEntryData() {

    if (isNewRecord) {
        alert("対象伝票は登録されていません！！\n中止ﾎﾞﾀﾝを押して下さい");
        return;
    }

    const orderDateInput = document.getElementById("orderDate");

    // Every row turns pink while it asks (legacy Gyo_ColorAll(1)), then goes back
    const rows = document.querySelectorAll(".infoGrid");
    rows.forEach(row => row.classList.add("row-target"));

    // confirm() blocks rendering, so let the highlight paint first
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)));

    const confirmed = confirm("削除してもよろしいですか？");

    rows.forEach(row => row.classList.remove("row-target"));

    if (!confirmed) {
        orderDateInput.focus();
        return;
    }

    const orderNo = document.getElementById("voucherNumber").value;

    const response = await fetch(`/OrderEntry/Delete?orderNo=${encodeURIComponent(orderNo)}`, {
        method: "POST",
        headers: {
            "RequestVerificationToken": getAntiForgeryToken()
        }
    });

    if (!response.ok) {
        alert("削除に失敗しました！！");
        orderDateInput.focus();
        return;
    }

    // focuses 受注日
    await resetToNewVoucher();
}

// =========================================
//            VoucherSearch (F5)
// =========================================
// Opens the order search (legacy FrmDsp_Juchu). A picked voucher is loaded without the change question (legacy Data_Dsp);
// after a pick or a cancel the focus goes to 受注日.

// True while the order search was opened by F5 of this screen; the picked 受注NO until it closes
let voucherSearchOpen = false;
let pickedVoucherNo = null;

 
// Above commented for adding below one to pass depCmbKey(branchCode)
function openVoucherSearch() {

    const branchCode = document.getElementById("depCmbKey")?.value.trim();

    //if (!branchCode) {
    //    alert("自社支店を入力してください！！");
    //    document.getElementById("depCmbKey")?.focus();
    //    return;
    //}

    voucherSearchOpen = true;
    pickedVoucherNo = null;

    document.dispatchEvent(
        new CustomEvent("openOrderSearchPopup", {
            detail: {
                branchCode: branchCode
            }
        })
    );
}

// =========================================
//            MasterSearch (F6)
// =========================================
// Opens the search of the code input F6 is for (legacy Seek_Para). A pick sets the code and commits it as Enter does
// (legacy commitFlg), so it is looked up and the focus moves on; a cancel puts the focus back on the code.
// The search popups are the ones the masters use; each tells its pick with its own event.
const masterSearches = {
    branch:    { open: "openCompanyBranchSearchPopup",     selected: "company-branch-search-selected",     code: d => d.companyCode },
    shipper:   { open: "openMasterShipperSearchPopup",     selected: "master-shipper-search-selected",     code: d => d.code },
    place:     { open: "openOriginDestinationSearchPopup", selected: "origin-destination-search-selected", code: d => d.originDestinationCode },
    product:   { open: "openProductNameSearchPopup",       selected: "product-name-search-selected",       code: d => d.code },
    driver:    { open: "openDriverSearchPopup",            selected: "driver-search-selected",             code: d => d.driverCode },
    vehicle:   { open: "openVehicleSearchPopup",           selected: "vehicle-search-selected",            code: d => d.vehicleCode },
    chartered: { open: "openCharteredSearchPopup",         selected: "chartered-search-selected",          code: d => d.charteredCode },
    unit:      { open: "openUnitSearchPopup",              selected: "unit-search-selected",               code: d => d.code }
};

// The search open now: { target, search, picked }, or null
let masterSearchOpen = null;

function openMasterSearch() {

    const target = masterSearchTarget;
    const field = lookupFieldOf(target);
    const search = field && masterSearches[field.type];

    if (!search || masterSearchOpen || lookupInProgress || pricingInProgress) {
        return;
    }

    // 発着地 registered per 荷主 need the row's 荷主 (legacy Seek_Para, Kanri_PLKbn = 0)
    if (field.type === "place"
        && document.getElementById("scrollArea")?.dataset.placeByShipper === "1"
        && !target.closest(".infoGrid").querySelector(".supplierCmbKey").value) {

        alert("荷主が未指定の為、検索出来ません！！");
        target.focus();
        return;
    }

    const openBefore = new Set(document.querySelectorAll(".is-open"));

    masterSearchOpen = { target, search, picked: null };

    // On a new voucher only the masters still in use (legacy SelMX = "9");
    // the 荷主, 車輌, 運転手 and 傭車 searches read this
    //document.dispatchEvent(new CustomEvent(search.open, { detail: { activeOnly: isNewRecord } }));

    // On a new voucher only the masters still in use (legacy SelMX = "9").
    const detail = {
        activeOnly: isNewRecord
    };

    // Pass the current row's 荷主 when opening 発地 / 着地 search.
    if (field.type === "place") {

        const row = target.closest(".infoGrid");

        detail.shipperCode =
            row?.querySelector(".supplierCmbKey")?.value?.trim() ?? "";

        detail.shipperName =
            row?.querySelector(".supplierCmb")?.value?.trim() ?? "";
    }

    document.dispatchEvent(
        new CustomEvent(search.open, { detail })
    );

    // The popup closes by itself after a pick, a cancel or ×; it is watched to know when
    const popup = Array.from(document.querySelectorAll(".is-open")).find(element => !openBefore.has(element));

    if (!popup) {
        masterSearchOpen = null;
        return;
    }

    new MutationObserver((mutations, observer) => {
        if (!popup.classList.contains("is-open")) {
            observer.disconnect();

            // Let the popup finish its own close (some move the focus) first
            setTimeout(finishMasterSearch);
        }
    }).observe(popup, { attributes: true, attributeFilter: ["class"] });
}

async function finishMasterSearch() {

    const { target, picked } = masterSearchOpen;

    masterSearchOpen = null;

    // Focus first, so the code it has now is the accepted one, then the pick is committed like a typed code
    target.focus();

    if (!picked) {
        return;
    }

    target.value = String(picked);
    codeTyped = true;

    if (await commitLookup(target) && document.activeElement === target) {
        focusNextInput(target);
    }
}

// The F5 and F6 popups tell their pick with an event before they close
function initializeSearchResults() {

    document.addEventListener("order-search-selected", event => {
        if (voucherSearchOpen) {
            pickedVoucherNo = event.detail?.orderNo ?? null;
        }
    });

    document.addEventListener("order-search-closed", () => {

        if (!voucherSearchOpen) {
            return;
        }

        const orderNo = pickedVoucherNo;

        voucherSearchOpen = false;
        pickedVoucherNo = null;

        setTimeout(() => {
            if (orderNo) {
                loadVoucher(orderNo);
            } else {
                document.getElementById("orderDate").focus();
            }
        });
    });

    Object.values(masterSearches).forEach(search => {
        document.addEventListener(search.selected, event => {
            if (masterSearchOpen?.search === search) {
                masterSearchOpen.picked = search.code(event.detail ?? {}) ?? null;
            }
        });
    });
}

// ================================================
//      ForwardNavigation(NextCodeData) (F8)
// ================================================
// Loads the voucher after the one on screen. If there is none, the screen stays as it is and the message is shown.
async function loadNextOrder() {
    await loadNeighbourOrder("GetNextOrder", "次の伝票はありません！！");
}
// =======================================================
//       BackwardNavigation(PreviousCodeData) (F7)
// =======================================================
// Loads the voucher before the one on screen. If there is none, the screen stays as it is and the message is shown.
async function loadPreviousOrder() {
    await loadNeighbourOrder("GetPreviousOrder", "前の伝票はありません！！");
}

// F7 / F8: the focus goes to 受注日 afterwards, found or not, and the grid is back at row 1 (legacy Body.Clear)
async function loadNeighbourOrder(action, noneMessage) {

    if (!confirmDiscardChanges()) {
        return;
    }

    const orderNo = document.getElementById("voucherNumber").value;

    const response = await fetch(`/OrderEntry/${action}?orderNo=${encodeURIComponent(orderNo)}`);

    if (response.ok) {
        const model = await response.json();

        clearDetailRows();
        loadScreenData(model);
        document.getElementById("scrollArea").scrollTop = 0;
    } else {
        alert(noneMessage);
    }

    document.getElementById("orderDate").focus();
}
// =========================================
//                 Copy (F10)
// =========================================

// F10 has two steps, shown on the button: the first press remembers the current row,
// and the next press pastes it onto the row then in focus (legacy Fkey case 10).
async function copyOrPasteRow() {

    if (!currentRow) {
        alert("対象行に移動してから行って下さい。");
        return;
    }

    const targetRow = currentRow;
    const position = targetRow.dataset.row;

    if (copySourceRowNo === null) {

        // Only a row with a 荷主 counts as entered (legacy Chk_Copy)
        if (!targetRow.querySelector(".supplierCmbKey").value) {
            alert("対象行に入力されているものしかコピー出来ません！！");
        } else if (await confirmOnRow(targetRow, "対象行をコピーしてもよろしいですか？")) {
            copySourceRowNo = Number(position);
            document.getElementById("btnCopy").textContent = "F10:貼り付け";
        }

    } else if (copySourceRowNo === Number(position)) {

        alert("同一行には貼り付けが出来ません！！");

    } else if (await confirmOnRow(targetRow, "対象行に貼り付けをしてもよろしいですか？")) {

        pasteRow(document.querySelector(`.infoGrid[data-row="${copySourceRowNo}"]`), targetRow);

        clearCopySource();
        hasChanges = true;
    }

    focusRow(position);
}

// Overwrites the target row with the source row's inputs (legacy Gyo_Paste).
// The source is read now, not when F10 was first pressed, so edits made in between are included.
function pasteRow(sourceRow, targetRow) {

    const targetInputs = targetRow.querySelectorAll("input");

    sourceRow.querySelectorAll("input")
        .forEach((input, index) => {
            targetInputs[index].value = input.value;
            targetInputs[index].style.color = input.style.color;
        });

    // The pasted row is not on a daily report yet
    delete targetRow.dataset.dailyReportNo;
    delete targetRow.dataset.dailyReportRowNo;
}

// Forgets the copied row and puts the F10 label back.
function clearCopySource() {

    copySourceRowNo = null;
    document.getElementById("btnCopy").textContent = "F10:コピー";
}

// =========================================
//            Voucher Copy (伝票複写)
// =========================================

// Turns the voucher on screen into a new one: the rows and 自社支店 stay, and it gets a new number and current date.
// Nothing is saved until F1 is triggered, and the original voucher is not changed (legacy CmdCopy_Click, Dsp_ClrH, Dno_Def).
async function copyVoucher() {

    const response = await fetch("/OrderEntry/GetNewOrderNo");

    if (!response.ok) {
        alert("伝票番号の取得に失敗しました！！");
        return;
    }

    document.getElementById("voucherNumber").value = await response.json();

    // The rows keep their 日報NO and 日報行NO, as legacy Dsp_ClrH does not clear them
    setNewVoucherMode();

    // legacy Dsp_ClrH also turns F2 off (focus goes to 受注日, a header input)
    document.getElementById("btnAddRow").disabled = true;

    // the date rendered with the page
    const orderDateInput = document.getElementById("orderDate");
    setOrderDate(pageOrderDate);
    orderDateInput.focus();
}

// Switches the screen state to an unsaved new voucher.
function setNewVoucherMode() {

    isNewRecord = true;
    hasChanges = false;
    document.getElementById("mode-lbl").textContent = "新　規";

    // Nothing to delete or copy until the voucher is saved (legacy Dsp_Clr, Dsp_ClrH)
    document.getElementById("btnDelete").disabled = true;
    document.getElementById("btnCopyVoucher").disabled = true;
    clearCopySource();

    // a new voucher number can be typed (legacy TxtDno.ReadOnly = False)
    document.getElementById("voucherNumber").readOnly = false;
    applyColorCoding(document.getElementById("voucherNumber"), false);
}


// =========================================
//                Cancel (F11)
// =========================================

// Discards the screen after a warning if anything changed, and starts a new voucher.
// Nothing is saved or deleted in the database.
async function cancelOrderEntry() {

    if (!confirmDiscardChanges()) {
        return;
    }

    await resetToNewVoucher();
}

// Returns true when it is safe to leave the current screen contents: nothing changed, or the user agreed.
function confirmDiscardChanges() {

    return !hasChanges || confirm("内容が変更されております。よろしいですか？");
}

// Clears the screen for a new voucher with the latest number (legacy Dsp_Clr, Dno_Def).
// Used after save and delete as well as cancel.
async function resetToNewVoucher() {

    const response = await fetch("/OrderEntry/GetNewOrderNo");

    if (!response.ok) {
        // alert("伝票番号の取得に失敗しました！！");
        return;
    }

    document.getElementById("voucherNumber").value = await response.json();

    clearDetailRows();
    document.getElementById("scrollArea").scrollTop = 0;

    // defaultValue is the default 自社支店 rendered with the page
    for (const id of ["depCmbKey", "depCmbValue"]) {
        const input = document.getElementById(id);
        input.value = input.defaultValue;
    }

    setNewVoucherMode();

    const orderDateInput = document.getElementById("orderDate");
    setOrderDate(newVoucherDate);
    orderDateInput.focus();
}

// =======================================================
//      受注日 (legacy TxtJDate: F_Date3 by DINPUT_Chk)
// =======================================================
// Typed slot by slot like the legacy GcDate (date_slots.js), in the format of the 和西暦 setting:
//     西暦  2026年11月16日        和暦  令和 08年11月16日
// The date itself is kept in dataset.actualValue as yyyy-MM-dd, which is what is saved;
// dataset.shownDate is the kept date (legacy .Tag). Space opens the calendar (japanesecalendar.js).

// today's date rendered with the page (used again by 伝票複写)
let pageOrderDate = "";

// legacy MinDate / MaxDate of TxtJDate; a date outside is not taken (MaxMinBehavior.Keep)
const ORDER_DATE_MIN = "2000-01-01";
const ORDER_DATE_MAX = "2050-12-31";

function orderDateFormat() {
    return DateSlots.isEra() ? "ggg ee年MM月dd日" : "yyyy年MM月dd日";
}

function initializeOrderDate() {

    const input = document.getElementById("orderDate");

    pageOrderDate = input.dataset.actualValue ?? "";

    DateSlots.attach(input, orderDateFormat());

    // the calendar's own text (japanesecalendar.js) follows the setting too
    input.dataset.noEra = DateSlots.isEra() ? "false" : "true";

    setOrderDate(pageOrderDate);

    // legacy GotFocus: LblMessage.Text = DINPUT_Mess
    input.addEventListener("focus", showDateHint);

    // legacy LostFocus: a typed date is taken; part-filled, impossible, out of range or empty puts the kept date back
    input.addEventListener("blur", () => {
        readTypedOrderDate();
        setMessage("");
    });

    // a date picked in the calendar (it sets data-actual-value and its own text without an input event)
    new MutationObserver(() => {
        const picked = input.dataset.actualValue ?? "";
        const kept = input.dataset.shownDate ?? "";

        if (picked === kept) {
            return;
        }

        if (picked >= ORDER_DATE_MIN && picked <= ORDER_DATE_MAX) {
            setOrderDate(picked);
            hasChanges = true;
        } else {
            setOrderDate(kept);
        }
    }).observe(input, { attributes: true, attributeFilter: ["data-actual-value"] });
}

// show a yyyy-MM-dd date (or a stored date with a time) in the box; it becomes the kept date
function setOrderDate(value) {

    const input = document.getElementById("orderDate");
    const date = String(value ?? "").substring(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        input.dataset.shownDate = "";
        delete input.dataset.actualValue;
        DateSlots.show(input, "");
        return;
    }

    // shownDate first, so the calendar observer sees nothing to take
    input.dataset.shownDate = date;
    input.dataset.actualValue = date;
    DateSlots.show(input, date);
}

// the date to save: yyyy-MM-dd, or null when there is none
function getOrderDate() {

    readTypedOrderDate();

    return document.getElementById("orderDate").dataset.actualValue || null;
}

// the date typed in the box: a good date in 2000-2050 is taken (a new one is a change, legacy Chg_Flg);
// anything else puts the kept date back (legacy Err_Exit2: TxtJDate.Text = TxtJDate.Tag)
function readTypedOrderDate() {

    const input = document.getElementById("orderDate");
    const kept = input.dataset.shownDate ?? "";
    const { date } = DateSlots.read(input);

    if (date && date >= ORDER_DATE_MIN && date <= ORDER_DATE_MAX) {
        if (date !== kept) {
            hasChanges = true;
        }
        setOrderDate(date);
    } else {
        setOrderDate(kept);
    }
}

// ==========================================================================================
//      積日 / 卸日 (legacy row format: 和暦 gee/MM/dd → R08/11/16, 西暦 yy/MM/dd → 26/11/16)
// ==========================================================================================

// The row date box works like the legacy GcDate (UC_JuchuGyo Date_InputSet: F_Date by DINPUT_Chk); the slot typing is date_slots.js:
//   - empty shows ___/__/__ (西暦 __/__/__), typing fills the slots and jumps over the "/",
//   - in 和暦 the era slot takes M T S H R or 0-4 (明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]).
// This screen adds:
//   - leaving with a part-filled, impossible or out of range date puts back the date it had (legacy Err_Exit: Value = mry(Gyo).HDate),
//   - Space opens the calendar (legacy DropDownCalendar). The box is a jp-calendar-input for japanesecalendar.js,
//     with its date kept in data-actual-value; a picked date is shown back as R08/11/16, not as the calendar's own text.
function rowDateFormat() {
    return DateSlots.isEra() ? "gee/MM/dd" : "yy/MM/dd";
}

// a stored date (yyyy-MM-dd, with or without a time) → R08/11/16 (西暦 26/11/16)
function formatRowDate(value) {
    return DateSlots.format(value, rowDateFormat());
}

// a row date as shown or typed (R08/11/16, 26/11/16, 20261116, 2026-11-16, 令和 08年11月16日)
// → yyyy-MM-dd, null when empty, undefined when it is not a date
function parseRowDate(text) {

    const trimmed = String(text ?? "").trim();

    // the empty box while it has focus
    if (trimmed === "" || trimmed === DateSlots.mask(rowDateFormat())) {
        return null;
    }

    return DateSlots.parseLoose(trimmed, false) || undefined;
}

// legacy MinDate / MaxDate
const ROW_DATE_MIN = "2010-01-01";
const ROW_DATE_MAX = "2050-12-31";

function isRowDateInput(element) {
    return element?.matches?.(".loadingDate, .unloadingDate") ?? false;
}

// legacy GotFocus of a date box: LblMessage.Text = DINPUT_Mess (the era hint in 和暦, nothing in 西暦)
function showDateHint() {
    setMessage(DateSlots.isEra() ? DateSlots.ERA_HINT : "");
}

function initializeRowDates() {

    document.querySelectorAll(".loadingDate, .unloadingDate").forEach(input => {

        // slot typing, ___/__/__ when empty, Space left to the calendar (date_slots.js)
        DateSlots.attach(input, rowDateFormat());

        // Space opens the calendar (japanesecalendar.js binds every .jp-calendar-input when it starts)
        input.classList.add("jp-calendar-input");
        input.dataset.noEra = DateSlots.isEra() ? "false" : "true";
        input.dataset.showDay = "true";
    });

    // a date picked in the calendar: the calendar writes data-actual-value and its own text (令和 08年11月16日 / 2026年11月16日)
    new MutationObserver(mutations => {
        for (const { target: input } of mutations) {
            if (isRowDateInput(input) && input.value !== "" && !DateSlots.inShape(input.value, rowDateFormat())) {
                takePickedRowDate(input);
            }
        }
    }).observe(document.getElementById("scrollArea") ?? document.body, { subtree: true, attributes: true, attributeFilter: ["data-actual-value"] });

    document.addEventListener("focusin", event => {

        const input = event.target;

        if (!isRowDateInput(input)) {
            return;
        }

        // the date the box goes back to when the typed one is not a date
        input.dataset.goodDate = parseRowDate(input.value) || "";

        // the calendar opens on this date (today when empty)
        setRowCalendarDate(input, input.dataset.goodDate);

        // legacy GotFocus: LblMessage.Text = DINPUT_Mess
        showDateHint();
    });

    // typing, Backspace / Delete, paste and the ___/__/__ shape are date_slots.js;
    // a pasted or typed date outside 2010-2050 is put back when the box is left (below)

    document.addEventListener("focusout", event => {

        const input = event.target;

        if (!isRowDateInput(input)) {
            return;
        }

        const goodDate = input.dataset.goodDate ?? "";
        let date = parseRowDate(input.value);

        // the era has to match the date too (R01/01/01 is H31/01/01), and legacy only takes 2010 to 2050
        const isDate = date === goodDate || (date && formatRowDate(date) === input.value && date >= ROW_DATE_MIN && date <= ROW_DATE_MAX);

        if (date === null) {
            date = "";
        }
        else if (!isDate) {
            date = goodDate;
        }

        input.value = formatRowDate(date);
        input.dataset.goodDate = date;
        setRowCalendarDate(input, date);

        // legacy LostFocus: Chg_Flg when the date changed
        if (date !== goodDate) {
            hasChanges = true;
        }

        setMessage("");
    });
}

// keeps data-actual-value (the date the calendar shows as selected) in step with the box
function setRowCalendarDate(input, date) {

    if (date) {
        input.dataset.actualValue = date;
    }
    else {
        delete input.dataset.actualValue;
    }
}

// A date picked in the calendar. Clicking the calendar has already taken focus from the box, so the box was checked
// against the date it had; the pick is checked the same way (2010 to 2050), shown as R08/11/16 and focus goes back to the box.
function takePickedRowDate(input) {

    const goodDate = input.dataset.goodDate ?? "";
    const picked = input.dataset.actualValue ?? "";
    const date = picked >= ROW_DATE_MIN && picked <= ROW_DATE_MAX ? picked : goodDate;

    input.value = formatRowDate(date);
    input.dataset.goodDate = date;
    setRowCalendarDate(input, date);

    if (date !== goodDate) {
        hasChanges = true;
    }

    input.focus();
}

function validDate(year, month, day) {

    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// =========================================
//            Other Functions
// =========================================
// All numeric input restriction, for the header inputs and the matching input in all 99 rows.
function InputToNumOnly() {

    restrictAllNumeric("#depCmbKey", 2);
    restrictAllNumeric("#voucherNumber", 10);

    restrictAllNumeric(".supplierCmbKey", 10);
    restrictAllNumeric(".departureCmbKey", 10);
    restrictAllNumeric(".arrivalCmbKey", 10);
    restrictAllNumeric(".productCmbKey", 10);

    restrictAllNumeric(".billCmbKey", 1);
    restrictAllNumeric(".payCmbKey", 1);

    restrictAllNumeric(".driverCode", 10);

    restrictAllNumeric(".vehicleCode", 10);
    restrictAllNumeric(".cVehicleCode", 10);

    // 運転手電話 / 発地担当電話 / 着地担当電話: legacy Format "#" takes digits and symbols (090-1234-0000)
    restrictPhoneInput(".driverContact", 16);
    restrictPhoneInput(".dAdminNumber", 16);
    restrictPhoneInput(".aAdminNumber", 16);
}

// Half-width digits and - + ( ) . , only; full-width ones are made half-width, anything else is dropped.
function restrictPhoneInput(selector, maxLength) {

    const clean = input => {
        input.value = input.value
            .replace(/[！-～]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
            .replace(/[ー−]/g, "-")
            .replace(/[^0-9\-+().,]/g, "")
            .substring(0, maxLength);
    };

    document.querySelectorAll(selector).forEach(input => {
        input.addEventListener("input", event => {
            if (!event.isComposing) {
                clean(input);
            }
        });
        input.addEventListener("compositionend", () => clean(input));
    });
}

// =========================================
//      車種: 運賃形態 list (legacy Frame1B)
// =========================================
// While 車種 has focus, the 運賃形態 codes 1 to 9 are shown beside it as code:name, the name cut to 10 bytes (legacy Set_Ini).
// it is a small list view with list of vehicles when 車種(code) is in focus

function initializeVehicleTypeList() {

    const list = document.getElementById("vehicleTypeList");

    if (!list) {
        return;
    }

    let shownFor = null;

    // Loaded once
    fetchJson("/OrderEntry/GetVehicleTypes").then(types => {
        list.textContent = (types ?? [])
            .map(type => `${type.vehicleTypeCode}:${leftBytes(type.vehicleTypeName ?? "", 10)}`)
            .join("\n");
    });

    const place = () => {
        if (!shownFor) {
            return;
        }

        // create a rectangle box for the data view
        const box = shownFor.getBoundingClientRect();

        list.style.left = `${box.right + 4}px`;
        list.style.top = `${box.top}px`;
    };

    // show when entring/focusing on code/key
    document.addEventListener("focusin", event => {
        if (event.target.matches?.(".vehicleCmbKey") && list.textContent !== "") {
            shownFor = event.target;
            list.hidden = false;
            place();
        }
    });

    // hide when exiting/not focusing on code/key
    document.addEventListener("focusout", event => {
        if (event.target === shownFor) {
            shownFor = null;
            list.hidden = true;
        }
    });

    document.getElementById("scrollArea")?.addEventListener("scroll", place);
    window.addEventListener("resize", place);
}

// The start of a text up to a number of bytes (full-width = 2), as legacy LeftB
function leftBytes(text, maxBytes) {

    let result = "";
    let bytes = 0;

    for (const ch of String(text)) {
        const size = /[\u0000-ÿ｡-ﾟ]/.test(ch) ? 1 : 2;

        if (bytes + size > maxBytes) {
            break;
        }

        result += ch;
        bytes += size;
    }

    return result;
}

// Applies the digits-only rule to every input matching the selector.
function restrictAllNumeric(selector, maxLength) {

    document
        .querySelectorAll(selector)
        .forEach(input => restrictNumericInput(input, maxLength));
}

// Shows a saved voucher from the server in edit mode (legacy Data_Dsp).
// Callers clear the grid first, because only rows present in the voucher are written here.
function loadScreenData(model) {

    isNewRecord = false;
    hasChanges = false;
    document.getElementById("mode-lbl").textContent = "修　正";

    // Only a saved voucher can be deleted or copied, and loading one cancels a row copy in progress (legacy Data_Dsp, Dsp_Clr)
    document.getElementById("btnDelete").disabled = false;
    document.getElementById("btnCopyVoucher").disabled = false;
    clearCopySource();

    // a loaded voucher keeps its number, shown pink by #voucherNumber[readonly] (legacy TxtDno.ReadOnly = True, BgColor3)
    document.getElementById("voucherNumber").readOnly = true;
    applyColorCoding(document.getElementById("voucherNumber"), true);

    document.getElementById("voucherNumber").value =
        model.orderNo ?? "";
    
    document.getElementById("depCmbKey").value =
        model.branchCode ?? "";
    
    document.getElementById("depCmbValue").value =
        model.branchName ?? "";

    console.log(model.orderDate);
    console.log(typeof model.orderDate);
    console.log(formatDate(model.orderDate));

    setOrderDate(formatDate(model.orderDate));

    // Detail Rows
    model.details.forEach(detail => {

        const row = document.querySelector(
            `.infoGrid[data-row="${detail.rowNo}"]`
        );

        if (!row)
            return;

        // No inputs on the screen, but these move with the row on F2/F3
        row.dataset.dailyReportNo = detail.dailyReportNo ?? "";
        row.dataset.dailyReportRowNo = detail.dailyReportRowNo ?? 0;

        //-----------------------------------
        // 荷主
        //-----------------------------------

        setValue(
            row,
            ".supplierCmbKey",
            detail.supplierCode
        );

        setValue(
            row,
            ".supplierCmbValue",
            detail.supplierName
        );

        //-----------------------------------
        // 積込
        //-----------------------------------

        setValue(
            row,
            ".loadingDate",
            formatRowDate(
                detail.loadingDate
            )
        );

        setValue(
            row,
            ".loadingNotes",
            detail.loadingNotes
        );

        //-----------------------------------
        // 荷卸
        //-----------------------------------

        setValue(
            row,
            ".unloadingDate",
            formatRowDate(
                detail.unloadingDate
            )
        );

        setValue(
            row,
            ".unloadingNotes",
            detail.unloadingNotes
        );

        //-----------------------------------
        // 発地
        //-----------------------------------

        setValue(
            row,
            ".departureCmbKey",
            detail.departureCode
        );

        setValue(
            row,
            ".departureCmbValue",
            detail.departureName
        );

        setValue(
            row,
            ".departureNotes",
            detail.departureAddress
        );

        //-----------------------------------
        // 着地
        //-----------------------------------

        setValue(
            row,
            ".arrivalCmbKey",
            detail.arrivalCode
        );

        setValue(
            row,
            ".arrivalCmbValue",
            detail.arrivalName
        );

        setValue(
            row,
            ".arrivalNotes",
            detail.arrivalAddress
        );

        //-----------------------------------
        // 品名
        //-----------------------------------

        setValue(
            row,
            ".productCmbKey",
            detail.productCode
        );

        setValue(
            row,
            ".productCmbValue",
            detail.productName
        );

        setValue(
            row,
            ".productNotes",
            detail.productType
        );

        //-----------------------------------
        // 数量
        //-----------------------------------

        setValue(
            row,
            ".quantity",
            detail.quantity
        );

        setValue(
            row,
            ".weight",
            detail.weight
        );

        //-----------------------------------
        // 請求
        //-----------------------------------

        setValue(
            row,
            ".billCmbKey",
            detail.billingUnitCode
        );

        setValue(
            row,
            ".billCmbValue",
            detail.billingUnitName
        );

        setValue(
            row,
            ".unitBill",
            detail.billingUnitPrice
        );

        setValue(
            row,
            ".fCharge",
            detail.freightCharge
        );

        setValue(
            row,
            ".sCharge",
            detail.surcharge
        );

        setValue(
            row,
            ".tCharge",
            detail.tollCharge
        );

        //-----------------------------------
        // 下払
        //-----------------------------------

        setValue(
            row,
            ".payCmbKey",
            detail.paymentUnitCode
        );

        setValue(
            row,
            ".payCmbValue",
            detail.paymentUnitName
        );

        setValue(
            row,
            ".unitPay",
            detail.paymentUnitPrice
        );

        setValue(
            row,
            ".fPay",
            detail.freightPay
        );

        setValue(
            row,
            ".sPay",
            detail.surchargePay
        );

        setValue(
            row,
            ".tPay",
            detail.tollPay
        );

        // 1,234.500 / 1,234.00 / 1,234, empty as 0
        showRowNumbers(row);

        //-----------------------------------
        // 運転手
        //-----------------------------------

        setValue(
            row,
            ".driverCode",
            detail.driverCode
        );

        setValue(
            row,
            ".driverName",
            detail.driverName
        );

        setValue(
            row,
            ".driverContact",
            detail.driverContact
        );

        //-----------------------------------
        // 車番
        //-----------------------------------

        setValue(
            row,
            ".vehicleCode",
            detail.vehicleCode
        );

        setValue(
            row,
            ".vehicleNumber",
            detail.vehicleNumber
        );

        setValue(
            row,
            ".vehicleCmbKey",
            detail.vehicleTypeCode
        );

        setValue(
            row,
            ".vehicleCmbValue",
            detail.vehicleTypeName
        );

        //-----------------------------------
        // 傭車
        //-----------------------------------

        setValue(
            row,
            ".cVehicleCode",
            detail.charteredVehicleCode
        );

        setValue(
            row,
            ".cVehicleNumber",
            detail.charteredVehicleName
        );

        // 実運送会社 (legacy TxtYYoshaNm)
        setValue(
            row,
            ".actualMileage",
            detail.subcontractedVehicleName
        );

        //-----------------------------------
        // 発地担当
        //-----------------------------------

        setValue(
            row,
            ".dAdminName",
            detail.departureAdminName
        );

        setValue(
            row,
            ".dAdminNumber",
            detail.departureAdminPhone
        );

        //-----------------------------------
        // 着地担当
        //-----------------------------------

        setValue(
            row,
            ".aAdminName",
            detail.arrivalAdminName
        );

        setValue(
            row,
            ".aAdminNumber",
            detail.arrivalAdminPhone
        );

        //-----------------------------------
        // 備考
        //-----------------------------------

        setValue(
            row,
            ".internalNoteComments",
            detail.internalNotes
        );

        setValue(
            row,
            ".reportNoteComments",
            detail.reportNotes
        );

    });

    console.log(model.details);

    syncAcceptedCode();
}

// Sets an input inside the given row, showing null values from the server as empty.
function setValue(parent, selector, value) {

    const control = parent.querySelector(selector);

    if (control) {
        control.value = value ?? "";
    }
}

// Cuts a server date such as 2026-11-05T00:00:00 down to yyyy-MM-dd for display. Empty stays empty.
function formatDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    return dateValue.substring(0, 10);
}

// Empties every row in the grid.
function clearDetailRows() {

    document
        .querySelectorAll(".infoGrid")
        .forEach(clearRow);

    syncAcceptedCode();
}

// Empties one row, including the 日報 values stored on the row element.
function clearRow(row) {

    row.querySelectorAll("input")
        .forEach(input => {

            if (
                input.type !== "hidden"
            ) {
                input.value = "";

                // Negative decimals are shown in red
                input.style.color = "";
            }
        });

    // legacy Clear: the number boxes are 0, not empty
    showRowNumbers(row);

    delete row.dataset.dailyReportNo;
    delete row.dataset.dailyReportRowNo;
}

// =========================================
//      Row numbers (数量, 重量, 単価, 運賃, 割増, 高速)
// =========================================
// Legacy GcNumber boxes always show a number: 0.000 / 0.00 / 0 when empty (UC_JuchuGyoList.Clear),
// and leaving a box empty puts 0 back (LostFocus stores Nothing as 0, then Err_Exit shows it).
const ROW_NUMBER_INPUTS = ".quantity, .weight, .unitBill, .fCharge, .sCharge, .tCharge, .unitPay, .fPay, .sPay, .tPay";

// shows every number box of the row in its format (comma, decimals, red when negative), empty as 0
function showRowNumbers(row) {

    row.querySelectorAll(ROW_NUMBER_INPUTS)
        .forEach(input => showNumber(input, parseDecimalInput(input.value) ?? 0));
}

function initializeRowNumbers() {

    document.querySelectorAll(".infoGrid").forEach(showRowNumbers);

    document.querySelectorAll(ROW_NUMBER_INPUTS)
        .forEach(input => {
            input.addEventListener("blur", () => {
                if (input.value.trim() === "") {
                    showNumber(input, 0);
                }
            });
        });
}

// Footer message shown when the 荷主 code is clicked.
function showSupplierCodeKeyMessage() {
    setMessage(`[HOME]キーにて上段コピー`);
}

// Loads the voucher chosen in the order search (F5). The search lists rows, so a row suffix such as -01 is dropped.
// Not found shows 指定した伝票は未登録です。 and the screen stays; the focus goes to 受注日 either way.
async function loadVoucher(searchedOrderNo) {

    const orderDateInput = document.getElementById("orderDate");
    const orderNo = String(searchedOrderNo ?? "").split("-")[0].trim();

    if (orderNo && !await showVoucher(orderNo)) {
        alert("指定した伝票は未登録です。");
    }

    orderDateInput.focus();
}

// Shows a saved voucher (legacy Data_Dsp). Returns false when it is not registered.
async function showVoucher(orderNo) {

    const response = await fetch(`/OrderEntry/GetByOrderNo?orderNo=${encodeURIComponent(orderNo)}`);

    if (!response.ok) {
        return false;
    }

    const model = await response.json();

    clearDetailRows();
    loadScreenData(model);
    document.getElementById("scrollArea").scrollTop = 0;

    return true;
}

// =========================================
//      伝票番号 (legacy TxtDno_LostFocus)
// =========================================
// Enter: the number is zero-padded; blank stays, the same number goes on to 受注日, another number opens that voucher.
// A number not registered shows 指定した伝票は未登録です。 and clears to a new voucher with the next number (Dsp_Clr + Dno_Def).
function initializeVoucherNumber() {

    const input = document.getElementById("voucherNumber");
    const orderDateInput = document.getElementById("orderDate");

    // The number the box had when it got focus
    let keptOrderNo = input.value;

    input.addEventListener("focus", () => {
        keptOrderNo = input.value;
    });

    input.addEventListener("keydown", async event => {

        if (event.key !== "Enter") {
            return;
        }

        event.preventDefault();

        if (lookupInProgress || pricingInProgress) {
            return;
        }

        const orderNo = zeroPad(input.value.trim(), 10);
        input.value = orderNo;

        if (orderNo === "") {
            return;
        }

        if (orderNo === keptOrderNo) {
            orderDateInput.focus();
            return;
        }

        if (await showVoucher(orderNo)) {
            orderDateInput.focus();
            return;
        }

        alert("指定した伝票は未登録です。");

        await resetToNewVoucher();

        keptOrderNo = input.value;
        input.focus();
    });
}