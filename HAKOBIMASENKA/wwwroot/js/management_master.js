/**
 * =========================================
 * Screen: Management Master
 *
 * Navigation:
 *     Main Menu
 *         -> Basic Master
 *         -> Management Master
 *
 * Migrated From: FrmM_kanri.vb
 *
 * Functions:
 *              - Save
 *              - Delete
 *              - Cancel
 *              - Exit
 *
 * =========================================
 */

//Flag to indicate if the current record is new or existing
let isNewRecord = true;

//Flag to indicate if the user is in edit mode`
let isEditMode = false;

//cancel/exit warning message flag
let hasChanges = false;

// 和暦 input is on (管理マスタ 01 和西暦 = 1, legacy DINPUT_Chk): dates show the era and the date hint is shown
let eraInput = false;

//Store the currently editing control for restoring uncommitted values
let editingControl = null;

//store initial load
let init = null;

//mapping data from viewModel to html control Id
const fieldMap = {

    // 自社情報
    "自社コード": "mmCode",
    "自社名1": "cName1",
    "自社名2": "cName2",
    "略称": "shortName",
    "郵便番号": "postalCode",
    "住所1": "address1",
    "住所2": "address2",
    "電話番号": "phNumber",
    "faX番号": "faxNumber",
    "銀行1": "bank1",
    "銀行2": "bank2",
    "運行管理者": "m_admin",
    "登録番号": "regNumber",

    // 税率設定
    "新消費税率施行日": "taxDate1",
    "旧消費税率": "percent1",
    "新消費税率": "percent2",
    "新軽油税施行日": "taxDate2",
    "旧軽油税": "amount1",
    "新軽油税": "amount2",

    // 対象月度
    "対象月度": "procDate",

    // 伝票番号設定
    "受注伝票": "orderVoucher",
    "仕入伝票": "purchaseVoucher",
    "傭車伝票": "subcontractVoucher",
    "経費伝票": "expenseVoucher",
    "作業伝票": "workVoucher",

    "運転日報": "dailyReport",
    "入金伝票": "receiptVoucher",
    "仕入支払": "supplierPayment",
    "支払伝票": "paymentVoucher",
    "予約番号": "reservationNo",

    // 端数設定
    "売上端数": "salesRounding",
    "消費税区分": "taxCategory",
    "消費税端数": "taxRounding",

    // マシン設定
    "顧客No": "clientNo",
    "サーバーパス": "serverPath",

    // 入力設定
    "発着地区分": "arrivalDepartureType",
    "日付区分": "dateType",

    // 部門管理
    "部門管理": "departmentManagement",

    // 請求書設定
    "宛先敬称": "titleSuffix",

    // 環境設定
    "実車区分": "actualKmType",
    "課税割増": "taxablePremium",
    "非課税割増": "nonTaxablePremium",
    "請求日設定": "billingDateType",
    "警告日数": "warningDays",
    "送信先1": "mailTo1",
    "送信先2": "mailTo2",

    // 手当
    "手当1": "allowance1",
    "手当2": "allowance2",
    "手当3": "allowance3",
    "手当4": "allowance4",
    "手当5": "allowance5",
    "手当6": "allowance6",
    "手当7": "allowance7",

    // 支給
    "支給1": "payment1",
    "支給2": "payment2",
    "支給3": "payment3",
    "支給4": "payment4",
    "支給5": "payment5",

    // 給与設定
    "給与締切日": "salaryClosingDay",
    "給与掛率1": "salaryRate1",
    "給与掛率2": "salaryRate2",
    "給与掛率3": "salaryRate3",
    "給与掛率4": "salaryRate4",
    "給与ファイル": "salaryFile",

    // 財務設定
    "財務区分1": "financeType1",
    "財務区分2": "financeType2",
    "財務区分3": "financeType3",
    "財務区分4": "financeType4",
    "財務区分5": "financeType5",
    "財務区分6": "financeType6",
    "財務区分7": "financeType7",
    "財務区分8": "financeType8",
    "財務ファイル": "financeFile",

    // カード
    "カード優先": "cardPriority",

    // 運賃形態
    "運賃形態1": "fareType1",
    "運賃形態2": "fareType2",
    "運賃形態3": "fareType3",
    "運賃形態4": "fareType4",
    "運賃形態5": "fareType5",
    "運賃形態6": "fareType6",
    "運賃形態7": "fareType7",
    "運賃形態8": "fareType8",
    "運賃形態9": "fareType9",

    // 補償
    "補償1": "compensation1",
    "補償2": "compensation2",
    "補償3": "compensation3",
    "補償4": "compensation4",
    "補償5": "compensation5",
    "補償6": "compensation6",
    "補償7": "compensation7",
    "補償8": "compensation8",
    "補償9": "compensation9",

    // シリアル
    "シリアルNO1": "serial1",
    "シリアルNO2": "serial2",
    "シリアルNO3": "serial3",
    "シリアルNO4": "serial4",
    "シリアルNO5": "serial5",
    "シリアルNO6": "serial6",
    "シリアルNO7": "serial7",
    "シリアルNO8": "serial8",
    "シリアルNO9": "serial9",
    "シリアルNO10": "serial10"
};

// calendar fields: the real date is kept in dataset.actualValue (yyyy-MM-dd),
// the box only shows the era text
const dateFields = [
    "新消費税率施行日",
    "新軽油税施行日",
    "対象月度"
];

// number fields: sent as numbers (blank = null), commas removed
const numberFields = [
    "旧消費税率", "新消費税率", "旧軽油税", "新軽油税",
    "受注伝票", "仕入伝票", "傭車伝票", "経費伝票", "作業伝票",
    "運転日報", "入金伝票", "仕入支払", "支払伝票", "予約番号",
    "売上端数", "消費税区分", "消費税端数",
    "発着地区分", "日付区分", "部門管理",
    "実車区分", "課税割増", "非課税割増", "請求日設定", "警告日数",
    "給与締切日", "給与掛率1", "給与掛率2", "給与掛率3", "給与掛率4",
    "カード優先"
];

// all vouchers data to be sentback to db
const voucherFields = [
    "受注伝票",
    "仕入伝票",
    "傭車伝票",
    "経費伝票",
    "作業伝票",
    "運転日報",
    "入金伝票",
    "仕入支払",
    "支払伝票",
    "予約番号"
];

// =========================================
//              Enter Navigation
// =========================================

// Enter / Tab / ↓ : check the field (legacy LostFocus) and go to the next one (legacy FrmM_KeyDown)
// ↑ / Esc / Shift+Tab : previous field (not from 自社コード)
// Order: 自社コード → 自社情報 → open tab → fields of the open tab → back to the tab (legacy SSActiveTabs)

// 自社情報 in legacy tab order
const headerFieldIds = [
    "mmCode", "cName1", "cName2", "shortName", "postalCode", "address1", "address2",
    "phNumber", "faxNumber", "regNumber", "bank1", "bank2", "m_admin"
];

// Enter order inside a tab where it differs from the page layout (legacy TabIndex / LostFocus chain).
// The other tabs follow the page.
const tabFieldOrder = {

    // vouchers go across each row (TxtDNo1-10): 受注 運転日報 / 仕入 入金 / 傭車 仕入支払 / 経費 有料 / 作業 予備
    basicSetting: [
        "taxDate1", "percent1", "percent2", "taxDate2", "amount1", "amount2", "procDate",
        "orderVoucher", "dailyReport", "purchaseVoucher", "receiptVoucher", "subcontractVoucher",
        "supplierPayment", "expenseVoucher", "paymentVoucher", "workVoucher", "reservationNo",
        "salesRounding", "taxCategory", "taxRounding", "clientNo", "serverPath",
        "arrivalDepartureType", "dateType", "departmentManagement", "titleSuffix"
    ],

    // 名称 → 変動名称 → 手当名 → 警告日数 → 実車Km → 課税 → 非課税 → 請求日 → 支給名
    envSetting: [
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `fareType${i}`),
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `compensation${i}`),
        ...[1, 2, 3, 4, 5, 6, 7].map(i => `allowance${i}`),
        "warningDays", "actualKmType", "taxablePremium", "nonTaxablePremium", "billingDateType",
        ...[1, 2, 3, 4, 5].map(i => `payment${i}`)
    ]
};

// Clicking an option label goes to this field (legacy LblXxx_Click); "tab" = the tab header
const optionNextField = {
    salesRounding: "taxCategory",
    taxCategory: "taxRounding",
    taxRounding: "clientNo",
    arrivalDepartureType: "dateType",
    dateType: "departmentManagement",
    departmentManagement: "titleSuffix",
    actualKmType: "taxablePremium",
    taxablePremium: "nonTaxablePremium",
    nonTaxablePremium: "billingDateType",
    billingDateType: "payment1",
    cardPriority: "tab"
};

// The field just committed with Enter / Tab / ↓; its focusout must not put the old value back
let committedField = null;

// True while a function key button is being clicked: the field keeps what was typed (legacy F-keys take no focus)
let footerPressed = false;

// option boxes: allowed values and the legacy LostFocus message
const optionRules = {
    salesRounding: [["0", "1", "2"], "売上端数を正しく入力して下さい！！（0・1・2）"],
    taxCategory: [["0", "1", "2"], "消費税区分を正しく入力して下さい！！（0・1・2）"],
    taxRounding: [["0", "1", "2"], "消費税端数を正しく入力して下さい！！（0・1・2）"],
    arrivalDepartureType: [["0", "1"], "発着地登録を正しく入力して下さい！！（0・1）"],
    dateType: [["0", "1"], "日付を正しく入力して下さい！！（0・1）"],
    departmentManagement: [["0", "1", "2"], "部門管理を正しく入力して下さい！！（0・1・2）"],
    actualKmType: [["0", "1"], "実車Km入力を正しく入力して下さい！！（0・1）"],
    taxablePremium: [["0", "1"], "課税割増を正しく入力して下さい！！（0・1）"],
    nonTaxablePremium: [["0", "1"], "非課税割増を正しく入力して下さい！！（0・1）"],
    billingDateType: [["0", "1", "2"], "請求日設定を正しく入力して下さい！！（0・1・2）"],
    cardPriority: [["0", "1"], "カード優先を正しく入力して下さい！！（0・1）"]
};

document.addEventListener("keydown", async function (event) {

    const current = event.target;

    // the screen itself only (not the grid or the calendar)
    if (!current.closest?.(".main-container")) {
        return;
    }

    // ← / → on the tab switch tabs
    if (current.classList.contains("tab-button") &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight")) {

        event.preventDefault();

        const tabs = Array.from(document.querySelectorAll(".tab-button"));
        const next = tabs[tabs.indexOf(current) + (event.key === "ArrowLeft" ? -1 : 1)];

        if (next) {
            next.click();
            next.focus();
        }

        return;
    }

    // Esc closes an open calendar first
    if (event.key === "Escape" &&
        Array.from(document.querySelectorAll(".japanese-calendar")).some(c => c.style.display === "block")) {
        return;
    }

    const forward = event.key === "Enter" || event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey);
    const backward = event.key === "ArrowUp" || event.key === "Escape" || (event.key === "Tab" && event.shiftKey);

    if (!forward && !backward) {
        return;
    }

    const fields = navigationFields();
    const index = fields.indexOf(current);

    if (index === -1) {
        return;
    }

    event.preventDefault();

    if (backward) {
        // the field's focusout decides: kept only when this lands on its next control (see Kept values below),
        // e.g. ↑ from the last open serial box onto the tab strip (legacy TxtSerial_LostFocus); otherwise put back
        if (current.id !== "mmCode" && index > 0) {
            focusAndSelect(fields[index - 1]);
        }
        return;
    }

    const before = acceptedValueOf(current);

    // stays on the field when the check fails
    if (!(await commitField(current))) {
        return;
    }

    acceptCommitted(current, before);

    // after the last field of a tab, legacy goes back to the tabs
    focusAndSelect(fields[index + 1] ?? document.querySelector(".tab-button.active"));

});

// 自社情報 + the open tab button + the fields of the open tab
function navigationFields() {

    const header = headerFieldIds
        .map(id => document.getElementById(id))
        .filter(field => field && (field.id === "mmCode" || isFocusableField(field)));

    const tab = document.querySelector(".tab-button.active");
    const section = document.querySelector(".tab-content.active");

    let fields = [];

    if (section) {
        const order = tabFieldOrder[section.id];

        fields = order
            ? order.map(id => document.getElementById(id)).filter(field => field && isFocusableField(field))
            : Array.from(section.querySelectorAll("input, select, textarea")).filter(isFocusableField);
    }

    return [...header, ...(tab ? [tab] : []), ...fields];
}

// =========================================
//      Kept values and the change flag
// =========================================
// Legacy keeps each field's last accepted value (Tag). Its LostFocus only asks which control got the focus: landing on
// the field's next control (Enter, Tab, ↓, a click, or ↑ where that is the next control) keeps the value; landing
// anywhere else puts it back. The change flag is set only when a committed value differs.
// Clicking a function key keeps what was typed (legacy F-keys take no focus), so F1 saves it.

function isTrackedField(field) {
    return field?.tagName === "INPUT" && Object.values(fieldMap).includes(field.id);
}

// the kept value: the real date for a calendar box, the text otherwise
function acceptedValueOf(field) {
    return field.classList.contains("jp-calendar-input")
        ? (field.dataset.acceptedDate ?? "")
        : (field.dataset.accepted ?? field.value);
}

// a field committed with Enter / Tab / ↓: its value becomes the kept one
function acceptCommitted(field, before) {

    const now = field.classList.contains("jp-calendar-input")
        ? (field.dataset.actualValue ?? "")
        : field.value;

    // legacy sets no change flag for 自社コード (it opens a company) nor for 処理月度 (TxtNendo_LostFocus)
    if (now !== before && field.id !== "mmCode" && field.id !== "procDate") {
        hasChanges = true;
    }

    if (field.classList.contains("jp-calendar-input")) {
        field.dataset.acceptedDate = now;
    } else {
        field.dataset.accepted = now;
    }

    committedField = field;
}

// put the kept value back without moving the cursor
function restoreKeptValue(field) {

    if (field.classList.contains("jp-calendar-input")) {
        setCalendarDate(field, field.dataset.acceptedDate);
        return;
    }

    if (field.dataset.accepted !== undefined && field.value !== field.dataset.accepted) {
        field.value = field.dataset.accepted;
        syncOptionButtons();
    }
}

document.addEventListener("mousedown", event => {
    if (event.target.closest?.(".function-footer")) {
        footerPressed = true;
        setTimeout(() => footerPressed = false);
    }
}, true);

document.addEventListener("focusout", event => {

    const field = event.target;

    if (!isTrackedField(field)) {
        return;
    }

    // legacy LostFocus clears the message bar; the next field's GotFocus sets its own
    if (!footerPressed) {
        setMessage("");
    }

    if (field === committedField) {
        committedField = null;
        return;
    }

    if (footerPressed || field.readOnly) {
        return;
    }

    // Legacy LostFocus checks only "<next control>.Focused": clicking straight into the next field
    // is a forward move, so the field is checked and kept (e.g. a code + click on 自社名(1) opens that company).
    const fields = navigationFields();
    const index = fields.indexOf(field);
    const next = index === -1 ? null : (fields[index + 1] ?? document.querySelector(".tab-button.active"));

    if (event.relatedTarget && event.relatedTarget === next) {

        const before = acceptedValueOf(field);

        commitField(field).then(ok => {
            if (ok) {
                acceptCommitted(field, before);

                // focus has already left the field: nothing more to skip
                committedField = null;
            } else {
                focusAndSelect(field);
            }
        });

        return;
    }

    restoreKeptValue(field);
});

function isFocusableField(field) {
    return !field.disabled &&
        !field.readOnly &&
        field.type !== "hidden" &&
        field.type !== "file" &&
        field.tabIndex !== -1 &&
        field.getClientRects().length > 0;
}

function focusAndSelect(field) {
    if (!field) return;

    field.focus();
    field.select?.();
}

// legacy LostFocus checks; false = stay on the field
async function commitField(field) {

    const value = field.value?.trim() ?? "";

    switch (field.id) {

        // TxtCode_LostFocus: pad, then show the company when the code is another one
        case "mmCode": {

            if (field.readOnly) {
                return true;
            }

            const code = zeroPad(value, 2);
            field.value = code;

            if (code === "") {
                alert("自社コードを入力して下さい");
                // legacy Err_Exit: the old code is put back
                restoreAccepted(field);
                return false;
            }

            if (code !== field.dataset.accepted && await exists(code)) {
                await getByCode(code);
                hasChanges = false;
            }

            field.dataset.accepted = code;
            return true;
        }

        // TxtName_LostFocus (a blank name gets its old value back, legacy Err_Exit)
        // legacy checks = "" (a name of only spaces is taken as typed)
        case "cName1":

            if (field.value === "") {
                alert("自社名を入力して下さい");
                restoreAccepted(field);
                return false;
            }

            // an empty 略称 takes the name, as an accepted value (legacy TxtName(2).Tag)
            if ($("#shortName").val() === "") {
                $("#shortName").val(field.value);
                $("#shortName")[0].dataset.accepted = field.value;
            }

            return true;

        case "shortName":

            if (field.value === "") {
                alert("略称を入力して下さい");
                restoreAccepted(field);
                return false;
            }

            return true;

        // TxtDate / TxtNendo_LostFocus: a blank, not a date, or outside the range keeps the cursor, with the old date back
        case "taxDate1":
        case "taxDate2":
        case "procDate":

            if (!readTypedCalendarDate(field) || !field.dataset.actualValue) {
                setCalendarDate(field, field.dataset.acceptedDate);
                field.select();
                return false;
            }

            return true;

        // TxtNo_LostFocus: digits only (stays without a message), padded to 2
        case "clientNo":

            if (!/^\d+$/.test(value)) {
                restoreAccepted(field);
                return false;
            }

            field.value = zeroPad(value, 2);
            return true;

        // TxtKeikoku_LostFocus: blank = 0
        case "warningDays":
        // TxtZei / TxtKZei_LostFocus: blank = 0
        case "percent1":
        case "percent2":
        case "amount1":
        case "amount2":

            if (value === "") {
                field.value = "0";
            }

            return true;

        // TxtEnd_LostFocus: 0-31 (legacy stays without a message)
        case "salaryClosingDay":

            if (value !== "" && !(/^\d+$/.test(value) && Number(value) <= 31)) {
                // legacy clears the bar, puts the old value back and refocuses, whose GotFocus shows the hint again
                restoreAccepted(field);
                setMessage(fieldMessage(field.id));
                return false;
            }

            field.dataset.accepted = field.value;
            return true;
    }

    // TxtDno_LostFocus: 8 digits, blank = 1
    if (field.hasAttribute("data-pad-length")) {

        field.value = value === "" ? "1" : zeroPad(value, 8);
        return true;
    }

    // TxtSiwake_LostFocus: blank or 1 (legacy stays without a message)
    if (/^financeType\d$/.test(field.id)) {

        if (value !== "" && value !== "1") {
            // legacy keeps the cursor and puts the old value back; the message bar stays empty
            restoreAccepted(field);
            return false;
        }

        field.dataset.accepted = field.value;
        return true;
    }

    // option boxes (TxtUKbn / TxtUZeiKbn / ... _LostFocus)
    const rule = optionRules[field.id];

    if (rule) {

        if (!rule[0].includes(value)) {
            alert(rule[1]);
            restoreAccepted(field);
            return false;
        }

        field.dataset.accepted = field.value;
        syncOptionButtons();
        return true;
    }

    return true;
}

// put back the last accepted value and select it (legacy Err_Exit)
function restoreAccepted(field) {

    if (field.dataset.accepted !== undefined) {
        field.value = field.dataset.accepted;
    }

    syncOptionButtons();
    field.select?.();
}

// =========================================
//         Initial Screen Load/Events
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    // tab switch
    initializeTabs();

    // changes tracking
    registerEvents();

    //Load Data initially/partially
    loadDataInitial();

    //RegisterButton
    const registerButton = document.getElementById("btnRegister");
    if (registerButton) {
        registerButton.addEventListener("click", saveManagementMaster);
    }

    //DeleteButton
    const deleteButton = document.getElementById("btnDelete");
    if (deleteButton) {
        deleteButton.addEventListener("click", deleteManagementMaster);
    }

    //CancelButton
    const cancelButton = document.getElementById("btnBack");
    if (cancelButton) {
        cancelButton.addEventListener("click", cancelManagementMaster);
    }

    //Code(Auto)
    const codeTextbox = document.getElementById("mmCode");
    codeTextbox.focus();

    // digits, half-width, byte limits, 郵便番号 mask (once; these were added again on every load)
    initializeInputRules();

    // folder picked with "..." (legacy FolderBrowserDialog)
    initializeFolderPickers();

    //F12 - ExitButton with popup
    const btnExit = document.getElementById("btnExit");

    if (btnExit) {

        btnExit.addEventListener("click", function (event) {

            event.preventDefault();

            if (hasChanges) {

                // only is used in each screen(based on whether this popup exist or not in legacy screen),
                // except common button functionality
                // legacy FrmM_Kanri_FormClosing text (half-width ? after a space)
                if (!confirm("変更されていますが、よろしいですか ?")) {
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

    //GridRowDoubleClick/Enter
    document.querySelectorAll(".list-grid-row")
        .forEach(row => {

            row.addEventListener("dblclick", () =>
                getSelectedRowData(row)
            );

            row.addEventListener("keydown", event => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    getSelectedRowData(row);

                }

            });

    });

    // single row click event
    document.querySelectorAll(".list-grid-row")
        .forEach(row => {
            row.addEventListener("click", async function () {

                document
                    .querySelectorAll(".list-grid-row")
                    .forEach(r =>
                        r.classList.remove("selected"));

                this.classList.add("selected");

                this.focus();

            });

        });

    // Select first grid row by default
    const firstRow = document.querySelector(".list-grid-row");

    if (firstRow) {

        firstRow.classList.add("selected");

    }

    // Select every input on the page that has the inputmode="decimal" attribute
    // const decimalInputs = document.querySelectorAll('input[inputmode="decimal"]');
    const decimalInputs = document.querySelectorAll(".decimal-input");

    decimalInputs.forEach(input => {
        input.addEventListener('blur', function () {
            normalizeDecimalInput(this);
        });
    });

    // message bar: set when a field gets focus (legacy GotFocus), however it was reached; cleared on leave (focusout above)
    document.addEventListener("focusin", event => {

        if (isTrackedField(event.target)) {
            setMessage(fieldMessage(event.target.id));
        }
    });

});

// legacy GotFocus messages; every other field clears the bar
function fieldMessage(id) {

    switch (id) {

        // TxtDate_GotFocus: DINPUT_Mess, only when 和暦 input is on
        case "taxDate1":
        case "taxDate2":
            return eraInput ? "明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]" : "";

        // TxtZei_GotFocus
        case "percent1":
        case "percent2":
            return "入力可能範囲[ 0～99 ]";

        // TxtKZei / TxtUPer_GotFocus (MinValue～MaxValue as ##0.00)
        case "amount1":
        case "amount2":
        case "salaryRate1":
        case "salaryRate2":
        case "salaryRate3":
        case "salaryRate4":
            return "入力可能範囲[ 0.00～100.00 ]";

        // TxtEnd_GotFocus
        case "salaryClosingDay":
            return "末締めは『31』を入力";
    }

    return "";
}

// =========================================
//         Laterally triggered Events
// =========================================

// a header click sorts the grid by that column (sortGrid, common_master.js: 1st click ascending, again descending)
document.querySelectorAll(".table-list th[data-sort]")
    .forEach(header => {

        header.addEventListener(
            "click",
            function () {

                sortGrid(this.dataset.sort);

            });

    });


// =========================================
//              F1 Save / Update
// =========================================

async function saveManagementMaster() {

    const model = collectModel();

    let result;

    // legacy Data_Repl
    setMessage("登録中！！　暫くお待ち下さい");

    try {

        // 入力端末 comes from the server's settings (legacy E_CODE), not from the screen
        const response = await fetch("/ManagementMaster/Save",

            {
                method: "POST",
                headers:
                {
                    "Content-Type": "application/json",
                    "RequestVerificationToken": getAntiForgeryToken()
                },
                body: JSON.stringify(model)
            });

        result = await response.json();

    } catch {

        setMessage("");

        // server error (legacy message when Data_Repl fails)
        alert("登録中に異常が発生しました！！\n再登録して下さい");

        return;
    }

    setMessage("");

    if (!result.success) {

        alert(result.errorMessage);

        // legacy Input_Chk: switch to the field's tab and put the cursor on it
        focusErrorField(result.errorField, result.errorTab);

        return;
    }

    // legacy F1 message after a successful save
    alert("登録が完了しました！！");

    hasChanges = false;

    location.reload();

}

// After a save check fails: opens the tab holding the field (model property name) and puts the cursor on it.
// tabId: the tab legacy switches to when it is another one (blank カード優先 → シリアル設定); the field is then not reachable.
function focusErrorField(property, tabId) {

    const field = document.getElementById(fieldMap[property]);

    if (!field) {
        return;
    }

    const tab = tabId ? document.getElementById(tabId) : field.closest(".tab-content");

    if (tab && !tab.classList.contains("active")) {
        document.querySelector(`.tab-button[data-tab="${tab.id}"]`)?.click();
    }

    // the field is on a tab that is not shown: no cursor (legacy Focus() on a hidden control does nothing)
    if (tab && !tab.contains(field)) {
        return;
    }

    // legacy quirk (Input_Chk): a bad serial gets the cursor only when its box is locked
    if (/^シリアルNO\d+$/.test(property) && !field.readOnly) {
        return;
    }

    focusAndSelect(field);
}

// =========================================
//                F4 Delete
// =========================================

async function deleteManagementMaster() {

    const code = $("#mmCode").val();

    try {

        // Del_Chk and the 01 check come before the question (legacy order)
        const checkResponse = await fetch(`/ManagementMaster/CheckDelete?companyCode=${encodeURIComponent(code)}`);

        if (!checkResponse.ok) throw new Error();

        const check = await checkResponse.json();

        if (!check.success) {

            alert(check.errorMessage);

            return;
        }

        if (!confirm("削除してもよいですか？")) {
            // legacy: TxtCode.Focus()
            $("#mmCode")[0]?.focus();
            return;
        }

        const response = await fetch(`/ManagementMaster/Delete?companyCode=${encodeURIComponent(code)}`,

            {
                method: "POST",

                headers: {
                    "RequestVerificationToken": getAntiForgeryToken()
                }

            });

        if (!response.ok) throw new Error();

        const result = await response.json();

        if (!result.success) {

            alert(result.errorMessage);

            // legacy: Data_Del = False → TxtCode.Focus()
            $("#mmCode")[0]?.focus();

            return;
        }

        setEditMode(false);

        location.reload();

    } catch {
        // legacy: Data_Del shows the error, then F4 focuses 自社コード
        alert("削除中に異常が発生しました！！");
        $("#mmCode")[0]?.focus();
    }

}

// =========================================
//         F11 Cancel with warning/popup
// =========================================

async function cancelManagementMaster() {

    if (hasChanges) {

        if (!confirm("内容が変更されております。よろしいですか？")) {
            return;
        }
    }

    // Dsp_Clr + Dsp_Clr2 + Dsp_Data2 + Set_Code:
    // settings reloaded from 01 (edits on the tabs are dropped), company fields cleared, next code
    await loadDataInitial();

    hasChanges = false;

    document.querySelector('.tab-button[data-tab="basicSetting"]')?.click();

    $("#mmCode")[0]?.focus();

}

// =========================================
//          Display Data/load by code
// =========================================
async function getByCode(code) {

    const response = await fetch(`/ManagementMaster/GetByCode?code=${code}`);

    // No 01 row yet: legacy Dsp_Data2 just returns, so the Dsp_Clr2 defaults stay and Set_Code still offers a code;
    // the first F1 creates the row. The 404 still carries クライアントNo / サーバーパス.
    // Any other missing code (deleted meanwhile): nothing is opened.
    if (!response.ok && init !== 0) {
        return;
    }

    const model = await response.json().catch(() => ({}));

    if (init !== 0) {

        // Dsp_Data: opening a company replaces the company fields only;
        // the settings tabs (always 01) keep what is on screen
        populateHeader(model);

        isNewRecord = false;

        setEditMode(true);

        // legacy Dsp_Data starts with Dsp_Clr: back on 基本設定, nothing changed yet
        document.querySelector('.tab-button[data-tab="basicSetting"]')?.click();
        hasChanges = false;

        return;
    }

    populateScreen(model);

    if (init === 0) {

        clearManagementMasterFields();

        await getNextCode();

        setEditMode(false);

        init = null;

        return;

    }

    isNewRecord = false;

    setEditMode(true);

}
// =========================================
//                  Mode
// =========================================
function setEditMode(isEdit) {

    const modeLabel = document.getElementById("mode-lbl");

    if (!modeLabel)
        return;

    modeLabel.textContent = isEdit ? "修　正" : "新　規";

    $("#btnDelete").prop("disabled", !isEdit);

    // 修正: the code is read-only (legacy TxtCode.ReadOnly)
    const code = document.getElementById("mmCode");

    if (code) {
        code.readOnly = isEdit;
        applyColorCoding(code, isEdit);
    }

    isEditMode = isEdit;
}
// =========================================
//              Clear Fields
// =========================================

function clearManagementMasterFields() {

    // clearUpperheade
    clearHeaderData();

}

// =========================================
//              Next Code
// =========================================

async function getNextCode() {

    // clearScreen();

    const response = await fetch("/ManagementMaster/NextCode");

    const code = await response.json();

    $("#mmCode").val(code);

    // the code on screen is the accepted one (Enter on it does not load anything)
    if ($("#mmCode")[0]) {
        $("#mmCode")[0].dataset.accepted = code;
    }

    $("#mmCode")[0]?.focus();

    isNewRecord = true;

}

// =========================================
//              functions
// =========================================

// getting list from source
async function loadList() {

    const response = await fetch("/ManagementMaster/GetList");

    const data = await response.json();

    renderGrid(data);
}

// add data to screen/Html fields
function populateScreen(model) {

    // legacy Dsp_Clr2 then Dsp_Data2: the settings tabs start from their defaults, so a NULL column
    // (and anything typed before F11) shows the default, not what was on the screen
    resetSettingsDefaults();

    // 和暦 / 西暦 display and the date hint follow the saved 和西暦 of 01 (legacy DINPUT_Chk, set when the screen opens;
    // a changed setting shows after F1, which reloads the page)
    applyDateSetting(DateSlots.isEra());

    Object.entries(fieldMap).forEach(([property, controlId]) => {

        const control = document.getElementById(controlId);

        if (!control)
            return;

        if (dateFields.includes(property)) {
            setCalendarDate(control, model[property]);
            return;
        }

        if (model[property] != null) {    control.value = model[property];}
    });

    lockSerials(model);

    // once per load (these were running once per field)
    syncOptionButtons();

    inputZeroPadding();

    formatPostalCode(document.getElementById("postalCode"));

    formatDecimalFields();

    // values on screen are the accepted ones (put back when a box is left the wrong way or a check fails).
    // Taken after the formatting above, as legacy Dsp_Data2 sets Tag = Text after ZeroPad:
    // leaving a voucher box must give back 00000031, not 31.
    Object.values(fieldMap).forEach(controlId => {
        const control = document.getElementById(controlId);

        if (control) {
            control.dataset.accepted = control.value;
        }
    });

}

// legacy Dsp_Clr2: the values the settings tabs show before 01 is read
const settingsDefaults = {
    // 基本設定
    percent1: "", percent2: "", amount1: "", amount2: "",
    orderVoucher: "", dailyReport: "", purchaseVoucher: "", receiptVoucher: "", subcontractVoucher: "",
    supplierPayment: "", expenseVoucher: "", paymentVoucher: "", workVoucher: "", reservationNo: "",
    salesRounding: "1", taxCategory: "1", taxRounding: "1",
    clientNo: "", serverPath: "",
    arrivalDepartureType: "1", dateType: "1", departmentManagement: "1", titleSuffix: "",

    // 環境設定
    warningDays: "", actualKmType: "1", taxablePremium: "1", nonTaxablePremium: "1", billingDateType: "1",

    // オプション設定
    salaryFile: "", financeFile: "", salaryClosingDay: "",
    salaryRate1: "0.00", salaryRate2: "0.00", salaryRate3: "0.00", salaryRate4: "0.00",
    mailTo1: "", mailTo2: "", cardPriority: "0"
};

function resetSettingsDefaults() {

    Object.entries(settingsDefaults).forEach(([id, value]) => {
        const control = document.getElementById(id);

        if (control) {
            control.value = value;
        }
    });

    // names, serials and 仕訳作成 start empty
    const emptyLists = [
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap(i => [`fareType${i}`, `compensation${i}`]),
        ...[1, 2, 3, 4, 5, 6, 7].map(i => `allowance${i}`),
        ...[1, 2, 3, 4, 5].map(i => `payment${i}`),
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `serial${i}`),
        ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => `financeType${i}`)
    ];

    emptyLists.forEach(id => {
        const control = document.getElementById(id);

        if (control) {
            control.value = "";
        }
    });

    ["taxDate1", "taxDate2", "procDate"].forEach(id => {
        const control = document.getElementById(id);

        if (control) {
            setCalendarDate(control, null);
        }
    });
}

// 和暦 on: ggg ee年MM月dd日 and the era hint; off: yyyy年MM月dd日 and no hint (処理月度 adds 度)
function applyDateSetting(isEra) {

    eraInput = isEra;

    ["taxDate1", "taxDate2", "procDate"].forEach(id => {
        const control = document.getElementById(id);

        if (control) {
            control.dataset.noEra = isEra ? "false" : "true";
            DateSlots.setFormat(control, dateFormatOf(control, isEra));
        }
    });
}

// A serial box is locked when its SEC flag is 1 (legacy Dsp_Data2: TxtSerial(i).Enabled = False).
// Runs whenever the 01 settings are shown: page load (also after F1/F4, which reload the page) and F11,
// so a serial saved as valid is locked right after the save. Opening another company does not run it.
// Like legacy, a box is only ever locked, never unlocked again; locked boxes are skipped by Enter.
function lockSerials(model) {

    for (let i = 1; i <= 10; i++) {

        const box = document.getElementById(`serial${i}`);

        if (box && model.シリアルロック?.[i - 1] === true) {
            box.readOnly = true;
        }
    }
}

// company fields only (legacy Dsp_Data)
function populateHeader(model) {

    Object.entries(fieldMap).forEach(([property, controlId]) => {

        if (!headerFieldIds.includes(controlId))
            return;

        const control = document.getElementById(controlId);

        if (control) {
            control.value = model[property] ?? "";

            if (control.id === "postalCode") {
                formatPostalCode(control);
            }

            control.dataset.accepted = control.value;
        }
    });
}

// an option button click is an accepted value (optionButton() in common_master.js sets the box).
// Like legacy LblXxx_Click (Lbl_Color2 sets Text and Tag), it sets no change flag, and goes to the next field.
document.addEventListener("click", function (event) {

    const button = event.target.closest?.(".select-option-btn");
    const input = button?.closest(".option-button-group")?.querySelector("input[type='text']");

    if (!input) {
        return;
    }

    input.dataset.accepted = input.value;

    const next = optionNextField[input.id];

    if (next === "tab") {
        document.querySelector(".tab-button.active")?.focus();
    } else if (next) {
        focusAndSelect(document.getElementById(next));
    }
});

// =========================================
//      Date boxes (施行日 ×2, 処理月度)
// =========================================
// Typed slot by slot like the legacy GcDate (date_slots.js), in the legacy formats of the 和西暦 setting:
//     西暦  2026年04月18日 / 2026年10月度        和暦  令和 08年04月18日 / 令和 08年10月度
// The real date is kept in dataset.actualValue (yyyy-MM-dd), also used by the calendar (japanesecalendar.js).

// legacy Date_InputSet: F_Date / F_Date2 by DINPUT_Chk
function dateFormatOf(control, isEra) {
    if (control.id === "procDate") {
        return isEra ? "ggg ee年MM月度" : "yyyy年MM月度";
    }
    return isEra ? "ggg ee年MM月dd日" : "yyyy年MM月dd日";
}

// show a stored date in a date box: the real date in dataset.actualValue, the legacy format in the box
function setCalendarDate(control, value) {

    const date = String(value ?? "").substring(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        DateSlots.show(control, "");
        control.dataset.shownDate = "";
        control.dataset.acceptedDate = "";
        delete control.dataset.actualValue;
        return;
    }

    // shownDate: what the screen set, so a date picked in the calendar can be told apart;
    // what the screen shows is also the kept value (put back when the box is left the wrong way)
    control.dataset.shownDate = date;
    control.dataset.acceptedDate = date;
    control.dataset.actualValue = date;

    DateSlots.show(control, date);
}

// slot typing on each date box; a date picked in the calendar is a change
function initializeCalendarInputs() {

    document.querySelectorAll(".jp-calendar-input").forEach(control => {

        // the format of the 和西暦 setting (legacy Date_InputSet on Load)
        DateSlots.attach(control, dateFormatOf(control, DateSlots.isEra()));

        // the calendar sets data-actual-value (and its own text) without an input event.
        // Like a legacy GcDate dropdown pick, the date only goes into the box (in the box's format) with the cursor:
        // it is kept, and the change flag set, when the box is left forward (acceptCommitted);
        // leaving any other way puts the kept date back. F1 saves what is in the box.
        // A date outside the box's range is refused and the kept date stays (legacy MaxMinBehavior.Keep).
        new MutationObserver(() => {
            if ((control.dataset.actualValue ?? "") !== (control.dataset.shownDate ?? "")) {

                const picked = control.dataset.actualValue ?? "";

                if (picked && !inDateRange(control, picked)) {
                    setCalendarDate(control, control.dataset.acceptedDate);
                    return;
                }

                control.dataset.shownDate = picked;
                DateSlots.show(control, picked);

                // clicking the calendar took the focus; legacy keeps it in the box
                control.focus();
            }
        }).observe(control, { attributes: true, attributeFilter: ["data-actual-value"] });
    });
}

// Legacy MinDate / MaxDate of each date box; a date outside is not taken (MaxMinBehavior.Keep)
const dateRanges = {
    taxDate1: ["2000-01-01", "2050-12-31"],     // 新消費税率施行日 (TxtDate0)
    taxDate2: ["1950-01-01", "2050-12-31"],     // 新軽油税施行日 (TxtDate1)
    procDate: ["2000-01-01", "2050-12-31"]      // 処理月度 (TxtNendo)
};

function inDateRange(control, date) {
    const range = dateRanges[control.id];
    return !range || (date >= range[0] && date <= range[1]);
}

// The date in the box, when it is committed (Enter / Tab / ↓) or saved (F1):
//   blank: no date (Enter keeps the cursor; F1 answers with the legacy 「…が異常です！！」),
//   part-filled, not a real date or outside the range: the kept date is put back (a legacy box cannot hold one); returns false.
function readTypedCalendarDate(control) {

    const { empty, date } = DateSlots.read(control);

    if (empty) {
        DateSlots.show(control, "");
        delete control.dataset.actualValue;
        control.dataset.shownDate = "";
        return true;
    }

    if (date && inDateRange(control, date)) {
        setCalendarDate(control, date);
        return true;
    }

    setCalendarDate(control, control.dataset.acceptedDate);
    return false;
}

// change tracking: set when a field is committed with a different value (acceptCommitted), not on every edit
function registerEvents() {

    initializeCalendarInputs();
}

// Check whether data exist
async function exists(code) {

    const response = await fetch(`/ManagementMaster/Exists?code=${code}`);

    return await response.json();
}

//    Tabs controls focus and movement inside the tab
function moveWithinActiveTab(current, event) {

    const activeTab =
        document.querySelector(
            ".tab-content.active"
        );

    if (!activeTab)
        return;

    const inputs =
        Array.from(
            activeTab.querySelectorAll(
                "input, select, textarea"
            )
        );

    const currentIndex =
        inputs.indexOf(current);

    if (currentIndex === -1)
        return;

    event.preventDefault();

    const nextIndex =
        (currentIndex + 1) % inputs.length;

    inputs[nextIndex].focus();
}

// function to open the selected row from the grid and populate the form fields
async function getSelectedRowData(row) {

    const code = row.dataset.code;

    await getByCode(code);

    setTimeout(() => {

        $("#cName1")[0]?.focus();
        $("#cName1")[0]?.select();
        $("#mmCode").prop("readOnly");

    }, 50);

    inputZeroPadding();

    // formatAllDynamicData();
}

//function used to set current data to be used in save/register
function collectModel() {

        const model = {};

        Object.entries(fieldMap).forEach(([property, controlId]) => {

            const control =
                document.getElementById(controlId);

            if (!control)
                return;

            // text is saved as typed (legacy writes .Text and checks only = ""); numbers are trimmed below
            const typed = control.value ?? "";
            let value = typed.trim();

            // calendar boxes: send the real date, not the era text
            // (a date still being typed when F1 is pressed is read first)
            if (dateFields.includes(property)) {
                readTypedCalendarDate(control);
                model[property] = control.dataset.actualValue || null;
                return;
            }

            // 00000031 → 31; a blank box stays blank, so the server answers 伝票番号が異常です！！ (legacy IsNumeric(""))
            if (voucherFields.includes(property) && value !== "") {
                value = value.replace(/^0+/, "") || "0";
            }

            // numbers: blank = null, so the server answers with the legacy message instead of failing
            if (numberFields.includes(property)) {
                value = value.replace(/,/g, "");
                model[property] = value === "" || isNaN(Number(value)) ? null : Number(value);
                return;
            }

            model[property] = typed;
        });

        return model;
}

//padding all the numbered input fields
function inputZeroPadding() {
    $("[data-pad-length]").each(function() {

        let value = $(this).val();

        if (!value) return;

        let length = parseInt($(this).data("pad"));

        $(this).val(zeroPad(value, length));
    });
}

// RadioButton_Reverse
function syncOptionButtons() {

    document
        .querySelectorAll(".option-button-group")
        .forEach(group => {

            const input =
                group.querySelector(
                    "input[type='text']"
                );

            if (!input)
                return;

            const value =
                input.value?.trim();

            group
                .querySelectorAll(".select-option-btn")
                .forEach(btn => {

                    btn.classList.remove("active");

                        const btnValue =
                        btn.textContent
                            .trim()
                                .split("：")[0];

                    if (btnValue === value) {
                        btn.classList.add("active");
                    }
                });
        });
}

//removes zeroes before saving to DB
function removeZeroPadding() {

    $("[data-pad-length]").each(function () {

        let value = $(this).val();

        if (!value) return;

        $(this).val(removeZeros(value));
    });
}

// =========================================
//            Input rules (once)
// =========================================
// Legacy box formats: Format "9" = digits, "H" = half-width only; MaxLength counts bytes (full-width 2, half-width 1).

function initializeInputRules() {

    // digits only: code 2, option boxes / 仕訳作成 / カード優先 1 (legacy Format "9", MaxLength 1),
    // クライアントNo 2, 警告日数 2 (0-99), 給与締切日 2, 消費税率 2
    restrictNumericInput(document.getElementById("mmCode"), 2);

    Object.keys(optionRules).forEach(id => restrictNumericInput(document.getElementById(id), 1));

    for (let i = 1; i <= 8; i++) {
        restrictNumericInput(document.getElementById(`financeType${i}`), 1);
    }

    ["clientNo", "warningDays", "salaryClosingDay", "percent1", "percent2"]
        .forEach(id => restrictNumericInput(document.getElementById(id), 2));

    // 伝票番号: digits, 8 (legacy TxtDNo Format "9", MaxLength 8)
    document.querySelectorAll("[data-pad-length]")
        .forEach(field => restrictNumericInput(field, 8));

    // byte limits and half-width-only boxes (data-maxbytes / data-halfwidth in the view)
    document.querySelectorAll(".main-container input[data-maxbytes]").forEach(field => {

        const apply = () => limitInput(field);

        field.addEventListener("input", event => {
            if (!event.isComposing) apply();
        });
        field.addEventListener("compositionend", apply);
    });

    // 郵便番号: legacy MaskedTextBox 000-0000
    const postal = document.getElementById("postalCode");

    postal.addEventListener("input", () => formatPostalCode(postal));
}

// legacy byte count: ASCII and half-width kana 1, others 2 (same as the server's ShiftJisLength)
function byteLength(text) {
    let length = 0;

    for (const ch of text) {
        const code = ch.charCodeAt(0);
        length += code <= 0x7F || (code >= 0xFF61 && code <= 0xFF9F) ? 1 : 2;
    }

    return length;
}

// keeps a box within its byte limit; a half-width box converts full-width input and drops what has no half-width form
function limitInput(field) {

    let text = field.value;

    if (field.hasAttribute("data-halfwidth")) {
        text = Array.from(toHalfWidth(text)).filter(ch => byteLength(ch) === 1).join("");
    }

    const maxBytes = parseInt(field.dataset.maxbytes, 10);

    if (maxBytes > 0) {
        let kept = "";

        for (const ch of text) {
            if (byteLength(kept + ch) > maxBytes) break;
            kept += ch;
        }

        text = kept;
    }

    if (text !== field.value) {
        field.value = text;
    }
}

// 1234567 / 123-4567 → 123-4567 (a stored value is shown the same way)
function formatPostalCode(field) {

    if (!field) return;

    const digits = toHalfWidth(field.value).replace(/\D/g, "").substring(0, 7);
    const formatted = digits.length <= 3 ? digits : `${digits.substring(0, 3)}-${digits.substring(3)}`;

    if (formatted !== field.value) {
        field.value = formatted;
    }
}

// 軽油税 / 運賃手当 shown with two decimals after a load
function formatDecimalFields() {
    ["amount1", "amount2", "salaryRate1", "salaryRate2", "salaryRate3", "salaryRate4"]
        .forEach(id => {
            const field = document.getElementById(id);

            if (field && field.value !== "") {
                normalizeDecimalInput(field);
            }
        });
}

// "..." on 給与 / 財務ﾃｷｽﾄﾌｧｲﾙ picks a folder (legacy FolderBrowserDialog).
// A browser only gives the folder's name, not its full path, so the box can also be typed in.
function initializeFolderPickers() {

    document.querySelectorAll(".folderSelector").forEach(picker => {

        picker.addEventListener("change", () => {

            const box = picker.parentElement.querySelector(".textFileName");
            const first = picker.files?.[0];

            if (!box || !first) return;

            // common_master.js wrote the first file's name; the folder is the first part of its relative path
            box.value = (first.webkitRelativePath || first.name).split("/")[0];
            limitInput(box);

            box.dataset.accepted = box.value;
            hasChanges = true;
        });
    });

    // "..." on ｻｰﾊﾞｰﾊﾟｽ (legacy CmdOpen): common_master.js puts the chosen file's name in the box
    // (a browser gives no folder path, so the box stays typeable); a different value is a change (Chg_Flg)
    document.querySelectorAll(".dbFileSelector").forEach(picker => {

        picker.addEventListener("change", () => {

            const box = picker.parentElement.querySelector(".dbFileName");

            if (!box || box.value === (box.dataset.accepted ?? "")) return;

            limitInput(box);

            box.dataset.accepted = box.value;
            hasChanges = true;
        });
    });
}

//clears initially loaded master header data except_tabs
function clearHeaderData() {

    const controls = [
        "mmCode",
        "cName1",
        "cName2",
        "shortName",
        "postalCode",
        "address1",
        "address2",
        "phNumber",
        "faxNumber",
        "bank1",
        "bank2",
        "m_admin",
        "regNumber"
    ];

    controls.forEach(id => {

        const control =
            document.getElementById(id);

        if (control) {
            control.value = "";
            control.dataset.accepted = "";
        }
    });

    init = null;
}

//Initial Data Load
async function loadDataInitial() {

    const code = "01";

    init = 0;

    // Load data initially
    await getByCode(code);

}
