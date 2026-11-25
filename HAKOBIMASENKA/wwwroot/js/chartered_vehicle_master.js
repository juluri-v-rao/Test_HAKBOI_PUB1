/*
 * =========================================
 * Screen: Chartered Vehicle Master
 *
 * Navigation:
 *     Main Menu
 *         -> Basic Master
 *         -> Chartered Vehicle Master
 *
 * Migrated From: FrmM_Yosha.vb
 *
 * Functions:
 *              - Constants and Fields
 *              - Events
 *              - Helpers
 * Keys:
 *              - Save(F1)
 *              - Copy(F2)
 *              - Delete(F4)
 *              - Search(F5)
 *              - Master Search(F6)
 *              - LoadNextData(F7)
 *              - LoadPreviousData(F8)
 *              - List(F9)
 *              - Cancel(F11)
 *              - Exit(F12)
 *  
 * =========================================
 */

// =========================================
//              Screen State
// =========================================

const CODE_LENGTH = 10;
const BASE_URL = "/CharteredVehicleMaster";
const CHANGED_MESSAGE = "内容が変更されております。よろしいですか？";

let isNewRecord = true;     // legacy Sink_Flg
let isCopy = false;         // legacy Copy_Flg
let hasChanges = false;     // legacy Chg_Flg
let isBusy = false;         // a lookup, save or function key is running
let committingField = null; // field being committed with Enter / ↓
let committedField = null;  // field just committed; its focusout must not put the old value back

// True while a function key button is being clicked: the field keeps what was typed (legacy F-keys take no focus)
let footerPressed = false;

// 和暦 input is on (DateSlots.isEra(): 管理マスタ 01 和西暦 = 1, legacy DINPUT_Chk): dates show the era and the date hint is shown
let eraInput = false;

let defaults = {};
let units = [];
let paymentMethods = [];

// Last accepted value of each checked field (legacy .Tag).
// Leaving the field any way other than Enter / ↓ puts this value back.
const acceptedValues = new Map();

// Last field the user was in, for F6 and for returning focus after a button.
let lastField = null;

// F5/F6 === "load/settlement"
let searchPurpose = null;
let searchSelection = null;

// 支払履歴 / 買掛履歴 rows of the 傭車 on screen (legacy wk傭車支払履歴表示 / wk傭車買掛履歴表示).
// Kept in the browser until F1, newest 更新日 first.
const historyRows = { payment: [], payable: [] };

// =========================================
//          Screen Fields ↔ 傭車マスタ
// =========================================

const textFields = {
    傭車コード: "cvCode",
    傭車名1: "cvName1",
    傭車名2: "cvName2",
    ふりがな: "furigana",
    略称: "abbreviation",
    郵便: "postalCode",
    住所1: "address1",
    住所2: "address2",
    電話番号: "phoneNumber",
    FAX番号: "faxNumber",
    備考: "remarks",
    MAIL: "email",
    締め日: "closingDate",
    精算先コード: "settlementCode",
    精算区分: "settlementCategory",
    支払サイト: "paymentSite",
    支払日: "paymentDay",
    支払方法1: "paymentMethod1",
    支払方法2: "paymentMethod2",
    銀行名: "bankName",
    支店名: "bankBranchName",
    口座種別: "accountType",
    口座番号: "accountNumber",
    口座名義: "accountHolder",
    端数桁数: "fractionaldigits",
    下払端数: "roundingType",
    税区分: "taxCategory",
    税端数: "taxRounding",
    値引課税: "taxableSurcharge",
    値引非課税: "nonTaxableSurcharge",
    値引端数: "discountRounding",
    支払日設定: "paymentDaySetting",
    デジタココード: "digitalTachoCode"
};

const dateFields = {
    取引開始日: "transactionStartDate",
    取引終了日: "transactionEndDate"
};

// Checked = 表示しない / 計算しない ("1")
const checkboxFields = {
    単価表示: "hideUnitPrice",
    支払残計算: "noPaymentBalance",
    買掛残計算: "noPayableBalance"
};

const numberFields = {
    支払条件: "paymentCondition",
    値引率: "discountRate",
    数量小数点: "quantityDecimal",
    重量小数点: "weightDecimal",
    小数点: "unitPriceDecimal"
};

// id: [min, max, decimals] (legacy GcNumber ranges)
const numberRanges = {
    paymentCondition: [0, 999999999, 0],
    discountRate: [-99.99, 100, 2],
    quantityDecimal: [0, 3, 0],
    weightDecimal: [0, 3, 0],
    unitPriceDecimal: [0, 2, 0]
};

// Legacy MaxLength in bytes (full-width = 2).
const byteLimits = {
    cvName1: 30, cvName2: 30, furigana: 32, abbreviation: 16,
    address1: 32, address2: 32, phoneNumber: 15, faxNumber: 15,
    remarks: 50, email: 50, bankName: 20, bankBranchName: 20,
    accountNumber: 7, accountHolder: 30
};

// Half-width only (legacy Format "H"): full-width input is converted, what has no half-width form is dropped.
const halfWidthFields = ["furigana", "phoneNumber", "faxNumber", "email"];

// Digits only, with their maximum length.
const digitLimits = {
    cvCode: 10, closingDate: 2, settlementCode: 10, settlementCategory: 1,
    paymentSite: 1, paymentDay: 2, paymentMethod1: 2, paymentMethod2: 2,
    accountType: 1, fractionaldigits: 1, roundingType: 1, taxCategory: 1,
    taxRounding: 1, taxableSurcharge: 1, nonTaxableSurcharge: 1,
    discountRounding: 1, paymentDaySetting: 1,
    quantityDecimal: 1, weightDecimal: 1, unitPriceDecimal: 1,
    paymentCondition: 9, digitalTachoCode: 15
};

// Option boxes: allowed values and the legacy LostFocus message.
const optionFields = {
    accountType: [["0", "1"], "口座種別を正しく入力して下さい！！（0・1）"],
    fractionaldigits: [["0", "1", "2"], "端数桁数を正しく入力して下さい！！（0・1・2）"],
    roundingType: [["0", "1", "2"], "下払端数を正しく入力して下さい！！（0・1・2）"],
    taxCategory: [["0", "1", "2"], "消費税区分を正しく入力して下さい！！（0・1・2）"],
    taxRounding: [["0", "1", "2"], "消費税端数を正しく入力して下さい！！（0・1・2）"],
    taxableSurcharge: [["0", "1"], "課税割増を正しく入力して下さい！！（0・1）"],
    nonTaxableSurcharge: [["0", "1"], "非課税割増を正しく入力して下さい！！（0・1）"],
    discountRounding: [["0", "1", "2"], "値引端数を正しく入力して下さい！！（0・1・2）"],
    paymentDaySetting: [["0", "1", "2"], "支払日設定を正しく入力して下さい！！（0・1・2）"]
};

// Message line shown while a field has focus (legacy LblMessage).
const fieldHints = {
    closingDate: "末締めは『31』を入力",
    paymentDay: "月末支払は『31』を入力",
    paymentCondition: "入力可能範囲[ 0～999,999,999 ]",
    discountRate: "入力可能範囲[ -99.99～100.00 ]",
    quantityDecimal: "入力可能範囲[ 0～3 ]",
    weightDecimal: "入力可能範囲[ 0～3 ]",
    unitPriceDecimal: "入力可能範囲[ 0～2 ]"
};

// Checks run when a field is committed (Enter / Tab / ↓, or moving into the next field).
// Failing puts the accepted value back and keeps the cursor; fields without a check are always accepted.
const checkedFields = {
    cvCode: commitCode,
    cvName1: commitName,
    cvName2: commitName,
    furigana: field => field.value !== "",
    abbreviation: commitAbbreviation,
    postalCode: commitPostalCode,
    closingDate: checkClosingDate,
    settlementCode: checkSettlement,
    settlementCategory: checkSettlementCategory,
    paymentSite: checkPaymentSite,
    paymentDay: checkPaymentDay,
    paymentMethod1: field => checkPaymentMethod(field, "paymentMethod1Select"),
    paymentMethod2: field => checkPaymentMethod(field, "paymentMethod2Select"),
    historyPaymentMethod: field => checkPaymentMethod(field, "historyPaymentMethodSelect")
};

Object.keys(optionFields).forEach(id => {
    checkedFields[id] = checkOption;
});

// Picking a name in a list sets its code and goes on (legacy CmbTani / CmbSel / CmbSelX SelectedIndexChanged).
// The history 支払方法 goes to ↓ 修正.
const selectCodes = [
    ["settlementCategorySelect", "settlementCategory", "paymentSite"],
    ["paymentMethod1Select", "paymentMethod1", "paymentCondition"],
    ["paymentMethod2Select", "paymentMethod2", "bankName"],
    ["historyPaymentMethodSelect", "historyPaymentMethod", null]
];

// Legacy MinDate / MaxDate of the date boxes; a date outside is not taken (MaxMinBehavior.Keep).
// 取引開始日 (TxtDate0) starts in 1900; 取引終了日 and the history dates in 2000.
const DATE_RANGES = {
    transactionStartDate: ["1900-01-01", "2050-12-31"]
};
const DEFAULT_DATE_RANGE = ["2000-01-01", "2050-12-31"];

// =========================================
//         Initial Screen Load/Events
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

    // tab switch
    initializeTabs();

    initializeInputLimits();
    initializeEvents();
    initializeFunctionKeys();
    initializeHistory();
    initializeDateBoxes();

    // 和暦 / 西暦 of the whole application (legacy DINPUT_Chk, _Layout.cshtml)
    applyDateSetting(DateSlots.isEra());

    try {
        const data = await getJson(`${BASE_URL}/GetInitialData`);

        defaults = data.defaults ?? {};
        hideUnlicensedTabs();

        units = data.units ?? [];
        paymentMethods = data.paymentMethods ?? [];

        populateSelect("settlementCategorySelect", units);
        populateSelect("paymentMethod1Select", paymentMethods);
        populateSelect("paymentMethod2Select", paymentMethods);
        populateSelect("historyPaymentMethodSelect", paymentMethods);

        clearScreen();
        setGeneratedCode(data.nextCode ?? "");

    } catch (error) {
        alert(error.message);
    }

    focusField("cvCode");
});

function initializeEvents() {

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    // The change flag (legacy Chg_Flg) is set when a field is committed with a new value (acceptValue),
    // not on every key: a value put back on leaving is not a change.

    // A function key button keeps what was typed in the field (legacy F-keys take no focus).
    document.addEventListener("mousedown", event => {
        if (event.target.closest?.(".function-footer")) {
            event.preventDefault();        // the cursor stays in the field
            footerPressed = true;
            setTimeout(() => footerPressed = false);
        }
    }, true);

    // Option buttons: optionButton() (common_master.js) already set the value and moved on.
    // Like legacy LblXxx_Click (Lbl_Color2 sets Text and Tag) it becomes the kept value, with no change flag.
    document.addEventListener("click", event => {
        const button = event.target.closest?.(".select-option-btn");

        if (!button || !isOnScreen(button)) return;

        const input = button.closest(".option-button-group")?.querySelector("input");

        if (input) {
            acceptedValues.set(input, input.value);

            // legacy LblBKbn_Click → TxtBNo
            if (input.id === "accountType") {
                focusField("accountNumber");
            }
        }
    });

    // The picked code becomes the kept value, with no change flag (legacy sets only .Tag).
    selectCodes.forEach(([selectId, codeId, nextId]) => {

        getField(selectId)?.addEventListener("change", function () {
            setValue(codeId, this.value);
            acceptedValues.set(getField(codeId), this.value);

            if (nextId) {
                focusField(nextId);
            } else {
                historyButton("payment", "update").focus?.();
            }
        });
    });

    // 〒→住所 (legacy CmdPost opens a postal search first; here the typed code is used)
    getField("btnPostToAddress")?.addEventListener("click", () => showNAMessage());
    //{
    //     runAction(async () => {
    //         if (await fillAddress(true)) {
    //             focusField("address1");
    //         } else {
    //             focusField("postalCode");
    //         }
    //     });
    // });

    // 住所→〒 needs the address search screen, which is not migrated yet.
    getField("btnAddressToPost")?.addEventListener("click", () => showNAMessage());

    // F5 / F6 search popup
    document.addEventListener("chartered-search-selected", event => {
        searchSelection = event.detail ?? null;
    });

    document.addEventListener("chartered-search-closed", () => {
        const purpose = searchPurpose;
        const picked = searchSelection;

        searchPurpose = null;
        searchSelection = null;

        if (purpose) {
            // Let the popup finish closing before moving focus.
            setTimeout(() => runAction(() => afterSearch(purpose, picked)));
        }
    });
}

// =========================================
//              Function Keys
// =========================================
// The footer buttons are clicked; the keyboard's F1-F12 are not used on this screen for now.

const functionKeys = {
    F1: ["btnRegister", saveRecord],
    F2: ["btnCopy", copyRecord],
    F4: ["btnDelete", deleteRecord],
    F5: ["btnF5", openSearch],
    F6: ["btnF6", openSettlementSearch],
    F7: ["btnF7", () => moveRecord(-1)],
    F8: ["btnF8", () => moveRecord(1)],
    // F9 リスト: shown, disabled (not in this phase)
    F11: ["btnBack", cancelScreen],
    F12: ["btnExit", exitScreen]
};

function initializeFunctionKeys() {

    Object.values(functionKeys).forEach(([buttonId, action]) => {
        const button = getField(buttonId);

        button?.addEventListener("click", event => {
            event.preventDefault();
            runAction(action);
        });
    });
}

async function runAction(action) {
    if (isBusy) return;

    isBusy = true;

    try {
        await action();
    } catch (error) {
        alert(error.message);
    } finally {
        isBusy = false;
    }
}

// =========================================
//              Enter Navigation
// =========================================

async function onKeyDown(event) {

    const field = event.target;

    if (isPopupOpen() || !isOnScreen(field)) return;

    if (field.classList.contains("tab-button")) {
        onTabButtonKey(event, field);
        return;
    }

    if (!navigationList().includes(field)) return;

    // Esc closes an open calendar first
    if (event.key === "Escape" && isCalendarOpen()) return;

    const forward = event.key === "Enter" || event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey);
    const backward = event.key === "ArrowUp" || event.key === "Escape" || (event.key === "Tab" && event.shiftKey);

    if (!forward && !backward) return;

    event.preventDefault();

    if (isBusy) return;

    if (backward) {
        // Legacy: Up / Esc does not leave the code.
        if (field.id !== "cvCode") {
            moveFocus(field, -1);
        }
        return;
    }

    let accepted = false;

    isBusy = true;
    committingField = field;

    try {
        accepted = await commitField(field);
    } catch (error) {
        restoreField(field);
        alert(error.message);
    } finally {
        isBusy = false;
        committingField = null;
    }

    // Do not move when focus already moved (alert, F-key, mouse).
    if (accepted && document.activeElement === field) {
        committedField = field;
        moveFocus(field, 1);
    }
}

// Tabs: Enter / Tab / ↓ goes into the tab, ← / → switches tab (legacy SSActiveTabs).
function onTabButtonKey(event, button) {
    if (event.key === "Enter" || event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey)) {
        event.preventDefault();
        moveFocus(button, 1);
    } else if (event.key === "ArrowUp" || event.key === "Escape" || (event.key === "Tab" && event.shiftKey)) {
        event.preventDefault();
        moveFocus(button, -1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();

        const buttons = Array.from(document.querySelectorAll(".tab-button"))
            .filter(isVisible);
        const index = buttons.indexOf(button);
        const next = buttons[index + (event.key === "ArrowLeft" ? -1 : 1)];

        if (next) {
            next.click();
            next.focus();
        }
    }
}

// Enter order: code → names → tab → fields of the open tab → back to the tab.
function navigationList() {
    const header = ["cvCode", "cvName1", "cvName2"]
        .map(getField)
        .filter(field => field && !field.disabled);

    const tab = document.querySelector(".tab-button.active");
    const section = document.querySelector(".tab-content.active");

    const fields = section
        ? Array.from(section.querySelectorAll("input, select, textarea")).filter(isFocusable)
        : [];

    return [...header, ...(tab ? [tab] : []), ...fields];
}

function moveFocus(field, step) {
    const next = step > 0 ? nextControl(field) : navigationList()[navigationList().indexOf(field) - 1];

    if (next) {
        next.focus();
        next.select?.();
    }
}

// The control after a field (legacy SelectNextControl / the LostFocus "next" check).
// After the last field of a tab legacy goes back to the tabs; on a history tab it goes to ↓ 修正.
function nextControl(field) {
    const list = navigationList();
    const index = list.indexOf(field);

    if (index === -1) return null;

    const next = list[index + 1];

    if (next) return next;

    const history = field.closest("[data-history]");

    return history
        ? historyButton(history.dataset.history, "update")
        : document.querySelector(".tab-button.active");
}

// =========================================
//          Focus In / Out
// =========================================

function onFocusIn(event) {
    const field = event.target;

    if (!isOnScreen(field)) return;

    if (field.matches("input, select, textarea")) {
        lastField = field;
    }

    if (isDateBox(field)) {
        // TxtDate / TxtDay GotFocus: DINPUT_Mess, only when 和暦 input is on
        setMessage(eraInput ? DateSlots.ERA_HINT : "");
    } else {
        setMessage(isHistoryAmount(field) ? HISTORY_AMOUNT_HINT : fieldHints[field.id] ?? "");
    }

    // legacy Fkey(6).Enabled: F6 only while the cursor is in 精算先
    getField("btnF6").disabled = field.id !== "settlementCode";

    if (field.id === "paymentCondition" || isHistoryAmount(field)) {
        field.value = field.value.replace(/,/g, "");
    }
}

// Legacy LostFocus: moving into the next control commits the field; leaving it any other way
// (mouse, ↑ / Esc, another tab) puts the kept value back (Err_Exit: .Text = .Tag).
function onFocusOut(event) {
    const field = event.target;

    if (!isTrackedField(field)) return;

    // Already committed by Enter / Tab / ↓, or being checked right now (an alert takes the focus).
    if (field === committedField) {
        committedField = null;
        return;
    }

    if (field === committingField) return;

    // A function key button keeps what was typed (legacy F-keys take no focus).
    if (footerPressed) {
        if (field.id in numberRanges) {
            normalizeNumber(field);
        }

        if (isHistoryAmount(field)) {
            normalizeHistoryAmount(field);
            calculateHistory(field.closest("[data-history]"));
        }
        return;
    }

    if (event.relatedTarget && event.relatedTarget === nextControl(field)) {
        commitOnLeave(field);
        return;
    }

    restoreField(field);
}

// The next control was clicked: the field is committed as with Enter; when refused it gets the focus back.
async function commitOnLeave(field) {
    if (isBusy) {
        restoreField(field);
        return;
    }

    isBusy = true;
    committingField = field;

    try {
        await commitField(field);
    } catch (error) {
        restoreField(field);
        alert(error.message);
    } finally {
        isBusy = false;
        committingField = null;
    }
}

// =========================================
//          Commit (Enter / Tab / ↓)
// =========================================

async function commitField(field) {

    if (field.id in numberRanges) {
        normalizeNumber(field);
    }

    // Cal_Rireki after each amount
    if (isHistoryAmount(field)) {
        normalizeHistoryAmount(field);
        calculateHistory(field.closest("[data-history]"));
    }

    const check = checkOf(field);

    if (check && !(await check(field))) {
        restoreField(field);

        // The check may have shown an alert; stay on the field.
        showField(field.id);
        field.focus();
        field.select?.();
        return false;
    }

    acceptValue(field);
    return true;
}

// The field's value becomes the kept one; a different value is a change (legacy: .Tag <> .Text → Chg_Flg).
function acceptValue(field) {
    const before = acceptedValues.get(field) ?? "";
    const now = valueOf(field);

    acceptedValues.set(field, now);

    if (now !== before && countsAsChange(field)) {
        hasChanges = true;
    }
}

// Legacy sets no change flag for the code (it opens a 傭車) nor for most history boxes:
// on the history tabs only 支払予定日 and 支払方法 set it (TxtDay2 / TxtSelX); 修正 / 削除 always do.
function countsAsChange(field) {
    if (field.id === "cvCode") return false;

    // legacy TxtZeiHasu_LostFocus sets no Chg_Flg
    if (field.id === "taxRounding") return false;

    if (field.closest("[data-history]")) {
        return field.dataset.field === "支払日付" || field.id === "historyPaymentMethod";
    }

    return true;
}

// The kept value: the real date (yyyy-MM-dd) for a date box, the text otherwise.
function valueOf(field) {
    return isDateBox(field) ? (field.dataset.actualValue ?? "") : field.value;
}

function restoreField(field) {
    if (!acceptedValues.has(field)) return;

    if (isDateBox(field)) {
        setCalendarDate(field, acceptedValues.get(field));
        return;
    }

    field.value = acceptedValues.get(field);

    if (field.id in optionFields) {
        syncOptionButtons(field);
    } else if (field.id === "settlementCategory") {
        syncSelect(field.id, "settlementCategorySelect");
    } else if (field.id === "paymentMethod1" || field.id === "paymentMethod2" || field.id === "historyPaymentMethod") {
        syncSelect(field.id, field.id + "Select");
    } else if (isHistoryAmount(field)) {
        calculateHistory(field.closest("[data-history]"));
    }
}

// What is on screen becomes the kept value of every field (in the whole screen, or one history tab).
function rememberAcceptedValues(root = document) {
    root.querySelectorAll("input[type='text']").forEach(field => {
        if (isOnScreen(field)) {
            acceptedValues.set(field, valueOf(field));
        }
    });
}

// Text boxes the user can type in; checkboxes and the calculated boxes are not kept.
function isTrackedField(field) {
    return isOnScreen(field) && field.matches?.("input[type='text']") && !field.readOnly;
}

// The check run when a field is committed, or undefined when it has none.
function checkOf(field) {
    if (checkedFields[field.id]) return checkedFields[field.id];

    if (isDateBox(field)) return readTypedDate;

    return undefined;
}

// =========================================
//          Field Checks (legacy LostFocus)
// =========================================

// TxtCode_LostFocus
async function commitCode(field) {
    const code = padCode(field.value, CODE_LENGTH);
    const previous = acceptedValues.get(field) ?? "";

    field.value = code;

    if (code === "") return false;

    if (code === previous) return true;

    // After F2 the copied values stay; the code just must be free.
    // 精算先 keeps the code F2 generated (legacy TxtCode_LostFocus in copy mode).
    if (isCopy) {
        const result = await getJson(`${BASE_URL}/Exists?code=${encodeURIComponent(code)}`);

        if (result.exists) {
            alert(`指定したコード『${code}』は存在します！！`);
            return false;
        }

        return true;
    }

    const model = await getJson(`${BASE_URL}/GetByCode?code=${encodeURIComponent(code)}`, true);

    if (model) {
        showRecord(model);
    } else {
        // Not registered: a new 傭車 with this code, whose 精算先 is itself.
        clearScreen();
        setValue("cvCode", code);
        setValue("settlementCode", code);
        setValue("settlementName", "");
        rememberAcceptedValues();
    }

    return true;
}

// TxtName_LostFocus
function commitName(field) {
    const name = field.value;

    if (field.id === "cvName1") {
        if (name === "") return false;

        if (getValue("settlementCode") === getValue("cvCode")) {
            setValue("settlementName", name);
        }
    }

    if (getValue("abbreviation") === "") {
        setValue("abbreviation", leftBytes(name, 16).trim());
        acceptedValues.set(getField("abbreviation"), getValue("abbreviation"));
    }

    return true;
}

// TxtRyaku_LostFocus
function commitAbbreviation(field) {
    if (field.value === "") {
        field.value = getValue("cvName1");
    }

    return true;
}

// TxtPost_LostFocus: the address is filled only when 住所1 is empty.
async function commitPostalCode() {
    if (getValue("address1") === "") {
        await fillAddress(false);
    }

    return true;
}

// TxtSime_LostFocus
function checkClosingDate(field) {
    field.value = padCode(field.value, 2);

    const day = Number(field.value);

    if (field.value === "" || !Number.isInteger(day)) {
        alert("締め日を入力して下さい！！");
        return false;
    }

    if (day < 1 || day > 31) {
        alert("締め日を正しく入力して下さい！！（1～31）");
        return false;
    }

    return true;
}

// TxtSeikyuCd_LostFocus
async function checkSettlement(field) {
    const code = padCode(field.value, CODE_LENGTH);

    field.value = code;

    if (code === "") return false;

    if (code === getValue("cvCode")) {
        setValue("settlementName", getValue("abbreviation"));
        return true;
    }

    const result = await getJson(
        `${BASE_URL}/GetSettlement?code=${encodeURIComponent(code)}&isNewRecord=${isNewRecord}`
    );

    // legacy TxtSeikyuCd_LostFocus: the kept value comes back with no message (the message is F1's)
    if (!result.found) {
        return false;
    }

    setValue("settlementName", result.name);
    return true;
}

// TxtUriKbn_LostFocus
function checkSettlementCategory(field) {
    const code = field.value.trim();

    field.value = code;

    if (code === "") return false;

    if (!units.some(unit => unit.コード === code)) {
        alert(`指定した精算区分『${code}』は未登録です！！`);
        return false;
    }

    syncSelect(field.id, "settlementCategorySelect");
    return true;
}

// TxtSite_LostFocus
function checkPaymentSite(field) {
    if (field.value !== "" && !/^[0-9]$/.test(field.value)) {
        alert("支払ｻｲﾄを正しく入力して下さい！！（1～9）");
        return false;
    }

    return true;
}

// TxtKDay_LostFocus
function checkPaymentDay(field) {
    field.value = padCode(field.value, 2);

    const day = Number(field.value);

    if (field.value !== "" && !(day >= 1 && day <= 31)) {
        alert("支払日を正しく入力して下さい！！（1～31）");
        return false;
    }

    return true;
}

// TxtSel_LostFocus
function checkPaymentMethod(field, selectId) {
    field.value = padCode(field.value, 2);

    if (field.value !== "" && !paymentMethods.some(method => method.コード === field.value)) {
        alert(`指定した支払方法『${field.value}』は未登録です！！`);
        return false;
    }

    syncSelect(field.id, selectId);
    return true;
}

// TxtKeta / TxtUriHasu / TxtZeiKbn / ... _LostFocus
function checkOption(field) {
    const [allowed, message] = optionFields[field.id];

    // 口座種別 may be left empty (legacy Input_Chk).
    const allowEmpty = field.id === "accountType";

    if (!(allowed.includes(field.value) || (allowEmpty && field.value === ""))) {
        alert(message);
        return false;
    }

    syncOptionButtons(field);
    return true;
}

// =========================================
//      Address from Postal Code (Dsp_Post)
// =========================================

async function fillAddress(overwrite) {
    const postal = getValue("postalCode").replace(/\D/g, "");

    if (postal === "") return false;

    const result = await getJson(`${BASE_URL}/GetAddress?postalCode=${encodeURIComponent(postal)}`);

    if (!result.found) return false;

    if (overwrite || getValue("address1") === "") {
        const [line1, line2] = splitBytes(result.address, 32);

        setValue("address1", line1.trim());
        setValue("address2", line2.trim());

        // legacy Dsp_Post sets .Tag (no change flag; the 郵便番号 itself counts when it changed)
        acceptedValues.set(getField("address1"), getValue("address1"));
        acceptedValues.set(getField("address2"), getValue("address2"));
    }

    return true;
}

// =========================================
//              Display
// =========================================

// Dsp_Clr: empty screen with the legacy starting values.
function clearScreen() {

    document.querySelectorAll(".main-container input").forEach(field => {
        if (field.type === "checkbox") {
            field.checked = false;
        } else if (field.type !== "hidden") {
            field.value = "";
        }
    });

    document.querySelectorAll(".main-container select").forEach(select => {
        select.value = "";
    });

    setValue("closingDate", "31");
    setValue("paymentCondition", "0");
    setValue("accountType", "0");
    setValue("fractionaldigits", "0");
    setValue("roundingType", defaults.下払端数 ?? "0");
    setValue("taxCategory", defaults.税区分 ?? "0");
    setValue("taxRounding", defaults.税端数 ?? "0");
    setValue("discountRate", "0.00");
    setValue("taxableSurcharge", defaults.値引課税 ?? "0");
    setValue("nonTaxableSurcharge", defaults.値引非課税 ?? "0");
    setValue("discountRounding", "0");
    setValue("paymentDaySetting", "0");
    setValue("quantityDecimal", "3");
    setValue("weightDecimal", "3");
    setValue("unitPriceDecimal", "2");

    document.querySelectorAll(".main-container .jp-calendar-input").forEach(field => setCalendarDate(field, ""));

    Object.keys(optionFields).forEach(id => syncOptionButtons(getField(id)));

    // Dsp_RClr + Set_Grd: empty histories
    setHistoryRows([], []);

    isCopy = false;
    setMode(true);
    hasChanges = false;
    showFirstTab();
    setMessage("");

    rememberAcceptedValues();
}

// Dsp_Data
function showRecord(model) {
    clearScreen();

    Object.entries(textFields).forEach(([column, id]) => {
        if (model[column] != null) {
            setValue(id, String(model[column]).trimEnd());
        }
    });

    Object.entries(dateFields).forEach(([column, id]) => {
        setCalendarDate(getField(id), model[column]);
    });

    Object.entries(checkboxFields).forEach(([column, id]) => {
        const field = getField(id);

        if (field) {
            field.checked = String(model[column] ?? "0") === "1" || model[column] === true;
        }
    });

    Object.entries(numberFields).forEach(([column, id]) => {
        if (model[column] != null) {
            setValue(id, String(model[column]));
            normalizeNumber(getField(id));
        }
    });

    setValue("settlementName", model.精算先名称 ?? "");

    syncSelect("settlementCategory", "settlementCategorySelect");
    syncSelect("paymentMethod1", "paymentMethod1Select");
    syncSelect("paymentMethod2", "paymentMethod2Select");
    Object.keys(optionFields).forEach(id => syncOptionButtons(getField(id)));

    // Dsp_List
    setHistoryRows(model.支払履歴 ?? [], model.買掛履歴 ?? []);

    setMode(false);
    hasChanges = false;

    rememberAcceptedValues();
}

// Set_Code: the next free code, with the 傭車 as its own 精算先.
function setGeneratedCode(code) {
    setValue("cvCode", code);
    setValue("settlementCode", code);
    setValue("settlementName", "");

    rememberAcceptedValues();
}

// 新規 / 修正 (legacy LblFlg, TxtCode.ReadOnly, Fkey(2)/Fkey(4))
function setMode(isNew) {
    isNewRecord = isNew;

    const label = getField("mode-lbl");

    if (label) {
        label.textContent = isNew ? "新　規" : "修　正";
    }

    const code = getField("cvCode");

    if (code) {
        code.readOnly = !isNew;
        applyColorCoding(code, !isNew);
    }

    getField("btnCopy").disabled = isNew;
    getField("btnDelete").disabled = isNew;
}

function showFirstTab() {
    document.querySelector(".tab-button")?.click();
}

// Tabs of options that are not licensed are not shown (legacy FrmM_Yosha_Load: TabPages.Remove).
// Their boxes stay in the page, so their values are still loaded and saved, as in legacy.
// Hidden tab buttons are skipped by ← / → and Enter (isVisible).
function hideUnlicensedTabs() {

    const hide = tab => {
        document.querySelector(`.tab-button[data-tab="${tab}"]`)?.style.setProperty("display", "none");
        getField(tab)?.style.setProperty("display", "none");
    };

    // 運行管理 (SEC2) off: no 支払履歴 / 買掛履歴
    if (!defaults.運行管理) {
        hide("paymentHistory");
        hide("accountsPayableHistory");
    }

    // neither デジタコ (SEC4) nor ETC (SEC5): no デジタコオプション設定
    if (!defaults.デジタコ) {
        hide("digitalTachocode");
    }
}

// Open the tab that holds the field.
function showField(id) {
    const section = getField(id)?.closest(".tab-content");

    if (section && !section.classList.contains("active")) {
        document.querySelector(`.tab-button[data-tab="${section.id}"]`)?.click();
    }
}

function focusField(id) {
    const field = getField(id);

    if (!field) return;

    showField(id);
    field.focus();
    field.select?.();
}

function populateSelect(selectId, items) {
    const select = getField(selectId);

    if (!select) return;

    select.innerHTML = "";
    select.appendChild(new Option("", ""));

    items.forEach(item => {
        select.appendChild(new Option(item.名称, item.コード));
    });
}

function syncSelect(codeId, selectId) {
    const select = getField(selectId);
    const code = getValue(codeId);

    if (!select) return;

    select.value = Array.from(select.options).some(option => option.value === code) ? code : "";
}

// Highlight the option button whose number is in the box (legacy Lbl_Color).
function syncOptionButtons(input) {
    const group = input?.closest(".option-button-group");

    if (!group) return;

    group.querySelectorAll(".select-option-btn").forEach(button => {
        const value = button.textContent.trim().split("：")[0];

        button.classList.toggle("active", value === input.value);
    });
}

// =========================================
//              F1 Register
// =========================================

async function saveRecord() {

    // A date typed without leaving the box: a legacy box cannot hold a wrong date, so the kept one is used.
    Object.values(dateFields).forEach(id => readTypedDate(getField(id)));

    if (!(await checkScreen())) return;

    const result = await postJson(`${BASE_URL}/Save`, collectModel());

    if (!result.success) {
        alert(result.message);
        focusModelField(result.field);
        return;
    }

    await startNewRecord();
}

// Input_Chk: same order and messages as legacy.
async function checkScreen() {

    const fail = (message, id) => {
        alert(message);
        focusField(id);
        return false;
    };

    const code = getValue("cvCode");

    if (code === "") return fail("傭車コードを入力して下さい。", "cvCode");
    if (getValue("cvName1") === "") return fail("傭車名を入力して下さい。", "cvName1");
    if (getValue("furigana") === "") return fail("フリガナを入力して下さい。", "furigana");
    if (getValue("abbreviation") === "") return fail("略称を入力して下さい。", "abbreviation");

    if (getValue("closingDate") === "") return fail("締め日を入力して下さい。", "closingDate");

    const settlement = getValue("settlementCode");

    if (settlement === "") return fail("精算先を入力して下さい。", "settlementCode");

    if (settlement !== code) {
        const result = await getJson(
            `${BASE_URL}/GetSettlement?code=${encodeURIComponent(settlement)}&isNewRecord=${isNewRecord}`
        );

        if (!result.found) return fail("精算先を正しく入力して下さい。", "settlementCode");

        setValue("settlementName", result.name);
    }

    if (getValue("settlementCategory") === "") return fail("精算区分を入力して下さい。", "settlementCategory");

    const site = getValue("paymentSite");
    if (site !== "" && !/^[0-9]$/.test(site)) return fail("支払サイトを正しく入力してください！！", "paymentSite");

    const day = getValue("paymentDay");
    if (day !== "" && !(Number(day) >= 1 && Number(day) <= 31)) return fail("支払日を正しく入力してください！！", "paymentDay");

    if (parseNumber(getValue("paymentCondition")) && getValue("paymentMethod2") === "") {
        return fail("支払方法2を正しく入力してください！！", "paymentMethod2");
    }

    const accountType = getValue("accountType");
    if (accountType !== "" && accountType !== "0" && accountType !== "1") {
        return fail("口座種別を正しく入力して下さい。", "accountType");
    }

    const requiredOptions = [
        ["fractionaldigits", "端数桁数"],
        ["roundingType", "下払端数"],
        ["taxCategory", "消費税区分"],
        ["taxRounding", "消費税端数"],
        ["taxableSurcharge", "課税割増"],
        ["nonTaxableSurcharge", "非課税割増"],
        ["discountRounding", "値引端数"],
        ["paymentDaySetting", "支払日設定"]
    ];

    for (const [id, label] of requiredOptions) {
        const value = getValue(id);

        if (value === "") return fail(`${label}を入力して下さい。`, id);
        if (!optionFields[id][0].includes(value)) return fail(`${label}を正しく入力して下さい。`, id);
    }

    return true;
}

function collectModel() {
    const model = { IsNewRecord: isNewRecord };

    Object.entries(textFields).forEach(([column, id]) => {
        model[column] = getValue(id);
    });

    Object.entries(dateFields).forEach(([column, id]) => {
        model[column] = dateOf(getField(id));
    });

    Object.entries(checkboxFields).forEach(([column, id]) => {
        model[column] = getField(id)?.checked ? "1" : "0";
    });

    Object.entries(numberFields).forEach(([column, id]) => {
        model[column] = parseNumber(getValue(id));
    });

    // Saved with the 傭車 in the same transaction (legacy Data_Repl from the wk tables).
    model.支払履歴 = historyRows.payment;
    model.買掛履歴 = historyRows.payable;

    return model;
}

// Focus the field named by the server (a 傭車マスタ column).
function focusModelField(column) {
    const id = textFields[column] ?? dateFields[column] ?? numberFields[column];

    if (id) {
        focusField(id);
    }
}

// =========================================
//              F2 Copy
// =========================================

// The values stay; the screen becomes 新規 with the next free code.
async function copyRecord() {
    if (isNewRecord) return;

    const result = await getJson(`${BASE_URL}/GetNextGeneratedCode`);

    setMode(true);
    isCopy = true;
    hasChanges = false;

    setValue("cvCode", result.code ?? "");
    setValue("settlementCode", result.code ?? "");
    // the 精算先 name stays as it was (legacy F2)

    // The copy starts without history (legacy TRUNCATE wk傭車支払履歴表示 / wk傭車買掛履歴表示).
    setHistoryRows([], []);

    rememberAcceptedValues();
    showFirstTab();
    focusField("cvCode");
}

// =========================================
//              F4 Delete
// =========================================

async function deleteRecord() {
    if (isNewRecord) return;

    const code = getValue("cvCode");

    // Del_Chk comes before the question, as in legacy.
    const check = await getJson(`${BASE_URL}/CheckDelete?code=${encodeURIComponent(code)}`);

    if (!check.canDelete) {
        alert(check.message);
        return;
    }

    if (!confirm("削除してもよいですか？")) {
        focusField("cvName1");
        return;
    }

    const result = await postJson(`${BASE_URL}/Delete?code=${encodeURIComponent(code)}`);

    if (!result.success) {
        alert(result.message);
        focusField("cvName1");
        return;
    }

    await startNewRecord();
}

// =========================================
//          F5 / F6 Search
// =========================================

async function openSearch() {
    searchPurpose = "load";
    searchSelection = null;

    document.dispatchEvent(new CustomEvent("openCharteredSearchPopup"));
}

// F6 works only from the 精算先 box (legacy Fkey(6).Enabled).
async function openSettlementSearch() {
    if (lastField?.id !== "settlementCode") return;

    searchPurpose = "settlement";
    searchSelection = null;

    // legacy SelMX = "9" in 新規 (Sink_Flg): only 傭車 still trading (取引終了日 IS NULL)
    document.dispatchEvent(new CustomEvent("openCharteredSearchPopup", {
        detail: { activeOnly: isNewRecord }
    }));
}

async function afterSearch(purpose, picked) {
    const code = picked?.charteredCode ?? "";

    if (purpose === "settlement") {
        const field = getField("settlementCode");

        if (code === "") {
            focusField("settlementCode");
            return;
        }

        field.value = code;
        committingField = field;

        try {
            if (await checkSettlement(field)) {
                acceptValue(field);
                focusField("settlementCategory");
            } else {
                restoreField(field);
                focusField("settlementCode");
            }
        } finally {
            committingField = null;
        }

        return;
    }

    if (code !== "") {
        if (hasChanges && !confirm(CHANGED_MESSAGE)) {
            focusField("cvName1");
            return;
        }

        await loadRecord(code);
    }

    focusField("cvName1");
}

async function loadRecord(code) {
    const model = await getJson(`${BASE_URL}/GetByCode?code=${encodeURIComponent(code)}`, true);

    if (!model) {
        alert("指定した傭車は未登録です。");
        return false;
    }

    showRecord(model);
    return true;
}

// =========================================
//          F7 / F8 Previous / Next
// =========================================

async function moveRecord(direction) {
    if (hasChanges && !confirm(CHANGED_MESSAGE)) {
        lastField?.focus();
        return;
    }

    const action = direction < 0 ? "GetPreviousCode" : "GetNextCode";
    const current = padCode(getValue("cvCode"), CODE_LENGTH);
    const result = await getJson(`${BASE_URL}/${action}?code=${encodeURIComponent(current)}`);

    if (result.code) {
        await loadRecord(result.code);
    } else {
        alert(direction < 0 ? "これより前のデータはありません！！" : "これより次のデータは有りません！！");
    }

    focusField("cvName1");
}

// =========================================
//          F11 Cancel / F12 Exit
// =========================================

async function cancelScreen() {
    if (hasChanges && !confirm(CHANGED_MESSAGE)) {
        lastField?.focus();
        return;
    }

    await startNewRecord();
}

async function exitScreen() {
    if (hasChanges && !confirm("変更されていますが、よろしいですか ?")) {
        lastField?.focus();
        return;
    }

    // Opened from 傭車検索 F10 (legacy SYORID2 = "検索"): F12 closes it and goes back to the search
    if (new URLSearchParams(location.search).get("mode") === "search") {
        window.parent.postMessage({ action: "closeCharteredMasterModal" }, location.origin);
        return;
    }

    const url = getField("btnExit")?.dataset.exitUrl;

    if (url) {
        window.location.href = url;
    }
}

// Dsp_Clr + Set_Code + TxtCode.Focus
async function startNewRecord() {
    const result = await getJson(`${BASE_URL}/GetNextGeneratedCode`);

    clearScreen();
    setGeneratedCode(result.code ?? "");
    focusField("cvCode");
}

// ==========================================================
//      支払履歴 / 買掛履歴 _____ Tabs 4/5
//      (legacy Dsp_List / Dsp_Rireki / Wk_Repl / Cal_Rireki)
// ==========================================================

// Amounts typed in the boxes (legacy TxtSKin1..9).
const HISTORY_AMOUNT_FIELDS = [
    "前回買掛額", "今回支払額", "今回調整額", "今回仕入額", "今回割増額",
    "今回非割増", "課税値引額", "非課税値引", "今回消費税"
];

const HISTORY_AMOUNT_LIMIT = 999999999;
const HISTORY_AMOUNT_HINT = "入力可能範囲[ -999,999,999～999,999,999 ]";

// Grid columns in screen order; the 支払履歴 grid also shows 支払予定日 and 支払方法.
const HISTORY_GRID_COLUMNS = [
    "開始日", "更新日", "前回買掛額", "今回支払額", "今回調整額", "今回繰越額", "今回仕入額",
    "今回割増額", "今回非割増", "課税値引額", "非課税値引", "今回消費税", "今回値引額",
    "今回合計額", "今回買掛額"
];

// Selected grid row per tab (-1 = none).
const historySelected = { payment: -1, payable: -1 };

const historyActions = {
    update: updateHistoryRow,   // ↓ 修正
    load: loadSelectedHistoryRow, // ↑ 呼出
    delete: deleteHistoryRow,   // 削除
    cancel: cancelHistoryRow    // 中止
};

function initializeHistory() {

    document.querySelectorAll("[data-history]").forEach(section => {
        const kind = section.dataset.history;
        const body = historyBody(kind);

        section.querySelectorAll("[data-action]").forEach(button => {
            button.addEventListener("click", () => runAction(() => historyActions[button.dataset.action](kind)));
        });

        // Grid: click selects, double-click / Enter shows the row in the boxes, ↑ ↓ move.
        body.addEventListener("click", event => {
            const row = event.target.closest("tr");

            if (row) selectHistoryRow(kind, Number(row.dataset.index));
        });

        body.addEventListener("dblclick", event => {
            const row = event.target.closest("tr");

            if (row) runAction(() => loadHistoryRow(kind, Number(row.dataset.index)));
        });

        // Header click: sort by that column (its original position, also after a move by grid_columns.js)
        section.querySelector(".history-table thead")?.addEventListener("click", event => {
            const th = event.target.closest("th");

            if (th) {
                sortHistoryByColumn(kind, th.dataset.col !== undefined ? Number(th.dataset.col) : th.cellIndex);
            }
        });

        body.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                runAction(() => loadSelectedHistoryRow(kind));
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();

                const next = historySelected[kind] + (event.key === "ArrowDown" ? 1 : -1);

                if (next >= 0 && next < historyRows[kind].length) selectHistoryRow(kind, next);
            }
        });

        // Amounts: digits and a leading minus.
        HISTORY_AMOUNT_FIELDS.forEach(name => {
            historyInput(kind, name)?.addEventListener("input", function () {
                const negative = this.value.trim().startsWith("-");
                const digits = this.value.replace(/\D/g, "").substring(0, 9);

                this.value = (negative ? "-" : "") + digits;
            });
        });
    });
}

// Replace both histories (load, clear, copy) and empty the boxes.
function setHistoryRows(payment, payable) {
    historyRows.payment = payment.map(row => ({ ...row }));
    historyRows.payable = payable.map(row => ({ ...row }));

    ["payment", "payable"].forEach(kind => {
        sortHistory(kind);
        historySelected[kind] = historyRows[kind].length > 0 ? 0 : -1;
        renderHistory(kind);
        clearHistoryBoxes(kind);
    });
}

// Dsp_List, grid in Html/FE
function renderHistory(kind) {
    const body = historyBody(kind);

    if (!body) return;

    body.innerHTML = "";

    historyRows[kind].forEach((row, index) => {
        const tr = document.createElement("tr");

        tr.tabIndex = 0;
        tr.dataset.index = String(index);
        tr.classList.toggle("selected", index === historySelected[kind]);

        const cells = HISTORY_GRID_COLUMNS.map(column =>
            column === "開始日" || column === "更新日" ? formatDate(row[column]) : formatAmount(row[column]));

        if (kind === "payment") {
            cells.push(formatDate(row.支払日付), row.支払方法名称 ?? "");
        }

        cells.forEach((text, column) => {
            const td = document.createElement("td");

            td.textContent = text;

            // amounts right-aligned, by class: a column can be moved (grid_columns.js)
            td.classList.toggle("amount", column >= 2 && column < HISTORY_GRID_COLUMNS.length);

            tr.appendChild(td);
        });

        body.appendChild(tr);
    });

    showHistorySortMark(kind);
}

function selectHistoryRow(kind, index) {
    historySelected[kind] = index;

    historyBody(kind).querySelectorAll("tr").forEach(tr => {
        tr.classList.toggle("selected", Number(tr.dataset.index) === index);
    });

    historyBody(kind).querySelector(`tr[data-index="${index}"]`)?.focus();
}

// ↑ 呼出 (legacy CmdSel1)
async function loadSelectedHistoryRow(kind) {
    if (historySelected[kind] < 0 || historySelected[kind] >= historyRows[kind].length) return;

    loadHistoryRow(kind, historySelected[kind]);
}

// Dsp_Rireki: show a grid row in the boxes; 削除 becomes available.
function loadHistoryRow(kind, index) {
    const row = historyRows[kind][index];

    if (!row) return;

    clearHistoryBoxes(kind);
    selectHistoryRow(kind, index);

    setCalendarDate(historyInput(kind, "開始日"), row.開始日);
    setCalendarDate(historyInput(kind, "更新日"), row.更新日);

    HISTORY_AMOUNT_FIELDS.forEach(name => setHistoryInput(kind, name, formatAmount(row[name])));

    if (kind === "payment") {
        setCalendarDate(historyInput(kind, "支払日付"), row.支払日付);
        setValue("historyPaymentMethod", row.支払方法 ?? "");
        syncSelect("historyPaymentMethod", "historyPaymentMethodSelect");
    }

    calculateHistory(historySection(kind));
    rememberHistoryBoxes(kind);

    historyButton(kind, "delete").disabled = false;
    historyInput(kind, "開始日")?.focus();
}

// ↓ 修正 (legacy CmdSel2: Input_Chk2, then Wk_Repl keyed by 終了日)
async function updateHistoryRow(kind) {
    const start = historyInput(kind, "開始日");
    const end = historyInput(kind, "更新日");

    // A date typed without leaving the box: the kept date is used when it is not a good one.
    historySection(kind).querySelectorAll(".jp-calendar-input").forEach(readTypedDate);

    const endDate = dateOf(end);
    const startDate = dateOf(start);

    if (endDate === null) {
        alert("終了日が不正です正しく入力して下さい！！");
        end.focus();
        return;
    }

    if (startDate !== null && startDate > endDate) {
        alert("期間が不正です日付を正しく入力して下さい！！");
        start.focus();
        return;
    }

    if (!confirm("修正してもよいですか？")) {
        start.focus();
        return;
    }

    const row = readHistoryBoxes(kind);
    const index = historyRows[kind].findIndex(item => dateKey(item.更新日) === endDate);

    if (index >= 0) {
        // Keep the stored 更新日 (with its time part) so F1 updates that row.
        row.更新日 = historyRows[kind][index].更新日;
        historyRows[kind][index] = row;
    } else {
        historyRows[kind].push(row);
    }

    hasChanges = true;

    sortHistory(kind);
    historySelected[kind] = historyRows[kind].findIndex(item => dateKey(item.更新日) === endDate);
    renderHistory(kind);
    clearHistoryBoxes(kind);
    start.focus();
}

// 削除 (legacy CmdSel3: removes the row whose 終了日 is in the box)
async function deleteHistoryRow(kind) {
    const start = historyInput(kind, "開始日");

    if (!confirm("削除してもよいですか？")) {
        start.focus();
        return;
    }

    const end = historyInput(kind, "更新日");

    readTypedDate(end);

    const endDate = dateOf(end);

    if (endDate !== null) {
        historyRows[kind] = historyRows[kind].filter(item => dateKey(item.更新日) !== endDate);

        // listed again in the default order (legacy Dsp_List after 削除)
        sortHistory(kind);
        historySelected[kind] = historyRows[kind].length > 0 ? 0 : -1;
        hasChanges = true;

        renderHistory(kind);
        clearHistoryBoxes(kind);
    }

    start.focus();
}

// 中止 (legacy CmdSel4)
async function cancelHistoryRow(kind) {
    clearHistoryBoxes(kind);
    historyInput(kind, "開始日")?.focus();
}

// Dsp_RClr
function clearHistoryBoxes(kind) {
    const section = historySection(kind);

    if (!section) return;

    section.querySelectorAll("[data-field]").forEach(input => {
        if (isDateBox(input)) {
            setCalendarDate(input, "");
        } else {
            input.value = "";
        }
    });

    if (kind === "payment") {
        setValue("historyPaymentMethod", "");
        setValue("historyPaymentMethodSelect", "");
    }

    historyButton(kind, "delete").disabled = true;
    rememberHistoryBoxes(kind);
}

// The boxes as one history row; the four totals are worked out here (Cal_Rireki).
function readHistoryBoxes(kind) {
    const row = {
        開始日: dateOf(historyInput(kind, "開始日")),
        更新日: dateOf(historyInput(kind, "更新日"))
    };

    HISTORY_AMOUNT_FIELDS.forEach(name => {
        row[name] = parseNumber(historyInput(kind, name).value) ?? 0;
    });

    Object.assign(row, historyTotals(row));

    if (kind === "payment") {
        const method = getValue("historyPaymentMethod");

        row.支払日付 = dateOf(historyInput(kind, "支払日付"));
        row.支払方法 = method;
        row.支払方法名称 = paymentMethods.find(item => item.コード === method)?.名称 ?? "";
    }

    return row;
}

// Cal_Rireki: the four calculated boxes.
function calculateHistory(section) {
    if (!section) return;

    const kind = section.dataset.history;
    const amounts = {};

    HISTORY_AMOUNT_FIELDS.forEach(name => {
        amounts[name] = parseNumber(historyInput(kind, name).value) ?? 0;
    });

    Object.entries(historyTotals(amounts)).forEach(([name, value]) => {
        setHistoryInput(kind, name, formatAmount(value));
    });
}

function historyTotals(row) {
    const carried = row.前回買掛額 - row.今回支払額 - row.今回調整額;
    const discount = row.課税値引額 + row.非課税値引;
    const total = row.今回仕入額 + row.今回割増額 + row.今回非割増 + row.今回消費税 - discount;

    return {
        今回繰越額: carried,
        今回値引額: discount,
        今回合計額: total,
        今回買掛額: carried + total
    };
}

// Amount box: whole number inside the legacy range, shown with commas (blank stays blank).
function normalizeHistoryAmount(field) {
    const value = parseNumber(field.value);

    field.value = value === null
        ? ""
        : formatAmount(Math.min(HISTORY_AMOUNT_LIMIT, Math.max(-HISTORY_AMOUNT_LIMIT, Math.trunc(value))));
}

// History boxes start from what is shown, so leaving one without Enter puts it back.
function rememberHistoryBoxes(kind) {
    const section = historySection(kind);

    if (section) {
        rememberAcceptedValues(section);
    }
}

// The default order: newest 終了日 first (legacy Dsp_List: ORDER BY 更新日 DESC); no header is sorted.
function sortHistory(kind) {
    historyRows[kind].sort((a, b) => dateKey(b.更新日).localeCompare(dateKey(a.更新日)));
    historySort[kind] = null;
}

// =========================================
//      Grid sorting by a header click
// =========================================
// Legacy DataGridView (sortable columns): the 1st click on a header sorts ascending, the next one descending.
// DataGridViewEx.OnSortCompare compares numbers as numbers; here dates compare as dates (also in 和暦), blanks first.
// The rows themselves are sorted and the grid drawn again, so the selected row, ↑ ↓ and 呼出 keep working.

// sorted column per grid: { column, ascending }, null = the default order
const historySort = { payment: null, payable: null };

const HISTORY_DATE_FIELDS = ["開始日", "更新日", "支払日付"];

// grid column (its original position) → history row field
function historyColumnField(column) {
    return HISTORY_GRID_COLUMNS[column] ?? ["支払日付", "支払方法名称"][column - HISTORY_GRID_COLUMNS.length];
}

function sortHistoryByColumn(kind, column) {

    const field = historyColumnField(column);

    if (!field) return;

    const current = historySort[kind];
    const ascending = current?.column === column ? !current.ascending : true;
    const selected = historyRows[kind][historySelected[kind]];

    historyRows[kind].sort((a, b) => compareHistoryValues(field, a[field], b[field]) * (ascending ? 1 : -1));

    historySort[kind] = { column, ascending };
    historySelected[kind] = selected ? historyRows[kind].indexOf(selected) : -1;

    renderHistory(kind);
}

function compareHistoryValues(field, a, b) {

    const isBlank = value => value === null || value === undefined || value === "";

    if (isBlank(a) || isBlank(b)) {
        return (isBlank(a) ? 0 : 1) - (isBlank(b) ? 0 : 1);
    }

    if (HISTORY_DATE_FIELDS.includes(field)) {
        return dateKey(a).localeCompare(dateKey(b));
    }

    if (typeof a === "number" && typeof b === "number") {
        return a - b;
    }

    return String(a).localeCompare(String(b), "ja");
}

// ▲ / ▼ on the sorted header (legacy sort glyph)
function showHistorySortMark(kind) {

    const sort = historySort[kind];

    historySection(kind)?.querySelectorAll(".history-table thead th").forEach((th, index) => {
        const column = th.dataset.col !== undefined ? Number(th.dataset.col) : index;

        th.classList.toggle("sorted-asc", sort?.column === column && sort.ascending);
        th.classList.toggle("sorted-desc", sort?.column === column && !sort.ascending);
    });
}

function historySection(kind) {
    return document.querySelector(`[data-history="${kind}"]`);
}

function historyInput(kind, name) {
    return historySection(kind)?.querySelector(`[data-field="${name}"]`);
}

function setHistoryInput(kind, name, value) {
    const input = historyInput(kind, name);

    if (input) input.value = value ?? "";
}

function historyBody(kind) {
    return historySection(kind)?.querySelector(".history-table tbody");
}

function historyButton(kind, action) {
    return historySection(kind)?.querySelector(`[data-action="${action}"]`) ?? {};
}

function isHistoryAmount(field) {
    return HISTORY_AMOUNT_FIELDS.includes(field?.dataset?.field) && !!field.closest("[data-history]");
}

// "2026-04-30T00:00:00" / "2026-04-30" → "2026-04-30"
function dateKey(value) {
    return String(value ?? "").substring(0, 10);
}

function formatAmount(value) {
    return value === null || value === undefined || value === "" ? "" : Number(value).toLocaleString("en-US");
}

// =========================================
//              Input Limits
// =========================================

function initializeInputLimits() {

    Object.entries(digitLimits).forEach(([id, max]) => {
        const field = getField(id);

        if (!field) return;

        // 支払条件 shows commas when not being edited.
        field.setAttribute("maxlength", String(id === "paymentCondition" ? 11 : max));
        field.setAttribute("inputmode", "numeric");

        field.addEventListener("input", function () {
            const digits = toHalfWidthDigits(this.value).replace(/\D/g, "").substring(0, max);

            if (digits !== this.value) {
                this.value = digits;
            }
        });
    });

    Object.entries(byteLimits).forEach(([id, max]) => {
        const field = getField(id);

        if (!field) return;

        const halfWidth = halfWidthFields.includes(id);

        const limit = function (event) {
            // Wait until IME input is finished.
            if (event.isComposing) return;

            // toHalfWidth: common_master.js
            const typed = halfWidth
                ? Array.from(toHalfWidth(this.value)).filter(ch => charBytes(ch) === 1).join("")
                : this.value;

            const text = leftBytes(typed, max);

            if (text !== this.value) {
                this.value = text;
            }
        };

        field.addEventListener("input", limit);
        field.addEventListener("compositionend", limit);
    });

    // 郵便番号: 999-9999
    getField("postalCode")?.addEventListener("input", function () {
        const digits = toHalfWidthDigits(this.value).replace(/\D/g, "").substring(0, 7);

        this.value = digits.length > 3 ? `${digits.substring(0, 3)}-${digits.substring(3)}` : digits;
    });

    // 値引率: digits, one point, two decimals, optional minus.
    getField("discountRate")?.addEventListener("input", function () {
        let text = toHalfWidthDigits(this.value).replace(/[^0-9.-]/g, "");
        const negative = text.startsWith("-");

        text = text.replace(/-/g, "");

        const [whole, ...rest] = text.split(".");
        const decimals = rest.join("").substring(0, 2);

        text = whole.substring(0, 3) + (text.includes(".") ? "." + decimals : "");

        this.value = (negative ? "-" : "") + text;
    });
}

// Keep a number box inside its legacy range and format.
function normalizeNumber(field) {
    if (!field) return;

    const [min, max, decimals] = numberRanges[field.id];
    let value = parseNumber(field.value);

    if (value === null) value = 0;

    value = Math.min(max, Math.max(min, value));

    field.value = field.id === "paymentCondition"
        ? value.toLocaleString("en-US")
        : value.toFixed(decimals);
}

// =========================================
//              Helpers
// =========================================

function getField(id) {
    return document.getElementById(id);
}

function getValue(id) {
    return getField(id)?.value.trim() ?? "";
}

function setValue(id, value) {
    const field = getField(id);

    if (field) {
        field.value = value ?? "";
    }
}

function isOnScreen(element) {
    return !!element?.closest?.(".main-container");
}

function isPopupOpen() {
    return !!getField("charteredSearchPopup")?.classList.contains("is-open");
}

function isVisible(element) {
    return element.getClientRects().length > 0;
}

function isFocusable(field) {
    return !field.disabled &&
        !field.readOnly &&
        field.type !== "hidden" &&
        field.tabIndex !== -1 &&
        isVisible(field);
}

// Legacy ZeroPad: blank stays blank.
function padCode(value, length) {
    const text = toHalfWidthDigits(String(value ?? "")).trim();

    return text === "" ? "" : text.padStart(length, "0");
}

function toHalfWidthDigits(text) {
    return String(text ?? "").replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
}

// Bytes as legacy counts them: ASCII and half-width kana 1, others 2.
function charBytes(ch) {
    const code = ch.codePointAt(0);

    return code <= 0x7F || (code >= 0xFF61 && code <= 0xFF9F) ? 1 : 2;
}

function leftBytes(text, max) {
    let result = "";
    let total = 0;

    for (const ch of String(text ?? "")) {
        const bytes = charBytes(ch);

        if (total + bytes > max) break;

        result += ch;
        total += bytes;
    }

    return result;
}

// Legacy Separate_Chara: first line up to max bytes, the rest on the next line.
function splitBytes(text, max) {
    const first = leftBytes(text, max);
    const second = leftBytes(String(text ?? "").substring(first.length), max);

    return [first, second];
}

// "2026-04-27T00:00:00" → the legacy format of the 和西暦 setting (grids); "" when no date.
// Legacy prints "西暦 ee年MM月dd日" here in 和暦 (.NET ToString of the GrapeCity format): a legacy bug, not carried over.
function formatDate(value) {
    return DateSlots.format(dateKey(value), dateFormat());
}

// =========================================
//      Date boxes (取引開始日 / 取引終了日 / 履歴)
// =========================================
// Typed slot by slot like the legacy GcDate (date_slots.js), in the legacy format of the 和西暦 setting:
//     西暦  2026年04月18日        和暦  令和 08年04月18日
// The real date is kept in dataset.actualValue (yyyy-MM-dd), also used by the calendar (japanesecalendar.js).

// legacy Date_InputSet: F_Date by DINPUT_Chk
function dateFormat() {
    return eraInput ? "ggg ee年MM月dd日" : "yyyy年MM月dd日";
}

function isDateBox(field) {
    return !!field?.classList?.contains("jp-calendar-input");
}

// The date in a box (yyyy-MM-dd), or null when it is empty.
function dateOf(field) {
    return field?.dataset.actualValue || null;
}

function inDateRange(field, date) {
    const [min, max] = DATE_RANGES[field.id] ?? DEFAULT_DATE_RANGE;

    return date >= min && date <= max;
}

// Show a stored date in a date box ("" empties it).
function setCalendarDate(field, value) {
    if (!field) return;

    const date = dateKey(value);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        DateSlots.show(field, "");
        field.dataset.shownDate = "";
        delete field.dataset.actualValue;
        return;
    }

    // shownDate: what the screen set, so a date picked in the calendar can be told apart
    field.dataset.shownDate = date;
    field.dataset.actualValue = date;

    DateSlots.show(field, date);
}

// The date typed in a box: blank or a good date in the range is taken;
// part-filled, not a real date or out of range puts the kept date back (a legacy box cannot hold one) and returns false.
function readTypedDate(field) {
    if (!field) return true;

    const { empty, date } = DateSlots.read(field);

    if (empty) {
        setCalendarDate(field, "");
        return true;
    }

    if (date && inDateRange(field, date)) {
        setCalendarDate(field, date);
        return true;
    }

    setCalendarDate(field, acceptedValues.get(field) ?? "");
    return false;
}

// Slot typing on each date box; a date picked in the calendar is taken like a committed one.
function initializeDateBoxes() {

    document.querySelectorAll(".main-container .jp-calendar-input").forEach(field => {

        // 西暦 until the 管理マスタ setting is read (applyDateSetting)
        DateSlots.attach(field, dateFormat());

        // The calendar sets data-actual-value (and its own text) without an input event.
        // A date outside the box's range is refused and the kept date stays (legacy MaxMinBehavior.Keep).
        new MutationObserver(() => {
            const picked = field.dataset.actualValue ?? "";

            if (picked === (field.dataset.shownDate ?? "")) return;

            if (picked && !inDateRange(field, picked)) {
                setCalendarDate(field, acceptedValues.get(field) ?? "");
                return;
            }

            // legacy GcDate dropdown: a pick only changes the box; it is kept (and Chg_Flg set)
            // only on a forward move, leaving another way puts the old date back
            setCalendarDate(field, picked);
        }).observe(field, { attributes: true, attributeFilter: ["data-actual-value"] });
    });
}

// 和暦 on: ggg ee年MM月dd日 and the era hint; off: yyyy年MM月dd日 and no hint.
function applyDateSetting(isEra) {
    eraInput = isEra;

    document.querySelectorAll(".main-container .jp-calendar-input").forEach(field => {
        field.dataset.noEra = isEra ? "false" : "true";
        DateSlots.setFormat(field, dateFormat());
    });
}

function isCalendarOpen() {
    return Array.from(document.querySelectorAll(".japanese-calendar")).some(calendar => calendar.style.display === "block");
}

// parse Number from text, if not number
function parseNumber(text) {
    const value = String(text ?? "").replace(/,/g, "").trim();

    if (value === "" || value === "-") return null;

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
}

// used in getting jason object with data
async function getJson(url, allowMissing = false) {
    const response = await fetch(url, { headers: { "Accept": "application/json" } });

    if (allowMissing && response.status === 404) {
        return null;
    }

    return readJson(response);
}

// submitting data through JSON
async function postJson(url, body) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "RequestVerificationToken": getAntiForgeryToken()
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });

    return readJson(response);
}

// checking for valid JSON Object
async function readJson(response) {
    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(data?.message || "処理に失敗しました。");
    }

    return data;
}
