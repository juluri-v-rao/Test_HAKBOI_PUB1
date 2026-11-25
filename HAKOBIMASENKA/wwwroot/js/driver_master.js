/**
 * =========================================
 * Screen: Driver Master (運転手マスタ)
 *
 * Navigation:
 *     Main Menu
 *         -> Basic Master
 *         -> Driver Master
 *
 * Migrated From: FrmM_Tanto.vb
 *
 * Tabs: 基本設定 / 固定経費設定 / 給与ｵﾌﾟｼｮﾝ設定 / ﾃﾞｼﾞﾀｺｵﾌﾟｼｮﾝ設定 / ETCｵﾌﾟｼｮﾝ設定 /
 *       運転者台帳1-4 (with their 8 histories: 運転免許 / 事故 / 違反 / 運転経歴証明書 / 適性診断 / 特別教育 / 健康診断 / 異動).
 * F10 (運転者台帳) and the histories' 印刷 are out of scope: they show the not-implemented message.
 *
 * The footer buttons are clicked; the keyboard's F1-F12 are not used on this screen.
 * Needs common_master.js (setMessage, getAntiForgeryToken, getShiftJisLength) and date_slots.js.
 * =========================================
 */

const DRIVER_URL = "/DriverMaster";
const CODE_LENGTH = 10;

// legacy Kei_Kbn(0/1) (FrmM_Tanto_Load)
const KEI_KBN = ["毎　月", "月指定"];

// legacy: 生年月日 / 入社日 / 退社日 are always 和暦 (Date_InputSet sets TxtDate(1-2) to "ggg ee年MM月dd日",
// TxtDate(0) keeps the designer's 和暦 format), whatever the 管理マスタ 和西暦 setting
const DATE_FORMAT = "ggg ee年MM月dd日";

// legacy TxtKing MinValue / MaxValue
const AMOUNT_MIN = -9999999;
const AMOUNT_MAX = 9999999;

// =========================================
//              Screen state
// =========================================

let isEditMode = false;        // legacy Sink_Flg = False
let isCopyMode = false;        // legacy Copy_Flg
let hasChanges = false;        // legacy Chg_Flg
let editingControl = null;     // cursor goes back here after a cancelled F11 / F12 / F7 / F8
let committedField = null;     // the field just committed by a key: its focusout must not put the old value back
let footerPressed = false;     // a footer button is being clicked: the field keeps what was typed (F-keys take no focus)
let isFromSearch = false;      // opened from a search's F10 (legacy SYORID2 = "検索")

let license = { fixedCost: true, payroll: true, digitaco: true, etc: true };
let vehicleOptions = [];
let charteredOptions = [];

// 固定経費 rows (legacy wk固定経費マスタ表示). New rows get negative keys until F1 gives them real ones.
let expenses = [];
let nextTempKey = -1;

// legacy TxtNO: the key the 固定経費 entry works on (a recalled row, or a new one)
let expenseKey = null;

// F6 (legacy Seek_Para) and the box an open search returns to
let seekPara = "";
let pendingSearch = null;

// =========================================
//              Element helpers
// =========================================

function getField(id) {
    return document.getElementById(id);
}

function focusAndSelect(field) {
    field?.focus();
    field?.select?.();
}

function isVisible(field) {
    return !!field && field.getClientRects().length > 0;
}

function pad(value, length) {
    const text = String(value ?? "").trim();
    return text === "" ? "" : text.padStart(length, "0");
}

// =========================================
//      Field order (legacy TabIndex / LostFocus chain)
// =========================================

const MONTH_IDS = ["month1", "month2", "month3", "month4", "month5", "month6",
                   "month7", "month8", "month9", "month10", "month11", "month12"];

const TAB_FIRST_FIELD = {
    basicSetting: "furigana",
    fixedCostSetting: "expenseitems",
    payrollOptionSettings: "payrollOptInp",
    digitacoSetting: "digitaco",
    etcOptionSetting: "etcOptSetting",

    // legacy TabIndex 0 of each 台帳 page (台帳2 starts at 違反履歴, 台帳3 at 適正診断)
    driverLedger1: "genderCode",
    driverLedger2: "violationDate",
    driverLedger3: "aptitudeDate",
    driverLedger4: "healthInsuranceDate"
};

// =========================================
//      運転者台帳 1-4: fields
// =========================================

// legacy Date_InputSet: the 台帳 dates follow 管理マスタ 和西暦 (DINPUT_Chk), unlike 生年月日 / 入社日 / 退社日
function ledgerDateFormat() {
    return DateSlots.isEra() ? "ggg ee年MM月dd日" : "yyyy年MM月dd日";
}

// [box, 運転手マスタ column, kind] — kind: text / date / number (shown as "0") / hours (shown as "00")
const LEDGER_FIELDS = [
    // 台帳1
    ["appointmentDate", "選任年月日", "date"],
    ["photoDate", "撮影日", "date"],
    ["photoFile", "写真パス", "text"],
    ["licenseNumber", "免許証番号", "text"],
    ["licenseIssueDate", "取得年月日", "date"],
    ["licenseCondition", "条件", "text"],
    ["experienceDate1", "職歴日付1", "date"],
    ["experienceText1", "職歴1", "text"],
    ["experienceDate2", "職歴日付2", "date"],
    ["experienceText2", "職歴2", "text"],
    ["experienceDate3", "職歴日付3", "date"],
    ["experienceText3", "職歴3", "text"],
    ["experienceDate4", "職歴日付4", "date"],
    ["experienceText4", "職歴4", "text"],
    ["experienceDate5", "職歴日付5", "date"],
    ["experienceText5", "職歴5", "text"],
    ["vehicleType1", "自動車種類1", "text"],
    ["vehicleType2", "自動車種類2", "text"],
    ["seatCount1", "定員数1", "number"],
    ["loadCapacity1", "積載量1", "number"],
    ["seatCount2", "定員数2", "number"],
    ["loadCapacity2", "積載量2", "number"],
    ["experienceYear1", "経験年数1", "number"],
    ["experienceMonth1", "経験月数1", "number"],
    ["experienceYear2", "経験年数2", "number"],
    ["experienceMonth2", "経験月数2", "number"],
    ["experienceOffice1", "経験事業所名1", "text"],
    ["experienceOffice2", "経験事業所名2", "text"],
    // 台帳4
    ["healthInsuranceDate", "健保加入年月日", "date"],
    ["healthInsuranceNo", "健保番号", "text"],
    ["pensionInsuranceDate", "厚保加入年月日", "date"],
    ["pensionInsuranceNo", "厚保番号", "text"],
    ["employmentInsuranceDate", "雇保加入年月日", "date"],
    ["employmentInsuranceNo", "雇保番号", "text"],
    ["workersInsuranceDate", "労災加入年月日", "date"],
    ["workersInsuranceNo", "労災番号", "text"],
    ["commuteOtherMethod", "通勤方法その他", "text"],
    ["totalHours", "通勤h", "hours"],
    ["totalMinutes", "通勤m", "hours"],
    ["emergencyContact", "緊急連絡先", "text"],
    ["emergencyPhone", "緊急連絡先番号", "text"],
    ["resignationReason1", "退社理由1", "text"],
    ["resignationReason2", "退社理由2", "text"],
    ["ledgerRemarks1", "台帳備考1", "text"],
    ["ledgerRemarks2", "台帳備考2", "text"],
    ["ledgerRemarks3", "台帳備考3", "text"],
    ["ledgerRemarks4", "台帳備考4", "text"],
    ["ledgerRemarks5", "台帳備考5", "text"],
    ["ledgerRemarks6", "台帳備考6", "text"],
    ["ledgerRemarks7", "台帳備考7", "text"],
    ["ledgerRemarks8", "台帳備考8", "text"]
];

// The 8 histories (legacy wk tables + MSFlxGrd2-7). Rows are keyed by 日付 (yyyy-MM-dd), as the tables.
//     modify: the checks of the ↓修正 button (legacy CmdSelX2), in order; "date" = the date box
//     deleteNeedsDate: the 削除 button asks for the date (legacy CmdSelX3)
const HISTORIES = {
    license: {
        prop: "運転免許証履歴", key: "License", date: "licenseExpiry",
        texts: { 番号: "licenseHistoryNo" },
        radios: {},
        cells: r => [historyDate(r.日付), r.番号],
        modify: [["date", "免許証の有効期限を入力してください"], ["番号", "免許証番号を入力してください"]],
        deleteNeedsDate: true
    },
    accident: {
        prop: "事故履歴", key: "Accident", date: "accidentDate",
        texts: { 車番: "accidentRegisterNo", 事故種類: "accidentType", 事故記録NO: "accidentRecordNo", 概要: "accidentSummary" },
        radios: { 責任: ["responsibility", "1"] },
        cells: r => [historyDate(r.日付), r.車番, r.事故種類, responsibilityText(r.責任), r.事故記録NO, r.概要],
        modify: [["date", "事故発生日を入力してください"]],
        deleteNeedsDate: true
    },
    violation: {
        prop: "違反履歴", key: "Violation", date: "violationDate",
        texts: { 内容: "violationContent" },
        radios: {},
        cells: r => [historyDate(r.日付), r.内容],
        modify: [["date", "違反日を入力してください"], ["内容", "違反した内容を入力してください"]],
        deleteNeedsDate: true
    },
    certificate: {
        prop: "運転経歴証明書", key: "Certificate", date: "certificateDate",
        texts: { 種類: "certificateType", 内容: "certificateContent" },
        radios: {},
        cells: r => [historyDate(r.日付), r.種類, r.内容],
        modify: [["date", "取得年月日を入力してください"], ["種類", "種類を入力してください"], ["内容", "内容等を入力してください"]],
        deleteNeedsDate: true
    },
    aptitude: {
        prop: "適性診断履歴", key: "Aptitude", date: "aptitudeDate",
        texts: { 概要: "aptitudeSummary" },
        radios: { 区分: ["aptitudeType", "1"] },
        cells: r => [historyDate(r.日付), aptitudeText(r.区分), r.概要],
        modify: [["date", "受診年月日を入力してください"], ["概要", "適性診断した所見概要を入力してください"]],
        deleteNeedsDate: true,
        // legacy CmdSelD3 sets the cursor on TxtUDate (台帳2), which is not on this page: the cursor stays
        deleteKeepsFocus: true
    },
    education: {
        prop: "教育実施履歴", key: "Education", date: "specialEducationDate",
        texts: { 内容: "specialEducationContent" },
        radios: { 区分: ["educationType", "1"] },
        cells: r => [historyDate(r.日付), r.内容, educationText(r.区分)],
        modify: [["date", "指導・教育の実施日を入力してください"], ["内容", "指導・教育の内容を入力してください"]],
        deleteNeedsDate: true
    },
    medical: {
        prop: "健康診断履歴", key: "Medical", date: "medicalCheckDate",
        texts: { 種類: "medicalCheckType" },
        radios: {},
        cells: r => [historyDate(r.日付), r.種類],
        // legacy CmdSelE2 checks 種類 before the date; CmdSelE3 checks neither
        modify: [["種類", "健康診断の種類を入力してください"], ["date", "受診年月日を入力してください"]],
        deleteNeedsDate: false
    },
    transfer: {
        prop: "異動履歴", key: "Transfer", date: "transferDate",
        texts: { 異動事項: "transferItem", 備考: "transferRemark" },
        radios: {},
        cells: r => [historyDate(r.日付), r.異動事項, r.備考],
        modify: [["date", "異動年月日を入力してください"], ["異動事項", "異動事項を入力してください"], ["備考", "異動の備考を入力してください"]],
        deleteNeedsDate: true
    }
};

const HISTORY_ENTRY_IDS = Object.values(HISTORIES).flatMap(h => [h.date, ...Object.values(h.texts)]);

const LEDGER_TRACKED_IDS = ["genderCode", ...LEDGER_FIELDS.map(f => f[0]), ...HISTORY_ENTRY_IDS];

// legacy LostFocus without Chg_Flg: 免許証番号 / 取得年月日 / 条件 and the history entries
// (only 運転経歴証明書 種類 / 内容 set it)
const NO_CHANGE_FLAG_IDS = new Set([
    "licenseNumber", "licenseIssueDate", "licenseCondition",
    ...HISTORY_ENTRY_IDS.filter(id => id !== "certificateType" && id !== "certificateContent")
]);

// date boxes whose GotFocus shows DINPUT_Mess (only when 和暦 input is on)
const LEDGER_HINT_DATE_IDS = ["licenseIssueDate", ...Object.values(HISTORIES).map(h => h.date)];

// legacy LostFocus chain of the 台帳 pages: the box commits only when the cursor goes to this one
// ("@tab" = the tab strip, legacy SSActiveTabs1.Focus)
const LEDGER_NEXT = {
    // 台帳1
    genderCode: "appointmentDate",
    appointmentDate: "photoDate",
    photoDate: "photoFile",
    photoFile: "licenseNumber",
    licenseNumber: "licenseIssueDate",
    licenseIssueDate: "licenseCondition",
    licenseCondition: "licenseExpiry",
    licenseExpiry: "licenseHistoryNo",
    licenseHistoryNo: "btnLicenseModify",
    experienceDate1: "experienceText1",
    experienceText1: "experienceDate2",
    experienceDate2: "experienceText2",
    experienceText2: "experienceDate3",
    experienceDate3: "experienceText3",
    experienceText3: "experienceDate4",
    experienceDate4: "experienceText4",
    experienceText4: "experienceDate5",
    experienceDate5: "experienceText5",
    experienceText5: "vehicleType1",
    vehicleType1: "vehicleType2",
    vehicleType2: "seatCount1",
    seatCount1: "loadCapacity1",
    loadCapacity1: "seatCount2",
    seatCount2: "loadCapacity2",
    loadCapacity2: "experienceYear1",
    experienceYear1: "experienceMonth1",
    experienceMonth1: "experienceYear2",
    experienceYear2: "experienceMonth2",
    experienceMonth2: "experienceOffice1",
    experienceOffice1: "experienceOffice2",
    experienceOffice2: "@tab",

    // 台帳2
    violationDate: "violationContent",
    violationContent: "btnViolationModify",
    certificateDate: "certificateType",
    certificateType: "certificateContent",
    certificateContent: "btnCertificateModify",
    accidentDate: "accidentRegisterNo",
    accidentRegisterNo: "accidentType",
    accidentType: "accidentRecordNo",
    accidentRecordNo: "accidentSummary",
    accidentSummary: "btnAccidentModify",

    // 台帳3
    aptitudeDate: "aptitudeSummary",
    aptitudeSummary: "btnAptitudeModify",
    specialEducationDate: "specialEducationContent",
    specialEducationContent: "btnEducationModify",
    medicalCheckDate: "medicalCheckType",
    medicalCheckType: "btnMedicalModify",

    // 台帳4
    healthInsuranceDate: "healthInsuranceNo",
    healthInsuranceNo: "pensionInsuranceDate",
    pensionInsuranceDate: "pensionInsuranceNo",
    pensionInsuranceNo: "employmentInsuranceDate",
    employmentInsuranceDate: "employmentInsuranceNo",
    employmentInsuranceNo: "workersInsuranceDate",
    workersInsuranceDate: "workersInsuranceNo",
    workersInsuranceNo: "transferDate",
    transferDate: "transferItem",
    transferItem: "transferRemark",
    transferRemark: "btnTransferModify",
    commuteOtherMethod: "totalHours",
    totalHours: "totalMinutes",
    totalMinutes: "emergencyContact",
    emergencyContact: "emergencyPhone",
    emergencyPhone: "resignationReason1",
    resignationReason1: "resignationReason2",
    resignationReason2: "ledgerRemarks1",
    ledgerRemarks1: "ledgerRemarks2",
    ledgerRemarks2: "ledgerRemarks3",
    ledgerRemarks3: "ledgerRemarks4",
    ledgerRemarks4: "ledgerRemarks5",
    ledgerRemarks5: "ledgerRemarks6",
    ledgerRemarks6: "ledgerRemarks7",
    ledgerRemarks7: "ledgerRemarks8",
    ledgerRemarks8: "@tab"
};

// ↑ / Esc: the box before in the chain; a group's first box goes back to the ↓修正 button before it
// (legacy SelectNextControl backwards by TabIndex)
const LEDGER_PREVIOUS = (() => {

    const previous = {};

    Object.entries(LEDGER_NEXT).forEach(([id, next]) => {
        if (next !== "@tab" && !next.startsWith("btn")) {
            previous[next] = id;
        }
    });

    return Object.assign(previous, {
        experienceDate1: "btnLicenseModify",
        certificateDate: "btnViolationModify",
        accidentDate: "btnCertificateModify",
        specialEducationDate: "btnAptitudeModify",
        medicalCheckDate: "btnEducationModify",
        commuteOtherMethod: "btnTransferModify"
    });
})();

function activeTabButton() {
    return document.querySelector(".tab-button.active");
}

function isCharteredEnabled() {
    return !getField("charteredVehicle-code").disabled;
}

// The control a forward move (Enter / Tab / ↓) goes to.
function nextControl(field) {

    if (field.classList?.contains("tab-button")) {
        return getField(TAB_FIRST_FIELD[field.dataset.tab]) ?? null;
    }

    if (LEDGER_NEXT[field.id]) {
        const next = LEDGER_NEXT[field.id];
        return next === "@tab" ? activeTabButton() : getField(next);
    }

    switch (field.id) {
        case "driver-code": return getField("driverName");
        case "driverName": return activeTabButton();

        // 基本設定
        case "furigana": return getField("zipCode");
        case "zipCode": return getField("addressField1");
        case "addressField1": return getField("addressField2");
        case "addressField2": return getField("phoneNumber");
        case "phoneNumber": return getField("mobilePhone");
        case "mobilePhone": return getField("dateOfBirth");
        case "dateOfBirth": return getField("dateOfJoining");
        case "dateOfJoining": return getField("dateOfLeaving");
        case "dateOfLeaving": return getField("driverCategory");
        case "driverCategory": return getField("vehicle-code");
        case "vehicle-code": return isCharteredEnabled() ? getField("charteredVehicle-code") : getField("department-code");
        case "charteredVehicle-code": return getField("department-code");
        case "department-code": return getField("remarks");
        // legacy TxtEtc: TxtMenkyo (運転者台帳1) is not visible from 基本設定, so ChckHaisha
        case "remarks": return getField("unitPrice-display");
        case "unitPrice-display": return activeTabButton();

        // 固定経費設定
        case "expenseitems": return getField("exp-vehicle-code");
        case "exp-vehicle-code": return getField("accountingmethod");
        case "accountingmethod":
            return getField("monthly").readOnly ? getField("month1") : getField("monthly");
        case "monthly": return getField("btnExpenseModify");
        case "month12": return getField("btnExpenseModify");

        // 給与ｵﾌﾟｼｮﾝ設定
        case "payrollOptInp": return getField("affilation-code");
        case "affilation-code": return getField("employeementCategory");
        case "employeementCategory": return getField("scheduled-working-days");
        case "scheduled-working-days": return activeTabButton();

        // ﾃﾞｼﾞﾀｺ / ETC
        case "digitaco": return activeTabButton();
        case "etcOptSetting": return activeTabButton();
    }

    const month = MONTH_IDS.indexOf(field.id);
    if (month >= 0 && month < 11) {
        return getField(MONTH_IDS[month + 1]);
    }

    return null;
}

// The control ↑ / Esc goes to; the code is never left backwards (legacy KeyDown: TxtCode → i_EnCh = False).
function previousControl(field) {

    if (field.id === "driver-code") {
        return null;
    }

    if (field.id === "driverName") {
        return getField("driver-code");
    }

    if (field.classList?.contains("tab-button")) {
        return getField("driverName");
    }

    if (LEDGER_PREVIOUS[field.id]) {
        return getField(LEDGER_PREVIOUS[field.id]);
    }

    const section = field.closest(".tab-content");
    const first = section ? getField(TAB_FIRST_FIELD[section.id]) : null;

    if (field === first) {
        return activeTabButton();
    }

    // walk the forward chain of the tab to find the control before this one
    let current = first;
    let guard = 0;

    while (current && guard++ < 40) {
        const next = nextControl(current);

        if (next === field) {
            return current;
        }

        if (!next || next.classList?.contains("tab-button") || next.tagName === "BUTTON") {
            break;
        }

        current = next;
    }

    return null;
}

// =========================================
//      Kept values (legacy .Tag) and the change flag
// =========================================
// Each box keeps its last accepted value in dataset.accepted. Moving forward to the next control
// (a key, or clicking straight into it) checks and keeps the value; leaving any other way
// (mouse, ↑, Esc, Shift+Tab) puts the kept value back (legacy LostFocus: Err_Exit sets .Text = .Tag).

const TRACKED_IDS = [
    "driver-code", "driverName",
    "furigana", "zipCode", "addressField1", "addressField2", "phoneNumber", "mobilePhone",
    "dateOfBirth", "dateOfJoining", "dateOfLeaving", "driverCategory",
    "vehicle-code", "charteredVehicle-code", "department-code", "remarks",
    "expenseitems", "exp-vehicle-code", "accountingmethod", "monthly", ...MONTH_IDS,
    "payrollOptInp", "affilation-code", "employeementCategory", "scheduled-working-days",
    "digitaco", "etcOptSetting",
    ...LEDGER_TRACKED_IDS
];

function isTracked(field) {
    return TRACKED_IDS.includes(field?.id);
}

function isDateBox(field) {
    return !!field?.classList?.contains("jp-calendar-input");
}

function keptValue(field) {
    return isDateBox(field) ? (field.dataset.acceptedDate ?? "") : (field.dataset.accepted ?? "");
}

function setKept(field, value) {
    if (isDateBox(field)) {
        field.dataset.acceptedDate = value ?? "";
    } else {
        field.dataset.accepted = value ?? "";
    }
}

// set a value and make it the kept one (legacy: .Text = x : .Tag = .Text)
function setAccepted(id, value) {
    const field = getField(id);
    if (!field) return;

    if (isDateBox(field)) {
        setCalendarDate(field, value);
        setKept(field, field.dataset.actualValue ?? "");
        return;
    }

    field.value = value ?? "";
    setKept(field, field.value);
}

function restoreKeptValue(field) {

    if (isDateBox(field)) {
        setCalendarDate(field, keptValue(field));
        return;
    }

    if (field.dataset.accepted !== undefined && field.value !== field.dataset.accepted) {
        field.value = field.dataset.accepted;
        afterRestore(field);
    }
}

// keep the names / option buttons in step with a code that was put back
function afterRestore(field) {
    if (field.id === "driverCategory" || field.id === "employeementCategory") {
        syncOptionButtons();
    }
}

// the field's value becomes the kept one; a different value is a change (legacy: .Tag <> .Text → Chg_Flg)
function acceptValue(field) {

    const now = isDateBox(field) ? (field.dataset.actualValue ?? "") : field.value;

    if (field.id !== "driver-code" && !NO_CHANGE_FLAG_IDS.has(field.id) && now !== keptValue(field)) {
        hasChanges = true;
    }

    setKept(field, now);
}

// =========================================
//              Key navigation
// =========================================

document.addEventListener("keydown", async function (event) {

    const current = document.activeElement;

    if (!current?.closest?.(".main-container")) {
        return;
    }

    // 固定経費 grid: ↑ / ↓ move the selection, Enter recalls the row (legacy MSFlxGrd_KeyDown)
    if (current.classList.contains("expense-row")) {
        onExpenseGridKey(event, current);
        return;
    }

    // 台帳 history grids: the same keys (legacy MSFlxGrd2-7_KeyDown)
    if (current.classList.contains("history-row")) {
        onHistoryGridKey(event, current);
        return;
    }

    // an open calendar takes Enter / ↓ / ↑ / Esc itself (legacy: GcDate DroppedDown → i_EnCh = False)
    if (isCalendarOpen() && isDateBox(current)) {
        return;
    }

    const isTab = current.classList.contains("tab-button");
    const isCheck = current.id === "unitPrice-display";

    if (!isTracked(current) && !isTab && !isCheck) {
        return;
    }

    const forward = event.key === "Enter" || event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey);
    const backward = event.key === "ArrowUp" || event.key === "Escape";

    if (!forward && !backward) {
        return;
    }

    // ← / → / Space on a check box keep the browser's behaviour; ↑ ↓ Enter move
    event.preventDefault();

    if (backward) {
        // the field's focusout puts its kept value back
        const previous = previousControl(current);
        if (previous) focusAndSelect(previous);
        return;
    }

    if (isTab || isCheck) {
        focusAndSelect(nextControl(current));
        return;
    }

    // the date box: let a part-typed date be read first (legacy GcDate holds only whole dates)
    if (!(await commitField(current))) {
        focusAndSelect(current);
        return;
    }

    // the user clicked somewhere else while a code was looked up
    if (document.activeElement !== current) {
        return;
    }

    committedField = current;

    focusAndSelect(afterCommitTarget(current));
});

// where a committed field goes; 計上方法 picks 毎月 or 1月 by its value (legacy TxtBunCd_LostFocus)
function afterCommitTarget(field) {
    return nextControl(field);
}

// A function key button keeps what was typed in the field (legacy F-keys take no focus).
document.addEventListener("mousedown", event => {
    if (event.target.closest?.(".function-footer")) {
        event.preventDefault();
        footerPressed = true;
        setTimeout(() => footerPressed = false);
    }
}, true);

// Legacy LostFocus: moving into the next control commits the field; leaving it any other way puts the kept value back.
document.addEventListener("focusout", event => {

    const field = event.target;

    if (!isTracked(field)) {
        return;
    }

    setMessage("");

    if (field === committedField) {
        committedField = null;
        return;
    }

    if (footerPressed || field.readOnly || field.disabled) {
        return;
    }

    if (event.relatedTarget && event.relatedTarget === nextControl(field)) {

        commitField(field).then(ok => {
            if (!ok) {
                focusAndSelect(field);
            }
        });

        return;
    }

    restoreKeptValue(field);
});

document.addEventListener("focusin", event => {

    const field = event.target;

    if (isTracked(field)) {
        editingControl = field;
    }

    if (!field.closest?.(".main-container")) {
        return;
    }

    // legacy GotFocus: the message bar and F6 (Seek_Para)
    setMessage(fieldMessage(field.id));
    setSeekPara(SEEK_FIELDS[field.id] ?? "");
});

// legacy GotFocus messages
function fieldMessage(id) {

    if (["dateOfBirth", "dateOfJoining", "dateOfLeaving"].includes(id)) {
        // legacy TxtDate_GotFocus shows the hint whatever the 和西暦 setting
        return DateSlots.ERA_HINT;
    }

    // TxtSDate / TxtYDate / TxtHDate … GotFocus: DINPUT_Mess (empty when 西暦 input)
    if (LEDGER_HINT_DATE_IDS.includes(id)) {
        return DateSlots.isEra() ? DateSlots.ERA_HINT : "";
    }

    if (id === "accountingmethod") {
        return `[ 0: ${KEI_KBN[0]}  1: ${KEI_KBN[1]}]`;
    }

    if (id === "monthly" || MONTH_IDS.includes(id)) {
        return "入力可能範囲[ -9,999,999～9,999,999 ]";
    }

    if (id === "payrollOptInp") {
        return "入力可能範囲[ 0.00～100.00 ]";
    }

    if (id === "scheduled-working-days") {
        return "入力可能範囲[ 0.0～99.9 ]";
    }

    return "";
}

// =========================================
//      Field checks (legacy LostFocus)
// =========================================

// false = refused: the kept value is back and the cursor stays.
async function commitField(field) {

    switch (field.id) {

        // TxtCode_LostFocus
        case "driver-code":
            return await commitCode(field);

        // TxtName / TxtKana_LostFocus: blank stays
        case "driverName":
        case "furigana":
            if (field.value === "") {
                restoreKeptValue(field);
                return false;
            }
            acceptValue(field);
            return true;

        // TxtPost_LostFocus: the address only when 住所1 is empty
        case "zipCode":
            if (field.value.trim() !== "" && getField("addressField1").value === "") {
                await fillAddress(field.value);
            }
            acceptValue(field);
            return true;

        // TxtDate_LostFocus
        case "dateOfBirth":
        case "dateOfJoining":
        case "dateOfLeaving":
            if (!readTypedDate(field)) {
                return false;
            }
            acceptValue(field);
            return true;

        // TxtCarKbn_LostFocus
        case "driverCategory":
            if (!["0", "1", "2"].includes(field.value)) {
                alert("運転手区分を正しく入力して下さい！！（0・1・2）");
                restoreKeptValue(field);
                return false;
            }
            acceptValue(field);
            applyDriverCategory();
            return true;

        // TxtCarCd_LostFocus: blank is taken (the dropdown is cleared)
        case "vehicle-code":
            return await commitLookup(field, {
                length: CODE_LENGTH,
                url: "GetVehicle",
                blankOk: true,
                message: code => `指定した車輌『${code}』は未登録です！！`,
                show: name => setSelectByCode("vehicle-name", field.value, name)
            });

        // TxtYoshaCd_LostFocus: blank stays (no message)
        case "charteredVehicle-code":
            return await commitLookup(field, {
                length: CODE_LENGTH,
                url: "GetChartered",
                blankOk: false,
                message: code => `指定した傭車『${code}』は未登録です！！`,
                show: name => setSelectByCode("charteredVehicle-name", field.value, name)
            });

        // TxtBKbn_LostFocus
        case "department-code":
            return await commitLookup(field, {
                length: 2,
                url: "GetDepartment",
                blankOk: true,
                message: code => `指定した部門『${code}』は未登録です！！`,
                show: name => getField("department-name").value = name
            });

        // TxtSKbn_LostFocus
        case "affilation-code":
            return await commitLookup(field, {
                length: 3,
                url: "GetAffiliation",
                blankOk: true,
                message: code => `指定した所属『${code}』は未登録です！！`,
                show: name => getField("affilation-name").value = name
            });

        // TxtKoKbn_LostFocus
        case "employeementCategory":
            if (!["0", "1", "2", "3", "4", "5", "6"].includes(field.value)) {
                alert("雇用区分を正しく入力して下さい！！（0・1・2・3・4・5・6）");
                restoreKeptValue(field);
                return false;
            }
            acceptValue(field);
            syncOptionButtons();
            return true;

        // TxtKPer / TxtShotei (GcNumber 0.00-100.00 / 0.0-99.9)
        case "payrollOptInp":
            return commitDecimal(field, 0, 100, 2);
        case "scheduled-working-days":
            return commitDecimal(field, 0, 99.9, 1);

        // TxtKeihi_LostFocus: blank stays (no message)
        case "expenseitems":
            return await commitLookup(field, {
                length: 4,
                url: "GetExpense",
                blankOk: false,
                message: code => `指定した経費項目『${code}』は未登録です！！`,
                show: name => document.querySelector(".master-name-expenseitems").value = name
            });

        // TxtGosya_LostFocus
        case "exp-vehicle-code":
            return await commitLookup(field, {
                length: CODE_LENGTH,
                url: "GetVehicle",
                blankOk: true,
                message: code => `指定した号車『${code}』は未登録です！！`,
                show: name => document.querySelector(".master-name-vehiclecode").value = name
            });

        // TxtBunCd_LostFocus: 0 / 1, otherwise it stays (no message)
        case "accountingmethod":
            if (!["0", "1"].includes(field.value)) {
                restoreKeptValue(field);
                return false;
            }
            acceptValue(field);
            applyAccountingMethod();
            return true;
    }

    // TxtKing_LostFocus
    if (field.id === "monthly" || MONTH_IDS.includes(field.id)) {
        return commitAmount(field);
    }

    // TxtNKbn2_LostFocus
    if (field.id === "genderCode") {
        if (!["1", "2"].includes(field.value)) {
            alert("性別を正しく入力して下さい！！（1・2）");
            restoreKeptValue(field);
            return false;
        }
        acceptValue(field);
        syncGender();
        return true;
    }

    // the 台帳 dates (GcDate): blank or a whole date
    if (isDateBox(field)) {
        if (!readTypedDate(field)) {
            return false;
        }
        acceptValue(field);
        return true;
    }

    // TxtCapa (GcNumber "#0", 0-99): shown without leading zeros
    if (field.id === "loadCapacity1" || field.id === "loadCapacity2") {
        const text = field.value.trim();
        if (text !== "") {
            field.value = String(Number(text));
        }
        acceptValue(field);
        return true;
    }

    acceptValue(field);
    return true;
}

// A code box with a name (legacy Dsp_CarCd / Dsp_YoshaCd / Dsp_BKbn / Dsp_SKbn / Dsp_Keihi / Dsp_Gosya).
async function commitLookup(field, rule) {

    const code = pad(field.value.replace(/\D/g, ""), rule.length);
    field.value = code;

    if (code === "") {

        if (!rule.blankOk) {
            restoreKeptValue(field);
            return false;
        }

        rule.show("");
        acceptValue(field);
        return true;
    }

    // an unchanged code needs no lookup
    if (code === keptValue(field)) {
        return true;
    }

    const result = await lookup(rule.url, code);

    if (!result.found) {
        alert(rule.message(code));
        restoreKeptValue(field);
        return false;
    }

    rule.show(result.name);
    acceptValue(field);
    return true;
}

async function lookup(action, code) {
    try {
        const response = await fetch(`${DRIVER_URL}/${action}?code=${encodeURIComponent(code)}`);
        return response.ok ? await response.json() : { found: false, name: "" };
    } catch {
        return { found: false, name: "" };
    }
}

// TxtCode_LostFocus: pad, then show the driver when the code is another one
async function commitCode(codeBox) {

    if (codeBox.readOnly) {
        return true;
    }

    const code = pad(codeBox.value.replace(/\D/g, ""), CODE_LENGTH);

    // empty: the kept code comes back and the cursor stays (legacy Err_Exit2)
    if (code === "") {
        restoreKeptValue(codeBox);
        return false;
    }

    codeBox.value = code;

    if (code !== keptValue(codeBox)) {

        if (isCopyMode) {

            // after F2 the copied values stay; the code only has to be free (legacy Data_Chk)
            const response = await fetch(`${DRIVER_URL}/Exists?code=${code}`);
            const result = await response.json();

            if (result.exists) {
                alert(`指定したコード『${code}』は存在します！！`);
                restoreKeptValue(codeBox);
                return false;
            }

        } else if (!(await loadDriver(code))) {

            // a new code: legacy Dsp_Data starts with Dsp_Clr, so the screen is emptied and stays 新規
            clearScreen();
            codeBox.value = code;
        }
    }

    setKept(codeBox, code);
    return true;
}

// GcNumber boxes of 手当掛率 / 所定労働: blank = 0 is not legacy (the box keeps a value), so blank puts the kept one back
function commitDecimal(field, min, max, decimals) {

    const text = field.value.replace(/,/g, "").trim();
    const value = Number(text);

    if (text === "" || Number.isNaN(value) || value < min || value > max) {
        restoreKeptValue(field);
        return false;
    }

    field.value = value.toFixed(decimals);
    acceptValue(field);
    return true;
}

// TxtKing: -9,999,999 to 9,999,999, blank allowed (NULL); the months add up to 合計 (Cal_Keihi)
function commitAmount(field) {

    const text = field.value.replace(/,/g, "").trim();

    if (text !== "") {
        const value = Number(text);

        if (!Number.isInteger(value) || value < AMOUNT_MIN || value > AMOUNT_MAX) {
            restoreKeptValue(field);
            return false;
        }

        field.value = value.toLocaleString("en-US");
    }

    acceptValue(field);
    calcMonthlyTotal();
    return true;
}

function amountOf(field) {
    const text = (field?.value ?? "").replace(/,/g, "").trim();
    return text === "" ? null : Number(text);
}

function formatAmount(value) {
    return value === null || value === undefined || value === "" ? "" : Number(value).toLocaleString("en-US");
}

// legacy Cal_Keihi: 合計 = 1月 + … + 12月
function calcMonthlyTotal() {
    const total = MONTH_IDS.reduce((sum, id) => sum + (amountOf(getField(id)) ?? 0), 0);
    getField("monthlyTotal").value = total.toLocaleString("en-US");
}

// 郵便番号 → 住所 (legacy Dsp_Post): both lines become kept values
async function fillAddress(postalCode) {

    try {
        const response = await fetch(`${DRIVER_URL}/GetAddress?postalCode=${encodeURIComponent(postalCode)}`);
        const result = await response.json();

        if (result.found) {
            setAccepted("addressField1", result.address1);
            setAccepted("addressField2", result.address2);
        }
    } catch {
        // legacy Dsp_Post shows nothing when the code is not registered
    }
}

// =========================================
//      運転手区分 / 雇用区分 / 計上方法
// =========================================

// legacy Lbl_Color("運転手区分"): 0 (自社) empties and locks the 傭車; 1 / 2 unlock it
function applyDriverCategory() {

    const code = getField("charteredVehicle-code");
    const select = getField("charteredVehicle-name");
    const isOwn = getField("driverCategory").value === "0";

    code.disabled = isOwn;
    select.disabled = isOwn;

    if (isOwn) {
        setAccepted("charteredVehicle-code", "");
        select.value = "";
    }

    syncOptionButtons();
}

// legacy Lbl_Color("計上方法"): 0 = 毎月 (months empty and locked), 1 = 月指定 (毎月 empty and locked)
function applyAccountingMethod() {

    const method = getField("accountingmethod").value;
    const monthly = getField("monthly");

    document.querySelector(".master-name-accountingmethod").value = KEI_KBN[Number(method)] ?? "";

    if (method === "1") {
        setAccepted("monthly", "");
        monthly.readOnly = true;
        monthly.tabIndex = -1;

        MONTH_IDS.forEach(id => {
            getField(id).readOnly = false;
            getField(id).tabIndex = 0;
        });
    } else {
        MONTH_IDS.forEach(id => {
            setAccepted(id, "");
            getField(id).readOnly = true;
            getField(id).tabIndex = -1;
        });

        monthly.readOnly = false;
        monthly.tabIndex = 0;
    }

    calcMonthlyTotal();
}

// the option buttons show the box's value
function syncOptionButtons() {

    document.querySelectorAll(".option-button-group").forEach(group => {

        const input = group.querySelector("input[type='text']");

        group.querySelectorAll(".select-option-btn").forEach(button => {
            const value = button.textContent.trim().replace(/^[０-９]/, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)).charAt(0);
            button.classList.toggle("active", value === input?.value);
        });
    });
}

// Option buttons (legacy LblCarKbn_Click / LblKoKbn_Click): set the value and its kept value
// (no change flag, as legacy Lbl_Color2) and move on.
function initializeOptionButtons() {

    document.querySelectorAll(".option-button-group").forEach(group => {

        const input = group.querySelector("input[type='text']");

        group.querySelectorAll(".select-option-btn").forEach(button => {

            // the view's onclick="optionButton(this)" moves to another tab's box: replaced here
            button.onclick = null;
            button.removeAttribute("onclick");
            button.tabIndex = -1;

            button.addEventListener("mousedown", event => event.preventDefault());

            button.addEventListener("click", () => {

                const value = button.textContent.trim()
                    .replace(/^[０-９]/, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)).charAt(0);

                setAccepted(input.id, value);

                if (input.id === "driverCategory") {
                    applyDriverCategory();
                    focusAndSelect(getField("vehicle-code"));
                } else {
                    syncOptionButtons();
                    focusAndSelect(getField("scheduled-working-days"));
                }
            });
        });
    });
}

// =========================================
//      車輌 / 傭車 dropdowns (legacy CmbCar / CmbYosha)
// =========================================

function fillSelect(id, options) {

    const select = getField(id);
    if (!select) return;

    select.replaceChildren(new Option("", ""));

    options.forEach(option => select.add(new Option(option.name, option.code)));
}

// show the dropdown entry of a code (a name not in the list is added, as legacy CmbCar.Text = 車番)
function setSelectByCode(id, code, name) {

    const select = getField(id);
    if (!select) return;

    if (code && !Array.from(select.options).some(option => option.value === code)) {
        select.add(new Option(name ?? "", code));
    }

    select.value = code ?? "";
}

// A pick sets the code as its kept value (no change flag, legacy CmbCar_SelectedIndexChanged) and moves on.
function initializeSelects() {

    const vehicle = getField("vehicle-name");
    const chartered = getField("charteredVehicle-name");

    vehicle.tabIndex = -1;
    chartered.tabIndex = -1;

    vehicle.addEventListener("change", () => {
        if (vehicle.value === "") return;

        setAccepted("vehicle-code", vehicle.value);
        focusAndSelect(isCharteredEnabled() ? getField("charteredVehicle-code") : getField("department-code"));
    });

    chartered.addEventListener("change", () => {
        if (chartered.value === "") return;

        setAccepted("charteredVehicle-code", chartered.value);
        focusAndSelect(getField("department-code"));
    });
}

async function reloadOptions() {
    try {
        const response = await fetch(`${DRIVER_URL}/GetOptions`);
        const result = await response.json();

        vehicleOptions = result.vehicles ?? [];
        charteredOptions = result.chartered ?? [];

        const vehicleCode = getField("vehicle-code").value;
        const charteredCode = getField("charteredVehicle-code").value;

        fillSelect("vehicle-name", vehicleOptions);
        fillSelect("charteredVehicle-name", charteredOptions);

        getField("vehicle-name").value = vehicleCode;
        getField("charteredVehicle-name").value = charteredCode;
    } catch {
        // the old lists stay
    }
}

// =========================================
//      Date boxes (生年月日 / 入社日 / 退社日)
// =========================================
// Typed slot by slot like the legacy GcDate (date_slots.js). The real date is kept in dataset.actualValue.

function dateKey(value) {
    return String(value ?? "").substring(0, 10);
}

function setCalendarDate(field, value) {

    if (!field) return;

    const date = dateKey(value);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        DateSlots.show(field, "");
        field.dataset.shownDate = "";
        delete field.dataset.actualValue;
        return;
    }

    field.dataset.shownDate = date;
    field.dataset.actualValue = date;
    DateSlots.show(field, date);
}

// blank or a whole date is taken; a part-typed or impossible one puts the kept date back
function readTypedDate(field) {

    const { empty, date } = DateSlots.read(field);

    if (empty) {
        setCalendarDate(field, "");
        return true;
    }

    if (date) {
        setCalendarDate(field, date);
        return true;
    }

    setCalendarDate(field, keptValue(field));
    return false;
}

function initializeDateBoxes() {

    document.querySelectorAll(".main-container .tab-content .jp-calendar-input").forEach(field => {

        // 基本設定: always 和暦; 運転者台帳: the 和西暦 setting (legacy Date_InputSet)
        const isBasic = !!field.closest("#basicSetting");
        const isEra = isBasic || DateSlots.isEra();

        field.dataset.noEra = isEra ? "false" : "true";
        DateSlots.attach(field, isBasic ? DATE_FORMAT : ledgerDateFormat());

        // The calendar sets data-actual-value without an input event: the box shows it,
        // and it is kept only on a forward move, as a typed date.
        new MutationObserver(() => {
            const picked = field.dataset.actualValue ?? "";

            if (picked === (field.dataset.shownDate ?? "")) return;

            setCalendarDate(field, picked);
        }).observe(field, { attributes: true, attributeFilter: ["data-actual-value"] });
    });
}

function isCalendarOpen() {
    return Array.from(document.querySelectorAll(".japanese-calendar")).some(c => c.style.display === "block");
}

// =========================================
//      Input limits (legacy designer MaxLength / Format)
// =========================================

function limitBytes(value, maxBytes) {

    let result = "";

    for (const ch of value) {
        if (getShiftJisLength(result + ch) > maxBytes) break;
        result += ch;
    }

    return result;
}

function digitsOnly(id, maxLength) {
    getField(id)?.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").substring(0, maxLength);
    });
}

function bytesOnly(id, maxBytes, halfWidth = false) {
    getField(id)?.addEventListener("input", function (event) {
        if (event.isComposing) return;
        const value = halfWidth ? toHalfWidth(this.value) : this.value;
        this.value = limitBytes(value, maxBytes);
    });

    getField(id)?.addEventListener("compositionend", function () {
        const value = halfWidth ? toHalfWidth(this.value) : this.value;
        this.value = limitBytes(value, maxBytes);
    });
}

function initializeInputRules() {

    digitsOnly("driver-code", CODE_LENGTH);
    bytesOnly("driverName", 16);
    bytesOnly("furigana", 16, true);          // Format "H"
    bytesOnly("addressField1", 32);
    bytesOnly("addressField2", 32);
    bytesOnly("phoneNumber", 15, true);       // Format "H"
    bytesOnly("mobilePhone", 15, true);
    digitsOnly("driverCategory", 1);
    digitsOnly("vehicle-code", CODE_LENGTH);
    digitsOnly("charteredVehicle-code", CODE_LENGTH);
    digitsOnly("department-code", 2);
    bytesOnly("remarks", 50);

    digitsOnly("expenseitems", 4);
    digitsOnly("exp-vehicle-code", CODE_LENGTH);
    digitsOnly("accountingmethod", 1);

    digitsOnly("affilation-code", 3);
    digitsOnly("employeementCategory", 1);

    bytesOnly("digitaco", 16);
    digitsOnly("etcOptSetting", 16);          // Format "9"

    // 郵便番号: 000-0000 (legacy MaskedTextBox)
    getField("zipCode")?.addEventListener("input", function () {
        const digits = toHalfWidth(this.value).replace(/\D/g, "").substring(0, 7);
        this.value = digits.length <= 3 ? digits : digits.substring(0, 3) + "-" + digits.substring(3);
    });

    // amounts: sign and digits only; commas off while typing
    ["monthly", ...MONTH_IDS].forEach(id => {
        const field = getField(id);

        field?.addEventListener("focus", function () {
            this.value = this.value.replace(/,/g, "");
            this.select();
        });

        field?.addEventListener("input", function () {
            this.value = this.value.replace(/[^\d-]/g, "").replace(/(?!^)-/g, "").substring(0, 8);
        });
    });

    // decimals: digits and one point
    ["payrollOptInp", "scheduled-working-days"].forEach(id => {
        getField(id)?.addEventListener("input", function () {
            this.value = this.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
        });
    });

    getField("monthlyTotal").tabIndex = -1;

    // 運転者台帳 (legacy designer MaxLength in bytes; Format "9" = digits, "H" = half-width)
    digitsOnly("genderCode", 1);
    bytesOnly("photoFile", 250);
    digitsOnly("licenseNumber", 12);
    bytesOnly("licenseCondition", 30);
    digitsOnly("licenseHistoryNo", 12);
    [1, 2, 3, 4, 5].forEach(i => bytesOnly(`experienceText${i}`, 40));
    bytesOnly("vehicleType1", 20);
    bytesOnly("vehicleType2", 20);
    ["seatCount1", "seatCount2", "loadCapacity1", "loadCapacity2",
     "experienceYear1", "experienceMonth1", "experienceYear2", "experienceMonth2"].forEach(id => digitsOnly(id, 2));
    bytesOnly("experienceOffice1", 32);
    bytesOnly("experienceOffice2", 32);

    bytesOnly("accidentRegisterNo", 20);
    bytesOnly("accidentType", 20);
    digitsOnly("accidentRecordNo", 10);
    bytesOnly("accidentSummary", 30);
    bytesOnly("violationContent", 20);
    bytesOnly("certificateType", 20);
    bytesOnly("certificateContent", 40);

    bytesOnly("aptitudeSummary", 30);
    bytesOnly("specialEducationContent", 20);
    bytesOnly("medicalCheckType", 10);

    ["healthInsuranceNo", "pensionInsuranceNo", "employmentInsuranceNo", "workersInsuranceNo"].forEach(id => bytesOnly(id, 30));
    bytesOnly("transferItem", 30);
    bytesOnly("transferRemark", 40);
    bytesOnly("commuteOtherMethod", 10);
    digitsOnly("totalHours", 2);
    digitsOnly("totalMinutes", 2);
    bytesOnly("emergencyContact", 20);
    bytesOnly("emergencyPhone", 15, true);
    bytesOnly("resignationReason1", 32);
    bytesOnly("resignationReason2", 32);
    [1, 2, 3, 4, 5, 6, 7, 8].forEach(i => bytesOnly(`ledgerRemarks${i}`, 80));
}

// =========================================
//      Tabs and licences
// =========================================

const LICENSED_TABS = {
    fixedCostSetting: () => license.fixedCost,     // SEC3 (SYARYO_Chk)
    payrollOptionSettings: () => license.payroll,  // SEC9 (KYUYO_Chk)
    digitacoSetting: () => license.digitaco,       // SEC4 (DIGI_Chk)
    etcOptionSetting: () => license.etc            // SEC5 (ETC_Chk)
};

// legacy FrmM_Tanto_Load: a tab without its licence is removed
function applyLicenses() {

    Object.entries(LICENSED_TABS).forEach(([tabId, isOn]) => {
        const on = isOn();
        const button = document.querySelector(`.tab-button[data-tab="${tabId}"]`);

        if (button) button.hidden = !on;
        getField(tabId)?.toggleAttribute("hidden", !on);
    });
}

function showTab(tabId) {

    document.querySelectorAll(".tab-button").forEach(b => b.classList.toggle("active", b.dataset.tab === tabId));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.toggle("active", c.id === tabId));
}

function initializeDriverTabs() {
    document.querySelectorAll(".tab-button").forEach(button => {
        button.addEventListener("click", () => showTab(button.dataset.tab));
    });
}

// =========================================
//      Clear / Show (legacy Dsp_Clr / Dsp_Data)
// =========================================

const PHASE1_TEXT_IDS = [
    "driverName", "furigana", "zipCode", "addressField1", "addressField2", "phoneNumber", "mobilePhone",
    "vehicle-code", "charteredVehicle-code", "department-code", "remarks",
    "affilation-code", "digitaco", "etcOptSetting"
];

// legacy Dsp_Clr (phase 1 part): empty boxes with empty kept values, the defaults, 新規, 基本設定
function clearScreen() {

    PHASE1_TEXT_IDS.forEach(id => setAccepted(id, ""));

    ["dateOfBirth", "dateOfJoining", "dateOfLeaving"].forEach(id => setAccepted(id, ""));

    getField("department-name").value = "";
    getField("affilation-name").value = "";
    getField("vehicle-name").value = "";
    getField("charteredVehicle-name").value = "";
    getField("unitPrice-display").checked = false;

    setAccepted("driverCategory", "0");
    applyDriverCategory();

    setAccepted("payrollOptInp", "100.00");
    setAccepted("employeementCategory", "0");
    setAccepted("scheduled-working-days", "23.0");
    syncOptionButtons();

    expenses = [];
    clearExpenseEntry();
    renderExpenses();

    clearLedger();

    isCopyMode = false;
    setEditMode(false);
    showTab("basicSetting");

    hasChanges = false;
}

// legacy Dsp_Data: show the driver and go to 修正; false when the code is not registered
async function loadDriver(code) {

    const response = await fetch(`${DRIVER_URL}/GetByCode?code=${encodeURIComponent(code)}`);

    if (!response.ok) {
        return false;
    }

    const d = await response.json();

    clearScreen();

    setAccepted("driver-code", d.運転手コード);
    setAccepted("driverName", d.運転手名);
    setAccepted("furigana", d.ふりがな);
    setAccepted("zipCode", d.郵便);
    setAccepted("addressField1", d.住所1);
    setAccepted("addressField2", d.住所2);
    setAccepted("phoneNumber", d.電話番号);
    setAccepted("mobilePhone", d.携帯番号);
    setAccepted("dateOfBirth", d.生年月日);
    setAccepted("dateOfJoining", d.入社日);
    setAccepted("dateOfLeaving", d.退社日);

    // legacy: a NULL keeps the Dsp_Clr default ("0"); a stored value is shown as it is
    setAccepted("driverCategory", d.運転手区分 == null ? "0" : String(d.運転手区分).trim());
    applyDriverCategory();

    setAccepted("vehicle-code", (d.車輌コード ?? "").trim());
    setSelectByCode("vehicle-name", getField("vehicle-code").value, d.車番);

    setAccepted("charteredVehicle-code", (d.傭車コード ?? "").trim());
    setSelectByCode("charteredVehicle-name", getField("charteredVehicle-code").value, d.傭車略称);

    // legacy: the 部門 / 所属 codes are shown only when numeric
    const department = (d.部門コード ?? "").trim();
    setAccepted("department-code", /^\d+$/.test(department) ? department : "");
    getField("department-name").value = /^\d+$/.test(department) ? (d.部門名称 ?? "") : "";

    setAccepted("remarks", d.備考);
    getField("unitPrice-display").checked = String(d.配車表示 ?? "").trim() === "1";

    setAccepted("payrollOptInp", d.手当掛率 == null ? "100.00" : Number(d.手当掛率).toFixed(2));

    const affiliation = (d.所属コード ?? "").trim();
    setAccepted("affilation-code", /^\d+$/.test(affiliation) ? affiliation : "");
    getField("affilation-name").value = /^\d+$/.test(affiliation) ? (d.所属名称 ?? "") : "";

    setAccepted("employeementCategory", d.雇用区分 == null ? "0" : String(d.雇用区分).trim());
    setAccepted("scheduled-working-days", d.所定労働 == null ? "23.0" : Number(d.所定労働).toFixed(1));
    syncOptionButtons();

    setAccepted("digitaco", d.デジタココード);
    setAccepted("etcOptSetting", d.ETCカード);

    expenses = (d.固定経費 ?? []).map(row => ({ ...row }));
    renderExpenses();

    fillLedger(d);

    isCopyMode = false;
    setEditMode(true);
    hasChanges = false;

    return true;
}

function setEditMode(isEdit) {

    isEditMode = isEdit;

    getField("mode-lbl").textContent = isEdit ? "修　正" : "新　規";

    const code = getField("driver-code");
    code.readOnly = isEdit;
    applyColorCoding?.(code, isEdit);

    getField("btnCopy").disabled = !isEdit;
    getField("btnDelete").disabled = !isEdit;
}

// =========================================
//      固定経費 (legacy wk固定経費マスタ表示 / MSFlxGrd)
// =========================================

// legacy Dsp_RClr + Set_No: an empty entry that works on a new key
function clearExpenseEntry() {

    setAccepted("expenseitems", "");
    document.querySelector(".master-name-expenseitems").value = "";
    setAccepted("exp-vehicle-code", "");
    document.querySelector(".master-name-vehiclecode").value = "";
    setAccepted("accountingmethod", "0");
    setAccepted("monthly", "");
    MONTH_IDS.forEach(id => setAccepted(id, ""));
    applyAccountingMethod();

    expenseKey = null;
}

// legacy Dsp_List order: 経費コード, 運転手コード, キー (new rows last)
function sortExpenses() {
    expenses.sort((a, b) =>
        String(a.経費コード ?? "").localeCompare(String(b.経費コード ?? "")) ||
        (a.キー > 0 ? a.キー : 1e9 - a.キー) - (b.キー > 0 ? b.キー : 1e9 - b.キー));
}

// the 経費 column: 毎月 → 金額, 月指定 → 金額1-12 (legacy Dsp_List G_King)
function expenseTotal(row) {

    if (String(row.分割方法) === "0") {
        return Number(row.金額 ?? 0);
    }

    let total = 0;
    for (let i = 1; i <= 12; i++) total += Number(row[`金額${i}`] ?? 0);
    return total;
}

function renderExpenses() {

    sortExpenses();

    const body = getField("expenseTableBody");
    body.replaceChildren();

    expenses.forEach(row => {

        const tr = document.createElement("tr");
        tr.className = "expense-row";
        tr.tabIndex = 0;
        tr.dataset.key = row.キー;

        const method = String(row.分割方法 ?? "");
        const methodText = method === "0" || method === "1" ? `${method}:${KEI_KBN[Number(method)]}` : "";

        [row.経費コード, row.経費名称, row.車輌コード, row.車番, methodText,
         methodText ? expenseTotal(row).toLocaleString("en-US") : ""]
            .forEach((value, index) => {
                const td = document.createElement("td");
                td.textContent = value ?? "";
                if (index === 5) td.style.textAlign = "right";
                tr.appendChild(td);
            });

        tr.addEventListener("click", () => selectExpenseRow(tr));
        tr.addEventListener("dblclick", () => recallExpense(tr));

        body.appendChild(tr);
    });

    // legacy DataGridView: the first row is the current one
    const first = body.querySelector(".expense-row");
    if (first) first.classList.add("selected");
}

function selectExpenseRow(tr) {
    document.querySelectorAll(".expense-row").forEach(r => r.classList.remove("selected"));
    tr.classList.add("selected");
    tr.focus();
}

function onExpenseGridKey(event, tr) {

    if (event.key === "Enter") {
        event.preventDefault();
        recallExpense(tr);
        return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const next = event.key === "ArrowDown" ? tr.nextElementSibling : tr.previousElementSibling;
        if (next) selectExpenseRow(next);
    }
}

// ←呼出 / double click / Enter (legacy CmdSel1 / Dsp_Kotei): the row goes to the entry, as kept values
function recallExpense(tr) {

    const row = expenses.find(r => String(r.キー) === tr?.dataset.key);
    if (!row) return;

    clearExpenseEntry();

    setAccepted("expenseitems", row.経費コード);
    document.querySelector(".master-name-expenseitems").value = row.経費名称 ?? "";
    setAccepted("exp-vehicle-code", row.車輌コード);
    document.querySelector(".master-name-vehiclecode").value = row.車番 ?? "";
    setAccepted("accountingmethod", String(row.分割方法 ?? "0"));
    applyAccountingMethod();

    setAccepted("monthly", formatAmount(row.金額));
    MONTH_IDS.forEach((id, i) => setAccepted(id, formatAmount(row[`金額${i + 1}`])));
    calcMonthlyTotal();

    expenseKey = row.キー;

    focusAndSelect(getField("expenseitems"));
}

function initializeExpenseButtons() {

    // the entry buttons take focus as legacy Buttons (the field before them is left: kept values are used)

    // ←呼出 (CmdSel1)
    getField("btnExpenseRecall")?.addEventListener("click", () => {
        recallExpense(document.querySelector(".expense-row.selected"));
    });

    // →修正 (CmdSel2 + Wk_Repl)
    getField("btnExpenseModify")?.addEventListener("click", () => {

        if (getField("expenseitems").value === "") {
            alert("経費項目を入力してください");
            focusAndSelect(getField("expenseitems"));
            return;
        }

        if (!confirm("修正してもよいですか？")) {
            focusAndSelect(getField("expenseitems"));
            return;
        }

        hasChanges = true;

        const method = getField("accountingmethod").value;
        const values = {
            経費コード: getField("expenseitems").value,
            経費名称: document.querySelector(".master-name-expenseitems").value,
            車輌コード: getField("exp-vehicle-code").value,
            車番: document.querySelector(".master-name-vehiclecode").value,
            分割方法: method,
            金額: amountOf(getField("monthly"))
        };

        MONTH_IDS.forEach((id, i) => values[`金額${i + 1}`] = amountOf(getField(id)));

        const existing = expenses.find(r => r.キー === expenseKey);

        if (existing) {
            Object.assign(existing, values);
        } else {
            expenses.push({ キー: nextTempKey--, ...values });
        }

        clearExpenseEntry();
        renderExpenses();
        focusAndSelect(getField("expenseitems"));
    });

    // 削除 (CmdSel3): the row the entry works on, if it is in the list
    getField("btnExpenseDelete")?.addEventListener("click", () => {

        if (!confirm("削除してもよいですか？")) {
            focusAndSelect(getField("expenseitems"));
            return;
        }

        hasChanges = true;

        expenses = expenses.filter(r => r.キー !== expenseKey);

        clearExpenseEntry();
        renderExpenses();
        focusAndSelect(getField("expenseitems"));
    });

    // 中止 (CmdSel4)
    getField("btnExpenseCancel")?.addEventListener("click", () => {
        clearExpenseEntry();
        focusAndSelect(getField("expenseitems"));
    });
}

// =========================================
//      運転者台帳 1-4 (legacy Dsp_Clr / Dsp_Data 運転者台帳 part)
// =========================================

// legacy Lbl_Color("性別"): the 1:男 / 2:女 buttons show the box's value
function syncGender() {
    const value = getField("genderCode").value;
    document.querySelectorAll(".gender-group .ledger-option-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.value === value);
    });
}

// legacy Dsp_Clr: 性別 1, every 台帳 box empty, check boxes off, no photo, the histories empty
function clearLedger() {

    setAccepted("genderCode", "1");
    syncGender();

    LEDGER_FIELDS.forEach(([id]) => setAccepted(id, ""));

    document.querySelectorAll(".ledger-check").forEach(check => check.checked = false);

    showPhoto("");
    clearHistories();
}

// legacy TRUNCATE wk運転免許証履歴 … wk異動履歴 + Dsp_RClr2-9 + the grids
function clearHistories() {
    Object.keys(HISTORIES).forEach(kind => {
        HISTORIES[kind].rows = [];
        clearHistoryEntry(kind);
        renderHistory(kind);
    });
}

// legacy Dsp_Data: a NULL column keeps the Dsp_Clr value; the numbers as DecimalToString "0" / "00"
function fillLedger(d) {

    setAccepted("genderCode", d.性別 == null ? "1" : String(d.性別));
    syncGender();

    LEDGER_FIELDS.forEach(([id, column, kind]) => {

        const value = d[column];

        if (value == null) {
            return;
        }

        switch (kind) {
            case "number":
                setAccepted(id, Number(value).toFixed(0));
                break;
            case "hours":
                setAccepted(id, Number(value).toFixed(0).padStart(2, "0"));
                break;
            default:
                setAccepted(id, String(value));
        }
    });

    document.querySelectorAll(".ledger-check").forEach(check => {
        check.checked = String(d[check.dataset.column] ?? "").trim() === "1";
    });

    // the server leaves 写真パス empty when the file is not there (legacy If Dir(写真パス) <> "")
    showPhoto(d.写真パス ?? "");

    // legacy: each history copied to its wk table (Dsp_UList … Dsp_IDoList)
    Object.keys(HISTORIES).forEach(kind => {
        HISTORIES[kind].rows = (d[HISTORIES[kind].prop] ?? []).map(normalizeHistoryRow);
        renderHistory(kind);
    });
}

function collectLedger() {

    const model = { 性別: getField("genderCode").value };

    LEDGER_FIELDS.forEach(([id, column, kind]) => {
        model[column] =
            kind === "date" ? (getField(id).dataset.actualValue || null) :
            kind === "text" ? getField(id).value :
            numberOf(id);
    });

    document.querySelectorAll(".ledger-check").forEach(check => {
        model[check.dataset.column] = check.checked ? "1" : "0";
    });

    Object.values(HISTORIES).forEach(h => {
        model[h.prop] = h.rows.map(row => ({ ...row }));
    });

    return model;
}

// legacy ImgPict.ImageLocation = 写真パス (the web server serves the file)
function showPhoto(path) {

    const image = getField("driverPhoto");
    if (!image) return;

    if (!path) {
        image.hidden = true;
        image.removeAttribute("src");
        return;
    }

    image.onerror = () => image.hidden = true;
    image.onload = () => image.hidden = false;
    image.src = `${DRIVER_URL}/GetPhoto?path=${encodeURIComponent(path)}`;
}

// =========================================
//      運転者台帳 histories (legacy wk tables + MSFlxGrd2-7)
// =========================================
// Each history keeps:
//     rows   the working rows (legacy wk table) — saved by F1
//     shown  what the grid shows (legacy MSFlxGrd), redrawn after 修正 / 削除 / a load

// legacy Dsp_UList …: FormatDate(日付, F_Date) by the 和西暦 setting
function historyDate(date) {
    return DateSlots.format(dateKey(date), ledgerDateFormat());
}

// legacy Dsp_JList: 1 有責 / 2 双 / anything else 無責
function responsibilityText(value) {
    if (value == null) return "";
    const text = String(value).trim();
    return text === "1" ? "有責" : text === "2" ? " 双 " : "無責";
}

// legacy Dsp_TSList: 1 一般 / 2 特別 / 3 初任 / 4 適齢 / 5 特定
function aptitudeText(value) {
    return { "1": "一般", "2": "特別", "3": "初任", "4": "適齢", "5": "特定" }[String(value ?? "").trim()] ?? "";
}

// legacy Dsp_SList: 1 新任 / 2 高齢 / anything else 事故
function educationText(value) {
    if (value == null) return "";
    const text = String(value).trim();
    return text === "1" ? "新任" : text === "2" ? "高齢" : "事故";
}

function normalizeHistoryRow(row) {
    return { ...row, 日付: dateKey(row.日付) };
}

// legacy Dsp_RClr2-9: the entry boxes empty, the option buttons back to the first one
function clearHistoryEntry(kind) {

    const h = HISTORIES[kind];

    setAccepted(h.date, "");
    Object.values(h.texts).forEach(id => setAccepted(id, ""));

    Object.values(h.radios).forEach(([name, first]) => {
        const radio = document.querySelector(`input[name="${name}"][value="${first}"]`);
        if (radio) radio.checked = true;
    });
}

// legacy Dsp_UList …: the working rows, newest first; the first row is the current one
function renderHistory(kind) {

    const h = HISTORIES[kind];
    const body = getField(`${kind}HistoryBody`);

    h.shown = [...(h.rows ?? [])].sort((a, b) => String(b.日付).localeCompare(String(a.日付)));

    if (!body) return;

    body.replaceChildren();

    h.shown.forEach((row, index) => {

        const tr = document.createElement("tr");
        tr.className = "history-row";
        tr.tabIndex = -1;                  // legacy grids are not tab stops
        tr.dataset.kind = kind;
        tr.dataset.index = index;

        h.cells(row).forEach(value => {
            const td = document.createElement("td");
            td.textContent = value ?? "";
            tr.appendChild(td);
        });

        tr.addEventListener("click", () => selectHistoryRow(tr));
        tr.addEventListener("dblclick", () => recallHistory(kind));

        body.appendChild(tr);
    });

    body.querySelector(".history-row")?.classList.add("selected");
}

function selectHistoryRow(tr) {
    tr.parentElement.querySelectorAll(".history-row").forEach(row => row.classList.remove("selected"));
    tr.classList.add("selected");
    tr.focus();
}

function onHistoryGridKey(event, tr) {

    if (event.key === "Enter") {
        event.preventDefault();
        selectHistoryRow(tr);
        recallHistory(tr.dataset.kind);
        return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const next = event.key === "ArrowDown" ? tr.nextElementSibling : tr.previousElementSibling;
        if (next) selectHistoryRow(next);
    }
}

// ↑呼出 / double click / Enter (legacy CmdSelX1 → Dsp_Rireki): the grid row's date is looked up in the
// working rows; found → the entry shows it as kept values. The cursor goes to the date.
function recallHistory(kind) {

    const h = HISTORIES[kind];
    const tr = getField(`${kind}HistoryBody`)?.querySelector(".history-row.selected");

    if (!tr) return;

    const date = h.shown[Number(tr.dataset.index)]?.日付;

    clearHistoryEntry(kind);

    const row = h.rows.find(r => r.日付 === date);

    if (row) {
        setAccepted(h.date, row.日付);
        Object.entries(h.texts).forEach(([column, id]) => setAccepted(id, row[column] ?? ""));

        Object.entries(h.radios).forEach(([column, [name]]) => {
            const radio = document.querySelector(`input[name="${name}"][value="${String(row[column] ?? "").trim()}"]`);
            if (radio) radio.checked = true;
        });
    }

    focusAndSelect(getField(h.date));
}

function historyEntryIsEmpty(h, what) {
    return what === "date" ? !getField(h.date).dataset.actualValue : getField(h.texts[what]).value === "";
}

function historyCodeIsEmpty() {
    if (getField("driver-code").value === "") {
        alert("運転手コードを入力してください");
        focusAndSelect(getField("driver-code"));
        return true;
    }
    return false;
}

// ↓修正 (legacy CmdSelX2 + Wk_XRepl): the entry is added to the working rows, or replaces the row of its date
function modifyHistory(kind) {

    const h = HISTORIES[kind];

    if (historyCodeIsEmpty()) return;

    for (const [what, message] of h.modify) {
        if (historyEntryIsEmpty(h, what)) {
            alert(message);
            focusAndSelect(getField(what === "date" ? h.date : h.texts[what]));
            return;
        }
    }

    if (!confirm("修正してもよいですか？")) {
        focusAndSelect(getField(h.date));
        return;
    }

    hasChanges = true;

    const values = { 日付: getField(h.date).dataset.actualValue };

    Object.entries(h.texts).forEach(([column, id]) => values[column] = getField(id).value);

    Object.entries(h.radios).forEach(([column, [name, first]]) => {
        values[column] = document.querySelector(`input[name="${name}"]:checked`)?.value ?? first;
    });

    const existing = h.rows.find(r => r.日付 === values.日付);

    if (existing) {
        Object.assign(existing, values);
    } else {
        h.rows.push(values);
    }

    clearHistoryEntry(kind);
    renderHistory(kind);
    focusAndSelect(getField(h.date));
}

// 削除 (legacy CmdSelX3): the working row of the entry's date goes
function deleteHistory(kind) {

    const h = HISTORIES[kind];

    if (historyCodeIsEmpty()) return;

    if (h.deleteNeedsDate && historyEntryIsEmpty(h, "date")) {
        alert(h.modify.find(([what]) => what === "date")[1]);
        focusAndSelect(getField(h.date));
        return;
    }

    if (!confirm("削除してもよいですか？")) {
        focusAndSelect(getField(h.date));
        return;
    }

    hasChanges = true;

    const date = getField(h.date).dataset.actualValue;
    if (date) {
        h.rows = h.rows.filter(r => r.日付 !== date);
    }

    clearHistoryEntry(kind);
    renderHistory(kind);

    if (!h.deleteKeepsFocus) {
        focusAndSelect(getField(h.date));
    }
}

// 中止 (legacy CmdSelX4)
function cancelHistory(kind) {
    clearHistoryEntry(kind);
    focusAndSelect(getField(HISTORIES[kind].date));
}

function initializeLedger() {

    // 性別 buttons (legacy LblNKbn2_Click → Lbl_Color2): the value and its kept value (no change flag), then 選任年月日
    document.querySelectorAll(".gender-group .ledger-option-btn").forEach(button => {

        button.tabIndex = -1;
        button.addEventListener("mousedown", event => event.preventDefault());

        button.addEventListener("click", () => {
            setAccepted("genderCode", button.dataset.value);
            syncGender();
            focusAndSelect(getField("appointmentDate"));
        });
    });

    // check boxes and option buttons: mouse only, no change flag (legacy ChkS / ChkTK / OptSeki / OptTS / OptK)

    // 写真の参照 (legacy CmdPict: a Windows file dialog). A browser cannot give the file's path:
    // the path is typed in ファイル名.
    getField("photoBrowseBtn")?.addEventListener("click", () => showNAMessage?.());

    Object.entries(HISTORIES).forEach(([kind, h]) => {
        getField(`btn${h.key}Recall`)?.addEventListener("click", () => recallHistory(kind));
        getField(`btn${h.key}Modify`)?.addEventListener("click", () => modifyHistory(kind));
        getField(`btn${h.key}Delete`)?.addEventListener("click", () => deleteHistory(kind));
        getField(`btn${h.key}Cancel`)?.addEventListener("click", () => cancelHistory(kind));
        getField(`btn${h.key}Print`)?.addEventListener("click", () => showNAMessage?.());

        h.rows = [];
        renderHistory(kind);
    });
}

// =========================================
//      F6 マスタ検索 (legacy Seek_Para)
// =========================================

const SEEK_FIELDS = {
    "vehicle-code": "車輌",
    "charteredVehicle-code": "傭車",
    "department-code": "部門",
    "expenseitems": "経費",
    "exp-vehicle-code": "車輌2",
    "affilation-code": "所属"
};

function setSeekPara(value) {
    seekPara = value;
    getField("btnMasterSearch").disabled = value === "";
}

function openMasterSearch() {

    switch (seekPara) {

        case "車輌":
            pendingSearch = { field: "vehicle-code", reloadOptions: true };
            document.dispatchEvent(new CustomEvent("openVehicleSearchPopup", { detail: { activeOnly: false } }));
            break;

        case "傭車":
            pendingSearch = { field: "charteredVehicle-code", reloadOptions: true };
            document.dispatchEvent(new CustomEvent("openCharteredSearchPopup", { detail: { activeOnly: false } }));
            break;

        case "部門":
            pendingSearch = { field: "department-code" };
            document.dispatchEvent(new CustomEvent("openDepartmentSearchPopup"));
            break;

        case "経費":
            pendingSearch = { field: "expenseitems" };
            document.dispatchEvent(new CustomEvent("openExpenseSearchPopup"));
            break;

        case "車輌2":
            pendingSearch = { field: "exp-vehicle-code" };
            document.dispatchEvent(new CustomEvent("openVehicleSearchPopup", { detail: { activeOnly: false } }));
            break;

        // 所属検索 (legacy FrmSeek_Mast1 所属) is not migrated yet
        case "所属":
            showNAMessage();
            break;
    }
}

// A pick puts the code in the box and moves on, so the box is checked as on a forward move
// (legacy: TxtXxx.Text = SELDATAM1 : NextBox.Focus() → TxtXxx_LostFocus).
async function applySearchPick(code) {

    const search = pendingSearch;
    pendingSearch = null;

    if (!search || !code) return;

    if (search.reloadOptions) {
        await reloadOptions();      // legacy Set_Cmb after FrmSeek_Car / FrmSeek_User
    }

    const field = getField(search.field);
    field.value = code;

    if (await commitField(field)) {
        focusAndSelect(nextControl(field));
    } else {
        focusAndSelect(field);
    }
}

// a search closed without a pick: back to the box (legacy: Else TxtXxx.Focus())
function searchCancelled() {

    const search = pendingSearch;
    pendingSearch = null;

    if (search) focusAndSelect(getField(search.field));
}

function initializeSearchEvents() {

    document.addEventListener("vehicle-search-selected", e => {
        if (pendingSearch?.field === "vehicle-code" || pendingSearch?.field === "exp-vehicle-code") {
            applySearchPick(e.detail?.vehicleCode);
        }
    });

    document.addEventListener("chartered-search-selected", e => {
        if (pendingSearch?.field === "charteredVehicle-code") applySearchPick(e.detail?.charteredCode);
    });

    document.addEventListener("chartered-search-closed", () => {
        if (pendingSearch?.field === "charteredVehicle-code") searchCancelled();
    });

    document.addEventListener("department-search-selected", e => {
        if (pendingSearch?.field === "department-code") applySearchPick(e.detail?.code);
    });

    document.addEventListener("department-search-closed", () => {
        if (pendingSearch?.field === "department-code") searchCancelled();
    });

    document.addEventListener("expense-search-selected", e => {
        if (pendingSearch?.field === "expenseitems") applySearchPick(e.detail?.expenseCode);
    });

    document.addEventListener("expense-search-closed", () => {
        if (pendingSearch?.field === "expenseitems") searchCancelled();
    });

    // F5 運転手検索 (legacy FrmSeek_Tanto, SelMX = "")
    document.addEventListener("driver-search-selected", async e => {

        if (!pendingSearch?.driver) return;
        pendingSearch = null;

        const code = e.detail?.driverCode;
        if (!code) return;

        if (hasChanges && !confirm("内容が変更されております。よろしいですか？")) {
            return;
        }

        if (await loadDriver(code)) {
            focusAndSelect(getField("driverName"));
        }
    });
}

// =========================================
//              F-keys
// =========================================

// F1 (legacy Input_Chk + Data_Repl)
async function saveDriver() {

    const code = getField("driver-code");

    // the screen checks first, in the legacy Input_Chk order
    const error = checkInput();
    if (error) {
        alert(error.message);
        if (error.tab) showTab(error.tab);
        focusAndSelect(getField(error.field));
        return;
    }

    const model = collectModel();

    try {
        const response = await fetch(`${DRIVER_URL}/Save`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "RequestVerificationToken": getAntiForgeryToken()
            },
            body: JSON.stringify(model)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.message);
            return;
        }

        // legacy: TxtCarCd = "" : Dsp_Clr : Set_Code : TxtCode.Focus (no message)
        await startNewDriver();

    } catch {
        alert("登録中に異常が発生しました！！");
    }
}

// legacy Input_Chk messages and the tab it opens
function checkInput() {

    const value = id => getField(id).value;

    if (value("driver-code") === "") {
        return { message: "運転手ｺｰﾄﾞを入力してください", field: "driver-code" };
    }

    if (value("driver-code") === "0000000000") {
        return { message: "運転手コード：0000000000 は手入力用コードなのでマスタ登録はできません", field: "driver-code" };
    }

    if (value("driverName") === "") {
        return { message: "運転手名を入力してください", field: "driverName" };
    }

    if (value("furigana") === "") {
        return { message: "フリガナを入力してください", field: "furigana", tab: "basicSetting" };
    }

    if (value("driverCategory") === "") {
        return { message: "運転手区分を入力して下さい。", field: "driverCategory", tab: "basicSetting" };
    }

    if (!["0", "1", "2"].includes(value("driverCategory"))) {
        return { message: "運転手区分を正しく入力して下さい。", field: "driverCategory", tab: "basicSetting" };
    }

    if (["1", "2"].includes(value("driverCategory")) && value("charteredVehicle-code") === "") {
        return { message: "傭車を入力してください", field: "charteredVehicle-code", tab: "basicSetting" };
    }

    // legacy SelectedIndex = 2: the third shown tab (給与 only while 固定経費 is licensed)
    const payrollTab = tabAtIndex(2);

    if (value("employeementCategory") === "") {
        return { message: "雇用区分を入力して下さい。", field: "employeementCategory", tab: payrollTab };
    }

    if (!["0", "1", "2", "3", "4", "5", "6"].includes(value("employeementCategory"))) {
        return { message: "雇用区分を正しく入力して下さい。", field: "employeementCategory", tab: payrollTab };
    }

    // legacy SelectedIndex = 5 (運転者台帳1 while all the option tabs are licensed).
    // Empty: legacy then focuses TxtCarKbn, which is on another page, so the cursor stays where it is.
    const genderTab = tabAtIndex(5);

    if (value("genderCode") === "") {
        return { message: "性別を入力して下さい。", field: null, tab: genderTab };
    }

    if (!["1", "2"].includes(value("genderCode"))) {
        return { message: "性別を正しく入力して下さい。", field: genderTab === "driverLedger1" ? "genderCode" : null, tab: genderTab };
    }

    return null;
}

// the tab legacy SSActiveTabs1.SelectedIndex = index selects (the unlicensed tabs are removed)
function tabAtIndex(index) {
    const shown = Array.from(document.querySelectorAll(".tab-button")).filter(button => !button.hidden);
    return shown[index]?.dataset.tab ?? null;
}

function numberOf(id) {
    const text = getField(id).value.replace(/,/g, "").trim();
    return text === "" ? null : Number(text);
}

function collectModel() {

    const value = id => getField(id).value;
    const date = id => getField(id).dataset.actualValue || null;

    return {
        IsNewRecord: !isEditMode,
        運転手コード: value("driver-code"),
        運転手名: value("driverName"),
        ふりがな: value("furigana"),
        郵便: value("zipCode"),
        住所1: value("addressField1"),
        住所2: value("addressField2"),
        電話番号: value("phoneNumber"),
        携帯番号: value("mobilePhone"),
        生年月日: date("dateOfBirth"),
        入社日: date("dateOfJoining"),
        退社日: date("dateOfLeaving"),
        運転手区分: value("driverCategory"),
        車輌コード: value("vehicle-code"),
        傭車コード: value("charteredVehicle-code"),
        部門コード: value("department-code"),
        備考: value("remarks"),
        配車表示: getField("unitPrice-display").checked ? "1" : "0",
        手当掛率: numberOf("payrollOptInp"),
        所属コード: value("affilation-code"),
        雇用区分: value("employeementCategory"),
        所定労働: numberOf("scheduled-working-days"),
        デジタココード: value("digitaco"),
        ETCカード: value("etcOptSetting"),

        // without the 固定経費 licence the tab is not shown: the stored rows stay (null)
        固定経費: license.fixedCost
            ? expenses.map(row => ({ ...row, キー: row.キー > 0 ? row.キー : 0 }))
            : null,

        ...collectLedger()
    };
}

// legacy Dsp_Clr + Set_Code + TxtCode.Focus
async function startNewDriver() {

    clearScreen();

    const response = await fetch(`${DRIVER_URL}/GetNextGeneratedCode`);
    const result = await response.json();

    setAccepted("driver-code", result.code ?? "");
    hasChanges = false;

    focusAndSelect(getField("driver-code"));
}

// F2 (legacy Fkey 2): the values stay; the screen becomes 新規 with the next code.
// The 固定経費 rows are dropped (legacy truncates wk固定経費マスタ表示).
async function copyDriver() {

    const response = await fetch(`${DRIVER_URL}/GetNextGeneratedCode`);
    const result = await response.json();

    setAccepted("driver-code", result.code ?? "");

    expenses = [];
    clearExpenseEntry();
    renderExpenses();

    // legacy also truncates the 8 history wk tables: the copy has no histories (the 台帳 boxes stay)
    clearHistories();

    setEditMode(false);
    isCopyMode = true;
    showTab("basicSetting");

    hasChanges = false;
    focusAndSelect(getField("driver-code"));
}

// F4 (legacy Del_Chk, then the question)
async function deleteDriver() {

    const code = getField("driver-code").value;

    try {
        const checkResponse = await fetch(`${DRIVER_URL}/CheckDelete?code=${encodeURIComponent(code)}`);
        const check = await checkResponse.json();

        if (!checkResponse.ok) throw new Error();

        // legacy: the message, then Exit Sub (the cursor stays)
        if (!check.canDelete) {
            alert(check.message);
            return;
        }

        if (!confirm("削除してもよいですか？")) {
            focusAndSelect(getField("driverName"));
            return;
        }

        const response = await fetch(`${DRIVER_URL}/Delete?code=${encodeURIComponent(code)}`, {
            method: "POST",
            headers: { "RequestVerificationToken": getAntiForgeryToken() }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            if (result.message) alert(result.message);
            focusAndSelect(getField("driverName"));
            return;
        }

        await startNewDriver();

    } catch {
        alert("削除中に異常が発生しました！！");
        focusAndSelect(getField("driverName"));
    }
}

// F5 (legacy FrmSeek_Tanto)
function openDriverSearch() {
    pendingSearch = { driver: true };
    document.dispatchEvent(new CustomEvent("openDriverSearchPopup", { detail: { activeOnly: false } }));
}

// F7 / F8 (legacy Data_Move); both end on 運転手名
async function moveDriver(direction) {

    if (hasChanges && !confirm("内容が変更されております。よろしいですか？")) {
        focusAndSelect(editingControl);
        return;
    }

    const code = pad(getField("driver-code").value, CODE_LENGTH);
    const action = direction < 0 ? "GetPreviousCode" : "GetNextCode";

    const response = await fetch(`${DRIVER_URL}/${action}?code=${encodeURIComponent(code)}`);
    const result = await response.json();

    if (result.code) {
        await loadDriver(result.code);
    } else {
        alert(direction < 0 ? "これより前のデータはありません！！" : "これより次のデータは有りません！！");
    }

    focusAndSelect(getField("driverName"));
}

// F11 (legacy Fkey 11)
async function cancelDriver() {

    if (hasChanges && !confirm("内容が変更されております。よろしいですか？")) {
        focusAndSelect(editingControl);
        return;
    }

    await startNewDriver();
}

// F12 (legacy FormClosing)
function exitDriver() {

    if (hasChanges && !confirm("変更されていますが、よろしいですか ?")) {
        focusAndSelect(editingControl);
        return;
    }

    // opened from 運転手検索 F10: close the modal of that search
    if (isFromSearch && window.parent !== window) {
        window.parent.postMessage({ action: "closeDriverMasterModal" }, window.location.origin);
        return;
    }

    const exitUrl = getField("btnExit").dataset.exitUrl;

    if (exitUrl) {
        window.location.href = exitUrl;
    }
}

// =========================================
//              Start
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

    isFromSearch = getField("btnExit")?.dataset.fromSearch === "true";

    initializeDriverTabs();
    initializeInputRules();
    initializeOptionButtons();
    initializeSelects();
    initializeDateBoxes();
    initializeExpenseButtons();
    initializeLedger();
    initializeSearchEvents();

    getField("btnRegister")?.addEventListener("click", saveDriver);
    getField("btnCopy")?.addEventListener("click", copyDriver);
    getField("btnDelete")?.addEventListener("click", deleteDriver);
    getField("btnSearch")?.addEventListener("click", openDriverSearch);
    getField("btnMasterSearch")?.addEventListener("click", openMasterSearch);
    getField("btnPrevious")?.addEventListener("click", () => moveDriver(-1));
    getField("btnNext")?.addEventListener("click", () => moveDriver(1));
    getField("btnF10")?.addEventListener("click", () => showNAMessage?.());
    getField("btnCancel")?.addEventListener("click", cancelDriver);
    getField("btnExit")?.addEventListener("click", event => {
        event.preventDefault();
        exitDriver();
    });

    // 〒→住所 / 住所→〒 (legacy FrmSeek_Post / FrmSeek_Post2): the postal searches are not migrated yet
    getField("zipCodeBtn1")?.addEventListener("click", () => showNAMessage?.());
    getField("zipCodeBtn2")?.addEventListener("click", () => showNAMessage?.());

    try {
        const response = await fetch(`${DRIVER_URL}/GetInitialData`);
        const data = await response.json();

        license = data.license ?? license;
        vehicleOptions = data.vehicles ?? [];
        charteredOptions = data.chartered ?? [];

        fillSelect("vehicle-name", vehicleOptions);
        fillSelect("charteredVehicle-name", charteredOptions);
        applyLicenses();

        clearScreen();
        setAccepted("driver-code", data.nextCode ?? "");
        hasChanges = false;

    } catch {
        alert("運転手マスタ画面の読み込みに失敗しました。");
    }

    setSeekPara("");
    focusAndSelect(getField("driver-code"));
});
