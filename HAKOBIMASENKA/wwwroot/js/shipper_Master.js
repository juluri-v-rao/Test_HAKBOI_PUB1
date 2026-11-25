
let isEditMode = false;
let hasChanges = false;
let committedFieldValues = new Map();
let isCopyMode = false;
let isProcessingShipperCode = false;
let isSaving = false;
let lastFocusedFieldBeforeBtnAction = null;
let currentHistoryRow = null;
let lastProcessedShipperCode = "";
// Track the currently focused master search field.
let activeMasterSearchField = null;
let activeBranchSearchField = null;
let kanriPlKbn = "0";
let eraInput = false;

// Master search popup mapping.
const masterSearchMapping = {
    "department-code": "openDepartmentSearchPopup",
    "settlementReceipt": "openMasterShipperSearchPopup",
    "branch-code1": "openCompanyBranchSearchPopup",
    "branch-code2": "openCompanyBranchSearchPopup",
    "bankCode": "openBankSearchPopup"
};

document.addEventListener("DOMContentLoaded", function () {
    initializeTabs();
    initializeShipperEvents();
    initializeEnterTabNavigation();
    initializeCalculationButtons();
    initializeHistoryButtons();
    initializeHistoryCalculations();
    initializeShipperInputRestrictions();
    formatAllDecimals();

    document.querySelectorAll(
        ".main-container input, .main-container select, .main-container textarea"
    ).forEach(field => {

        if (
            field.id === "shipper-code" ||
            field.readOnly
        ) {
            return;
        }

    });

    // Track only values committed using Enter or Tab.
    document.addEventListener("keydown", trackCommittedField, true);

    isEditMode = false;
    setEditMode();

    setComboBoxes();
    getSystemDefaults();
    hideUnlicensedTabs();
    getkanriPlKbn();
    getNextGeneratedCode();
    searchModeButtonCorrection();

    focusShipperCode();

    initializeDateBoxes();
    applyDateSetting(DateSlots.isEra());

    document.addEventListener("shipper-search-closed", function (event) {

        if (event.detail?.mode === "settlement") {
            return;
        }

        focusShipperName1();
    });

    // Track focus for F6 master search.
    Object.keys(masterSearchMapping).forEach(function (fieldId) {

        const field = getField(fieldId);

        if (field) {
            field.addEventListener("focus", function () {

                activeMasterSearchField = fieldId;

                updateMasterSearchButton();

            });
        }

    });

    // Disable F6 initially.
    updateMasterSearchButton();

    // Disable F6 when focus moves outside the master search fields.
    document.addEventListener("focusin", function (event) {

        // Do not clear the active field when the F6 button receives focus.
        if (event.target.id === "btnMasterSearch") {
            return;
        }

        if (!Object.keys(masterSearchMapping).includes(event.target.id)) {

            activeMasterSearchField = null;

            updateMasterSearchButton();

        }

    });

    // Prevent browser default actions for F1-F12.
    document.addEventListener("keydown", function (event) {
        if (event.key.match(/^F([1-9]|1[0-2])$/)) {
            event.preventDefault();
            event.stopPropagation();
        }
    },
        true
    );

    ["shipperName1", "shipperName2"].forEach(id => {

        const field = getField(id);

        field?.addEventListener("keydown", function (e) {

            if (
                e.key === "Enter" ||
                e.key === "Tab" ||
                e.key === "ArrowDown"
            ) {
                autoFillAbbreviation();
            }

        });

    });
});

// ======================================================
//              ELEMENT HELPERS
// ======================================================

function getField(id) {
    return document.getElementById(id);
}

function getValue(id) {
    const field = getField(id);
    return field ? field.value.trim() : "";
}

function setValue(id, value) {
    const field = getField(id);

    if (field) {
        field.value = value == null ? "" : value;
    }
}

function searchModeButtonCorrection() {

    if (window.pageMode === "search") {

        const btnSearch =
            getField("btnSearch");

        const btnList =
            getField("btnList");

        const f10Button =
            document.querySelector(
                ".function-footer button:nth-child(10)"
            );

        if (btnSearch) {
            btnSearch.disabled = true;
            btnSearch.textContent = "F5:　　";
        }

        if (btnList) {
            btnList.disabled = true;
            btnList.textContent = "F9:　　";
        }

        if (f10Button) {
            f10Button.disabled = true;
            f10Button.textContent = "F10:　　";
        }
    }
}

// Store the current values as the baseline.
function resetCommittedFieldValues() {
    committedFieldValues.clear();

    document.querySelectorAll(
        ".main-container input, .main-container select, .main-container textarea"
    ).forEach(function (field) {

        if (
            field.id === "shipper-code" ||
            field.type === "button"
        ) {
            return;
        }

        const value = field.type === "checkbox"
            ? field.checked
            : field.value;

        committedFieldValues.set(field, value);
    });
}

// Mark a field as modified only when Enter or Tab is pressed.
function trackCommittedField(event) {

    if (event.key !== "Enter" && event.key !== "Tab" && event.key !== "ArrowDown") {
        return;
    }

    const field = event.target;

    if (
        !field.matches("input, select, textarea") ||
        field.id === "shipper-code" ||
        field.type === "button" ||
        field.type === "submit"
    ) {
        return;
    }

    const currentValue = field.type === "checkbox"
        ? field.checked
        : field.value;

    if ((field.id === "closingDate" || field.id === "collectionDate") && (event.key === "Enter" || event.key === "Tab" || event.key === "ArrowDown" || event.key === "ArrowUp")) {
        return;
    }

    const originalValue = committedFieldValues.get(field);

    if (currentValue !== originalValue) {
        hasChanges = true;

        // Update the committed value.
        committedFieldValues.set(field, currentValue);
    }
}

// Cut text without exceeding the specified half-width-unit limit.
function limitHalfWidthUnits(value, maxUnits) {
    let result = "";
    let total = 0;

    for (const ch of value) {
        const code = ch.codePointAt(0);

        const isHalfWidth =
            (code >= 0x0020 && code <= 0x007E) ||
            (code >= 0xFF61 && code <= 0xFF9F);

        const units = isHalfWidth ? 1 : 2;

        if (total + units > maxUnits) {
            break;
        }

        result += ch;
        total += units;
    }

    return result;
}

// 支払条件: maximum nine digits, with comma separators.
function initializeCollectionCondition() {
    const field = getField("collectionCondition");
    if (!field) return;

    field.addEventListener("input", function () {
        const digits = toHalfWidth(this.value)
            .replace(/\D/g, "")
            .substring(0, 9);

        this.value = digits;
    });

    field.addEventListener("blur", function () {
        const digits = this.value.replace(/\D/g, "");

        this.value = digits
            ? Number(digits).toLocaleString("en-US")
            : "";
    });

    if (field.value) {
        const digits = field.value.replace(/\D/g, "").substring(0, 9);
        field.value = digits ? Number(digits).toLocaleString("en-US") : "";
    }
}

// 値引率 and 手当掛率: 0.00 to 100.00.
function initializePercentageField(id) {
    const field = getField(id);
    if (!field) return;

    let lastValidValue = field.value || "0.00";

    field.addEventListener("input", function () {
        let value = toHalfWidth(this.value);

        // Only digits and one decimal point.
        value = value.replace(/[^\d.-]/g, "");

        const firstDot = value.indexOf(".");
        if (firstDot !== -1) {
            value =
                value.substring(0, firstDot + 1) +
                value.substring(firstDot + 1).replace(/\./g, "");
        }

        let parts = value.split(".");

        // Maximum three digits before decimal.
        parts[0] = (parts[0] || "").substring(0, 3);

        // Maximum two digits after decimal.
        if (parts.length > 1) {
            parts[1] = parts[1].substring(0, 2);
        }

        value = parts.join(".");

        // Do not accept a value greater than 100.
        if (value !== "" && (Number(value) > 100 || Number(value) < -99.99)) {
            this.value = lastValidValue;
            return;
        }

        this.value = value;
        lastValidValue = value;
    });

    field.addEventListener("blur", function () {
        if (this.value === "") {
            this.value = "0.00";
        } else {
            this.value = Number(this.value).toFixed(2);
        }

        lastValidValue = this.value;
    });

    if (field.value === "") {
        field.value = "0.00";
    }
}

// =============================================
//          Initialize Decimal Place Fields
// =============================================
function initializeDecimalPlaceField(id, maxValue) {
    const field = getField(id);

    if (!field) return;

    field.addEventListener("input", function () {

        let value = this.value.replace(/\D/g, "");

        if (value !== "" && Number(value) > maxValue) {
            value = String(maxValue);
        }

        this.value = value;
    }
    );

    field.addEventListener("blur", function () {

        if (this.value === "") {
            this.value = "0";
        }
    }
    );
}

// Initialize all Shipper Master field restrictions.
function initializeShipperInputRestrictions() {

    // Half-width-unit text limits.
    attachTextLimit("shipperName1", 30);
    attachTextLimit("shipperName2", 30);
    attachTextLimit("furigana", 32, true);
    attachTextLimit("abbreviation", 16);
    attachTextLimit("addressField1", 32);
    attachTextLimit("addressField2", 32);
    attachTextLimit("remarks", 50);
    attachTextLimit("email", 50, true);

    // Half-width-only fields.
    attachTextLimit("phoneNumber", 15, true);
    attachTextLimit("fax", 15, true);

    // Numeric fields.
    attachDigitLimit("digitaco", 15);
    attachDigitLimit("shipper-code", 10);
    attachDigitLimit("department-code", 2, 2);
    attachDigitLimit("closingDate", 2, 2);
    attachDigitLimit("settlementReceipt", 10);
    attachDigitLimit("unit-code", 1);
    attachDigitLimit("collectionTerms", 1);
    attachDigitLimit("collectionDate", 2, 2);
    attachDigitLimit("collectionMethod1-code", 2, 2);
    attachDigitLimit("collectionMethod2-code", 2, 2);
    attachDigitLimit("collectionMethod3-code", 2, 2);
    attachDigitLimit("bankCode", 2, 2);

    attachDigitLimit("decimal-places-num", 1);
    attachDigitLimit("salesFractionAmt-input", 1);
    attachDigitLimit("consumptionTaxCategory-input", 1);
    attachDigitLimit("consumptionTaxFraction-input", 1);
    attachDigitLimit("taxableSurcharge-input", 1);
    attachDigitLimit("nonTaxableSurcharge-input", 1);
    attachDigitLimit("discountFraction-input", 1);
    attachDigitLimit("billingDateSetting-input", 1);
    attachDigitLimit("quantityDecimalPlaces", 1);
    attachDigitLimit("weightDecimalPlaces", 1);
    attachDigitLimit("unitPriceDecimalPlaces", 1);
    attachDigitLimit("branch-code1", 2, 2);
    attachDigitLimit("branch-code2", 2, 2);

    initializeDecimalPlaceField("quantityDecimalPlaces", 3);
    initializeDecimalPlaceField("weightDecimalPlaces", 3);
    initializeDecimalPlaceField("unitPriceDecimalPlaces", 2);
    // Special formats.
    initializePostalCode();
    initializeCollectionCondition();

    initializePercentageField("discount-rate");
    initializePercentageField("payrollOptInp");
}

async function readJsonResponse(response) {
    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            "処理に失敗しました。"
        );
    }

    return data;
}

// ======================================================
//              MASTER CODE LOOKUP HELPER
// ======================================================

async function getMasterName(url) {
    const response = await fetch(url);
    const result = await readJsonResponse(response);

    return result;
}

function focusShipperCode() {
    const field = getField("shipper-code");

    if (field) {
        field.focus();
        field.select();
    }
}

function focusShipperName1() {
    const field = getField("shipperName1");

    if (field) {
        field.focus();
        field.select();
    }
}

function rememberFocusedField(button) {
    button.addEventListener("mousedown", function () {
        const active = document.activeElement;

        if (active && active.matches("input, select, textarea")) {
            lastFocusedFieldBeforeBtnAction = active;
        }
    });
}

// ======================================================
//              EVENT INITIALIZATION
// ======================================================

function initializeShipperEvents() {
    const code = getField("shipper-code");

    if (code) {

        // Store the previous shipper code when the field receives focus.
        code.addEventListener("focus", function () {
            this.dataset.previousCode = this.value;
        });

        code.addEventListener("keydown", async function (event) {

            if (event.key !== "Enter" && event.key !== "Tab" && event.key !== "ArrowDown") {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const key = event.key;

            await processShipperCode();

            const shipperName1 = getField("shipperName1");

            if (!shipperName1) {
                return;
            }
        });

        code.addEventListener("blur", async function (e) {

            if (e.relatedTarget && e.relatedTarget.id === "shipperName1") {
                await processShipperCode();
                return;
            }

            // Switching to another tab: keep the shipper code.
            if (e.relatedTarget?.classList.contains("tab-button")) {
                return;
            }

            this.value = this.dataset.previousCode ?? lastProcessedShipperCode ?? "";
        });
    }

    // Destination name.
    const nameField = getField("shipperName1");
    let lastKanaReading = "";
    if (nameField) {

        nameField.addEventListener("keydown", function (event) {

            if (event.key !== "Enter") {
                return;
            }

            const shipperName = getValue("shipperName1");

            if (getValue("settlementReceipt") === getValue("shipper-code")) {
                setValue("shipper-name", getValue("shipperName1"));
            }
        });

        nameField.addEventListener("compositionupdate", function (event) {

            const reading = event.data || "";

            if (/^[\u3041-\u3096\u30A1-\u30FCー]+$/
                    .test(reading)
            ) {
                lastKanaReading = reading;
            }
        });

        nameField.addEventListener("compositionend", function () {

            const furigana =
                getField("furigana");

            if (!furigana) {
                return;
            }

            furigana.value += toHalfWidth(lastKanaReading);

            lastKanaReading = "";
        });

    }

    const registerButton = getField("btnRegister");
    if (registerButton) {
        registerButton.addEventListener("click", saveShipper);
    }

    const copyButton = getField("btnCopy");
    if (copyButton) {
        copyButton.addEventListener("click", copyShipper);
    }

    const deleteButton = getField("btnDelete");
    if (deleteButton) {
        deleteButton.addEventListener("click", deleteShipper);
    }

    const searchButton = getField("btnSearch");
    if (searchButton) {
        // F5: Open the Vehicle Search popup.
        searchButton.addEventListener("click", function () {
            document.dispatchEvent(
                new CustomEvent("openShipperSearchPopup")
            );
        });
    }

    const masterSearchButton = getField("btnMasterSearch");
    if (masterSearchButton) {

        masterSearchButton.addEventListener("click", function () {
            const popupEvent = masterSearchMapping[activeMasterSearchField];

            if (popupEvent === "openBankSearchPopup") {
                showNAMessage();
            }

            if (!popupEvent) {
                return;
            }

            activeBranchSearchField = document.activeElement.id;

            const eventOptions =
                popupEvent === "openMasterShipperSearchPopup"
                    ? {
                        detail: {
                            activeOnly: !isEditMode
                        }
                    }
                    : {};

            document.dispatchEvent(
                new CustomEvent(popupEvent, eventOptions)
            );
        });
    }

    const previousButton = getField("btnPrevious");
    if (previousButton) {
        previousButton.addEventListener("click", getPreviousShipper); // F7
    }

    const nextButton = getField("btnNext");
    if (nextButton) {
        nextButton.addEventListener("click", getNextShipperRecord); // F8
    }

    const cancelButton = getField("btnCancel");
    if (cancelButton) {
        rememberFocusedField(cancelButton);
        cancelButton.addEventListener("click", cancelShipper);
    }

    const exitButton = getField("btnExit");
    if (exitButton) {
        rememberFocusedField(exitButton);

        exitButton.addEventListener("click", function (event) {
            event.preventDefault();

            if (
                hasChanges &&
                !confirm("変更されていますが、よろしいですか ?")
            ) {
                if (lastFocusedFieldBeforeBtnAction) {
                    lastFocusedFieldBeforeBtnAction.focus();
                }
                return;
            }

            const url = this.dataset.exitUrl;

            if (window.pageMode === "search") {

                window.parent.postMessage(
                    {
                        action: "close"
                    },
                    "*"
                );

                return;
            }

            if (url) {
                window.location.href = url;
            }
        });
    }

    // Validate the settlement destination code.
    const settlementCode = getField("settlementReceipt");

    if (settlementCode) {
        settlementCode.addEventListener("keydown", async function (event) {
            if (event.key === "Enter" || event.key === "Tab" || event.key === "ArrowDown") {
                this.value = normalizeCode(this.value, 10);
                await validateSettlementDestination();
            }
        });

        // Validate settlement destination when focus leaves field.
        settlementCode.addEventListener("blur", async function (e) {

            if (e.relatedTarget?.id !== "unit-code") {

                this.value = this.dataset.previousValue ?? "";

                return;
            }

            const code = this.value.trim();

            if (!code) {
                return;
            }

            await validateSettlementDestination();
        }
        );
    }

    // Update payment method code fields when dropdowns change.
    ["collectionMethod1-name", "collectionMethod2-name", "collectionMethod3-name"].forEach(function (id) {
        const select = getField(id);

        if (select) {
            select.addEventListener("change", function () {
                const codeId = id === "collectionMethod1-name"
                    ? "collectionMethod1-code"
                    : id === "collectionMethod2-name"
                        ? "collectionMethod2-code"
                        : "collectionMethod3-code";

                setValue(codeId, this.value);
            });
        }
    });

    initializeUnitDropdownEvent();

    // These lookups require backend endpoints that are not currently defined.
    // ZIP CODE, BANK CODE, DEPARTMENT CODE NEEDS TO CHANGE
    const zipButtons = document.querySelectorAll(".zipCode-row button");

    const zipCodeBtn1 = getField("zipCodeBtn1");
    if (zipCodeBtn1) {
        zipCodeBtn1.addEventListener("click", () => showNAMessage());
        /*function () {
            //setMessage("郵便番号検索のAPIが未実装です。");
            alert("郵便番号検索は未実装です。");
        });*/
    }

    const zipCodeBtn2 = getField("zipCodeBtn2");
    if (zipCodeBtn2) {
        zipCodeBtn2.addEventListener("click", () => showNAMessage());
        /*function () {
            //setMessage("住所から郵便番号を検索するAPIが未実装です。");
            alert("住所検索は未実装です。");
        });*/
    }

    // Department - First tab
    bindLookupEvent("department-code", getDepartmentName);

    // Billing category - Second tab
    bindLookupEvent("unit-code", getBillingCategory);

    // Collection method 1 - Second tab
    bindLookupEvent("collectionMethod1-code", getCollectionMethod1);

    // Collection method 2 - Second tab
    bindLookupEvent("collectionMethod2-code", getCollectionMethod2);

    // Billing history Collection method
    bindLookupEvent("collectionMethod3-code", getCollectionMethod3);

    // Bank - Second tab
    bindLookupEvent("bankCode", getBankName);

    // Billing History - Branch Code
    const billingBranchCode = getField("branch-code1");

    if (billingBranchCode) {

        const billingBranchName = getField("billing-branch-name");

        billingBranchCode.dataset.previousValue = billingBranchCode.value;
        billingBranchCode.dataset.previousName = billingBranchName?.value || "";
        billingBranchCode.dataset.commitRequested = "false";

        // Commit the code when Enter or Tab is pressed
        billingBranchCode.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === "Tab" || event.key === "ArrowDown") {
                event.preventDefault();

                billingBranchCode.dataset.commitRequested = "true";

                getBranchName("branch-code1", "billing-branch-name")
                    .then(function () {

                        getField("fromDate_bill")?.focus();
                    })
                    .finally(function () {

                        billingBranchCode.dataset.commitRequested = "false";
                    });
            }
        });

        // Restore the previous values only when leaving without Enter or Tab
        billingBranchCode.addEventListener("blur", function () {
            if (billingBranchCode.dataset.commitRequested === "true") {
                return;
            }

            billingBranchCode.value = billingBranchCode.dataset.previousValue || "";
            setValue("billing-branch-name", billingBranchCode.dataset.previousName || "");
        });

    }

    // Accounts Receivable History - Branch Code
    const arBranchCode = getField("branch-code2");

    if (arBranchCode) {

        const arBranchName = getField("ar-branch-name");

        // Store the initially committed values
        arBranchCode.dataset.previousValue = arBranchCode.value;
        arBranchCode.dataset.previousName = arBranchName?.value || "";
        arBranchCode.dataset.commitRequested = "false";

        // Commit the code when Enter or Tab is pressed
        arBranchCode.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === "Tab" || event.key === "ArrowDown") {
                event.preventDefault();
                arBranchCode.dataset.commitRequested = "true";

                getBranchName("branch-code2", "ar-branch-name")
                    .then(function () {

                        getField("fromDate_Ar")?.focus();
                    })
                    .finally(function () {

                        arBranchCode.dataset.commitRequested = "false";
                    });
            }
        });

        // Restore the previous values only when leaving without Enter or Tab
        arBranchCode.addEventListener("blur", function () {
            if (arBranchCode.dataset.commitRequested === "true") {
                return;
            }

            arBranchCode.value = arBranchCode.dataset.previousValue || "";
            setValue("ar-branch-name", arBranchCode.dataset.previousName || "");
        });

    }

    document.querySelectorAll(".function-footer button").forEach(button => {

        button.addEventListener(
            "mousedown",
            function (event) {
                event.preventDefault();
            });
    });

    // Receive 荷主コード from the Vehicle Search popup.
    document.addEventListener("shipper-search-selected", async function (event) {

        if (hasChanges && !confirm("内容が変更されております。よろしいですか？")) {
            return;
        }
        const shipperCode = document.getElementById("shipper-code");

        if (!shipperCode) return;

        // Set the selected 車輌コード.
        shipperCode.value = event.detail.shipperCode ?? "";

        // Trigger the existing lookup immediately.
        // Replace getShipperByCode() with your existing lookup function name.
        await getShipperByCode(shipperCode.value);
    });

    // F6 - Receive selected shipper for Settlement Receipt.
    document.addEventListener("master-shipper-search-selected", function (event) {

        if (!getField("settlementReceipt") || !getField("shipper-name")) {
            return;
        }

        setValue("settlementReceipt", event.detail.code ?? "");
        getField("settlementReceipt").dataset.previousValue = event.detail.code ?? "";
        setValue("shipper-name", event.detail.name ?? "");

        getField("unit-code").focus();

        hasChanges = true;

    });

    // Receive 部門詳細 from the Department Search popup.
    document.addEventListener("department-search-selected", async function (event) {

        if (!getField("department-code") || !getField("department-name")) return;
        const previousCode = getField("department-code")?.dataset.previousValue || "";
        if (previousCode !== event.detail.code) {
            hasChanges = true;
        }

        setValue("department-code", event.detail.code ?? "");
        setValue("department-name", event.detail.departmentName ?? "");
        getField("department-code").dataset.previousValue = event.detail.code;
        document.querySelector(".tab-button.active")?.focus();
    });

    // Receive 自社支店詳細 from the Company branch Search popup.
    document.addEventListener("company-branch-search-selected", async function (event) {

        //const activeField = document.activeElement.id;
        if (activeBranchSearchField === "branch-code1") {

            if (!getField("branch-code1") || !getField("billing-branch-name")) return;
            const branchOldCode1 = getValue("branch-code1");
            if (branchOldCode1 !== event.detail.companyCode) {
                hasChanges = true;
            }
            setValue("branch-code1", event.detail.companyCode ?? "");
            setValue("billing-branch-name", event.detail.abbreviation ?? "");

            getField("fromDate_bill").focus();
        }
        else if (activeBranchSearchField === "branch-code2") {
            if (!getField("branch-code2") || !getField("ar-branch-name")) return;
            const branchOldCode2 = getValue("branch-code2");
            if (branchOldCode2 !== event.detail.companyCode) {
                hasChanges = true;
            }
            setValue("branch-code2", event.detail.companyCode ?? "");
            setValue("ar-branch-name", event.detail.abbreviation ?? "");
            getField("fromDate_Ar").focus();
        }
        activeBranchSearchField = null;
    });

    document.addEventListener("bank-search-selected", function (event) {

        setValue("bankCode", event.detail.code);

        setValue("bankName1", event.detail.bankName1);

        setValue("bankName2", event.detail.bankName2);

        document.querySelector(".tab-button.active")?.focus();
    });

}

function validateFieldBeforeMove(field) {

    const value = field.value.trim();
    const previousValue = committedFieldValues.get(field) ?? "";

    switch (field.id) {

        case "closingDate":
        case "collectionDate": {

            if (!value) {
                field.value = previousValue;
                field.focus();
                return false;
            }

            if (value) {
                const number = Number(value);

                if (!Number.isInteger(number) || number < 1 || number > 31) {
                    alert(`${field.id === "closingDate"
                        ? "締め日"
                        : "回収日"}を正しく入力して下さい！！（1～31）`);

                    // Restore the last committed value.
                    field.value = previousValue;
                    field.focus();
                    field.select();

                    return false;
                }

            }

            break;
        }

        case "decimal-places-num":
        case "salesFractionAmt-input":
        case "consumptionTaxCategory-input":
        case "consumptionTaxFraction-input":
        case "discountFraction-input":
        case "billingDateSetting-input": {

            if (!["0", "1", "2"].includes(value)) {
                const labels = {
                    "decimal-places-num": "端数桁数",
                    "salesFractionAmt-input": "売上端数",
                    "consumptionTaxCategory-input": "消費税区分",
                    "consumptionTaxFraction-input": "消費税端数",
                    "discountFraction-input": "値引端数",
                    "billingDateSetting-input": "請求日設定"
                };
                alert(`${labels[field.id]}を正しく入力して下さい！！（0・1・2）`);
                field.value = previousValue;
                field.focus();
                field.select();

                return false;
            }

            break;
        }

        case "taxableSurcharge-input":
        case "nonTaxableSurcharge-input": {

            if (!["0", "1"].includes(value)) {
                const labels = {
                    "taxableSurcharge-input": "課税割増",
                    "nonTaxableSurcharge-input": "非課税割増"
                };
                alert(`${labels[field.id]}を正しく入力して下さい！！（0・1）`);
                field.value = previousValue;
                field.focus();
                field.select();

                return false;
            }

            break;
        }
    }

    return true;
}

// ======================================================
//          ENTER / TAB FIELD NAVIGATION
// ======================================================

function initializeEnterTabNavigation() {
    document.addEventListener("keydown", function (event) {
        const currentField = event.target;

        if (event.key !== "Enter" && event.key !== "Tab" &&
            event.key !== "ArrowDown" && event.key !== "ArrowUp") {
            return;
        }

        // Do not interfere with another keydown handler
        // that has already handled this event.
        if (event.defaultPrevented) {
            return;
        }

        if (currentField.classList.contains("tab-button") && (event.key === "Enter" || event.key === "ArrowDown")) {

            event.preventDefault();

            focusFirstActiveTabField();

            return;
        }

        // Process only input fields and dropdowns.
        if (!currentField.matches("input, select, textarea")) {
            return;
        }

        // Do not interfere with Enter inside a textarea.
        if (currentField.tagName === "TEXTAREA") {
            return;
        }

        // Handle Shipper Code navigation.
        if (currentField.id === "shipper-code") {

            if (event.key === "ArrowDown") {
                event.preventDefault();

                // Move from Shipper Code to Shipper Name 1.
                focusShipperName1();
            }

            return;
        }

        const shipperName1 = getField("shipperName1");
        const shipperName2 = getField("shipperName2");
        const shipperCode = getField("shipper-code");
        const furigana = getField("furigana");

        // Mandatory validation for 荷主名1.
        if (currentField === shipperName1 && event.key !== "ArrowUp") {
            if (shipperName1.value.trim() === "") {
                event.preventDefault();
                shipperName1.value = shipperName1.dataset.keepValue || "";
                focusShipperName1();
                return;
            }

            // Name 1 is filled: Both Enter and Tab
            // move to Shipper Name 2.
            event.preventDefault();

            if (shipperName2) {
                shipperName2.focus();
            }

            return;
        }

        // -------------------------------------------------
        // Furigana: Mandatory validation.
        // -------------------------------------------------
        if (currentField === furigana && event.key !== "ArrowUp") {

            if (furigana.value.trim() === "") {

                event.preventDefault();
                furigana.value = furigana.dataset.keepValue || "";
                furigana.focus();
                furigana.select();

                return;
            }

        }

        if (currentField.id === "ar-consumption-tax") {

            event.preventDefault();

            getField("ar_EditBtn")?.focus();

            return;
        }

        // -------------------------------------------------
        // UP ARROW: Move to previous field.
        // -------------------------------------------------
        if (event.key === "ArrowUp") {

            // Get all fields above and inside the active tab.
            const activeFields = getActiveTabFields();

            const allFields = [
                shipperCode,
                shipperName1,
                shipperName2,
                ...activeFields
            ].filter(field => {

                return (
                    field &&
                    !field.disabled &&
                    !field.readOnly &&
                    field.type !== "hidden" &&
                    field.type !== "button" &&
                    field.type !== "submit" &&
                    field.getClientRects().length > 0
                );

            });

            const currentIndex = allFields.indexOf(currentField);

            if (currentIndex > 0) {

                event.preventDefault();

                allFields[currentIndex - 1].focus();

            }

            return;
        }
        // -------------------------------------------------
        // Shipper Name 2: Move to first active tab.
        // -------------------------------------------------
        if (currentField === shipperName2) {

            event.preventDefault();

            document.querySelector(".tab-button.active")?.focus();

            return;
        }

        // -------------------------------------------------
        // Active tab fields.
        // -------------------------------------------------
        const activeFields = getActiveTabFields();
        console.log(
            activeFields.map(f => f.id)
        );
        const currentIndex = activeFields.indexOf(
            currentField
        );

        if (currentIndex === -1) {
            return;
        }

        event.preventDefault();

        // -------------------------------------------------
        // ENTER KEY
        // -------------------------------------------------
        if (event.key === "Enter" || event.key === "ArrowDown") {
            if (!validateFieldBeforeMove(currentField)) {
                return;
            }

            if (currentIndex < activeFields.length - 1) {
                // Move to next field.
                activeFields[currentIndex + 1].focus();

            }
            else {

                // Last field -> Active tab name.
                const activeTabButton = document.querySelector(
                    ".tab-button.active"
                );

                if (activeTabButton) {
                    activeTabButton.focus();
                }

            }

            return;
        }

        // -------------------------------------------------
        // TAB KEY
        // -------------------------------------------------
        if (event.key === "Tab") {
            if (!validateFieldBeforeMove(currentField)) {
                return;
            }
            if (currentIndex < activeFields.length - 1) {
                // Move to next field.
                activeFields[currentIndex + 1].focus();

            }
            else {

                // Last field -> Shipper Code.
                if (shipperCode) {
                    shipperCode.focus();
                }

            }

        }

    });
}

// ======================================================
//              Set_Cmb - COMBO BOX INITIALIZATION
// ======================================================

async function setComboBoxes() {
    try {
        // Get Unit Master options.
        const unitResponse = await fetch(
            "/ShipperMaster/GetUnits"
        );

        const unitData = await readJsonResponse(unitResponse);

        const units = Array.isArray(unitData)
            ? unitData
            : unitData.items || unitData.data || [];

        // Get Payment Category options.
        const paymentResponse = await fetch(
            "/ShipperMaster/GetPaymentCategories"
        );

        const paymentData = await readJsonResponse(paymentResponse);

        const paymentCategories = Array.isArray(paymentData)
            ? paymentData
            : paymentData.items || paymentData.data || [];

        // Populate the billing category dropdown.
        populateComboBox("unit-name", units);

        // Populate collection method dropdowns.
        populateComboBox("collectionMethod1-name", paymentCategories);
        populateComboBox("collectionMethod2-name", paymentCategories);
        populateComboBox("collectionMethod3-name", paymentCategories);

    } catch (error) {
        alert(error.message);
    }
}
// ======================================================
//              AUTO-FILL ABBREVIATION
// ======================================================

function autoFillAbbreviation() {

    if (getValue("abbreviation")) {
        return;
    }

    const source =
        getValue("shipperName1") ||
        getValue("shipperName2");

    if (!source) {
        return;
    }

    setValue(
        "abbreviation",
        limitHalfWidthUnits(source, 16).trim()
    );
}


// ======================================================
//              POPULATE COMBO BOX
// ======================================================

function populateComboBox(fieldId, items) {
    const select = getField(fieldId);

    if (!select || select.tagName !== "SELECT") {
        return;
    }

    const previousValue = select.value;

    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "";
    select.appendChild(defaultOption);

    items.forEach(function (item) {
        const code =
            item.入金区分コード ?? item.請求コード;

        const name =
            item.入金区分名称 ?? item.請求名称;

        if (code == null || name == null) {
            return;
        }

        const option = document.createElement("option");

        option.value = code;
        option.textContent = name;

        select.appendChild(option);
    });

    // Restore the previous selected value if it exists.
    if (previousValue) {
        select.value = previousValue;
    }
}

const lookupNextField = {
    "department-code": () => document.querySelector(".tab-button.active"),
    "unit-code": () => getField("collectionTerms"),
    "collectionMethod1-code": () => getField("collectionCondition"),
    "collectionMethod2-code": () => getField("bankCode"),
    "collectionMethod3-code": () => getField("bh_EditBtn"),
    "bankCode": () => document.querySelector(".tab-button.active")
};

function isNextFieldOf(field, target) {
    return lookupNextField[field.id]?.() === target;
}

// ======================================================
//              COMMON LOOKUP EVENT
// ======================================================

function bindLookupEvent(fieldId, lookupFunction) {
    const field = getField(fieldId);

    if (!field) {
        return;
    }

    // Enter key
    field.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") {
            return;
        }
        event.preventDefault();
        event.stopPropagation();

        lookupFunction();
    });

    // Tab or mouse focus change
    field.addEventListener("blur", function (e) {

        if (e.relatedTarget && isNextFieldOf(field, e.relatedTarget)) {
            return;
        }

        field.value = field.dataset.previousValue ?? "";
    });

}

// ======================================================
//              SCREEN MODE
// ======================================================

function setEditMode() {

    const label = document.getElementById("mode-lbl");

    if (label) {
        label.textContent = isEditMode ? "修　正" : "新　規";
    }

    const code = getField("shipper-code");

    if (code) {
        code.readOnly = isEditMode;
        code.classList.toggle("existing-code", isEditMode);
    }

    getField("btnCopy").disabled = !isEditMode;

    getField("btnDelete").disabled = !isEditMode;
}


// ======================================================
//              CODE PROCESSING
// ======================================================

async function processShipperCode() {
    if (isProcessingShipperCode) {
        return;
    }

    const codeField = getField("shipper-code");
    if (!codeField) return;

    const code = normalizeCode(codeField.value, 10);

    if (code === "") {

        codeField.value =
            lastProcessedShipperCode;

        codeField.focus();

        return;
    }

    // Do not reload the same code repeatedly.
    if (code === lastProcessedShipperCode && !isCopyMode) {
        focusShipperName1();
        return;
    }

    isProcessingShipperCode = true;

    try {

        codeField.value = code;

        const response = await fetch(
            `/ShipperMaster/Exists?code=${encodeURIComponent(code)}`
        );

        const result = await readJsonResponse(response);
        const exists = result.exists === true;

        if (isCopyMode) {
            if (exists) {
                alert(`指定したコード『${code}』は存在します！！`);
                await getNextGeneratedCode();
                return;
            }

            focusShipperName1();
            lastProcessedShipperCode = code;
            return;

        } else if (exists) {
            await getShipperByCode(code);
            isEditMode = true;
            setEditMode();
        } else {
            await clearFields(false);
            codeField.value = code;
            setValue("settlementReceipt", code);
            isEditMode = false;
            setEditMode();

            const name = getField("shipperName1");
            if (name) {
                name.focus();
            }
        }
        lastProcessedShipperCode = code;

        hasChanges = false;
    } catch (error) {
        alert(error.message);
    } finally {
        isProcessingShipperCode = false;
    }
}

// ======================================================
//              GET SHIPPER BY CODE
// ======================================================

async function getShipperByCode(code) {
    const response = await fetch(
        `/ShipperMaster/GetByCode?code=${encodeURIComponent(code)}`
    );

    const data = await readJsonResponse(response);

    isEditMode = true;
    setEditMode();

    clearHistoryFields("bill_HistoryDetails");
    clearHistoryFields("ar_HistoryDetails");

    await resetHistoryBranches();

    getField("bh_DelBtn").disabled = true;
    getField("ar_DelBtn").disabled = true;

    fillShipperFields(data);

    isCopyMode = false;

    lastProcessedShipperCode =
        data["荷主コード"];

    hasChanges = false;

    resetCommittedFieldValues();

    const activeTab = document.querySelector(".tab-button.active");

    if (activeTab && activeTab.dataset.tab === "billingHistory" && !isEditMode) {
        clearHistoryFields("bill_HistoryDetails");
        loadHistory("billing");
    } else if (
        activeTab &&
        activeTab.dataset.tab === "accountsReceivableHistory" && !isEditMode) {
        clearHistoryFields("ar_HistoryDetails");
        loadHistory("receivable");
    }

    // After successful retrieval, navigate to the first tab
    const firstTabButton = document.querySelector(".tab-button");

    if (firstTabButton) {
        firstTabButton.click();
    }

    focusShipperName1()
}

// ======================================================
//              LOAD FIELDS
// ======================================================

function fillShipperFields(model) {
    setValue("shipper-code", model["荷主コード"]);
    setValue("shipperName1", model["荷主名1"]);
    getField("shipperName1").dataset.keepValue = model["荷主名1"] ?? "";
    setValue("shipperName2", model["荷主名2"]);
    setValue("furigana", model["ふりがな"]);
    getField("furigana").dataset.keepValue = model["ふりがな"] ?? "";
    setValue("abbreviation", model["略称"]);
    setValue("zipCode", model["郵便"]);
    setValue("addressField1", model["住所1"]);
    setValue("addressField2", model["住所2"]);
    setValue("phoneNumber", model["電話番号"]);
    setValue("fax", model["FAX番号"]);
    DateSlots.show(getField("startDate"), model["取引開始日"]);
    DateSlots.show(getField("endDate"), model["取引終了日"]);

    setValue("remarks", model["備考"]);
    setValue("email", model["mail"]);
    setValue("department-code", model["部門コード"]);
    setValue("department-name", model["部門名称"]);
    setValue("closingDate", model["締め日"]);
    setValue("settlementReceipt", model["請求先コード"]);
    getField("settlementReceipt").dataset.previousValue = model["請求先コード"] ?? "";
    setValue("shipper-name", model["精算先名称"]);
    setValue("unit-code", model["請求区分"]);
    const unitDropdown = getField("unit-name");
    if (unitDropdown) {
        unitDropdown.value = model["請求区分"] ?? "";
    }
    setValue("collectionTerms", model["回収サイト"]);
    setValue("collectionDate", model["回収日"]);
    setValue("collectionMethod1-code", model["支払方法1"]);
    const cm1 = getField("collectionMethod1-name");
    if (cm1) {
        cm1.value = model["支払方法1"] ?? "";
    }
    setValue("collectionCondition", model["支払条件"]);
    initializeCollectionCondition();

    setValue("collectionMethod2-code", model["支払方法2"]);
    const cm2 = getField("collectionMethod2-name");
    if (cm2) {
        cm2.value = model["支払方法2"] ?? "";
    }
    setValue("bankCode", model["銀行コード"]);
    getField("department-code").dataset.previousValue = model["部門コード"] ?? "";

    getField("unit-code").dataset.previousValue = model["請求区分"] ?? "";

    getField("collectionMethod1-code").dataset.previousValue = model["回収方法1"] ?? "";

    getField("collectionMethod2-code").dataset.previousValue = model["回収方法2"] ?? "";

    getField("bankCode").dataset.previousValue = model["銀行コード"] ?? "";

    setValue("bankName1", model["銀行１"]);
    setValue("bankName2", model["銀行２"]);
    setValue("decimal-places-num", model["端数桁数"]);
    setValue("salesFractionAmt-input", model["売上端数"]);
    setValue("consumptionTaxCategory-input", model["税区分"]);
    setValue("consumptionTaxFraction-input", model["税端数"]);
    setValue("discount-rate", model["値引率"]);
    const discountRateField = getField("discount-rate");
    if (discountRateField && discountRateField.value !== "") {
        discountRateField.value = Number(discountRateField.value).toFixed(2);
    }
    setValue("taxableSurcharge-input", model["課税割増"]);
    setValue("nonTaxableSurcharge-input", model["非課税割増"]);
    setValue("discountFraction-input", model["値引端数"]);
    setValue("billingDateSetting-input", model["請求日設定"]);
    setValue("quantityDecimalPlaces", model["数量小数点"]);
    setValue("weightDecimalPlaces", model["重量小数点"]);
    setValue("unitPriceDecimalPlaces", model["小数点"]);
    setValue("payrollOptInp", model["手当掛率"]);
    const payrollField = getField("payrollOptInp");
    normalizeDecimalInput(payrollField);
    setValue("digitaco", model["デジタココード"]);
    setChecked("unitPrice-display", model["単価表示"]);
    setChecked("billingBal-Calculation", model["請求残計算"]);
    setChecked("accReceivableBalCalculation", model["売掛残計算"]);
}

// ======================================================
//              FILL HISTORY FIELDS
// ======================================================
function fillHistoryFields(model, kind) {

    if (!model) return;

    // Common history fields
    if (kind === "billing") {

        // Billing History period
        DateSlots.show(getField("fromDate_bill"), model["開始日"]);
        DateSlots.show(getField("toDate_bill"), model["更新日"]);

        // Billing amounts
        setValue("bh-previous-billing", model["前回請求額"]);
        setValue("bh-payment-amount", model["今回入金額"]);
        setValue("bh-adjustment-amount", model["入金調整額"]);
        setValue("bh-carry-forward", model["今回繰越額"]);
        setValue("bh-freight-amount", model["今回運賃額"]);
        setValue("bh-taxable-surcharge", model["割増額課"]);
        setValue("bh-nontaxable-surcharge", model["割増額非"]);
        setValue("bh-taxable-discount", model["課税値引額"]);
        setValue("bh-nontaxable-discount", model["非課税値引"]);
        setValue("bh-consumption-tax", model["今回消費税"]);
        setValue("bh-discount-amount", model["今回値引額"]);
        setValue("bh-total-amount", model["今回合計額"]);
        setValue("bh-billing-amount", model["今回請求額"]);
        setHistoryAmount("bh-carry-forward", model["今回繰越額"] || 0);
        setHistoryAmount("bh-discount-amount", model["今回値引額"] || 0);
        setHistoryAmount("bh-total-amount", model["今回合計額"] || 0);
        setHistoryAmount("bh-billing-amount", model["今回請求額"] || 0);

        // Collection details
        DateSlots.show(getField("bh-collection-date"), model["回収予定日"]);
        setValue("collectionMethod3-code", model["回収方法"] ?? "");
        getField("collectionMethod3-code").dataset.previousValue = model["回収方法"] ?? "";
        setValue("collectionMethod3-name", model["回収方法"]);
    }

    else if (kind === "receivable") {

        // Accounts Receivable History period
        DateSlots.show(getField("fromDate_Ar"), model["開始日"]);
        DateSlots.show(getField("toDate_Ar"), model["更新日"]);

        // Receivable amounts
        setValue("ar-previous-balance", model["前月売掛残"]);
        setValue("ar-payment-amount", model["今月入金額"]);
        setValue("ar-adjustment-amount", model["入金調整額"]);
        setHistoryAmount("ar-carry-forward", model["今月繰越額"] || 0);
        setValue("ar-freight-amount", model["今月運賃額"]);
        setValue("ar-taxable-surcharge", model["割増額課"]);
        setValue("ar-nontaxable-surcharge", model["割増額非"]);
        setValue("ar-taxable-discount", model["課税値引額"]);
        setValue("ar-nontaxable-discount", model["非課税値引"]);
        setValue("ar-consumption-tax", model["今月消費税"]);
        setHistoryAmount("ar-discount-amount", model["今月値引額"] || 0);
        setHistoryAmount("ar-total-amount", model["今月合計額"] || 0);
        setHistoryAmount("ar-receivable-balance", model["今月売掛残"] || 0);
    }
}

// ======================================================
//              Dsp_BKbn - DEPARTMENT NAME
// ======================================================

async function getDepartmentName() {
    const code = getValue("department-code");

    if (!code) {
        setValue("department-name", "");
        const field = getField("department-code");
        if (field) {
            field.dataset.previousValue = "";
        }
        document.querySelector(".tab-button.active")?.focus();
        return;
    }

    try {
        const response = await fetch(
            `/ShipperMaster/GetDepartment?code=${encodeURIComponent(code)}`
        );

        const result = await readJsonResponse(response);

        if (result.found === false) {
            setValue("department-name", "");
            alert(`指定した部門『${code}』は未登録です！！`);
            getField("department-code")?.focus();
            return;
        }

        setValue("department-name", result.departmentName ?? "");
        document.querySelector(".tab-button.active")?.focus();
        getField("department-code").dataset.previousValue = code;
    } catch (error) {
        alert(error.message);
    }
}

// ======================================================
//              Dsp_Tani - BILLING CATEGORY
// ======================================================

function getBillingCategory() {

    const code = getValue("unit-code").trim();
    const nameDropdown = getField("unit-name");

    if (!nameDropdown) return;

    // If code is empty, clear only the selected dropdown value.
    if (!code) {
        getField("unit-code").dataset.previousValue = "";
        getField("unit-code")?.focus();
        nameDropdown.value = "";
        return;
    }

    // Find the option that matches the entered code.
    const matchingOption = Array.from(nameDropdown.options)
        .find(option => option.value === code);

    if (!matchingOption) {

        nameDropdown.value = "";

        alert(`指定した請求区分『${code}』は未登録です！！`);

        getField("unit-code")?.focus();

        return;
    } else if (matchingOption) {
        // Select the matching Unit name.
        nameDropdown.value = matchingOption.value;
        getField("unit-code").dataset.previousValue = code;
        getField("collectionTerms").focus();

    }

}

// ======================================================
//              Dsp_Kaishu - COLLECTION METHOD 1
// ======================================================

function getCollectionMethod1(fallbackName = "") {
    const codeInput = getField("collectionMethod1-code");
    const nameDropdown = getField("collectionMethod1-name");

    if (!codeInput || !nameDropdown) return;

    const code = codeInput.value.trim();

    // CASE 1: Code is empty, but retrieved name is available.
    if (!code) {

        if (fallbackName) {

            const matchingOption = Array.from(nameDropdown.options)
                .find(option =>
                    option.textContent.trim().toLowerCase() ===
                    fallbackName.trim().toLowerCase()
                );

            if (matchingOption) {

                // Set both code and name using the matching option.
                codeInput.value = matchingOption.value;
                nameDropdown.value = matchingOption.value;
                getField("collectionCondition").focus();

                return;
            }
        }
        codeInput.dataset.previousValue = "";

        // No code and no matching name.
        nameDropdown.value = "";
        getField("collectionCondition")?.focus();
        return;
    }

    // CASE 2: Code is available. Find the matching option using code.
    const matchingOption = Array.from(nameDropdown.options)
        .find(option => option.value.trim() === code);

    if (!matchingOption) {

        nameDropdown.value = "";

        alert(`指定した回収方法『${code}』は未登録です！！`);

        codeInput.focus();

        return;
    }

    // Display the corresponding Payment Category name.
    nameDropdown.value = matchingOption.value;
    getField("collectionCondition").focus();
    codeInput.dataset.previousValue = code;

}

// ======================================================
//              Dsp_Kaishu2 - COLLECTION METHOD 2
// ======================================================

async function getCollectionMethod2(fallbackName = "") {

    const codeInput = getField("collectionMethod2-code");
    const nameDropdown = getField("collectionMethod2-name");

    if (!codeInput || !nameDropdown) return;

    const code = codeInput.value.trim();

    // CASE 1: Code is empty, but retrieved name is available.
    if (!code) {

        if (fallbackName) {

            const matchingOption = Array.from(nameDropdown.options)
                .find(option =>
                    option.textContent.trim().toLowerCase() ===
                    fallbackName.trim().toLowerCase()
                );

            if (matchingOption) {

                // Set both code and name using the matching option.
                codeInput.value = matchingOption.value;
                nameDropdown.value = matchingOption.value;
                getField("bankCode").focus();

                return;
            }
        }
        codeInput.dataset.previousValue = "";
        // No code and no matching name.
        nameDropdown.value = "";
        getField("bankCode")?.focus();
        return;
    }

    // CASE 2: Code is available. Find the matching option using code.
    const matchingOption = Array.from(nameDropdown.options)
        .find(option => option.value.trim() === code);

    if (!matchingOption) {

        nameDropdown.value = "";

        alert(`指定した回収方法『${code}』は未登録です！！`);

        codeInput.focus();

        return;
    }

    // Display the corresponding Payment Category name.
    nameDropdown.value = matchingOption.value;
    getField("bankCode").focus();
    codeInput.dataset.previousValue = code;
}

async function getCollectionMethod3() {

    const code = getValue("collectionMethod3-code").trim();

    const nameDropdown = getField("collectionMethod3-name");

    if (!nameDropdown) return;

    // Clear only the selected value when code is empty.
    if (!code) {
        getField("collectionMethod3-code").dataset.previousValue = "";
        nameDropdown.value = "";
        getField("bh_EditBtn")?.focus();
        return;
    }

    // Find the matching option using the entered code.
    const matchingOption = Array.from(nameDropdown.options)
        .find(option => option.value === code);

    if (!matchingOption) {

        nameDropdown.value = "";

        alert(`指定した回収方法『${code}』は未登録です！！`);

        getField("collectionMethod3-code")?.focus();

        return;
    }

    // Display the corresponding Payment Category name.
    nameDropdown.value = matchingOption.value;
    getField("bh_EditBtn").focus();
    getField("collectionMethod3-code").dataset.previousValue = code;
}

// ======================================================
//              Dsp_Kanri - BRANCH NAME
// ======================================================

async function getBranchName(codeFieldId, nameFieldId) {

    const field = getField(codeFieldId);
    const code = normalizeCode(field.value, 2);
    const oldValue = field.dataset.previousValue || "";

    if (code === oldValue) {
        return true;
    }

    if (!code) {

        alert("指定した自社支店『』は未登録です！！");

        field.value = field.dataset.previousValue || "";

        setValue(nameFieldId, field.dataset.previousName || "");

        field.focus();

        return false;
    }

    field.value = code;

    try {
        const response = await fetch(
            `/ShipperMaster/GetManagementName?code=${encodeURIComponent(code)}`
        );

        const result = await readJsonResponse(response);

        if (result.found === false && result.name === null) {

            alert(`指定した自社支店『${code}』は未登録です！！`);
            field.value = field.dataset.previousValue || "";
            setValue(nameFieldId, field.dataset.previousName || "");
            field.focus();
            return;
        }

        // Commit the new branch code and name
        field.value = code;
        setValue(nameFieldId, result.name || "");
        if (oldValue !== code) {
            hasChanges = true;
        }
        field.dataset.previousValue = code;
        field.dataset.previousName = result.name || "";
        if (codeFieldId === "branch-code1") {
            clearHistoryFields("bill_HistoryDetails");
            loadHistory("billing");
        }

        if (codeFieldId === "branch-code2") {
            clearHistoryFields("ar_HistoryDetails");
            loadHistory("receivable");
        }

        return true;

    } catch (error) {
        alert(error.message);

        field.value = field.dataset.previousValue || "";
        setValue(nameFieldId, field.dataset.previousName || "");

        return false;
    }
}

async function resetSingleBranch(codeFieldId, nameFieldId) {

    const result =
        await getMasterName(
            "/ShipperMaster/GetManagementName?code=01"
        );

    const branchName = result.name || "";

    setValue(codeFieldId, "01");
    setValue(nameFieldId, branchName);

    const field = getField(codeFieldId);

    if (field) {
        field.dataset.previousValue = "01";
        field.dataset.previousName = branchName;
    }
}

async function resetHistoryBranches() {

    setValue("branch-code1", "01");
    setValue("branch-code2", "01");

    const result =
        await getMasterName(
            "/ShipperMaster/GetManagementName?code=01"
        );

    const branchName = result.name ?? "";

    setValue("billing-branch-name", branchName);
    setValue("ar-branch-name", branchName);

    const branch1 = getField("branch-code1");
    const branch2 = getField("branch-code2");

    if (branch1) {
        branch1.dataset.previousValue = "01";
        branch1.dataset.previousName = branchName;
    }

    if (branch2) {
        branch2.dataset.previousValue = "01";
        branch2.dataset.previousName = branchName;
    }
}

// ======================================================
//              Dsp_Bank - BANK NAME
// ======================================================

async function getBankName() {
    const code = getValue("bankCode");

    if (!code) {
        getField("bankCode").dataset.previousValue = "";
        setValue("bankName1", "");
        setValue("bankName2", "");
        document.querySelector(".tab-button.active")?.focus();
        return;
    }

    try {
        const response = await fetch(
            `/ShipperMaster/GetBankName?code=${encodeURIComponent(code)}`
        );

        const result = await readJsonResponse(response);

        if (result.found === false) {
            setValue("bankName1", "");
            setValue("bankName2", "");
            alert(`指定した銀行『${code}』は未登録です！！`);
            getField("bankCode")?.focus();
            getField("bankCode")?.select();
            return;
        }

        setValue("bankName1", result.bankName1 ?? "");

        setValue("bankName2", result.bankName2 ?? "");
        document.querySelector(".tab-button.active")?.focus();
        getField("bankCode").dataset.previousValue = code;
    } catch (error) {
        alert(error.message);
    }
}

function formatDateForJapaneseInput(value) {

    if (!value) return "";

    // Extract the date portion to avoid timezone conversion.
    const datePart = String(value).substring(0, 10);

    let year;
    let month;
    let day;

    // Handle yyyy-MM-dd format from the database/API.
    const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (match) {
        year = Number(match[1]);
        month = Number(match[2]);
        day = Number(match[3]);
    } else {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        year = date.getFullYear();
        month = date.getMonth() + 1;
        day = date.getDate();
    }

    // Create a date using local date components.
    const date = new Date(year, month - 1, day);

    // Format using the Japanese calendar.
    const formatter = new Intl.DateTimeFormat(
        "ja-JP-u-ca-japanese",
        {
            era: "long",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    );

    const parts = formatter.formatToParts(date);

    const era = parts.find(p => p.type === "era")?.value || "";
    const eraYear = parts.find(p => p.type === "year")?.value || "";
    const formattedMonth = parts.find(p => p.type === "month")?.value || "";
    const formattedDay = parts.find(p => p.type === "day")?.value || "";

    return `${era} ${eraYear}年${formattedMonth}月${formattedDay}日`;
}

function dateFormat() {
    return eraInput
        ? "ggg ee年MM月dd日"
        : "yyyy年MM月dd日";
}

function initializeDateBoxes() {

    document
        .querySelectorAll(".jp-calendar-input")
        .forEach(field => {

            DateSlots.attach(
                field,
                dateFormat()
            );
        });
}

function applyDateSetting(isEra) {

    eraInput = isEra;

    document
        .querySelectorAll(".jp-calendar-input")
        .forEach(field => {

            field.dataset.noEra =
                isEra ? "false" : "true";

            DateSlots.setFormat(
                field,
                dateFormat()
            );
        });
}

function hideUnlicensedTabs() {

    const sec2 = window.licenseFlags?.unkoukanri === true;

    const digi = window.licenseFlags?.digitco === true;

    const hideTab = function (tabId) {

        document.querySelector(`.tab-button[data-tab="${tabId}"]`)
            ?.style.setProperty(
                "display",
                "none"
            );

        getField(tabId)
            ?.style.setProperty(
                "display",
                "none"
            );
    };

    // SEC2 = 0
    if (!sec2) {

        hideTab("billingHistory");

        hideTab("accountsReceivableHistory");
    }

    // SEC4 != 1 and SEC5 != 1
    if (!digi) {

        hideTab("payrollOptionSettings");

        hideTab("digitacoSetting");
    }
}

function setChecked(id, value) {
    const field = getField(id);
    if (!field) return;

    const text = String(value ?? "0").toUpperCase();

    field.checked =
        text === "1" ||
        text === "TRUE" ||
        text === "CHECKED";
}

function collectShipperFields() {

    return {
        "荷主コード": getValue("shipper-code"),
        "IsNewRecord": !isEditMode,
        "荷主名1": getValue("shipperName1"),
        "荷主名2": getValue("shipperName2"),
        "ふりがな": getValue("furigana"),
        "略称": getValue("abbreviation"),
        "郵便": getValue("zipCode"),
        "住所1": getValue("addressField1"),
        "住所2": getValue("addressField2"),
        "電話番号": getValue("phoneNumber"),
        "FAX番号": getValue("fax"),
        "取引開始日": parseDateToIso(getValue("startDate")),
        "取引終了日": parseDateToIso(getValue("endDate")),
        "備考": getValue("remarks"),
        "MAIL": getValue("email"),
        "部門コード": getValue("department-code"),
        "締め日": getValue("closingDate", 31),
        "請求先コード": getValue("settlementReceipt"),
        "請求区分": getValue("unit-code"),
        "回収サイト": getValue("collectionTerms"),
        "回収日": getValue("collectionDate"),
        "支払方法1": getValue("collectionMethod1-code"),
        "支払条件": parseNullableDecimal("collectionCondition"),
        "支払方法2": getValue("collectionMethod2-code"),
        "銀行コード": getValue("bankCode"),
        "銀行１": getValue("bankName1"),
        "銀行２": getValue("bankName2"),
        "端数桁数": getValue("decimal-places-num") || "0",
        "売上端数": getValue("salesFractionAmt-input") || "1",
        "税区分": getValue("consumptionTaxCategory-input") || "1",
        "税端数": getValue("consumptionTaxFraction-input") || "0",
        "値引率": parseNullableDecimal("discount-rate"),
        "課税割増": getValue("taxableSurcharge-input") || "1",
        "非課税割増": getValue("nonTaxableSurcharge-input") || "1",
        "値引端数": getValue("discountFraction-input") || "0",
        "請求日設定": getValue("billingDateSetting-input") || "0",
        "数量小数点": parseNullableInteger("quantityDecimalPlaces") ?? 0,
        "重量小数点": parseNullableInteger("weightDecimalPlaces") ?? 0,
        "小数点": parseNullableInteger("unitPriceDecimalPlaces") ?? 0,
        "単価表示": getField("unitPrice-display")?.checked ? "1" : "0",
        "請求残計算": getField("billingBal-Calculation")?.checked ? "1" : "0",
        "売掛残計算": getField("accReceivableBalCalculation")?.checked ? "1" : "0",
        "手当掛率": getValue("payrollOptInp"),
        "デジタココード": getValue("digitaco")
    };
}

function parseDateToIso(value) {

    if (!value) return null;

    value = String(value).trim();

    if (value === "") return null;

    // Japanese era starting dates.
    const eraStartDates = {
        "明治": "1868-09-08",
        "大正": "1912-07-30",
        "昭和": "1926-12-25",
        "平成": "1989-01-08",
        "令和": "2019-05-01"
    };

    // Japanese era ending dates.
    const eraEndDates = {
        "明治": "1912-07-29",
        "大正": "1926-12-24",
        "昭和": "1989-01-07",
        "平成": "2019-04-30"
    };

    let year;
    let month;
    let day;

    // 1. Japanese era format: 令和 08年11月02日
    const eraMatch = value.match(
        /^(明治|大正|昭和|平成|令和)\s*(\d{1,2})年(\d{1,2})月(\d{1,2})日$/
    );

    if (eraMatch) {

        const era = eraMatch[1];
        const eraYear = Number(eraMatch[2]);

        month = Number(eraMatch[3]);
        day = Number(eraMatch[4]);

        if (eraYear < 1) return null;

        year =
            Number(eraStartDates[era].substring(0, 4))
            + eraYear - 1;
    }

    // 2. Gregorian Japanese format: 2026年11月02日
    else {

        const normalMatch = value.match(
            /^(\d{4})年(\d{1,2})月(\d{1,2})日$/
        );

        if (normalMatch) {

            year = Number(normalMatch[1]);
            month = Number(normalMatch[2]);
            day = Number(normalMatch[3]);
        }

        // 3. ISO format: 2026-11-02
        else {

            const isoMatch = value.match(
                /^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/
            );

            if (!isoMatch) return null;

            year = Number(isoMatch[1]);
            month = Number(isoMatch[2]);
            day = Number(isoMatch[3]);
        }
    }

    // Validate the actual calendar date.
    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    const isoDate =
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Validate that the date belongs to the specified Japanese era.
    if (eraMatch) {

        const era = eraMatch[1];

        if (isoDate < eraStartDates[era]) {
            return null;
        }

        if (
            eraEndDates[era] &&
            isoDate > eraEndDates[era]
        ) {
            return null;
        }
    }

    return isoDate;
}

function parseNullableInteger(id) {
    const value = getValue(id);

    if (value === "") {
        return null;
    }

    const number = Number(value);

    return Number.isInteger(number) ? number : null;
}

function parseNullableDecimal(id) {
    const value = getValue(id).replace(/,/g, "");

    if (value === "") {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
}


// ======================================================
//              VALIDATION
// ======================================================

function validateShipperFields(model) {
    if (!model["荷主コード"]) {
        alert("荷主コードを入力して下さい。");
        focusShipperCode();
        return false;
    }

    if (!model["荷主名1"]) {
        alert("荷主名を入力して下さい。");
        getField("shipperName1")?.focus();
        return false;
    }

    if (!model["ふりがな"]) {
        alert("フリガナを入力して下さい。");
        document.querySelector('[data-tab="basicSetting"]')?.click();
        getField("furigana")?.focus();
        return false;
    }

    if (!model["略称"]) {
        alert("略称を入力して下さい。");
        document.querySelector('[data-tab="basicSetting"]')?.click();
        getField("abbreviation")?.focus();
        return false;
    }

    if (model["締め日"] == "" || model["締め日"] === undefined || model["締め日"] === null) {
        alert("締め日を入力して下さい。");
        document.querySelector('[data-tab="billingSetting"]')?.click();
        getField("closingDate")?.focus();
        return false;
    }

    const settlementReceipt = getField("settlementReceipt");
    if (!model["請求先コード"]) {
        alert("請求先を入力して下さい。");
        document.querySelector('[data-tab="billingSetting"]')?.click();
        settlementReceipt?.focus();
        return false;
    }

    if (model["請求区分"] == "") {
        alert("請求区分を入力して下さい。");
        document.querySelector('[data-tab="billingSetting"]')?.click();
        getField("unit-code")?.focus();
        return false;
    }

    if (model["回収サイト"] != null && (model["回収サイト"] < 0 || model["回収サイト"] > 9)
    ) {
        alert("回収サイトを正しく入力してください！！");
        document.querySelector('[data-tab="billingSetting"]')?.click();
        getField("collectionTerms")?.focus();
        return false;
    }

    if (
        model["回収日"] != null &&
        (model["回収日"] < 1 || model["回収日"] > 31)
    ) {
        alert("回収日を正しく入力してください！！");
        document.querySelector('[data-tab="billingSetting"]')?.click();
        getField("collectionDate")?.focus();
        return false;
    }

    if (model["支払条件"] !== null && model["支払条件"] !== 0) {

        if (!model["支払方法1"]) {

            alert("回収方法1を正しく入力してください！！");
            document.querySelector('[data-tab="billingSetting"]')?.click();
            getField("collectionMethod1-code")?.focus();

            return false;
        }

        if (!model["支払方法2"]) {

            alert("回収方法2を正しく入力してください！！");
            document.querySelector('[data-tab="billingSetting"]')?.click();
            getField("collectionMethod2-code")?.focus();

            return false;
        }
    }

    // -------------------------------------------------------------------
    // Decimal and tax settings: 0 to 2 and Surcharge settings: 0 to 1.
    // -------------------------------------------------------------------

    const validationFields = [
        { id: "decimal-places-num", label: "端数桁数", max: 2 },
        { id: "salesFractionAmt-input", label: "売上端数", max: 2 },
        { id: "consumptionTaxCategory-input", label: "消費税区分", max: 2 },
        { id: "consumptionTaxFraction-input", label: "消費税端数", max: 2 },
        { id: "taxableSurcharge-input", label: "値引課割", max: 1 },
        { id: "nonTaxableSurcharge-input", label: "値引非課割", max: 1 },
        { id: "discountFraction-input", label: "値引端数", max: 2 },
        { id: "billingDateSetting-input", label: "請求日設定", max: 2 }
    ];

    for (const item of validationFields) {

        const value = getValue(item.id);

        const number = Number(value);

        if (value === "") {
            alert(`${item.label}を入力して下さい。`);
            document.querySelector('[data-tab="calculationSetting"]')?.click();
            getField(item.id)?.focus();
            return false;
        }
        else if (
            !Number.isInteger(number) ||
            number < 0 ||
            number > item.max
        ) {

            alert(`${item.label}を正しく入力して下さい。`);
            document.querySelector('[data-tab="calculationSetting"]')?.click();
            getField(item.id)?.focus();

            return false;
        }
    }

    return true;
}

// ======================================================
//              F1 - REGISTER
// ======================================================

async function saveShipper() {

    if (isSaving) {
        return;
    }

    isSaving = true;

    try {
        const model = collectShipperFields();

        if (!validateShipperFields(model)) {
            return;
        }

        // Validate settlement destination only when it differs
        // from the current shipper code.
        if (model["請求先コード"] !== model["荷主コード"]) {

            const validResponse = await fetch(
                `/ShipperMaster/ValidateSettlementDestination?code=${encodeURIComponent(model["請求先コード"])}&isNewRecord=${!isEditMode}`
            );

            const validResult = await readJsonResponse(validResponse);

            if (validResult.valid === false) {
                alert("請求先を正しく入力して下さい。");
                getField("settlementReceipt")?.focus();
                return;
            }
        }

        const response = await fetch("/ShipperMaster/Save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(model)
        });

        const result = await readJsonResponse(response);

        hasChanges = false;
        isEditMode = true;
        setEditMode();

        getNextGeneratedCode();
        location.reload();

    } catch (error) {
        alert(error.message);
    } finally {
        isSaving = false;
    }
}

// ======================================================
//              F2 - COPY
// ======================================================

async function copyShipper() {
    if (!isEditMode) {
        return;
    }

    try {
        const response = await fetch(
            "/ShipperMaster/GetNextGeneratedCode?currentCode=" +
            encodeURIComponent(getValue("shipper-code"))
        );

        const result = await readJsonResponse(response);
        const nextCode = result.code;

        if (!nextCode) {
            setValue("shipper-code", "");
        }

        const oldModel = collectShipperFields();
        const faxValue = getValue("fax");
        const mailValue = getValue("email");
        const departmentName = getValue("department-name");
        const settlementName = getValue("shipper-name");

        await clearFields(false);
        const clearResponse = await fetch(
            "/ShipperMaster/ClearHistoryWorkTables",
            {
                method: "POST"
            }
        );

        await readJsonResponse(clearResponse);

        fillShipperFields(oldModel);
        setValue("department-name", departmentName);

        setValue("shipper-name", settlementName);
        setValue("fax", faxValue);
        setValue("email", mailValue);

        setValue("shipper-code", nextCode || "");
        setValue("settlementReceipt", nextCode || "");
        getField("settlementReceipt").dataset.previousValue = nextCode || "";

        lastProcessedShipperCode = "";

        isEditMode = false;
        setEditMode();
        hasChanges = false;
        isCopyMode = true;
        document
            .querySelector('.tab-button[data-tab="basicSetting"]')
            ?.click();

        clearHistoryFields("bill_HistoryDetails");
        clearHistoryFields("ar_HistoryDetails");

        await resetHistoryBranches();
        focusShipperCode();
    } catch (error) {
        alert(error.message);
    }
}

// ======================================================
//              F4 - DELETE
// ======================================================

async function deleteShipper() {
    if (!isEditMode) {
        alert("削除する荷主を選択して下さい。");
        return;
    }

    const code = getValue("shipper-code");

    if (!code) {
        return;
    }

    try {
        const checkUrl = `/ShipperMaster/CheckDelete?code=${encodeURIComponent(code)}&kanriPlKbn=${encodeURIComponent(kanriPlKbn)}`;
        const checkResponse = await fetch(checkUrl, {
            method: "GET"
        });

        const checkResult = await readJsonResponse(checkResponse);

        if (!checkResult.success) {
            alert(checkResult.message);
            return;
        }

        // Step 3: Ask for confirmation only after the check passes.
        if (!confirm("削除してもよいですか？")) {
            focusShipperName1();
            return;
        }

        const deleteUrl =
            `/ShipperMaster/Delete?code=${encodeURIComponent(code)}&kanriPlKbn=${encodeURIComponent(kanriPlKbn)}`;

        const response = await fetch(deleteUrl, {
            method: "POST"
        });

        const deleteResult = await readJsonResponse(response);

        if (deleteResult.success) {
            await clearFields(true);
            await getNextGeneratedCode();

            isEditMode = false;
            setEditMode();
            hasChanges = false;

            isCopyMode = false;

            lastProcessedShipperCode = "";

            resetCommittedFieldValues();

            document.querySelector('.tab-button[data-tab="basicSetting"]')?.click();
            focusShipperCode();
        }
        else {
            return alert(deleteResult.message);
        }
    } catch (error) {
        alert(error.message);
    }
}

// ======================================================
//              F7 - PREVIOUS RECORD
// ======================================================

async function getPreviousShipper() {
    try {
        if (hasChanges) {
            if (!confirm("内容が変更されております。よろしいですか？")) {
                return;
            }
        }

        const response = await fetch(
            `/ShipperMaster/GetPrevCode?currentCode=${encodeURIComponent(normalizeCode(getValue("shipper-code"), 10))}`
        );

        const result = await readJsonResponse(response);
        const code = result.code || "";

        if (code) {
            await getShipperByCode(code);
        } else {
            alert("これより前のデータはありません！！");
            focusShipperName1();
        }
    } catch (error) {
        alert(error.message);
    }
}

// ======================================================
//              F8 - NEXT RECORD
// ======================================================

async function getNextShipperRecord() {
    try {
        if (hasChanges) {
            if (!confirm("内容が変更されております。よろしいですか？")) {
                return;
            }
        }
        const response = await fetch(
            `/ShipperMaster/GetNextCode?currentCode=${encodeURIComponent(normalizeCode(getValue("shipper-code"), 10))}`
        );

        const result = await readJsonResponse(response);
        const code = result.code || "";

        if (code) {
            await getShipperByCode(code);
        } else {
            alert("これより次のデータは有りません！！");
            focusShipperName1();
        }
    } catch (error) {
        alert(error.message);
    }
}

// ======================================================
//              GET GENERATED CODE
// ======================================================

async function getNextGeneratedCode() {
    try {
        const response = await fetch(
            "/ShipperMaster/GetNextGeneratedCode"
        );

        const result = await readJsonResponse(response);
        const code = result.code || "";

        if (code) {
            setValue("shipper-code", code);
            setValue("settlementReceipt", code);
            getField("settlementReceipt").dataset.previousValue = code;
            lastProcessedShipperCode = code;
        }
    } catch (error) {
        alert(error.message);
    }
}

// ======================================================
//              F11 - CANCEL
// ======================================================

async function cancelShipper() {
    if (hasChanges && !confirm("内容が変更されております。よろしいですか？")) {
        if (lastFocusedFieldBeforeBtnAction) {
            lastFocusedFieldBeforeBtnAction.focus();
        }
        return;
    }

    const clearResponse = await fetch(
        "/ShipperMaster/ClearHistoryWorkTables",
        {
            method: "POST"
        }
    );

    await readJsonResponse(clearResponse);

    await clearFields(true);
    isEditMode = false;
    setEditMode();
    hasChanges = false;
    isCopyMode = false;
    lastProcessedShipperCode = "";

    resetCommittedFieldValues();

    // Step 5: Navigate to the first tab (基本設定).
    const firstTabButton = document.querySelector(".tab-button");

    if (firstTabButton) {
        firstTabButton.click();
    }

    getField("bh_DelBtn").disabled = true;
    getField("ar_DelBtn").disabled = true;

    await getNextGeneratedCode();
    focusShipperCode();
}


// ======================================================
//              CLEAR FORM
// ======================================================

async function clearFields(clearCode) {
    const form = document.querySelector(".main-container");

    if (!form) {
        return;
    }

    form.querySelectorAll("input").forEach(function (field) {
        if (field.type === "checkbox") {
            field.checked = false;
        } else if (
            field.type !== "button" &&
            field.id !== "shipper-code" &&
            field.id !== "branch-code1" &&
            field.id !== "branch-code2" &&
            field.id !== "billing-branch-name" &&
            field.id !== "ar-branch-name"
        ) {
            field.value = "";
            field.dataset.oldName = "";
        }
    });

    form.querySelectorAll("select").forEach(function (field) {
        field.selectedIndex = 0;
    });

    if (clearCode) {
        setValue("shipper-code", "");
    }

    setValue("unit-code", "");
    setValue("settlementReceipt", getValue("shipper-code"));
    setValue("collectionTerms", "");
    setValue("collectionDate", "");
    await getSystemDefaults();

    document.querySelectorAll(".history-grid tbody").forEach(function (tbody) {
        tbody.innerHTML = "";
    });

    await resetHistoryBranches();

    updateOptionButtons();

    [
        "department-code",
        "unit-code",
        "collectionMethod1-code",
        "collectionMethod2-code",
        "collectionMethod3-code",
        "bankCode"
    ].forEach(id => {

        const field = getField(id);

        if (field) {
            field.dataset.previousValue = "";
        }
    });
}

function clearHistoryFields(tabId) {
    const form = tabId ? document.querySelector(`#${tabId}.tab-details.history-tab`) : document.querySelector(".tab-details.history-tab");

    if (!form) {
        return;
    }

    form.querySelectorAll("input").forEach(function (field) {
        if (field.type === "checkbox") {
            field.checked = false;
        } else if (
            field.type !== "button" &&
            field.id !== "shipper-code" &&
            field.id !== "branch-code1" &&
            field.id !== "branch-code2" &&
            field.id !== "billing-branch-name" &&
            field.id !== "ar-branch-name"
        ) {
            field.value = "";
        }
    });

    getField("bh_DelBtn").disabled = true;
    getField("ar_DelBtn").disabled = true;

}

// ======================================================
//              SYSTEM DEFAULTS
// ======================================================

async function getSystemDefaults() {
    try {
        const response = await fetch(
            "/ShipperMaster/GetSystemDefaults"
        );

        const result = await readJsonResponse(response);

        setValue("closingDate", "31");
        setValue("decimal-places-num", "0");
        setValue("discountFraction-input", "0");
        setValue("quantityDecimalPlaces", "3");
        setValue("weightDecimalPlaces", "3");
        setValue("unitPriceDecimalPlaces", "2");
        setValue("collectionCondition", "0");
        setValue("discount-rate", "0.00");
        setValue("payrollOptInp", "100.00");

        setValue(
            "salesFractionAmt-input",
            result.uriHasu ?? "1"
        );

        setValue(
            "consumptionTaxCategory-input",
            result.zeiKbn ?? "1"
        );

        setValue(
            "consumptionTaxFraction-input",
            result.zeiHasu ?? "0"
        );

        setValue(
            "billingDateSetting-input",
            result.seikyuBiSettei ?? "0"
        );

        setValue(
            "taxableSurcharge-input",
            result.kazeiWarimashi ?? "1"
        );

        setValue(
            "nonTaxableSurcharge-input",
            result.hikazeiWarimashi ?? "1"
        );


        updateOptionButtons();
    } catch (error) {
        alert(error.message);
    }
}


// ======================================================
//              SETTLEMENT DESTINATION VALIDATION
// ======================================================

async function validateSettlementDestination() {
    const code = getValue("settlementReceipt");
    const shipperCode = getValue("shipper-code");

    if (!code) {
        const field = getField("settlementReceipt");

        field.value = field.dataset.previousValue ?? "";
        field.focus();
        return;
    }

    // When the settlement destination is the same as
    // the shipper code, use the shipper's abbreviation.
    if (code === shipperCode) {

        setValue("shipper-name", getValue("abbreviation"));

        return;
    }

    try {
        const response = await fetch(
            `/ShipperMaster/ValidateSettlementDestination?code=${encodeURIComponent(code)}&isNewRecord=${!isEditMode}`
        );

        const result = await readJsonResponse(response);

        if (result.valid === false) {

            const field = getField("settlementReceipt");
            field.value = field.dataset.previousValue ?? "";

            field.focus();
            return;
        }

        setValue("shipper-name", result.略称 || "");
        getField("settlementReceipt").dataset.previousValue = code;
    } catch (error) {
        alert(error.message);
    }
}

// ======================================================
//              CALCULATION OPTION BUTTONS
// ======================================================

function initializeCalculationButtons() {
    document.querySelectorAll(".option-button-group").forEach(function (group) {
        const input = group.querySelector("input");
        const buttons = group.querySelectorAll(".select-option-btn");

        buttons.forEach(function (button, index) {
            button.addEventListener("click", function () {
                buttons.forEach(function (item) {
                    item.classList.remove("active");
                });

                this.classList.add("active");

                if (input) {
                    input.value = String(index);
                }
            });
        });

        if (input) {
            input.addEventListener("change", function () {
                const number = Number(this.value);

                buttons.forEach(function (button, index) {
                    button.classList.toggle(
                        "active",
                        index === number
                    );
                });
            });
        }
    });
}

function updateOptionButtons() {
    document.querySelectorAll(".option-button-group").forEach(function (group) {
        const input = group.querySelector("input");

        if (!input) {
            return;
        }

        const value = Number(input.value);
        const buttons = group.querySelectorAll(".select-option-btn");

        buttons.forEach(function (button, index) {
            button.classList.toggle("active", index === value);
        });
    });
}

// ======================================================
//              HISTORY - LOAD GRID
// ======================================================

async function loadHistory(kind) {
    const code = getValue("shipper-code");

    if (!code) {
        return;
    }

    const branchCodeField = kind === "billing"
        ? "branch-code1"
        : "branch-code2";

    const branchCode = getValue(branchCodeField).trim() || "";

    try {
        const response = await fetch(
            `/ShipperMaster/GetHistory?code=${encodeURIComponent(code)}&branchCode=${encodeURIComponent(branchCode)}&kind=${encodeURIComponent(kind)}`
        );

        const data = await readJsonResponse(response);

        const rows = Array.isArray(data) ? data : [];

        renderHistoryGrid(kind, rows);
        return rows;
    } catch (error) {
        alert(error.message);
    }
}

function renderHistoryGrid(kind, rows) {

    const tabId = kind === "billing"
        ? "billingHistory"
        : "accountsReceivableHistory";

    const tbody = document.querySelector(
        `#${tabId} .history-grid tbody`
    );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    rows.forEach(function (row) {

        const tr = document.createElement("tr");

        tr.tabIndex = 0;

        // Same as legacy RowData(Max_Row)
        tr.dataset.updateDate =
            row["更新日"] || "";

        tr.dataset.branchCode =
            row["支店コード"] || "";

        let columns;

        if (kind === "billing") {

            columns = [
                row["開始日"],
                row["更新日"],
                row["前回請求額"],
                row["今回入金額"],
                row["入金調整額"],
                row["今回繰越額"],
                row["今回運賃額"],
                row["割増額課"],
                row["割増額非"],
                row["課税値引額"],
                row["非課税値引"],
                row["今回消費税"],
                row["今回値引額"],
                row["今回合計額"],
                row["今回請求額"],
                row["回収予定日"],
                row["回収方法名称"]
            ];

        }
        else {

            columns = [
                row["開始日"],
                row["更新日"],
                row["前月売掛残"],
                row["今月入金額"],
                row["入金調整額"],
                row["今月繰越額"],
                row["今月運賃額"],
                row["割増額課"],
                row["割増額非"],
                row["課税値引額"],
                row["非課税値引"],
                row["今月消費税"],
                row["今月値引額"],
                row["今月合計額"],
                row["今月売掛残"]
            ];

        }

        columns.forEach(function (value, index) {

            const td = document.createElement("td");

            if (value !== null && value !== undefined) {

                // Legacy DecimalToString(value, "#,0")
                if (index >= 2 && index <= 14) {

                    const number = Number(value);

                    td.textContent = Number.isNaN(number)
                        ? String(value)
                        : number.toLocaleString("ja-JP", {
                            maximumFractionDigits: 0
                        });
                }
                // Legacy FormatDate(value, F_Date)
                else if (index === 0 || index === 1 || index === 15) {

                    td.textContent = formatDateForJapaneseInput(value);
                }
                else {
                    td.textContent = String(value);
                }
            }
            else {
                td.textContent = "";
            }

            tr.appendChild(td);
        });

        tr.addEventListener("click", function () {

            tbody.querySelectorAll("tr").forEach(function (item) {
                item.classList.remove("selected");
            });

            tr.classList.add("selected");
            //}

            currentHistoryRow = row;
        });

        tr.addEventListener("focus", function () {

            tbody.querySelectorAll("tr").forEach(function (item) {
                item.classList.remove("selected");
            });

            tr.classList.add("selected");

            currentHistoryRow = row;
        });

        tr.addEventListener("dblclick", async function () {

            currentHistoryRow = row;

            await loadHistoryRow(kind, row);

            if (kind === "billing") {
                getField("fromDate_bill")?.focus();
            }
            else {
                getField("fromDate_Ar")?.focus();
            }
        });

        tr.addEventListener("keydown", async function (event) {

            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();

            currentHistoryRow = row;

            await loadHistoryRow(kind, row);

            if (kind === "billing") {
                getField("fromDate_bill")?.focus();
            }
            else {
                getField("fromDate_Ar")?.focus();
            }
        });

        tr.addEventListener("keydown", function (event) {

            const rows =
                Array.from(
                    tbody.querySelectorAll("tr")
                );

            const currentIndex =
                rows.indexOf(tr);

            if (
                event.key === "ArrowDown" &&
                currentIndex < rows.length - 1
            ) {
                event.preventDefault();
                rows[currentIndex + 1].focus();

            }

            if (
                event.key === "ArrowUp" &&
                currentIndex > 0
            ) {
                event.preventDefault();
                rows[currentIndex - 1].focus();

            }
        });

        tbody.appendChild(tr);
        tr.dataset.updateDate = row["更新日"];
    });

    const firstRow = tbody.querySelector("tr");

    if (firstRow && rows.length > 0) {

        firstRow.classList.add("selected");

        currentHistoryRow = rows[0];
    }
}

// ======================================================
//              HISTORY - LOAD SELECTED ROW
// ======================================================

async function loadHistoryRow(kind, row) {
    const code = getValue("shipper-code");

    const branchCode = row["支店コード"] ||
        "";

    const updateDate = row["更新日"] || "";

    if (!updateDate) {
        alert("選択した履歴に更新日がありません。");
        return;
    }

    try {
        const response = await fetch(
            `/ShipperMaster/GetHistoryRow?code=${encodeURIComponent(code)}&branchCode=${encodeURIComponent(branchCode)}&kind=${encodeURIComponent(kind)}&updateDate=${encodeURIComponent(updateDate)}`
        );

        const data = await readJsonResponse(response);

        currentHistoryRow = data;

        fillHistoryFields(data, kind);

        if (kind === "billing") {
            getField("bh_DelBtn").disabled = false;
        }
        else if (kind === "receivable") {
            getField("ar_DelBtn").disabled = false;
        }

    } catch (error) {
        alert(`履歴の呼び出しに失敗しました。${error.message}`);
    }
}


// ======================================================
//              HISTORY - BUTTONS
// ======================================================

function initializeHistoryButtons() {
    const tabs = [
        { id: "billingHistory", kind: "billing" },
        { id: "accountsReceivableHistory", kind: "receivable" }
    ];

    tabs.forEach(function (item) {
        const tab = getField(item.id);

        if (!tab) {
            return;
        }

        const buttons = tab.querySelectorAll(
            ".action-button-row button"
        );

        // First button: edit/Save selected history.
        if (buttons[0]) {
            buttons[0].addEventListener("click", function () {

                saveHistoryRow(item.kind);
            });
        }

        // Second button: call selected history.
        if (buttons[1]) {
            buttons[1].addEventListener("click", function () {
                if (!currentHistoryRow) {
                    return;
                }

                loadHistoryRow(item.kind, currentHistoryRow);
            });
        }

        // Third button: delete selected history.
        if (buttons[2]) {
            buttons[2].addEventListener("click", function () {
                deleteHistoryRow(item.kind);
            });
        }

        // Fourth button: cancel history selection.
        if (buttons[3]) {
            buttons[3].addEventListener("click", async function () {

                currentHistoryRow = null;

                if (item.kind === "billing") {
                    clearHistoryFields("bill_HistoryDetails");

                    await resetSingleBranch("branch-code1", "billing-branch-name");

                    getField("branch-code1")?.focus();
                }
                else {
                    clearHistoryFields("ar_HistoryDetails");
                    await resetSingleBranch("branch-code2", "ar-branch-name");
                    getField("branch-code2")?.focus();
                }
            });
        }

        const branchField = item.kind === "billing" ? getField("branch-code1") : getField("branch-code2");

        if (branchField) {
            branchField.addEventListener("change", function () {
                loadHistory(item.kind);
            });
        }
    });
}

// ======================================================
//              HISTORY - DELETE SELECTED ROW
// ======================================================

async function deleteHistoryRow(kind) {

    if (!confirm("削除してもよいですか？")) {
        if (kind === "billing") {
            getField("branch-code1")?.focus();
        }
        else {
            getField("branch-code2")?.focus();
        }

        return;
    }

    const code = getValue("shipper-code");
    const branchCode = kind === "billing" ? getValue("branch-code1") : getValue("branch-code2");
    const updateDate = parseDateToIso(kind === "billing" ? getValue("toDate_bill") : getValue("toDate_Ar"));

    if (!updateDate) {
        return;
    }

    try {
        const url =
            `/ShipperMaster/DeleteHistoryRow?code=${encodeURIComponent(code)}` +
            `&branchCode=${encodeURIComponent(branchCode)}` +
            `&kind=${encodeURIComponent(kind)}` +
            `&updateDate=${encodeURIComponent(updateDate)}`;

        const response = await fetch(url, {
            method: "POST"
        });

        const result = await readJsonResponse(response);

        if (result.success) {
            hasChanges = true;
            currentHistoryRow = null;

            clearHistoryFields(kind === "billing" ? "bill_HistoryDetails" : "ar_HistoryDetails");

            if (kind === "billing") {

                await resetSingleBranch("branch-code1", "billing-branch-name");
            }
            else {

                await resetSingleBranch("branch-code2", "ar-branch-name");
            }

            await loadHistory(kind);

            if (kind === "billing") {
                getField("branch-code1")?.focus();
                getField("bh_DelBtn").disabled = true;
            }
            else if (kind === "receivable") {
                getField("branch-code2")?.focus();
                getField("ar_DelBtn").disabled = true;
            }
        }

    } catch (error) {
        alert(error.message);
    }
}

async function saveHistoryRow(kind) {

    const code = getValue("shipper-code").trim();

    if (!code) {
        alert("荷主コードを入力してください。");
        return;
    }

    // Select the correct date fields.
    const startDateField = kind === "billing"
        ? "fromDate_bill"
        : "fromDate_Ar";

    const endDateField = kind === "billing"
        ? "toDate_bill"
        : "toDate_Ar";

    const startDate = getValue(startDateField).trim();
    const endDate = getValue(endDateField).trim();

    // End date is required.
    if (!endDate) {
        alert("終了日が不正です正しく入力して下さい！！");
        getField(endDateField)?.focus();
        return;
    }

    // Validate the date format.
    const isValidDate = function (value) {

        if (!value) {
            return false;
        }

        // Japanese era date format: 令和 08年11月02日
        const match = value.match(
            /^(明治|大正|昭和|平成|令和)\s*(\d{1,2})年(\d{1,2})月(\d{1,2})日$/
        );

        if (!match) {
            return false;
        }

        const era = match[1];
        const eraYear = parseInt(match[2], 10);
        const month = parseInt(match[3], 10);
        const day = parseInt(match[4], 10);

        // Japanese era starting dates.
        const eraStartDates = {
            "明治": "1868-09-08",
            "大正": "1912-07-30",
            "昭和": "1926-12-25",
            "平成": "1989-01-08",
            "令和": "2019-05-01"
        };

        const startDate = new Date(eraStartDates[era] + "T00:00:00");

        // Convert Japanese era year to Gregorian year.
        const year = startDate.getFullYear() + eraYear - 1;

        // Validate the actual calendar date.
        const date = new Date(year, month - 1, day);

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return false;
        }

        // Validate that the date belongs to the specified era.
        const inputDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const eraEndDates = {
            "明治": "1912-07-29",
            "大正": "1926-12-24",
            "昭和": "1989-01-07",
            "平成": "2019-04-30"
        };

        if (inputDate < eraStartDates[era]) {
            return false;
        }

        if (eraEndDates[era] && inputDate > eraEndDates[era]) {
            return false;
        }

        return true;

    };

    if (!isValidDate(endDate)) {
        alert("終了日が不正です正しく入力して下さい！！");
        getField(endDateField)?.focus();
        return;
    }

    const startDateIso = startDate ? parseDateToIso(startDate) : null;
    const endDateIso = parseDateToIso(endDate);
    // Validate the period.
    if (startDateIso && endDateIso && new Date(startDateIso) > new Date(endDateIso)) {
        alert("期間が不正です日付を正しく入力して下さい！！");
        getField(startDateField)?.focus();
        return;
    }

    // Ask confirmation before saving.
    if (!confirm("修正してもよいですか？")) {
        if (kind === "billing") {
            getField("branch-code1")?.focus();
        }
        else {
            getField("branch-code2")?.focus();
        }
        return;
    }

    const branchCodeField = kind === "billing"
        ? "branch-code1"
        : "branch-code2";

    const branchCode = getValue(branchCodeField).trim();

    let historyData;

    const startDateForSave = startDate ? parseDateToIso(startDate) : null;
    const endDateForSave = parseDateToIso(endDate);

    // End date is required.
    if (!endDateForSave) {
        alert("終了日が不正です正しく入力して下さい！！");
        getField(endDateField)?.focus();
        return;
    }

    // Validate start date conversion.
    if (startDate && !startDateForSave) {
        alert("開始日が不正です正しく入力して下さい！！");
        getField(startDateField)?.focus();
        return;
    }

    if (kind === "billing") {

        historyData = {
            荷主コード: code,
            支店コード: branchCode,

            開始日: startDateForSave,
            更新日: endDateForSave,

            前回請求額: getHistoryAmountForSave("bh-previous-billing"),
            今回入金額: getHistoryAmountForSave("bh-payment-amount"),
            入金調整額: getHistoryAmountForSave("bh-adjustment-amount"),

            今回運賃額: getHistoryAmountForSave("bh-freight-amount"),
            割増額課: getHistoryAmountForSave("bh-taxable-surcharge"),
            割増額非: getHistoryAmountForSave("bh-nontaxable-surcharge"),

            課税値引額: getHistoryAmountForSave("bh-taxable-discount"),
            非課税値引: getHistoryAmountForSave("bh-nontaxable-discount"),
            今回消費税: getHistoryAmountForSave("bh-consumption-tax"),

            今回繰越額: getHistoryAmountForSave("bh-carry-forward"),
            今回値引額: getHistoryAmountForSave("bh-discount-amount"),
            今回合計額: getHistoryAmountForSave("bh-total-amount"),
            今回請求額: getHistoryAmountForSave("bh-billing-amount"),

            回収予定日:
                parseDateToIso(getValue("bh-collection-date")) || null,

            回収方法:
                getValue("collectionMethod3-code")
        };

    }
    else {

        historyData = {
            荷主コード: code,
            支店コード: branchCode,

            開始日: startDateForSave,
            更新日: endDateForSave,

            前月売掛残: getHistoryAmountForSave("ar-previous-balance"),
            今月入金額: getHistoryAmountForSave("ar-payment-amount"),
            入金調整額: getHistoryAmountForSave("ar-adjustment-amount"),

            今月運賃額: getHistoryAmountForSave("ar-freight-amount"),
            割増額課: getHistoryAmountForSave("ar-taxable-surcharge"),
            割増額非: getHistoryAmountForSave("ar-nontaxable-surcharge"),

            課税値引額: getHistoryAmountForSave("ar-taxable-discount"),
            非課税値引: getHistoryAmountForSave("ar-nontaxable-discount"),
            今月消費税: getHistoryAmountForSave("ar-consumption-tax"),

            今月繰越額: getHistoryAmountForSave("ar-carry-forward"),
            今月値引額: getHistoryAmountForSave("ar-discount-amount"),
            今月合計額: getHistoryAmountForSave("ar-total-amount"),
            今月売掛残: getHistoryAmountForSave("ar-receivable-balance")
        };
    }

    try {

        const url = `/ShipperMaster/SaveHistoryRow?kind=${encodeURIComponent(kind)}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(historyData)
        });

        const result = await readJsonResponse(response);

        if (result.success) {
            hasChanges = true;
            currentHistoryRow = null;

            await loadHistory(kind);

            if (kind === "billing") {
                clearHistoryFields("bill_HistoryDetails");
                getField("branch-code1")?.focus();
                getField("bh_DelBtn").disabled = true;
            }
            else {
                clearHistoryFields("ar_HistoryDetails");
                getField("branch-code2")?.focus();
                getField("ar_DelBtn").disabled = true;
            }

        }

    }
    catch (error) {

        alert(error.message || "履歴情報の修正に失敗しました。");

    }
}

async function getkanriPlKbn() {
    const response = await fetch("/ShipperMaster/GetKanriPlKbn");

    const result = await readJsonResponse(response);

    kanriPlKbn = result.value;
}

//======================================================
//              UNIT DROPDOWN EVENT
//======================================================
function initializeUnitDropdownEvent() {

    const nameDropdown = getField("unit-name");
    const codeField = getField("unit-code");

    if (!nameDropdown || !codeField) return;

    nameDropdown.addEventListener("change", function () {

        // The selected option's value is the Unit code.
        codeField.value = nameDropdown.value;

    });
}

// ======================================================
//       SHIPPER MASTER - FIELD MESSAGE DISPLAY
// ======================================================

// Displays the appropriate message when a field receives focus.

(function initializeShipperFieldMessages() {

    const fieldMessages = {

        // --------------------------------------------------
        // 1. DATE INPUT FIELDS
        // --------------------------------------------------

        "startDate":
            "明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]",

        "endDate":
            "明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]",

        "fromDate_bill":
            "明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]",

        "toDate_bill":
            "明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]",

        "fromDate_Ar":
            "明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]",

        "toDate_Ar":
            "明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]",

        "bh-collection-date":
            "明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]",


        // --------------------------------------------------
        // 2. BILLING AND ACCOUNTS RECEIVABLE AMOUNT FIELDS
        // --------------------------------------------------

        "bh-previous-billing":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "bh-payment-amount":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "bh-adjustment-amount":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "bh-freight-amount":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "bh-taxable-surcharge":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "bh-nontaxable-surcharge":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "bh-taxable-discount":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "bh-nontaxable-discount":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "bh-consumption-tax":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "ar-previous-balance":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "ar-payment-amount":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "ar-adjustment-amount":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "ar-freight-amount":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "ar-taxable-surcharge":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "ar-nontaxable-surcharge":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "ar-taxable-discount":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "ar-nontaxable-discount":
            "入力可能範囲[ -999,999,999～999,999,999 ]",

        "ar-consumption-tax":
            "入力可能範囲[ -999,999,999～999,999,999 ]",


        // --------------------------------------------------
        // 3. CLOSING DATE
        // --------------------------------------------------

        "closingDate":
            "末締めは『31』を入力",


        // --------------------------------------------------
        // 4. COLLECTION DATE
        // --------------------------------------------------

        "collectionDate":
            "月末回収は『31』を入力",


        // --------------------------------------------------
        // 5. COLLECTION CONDITION
        // --------------------------------------------------

        "collectionCondition":
            "入力可能範囲[ 0～999,999,999 ]",


        // --------------------------------------------------
        // 6. DISCOUNT RATE
        // --------------------------------------------------

        "discount-rate":
            "入力可能範囲[ -99.99～100.00 ]",


        // --------------------------------------------------
        // 7. QUANTITY AND WEIGHT DECIMAL PLACES
        // --------------------------------------------------

        "quantityDecimalPlaces":
            "入力可能範囲[ 0～3 ]",

        "weightDecimalPlaces":
            "入力可能範囲[ 0～3 ]",


        // --------------------------------------------------
        // 8. UNIT PRICE DECIMAL PLACES
        // --------------------------------------------------

        "unitPriceDecimalPlaces":
            "入力可能範囲[ 0～2 ]",


        // --------------------------------------------------
        // 9. INPUT SPAN
        // --------------------------------------------------

        "payrollOptInp":
            "入力可能範囲[ 0.00～100.00 ]"
    };


    // Display message when an input field receives focus.

    document.addEventListener("focusin", function (event) {

        const message = fieldMessages[event.target.id];

        setMessage(message || "");

    });


    // Clear message when the focused field loses focus.

    document.addEventListener("focusout", function (event) {

        if (Object.prototype.hasOwnProperty.call(
            fieldMessages,
            event.target.id
        )) {

            setMessage("");

        }

    });

})();

//======================================================
//              MESSAGE DISPLAY
//======================================================
// Sets the message text in the message label element.

function setMessage(message = "") {

    const label = document.getElementById("message-label");

    if (!label) return;

    label.textContent = message ?? "";
}

// ======================================================
// BILLING / RECEIVABLE HISTORY CALCULATIONS
// ======================================================

// Convert input values to numbers.
// Empty values are treated as zero.
function getHistoryAmount(id) {

    const input = document.getElementById(id);

    if (!input) {
        return 0;
    }

    const value = input.value
        .replace(/,/g, "")
        .trim();

    if (value === "" || value === "-") {
        return 0;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
}


// Display calculated amount with comma formatting.
function setHistoryAmount(id, value) {

    const input = getField(id);

    if (!input) {
        return;
    }

    const decimalDigits = parseInt(
        input.dataset.decDigits || 0
    );

    input.value = value.toLocaleString("en-US", {
        minimumFractionDigits: decimalDigits,
        maximumFractionDigits: decimalDigits
    });
}


// Calculate Billing History amounts.
function calculateBillingHistory() {

    // Input values
    const previousBilling =
        getHistoryAmount("bh-previous-billing");

    const paymentAmount =
        getHistoryAmount("bh-payment-amount");

    const adjustmentAmount =
        getHistoryAmount("bh-adjustment-amount");

    const freightAmount =
        getHistoryAmount("bh-freight-amount");

    const taxableSurcharge =
        getHistoryAmount("bh-taxable-surcharge");

    const nonTaxableSurcharge =
        getHistoryAmount("bh-nontaxable-surcharge");

    const taxableDiscount =
        getHistoryAmount("bh-taxable-discount");

    const nonTaxableDiscount =
        getHistoryAmount("bh-nontaxable-discount");

    const consumptionTax =
        getHistoryAmount("bh-consumption-tax");


    // Calculated values
    const carryForward =
        previousBilling - paymentAmount - adjustmentAmount;

    const discountAmount =
        taxableDiscount + nonTaxableDiscount;

    const totalAmount =
        freightAmount +
        taxableSurcharge +
        nonTaxableSurcharge +
        consumptionTax -
        discountAmount;

    const billingAmount =
        carryForward + totalAmount;


    // Display calculated values
    setHistoryAmount("bh-carry-forward", carryForward);

    setHistoryAmount("bh-discount-amount", discountAmount);

    setHistoryAmount("bh-total-amount", totalAmount);

    setHistoryAmount("bh-billing-amount", billingAmount);
}


// Calculate Receivable History amounts.
function calculateReceivableHistory() {

    // Input values
    const previousBalance =
        getHistoryAmount("ar-previous-balance");

    const paymentAmount =
        getHistoryAmount("ar-payment-amount");

    const adjustmentAmount =
        getHistoryAmount("ar-adjustment-amount");

    const freightAmount =
        getHistoryAmount("ar-freight-amount");

    const taxableSurcharge =
        getHistoryAmount("ar-taxable-surcharge");

    const nonTaxableSurcharge =
        getHistoryAmount("ar-nontaxable-surcharge");

    const taxableDiscount =
        getHistoryAmount("ar-taxable-discount");

    const nonTaxableDiscount =
        getHistoryAmount("ar-nontaxable-discount");

    const consumptionTax =
        getHistoryAmount("ar-consumption-tax");


    // Calculated values
    const carryForward =
        previousBalance - paymentAmount - adjustmentAmount;

    const discountAmount =
        taxableDiscount + nonTaxableDiscount;

    const totalAmount =
        freightAmount +
        taxableSurcharge +
        nonTaxableSurcharge +
        consumptionTax -
        discountAmount;

    const receivableBalance =
        carryForward + totalAmount;


    // Display calculated values
    setHistoryAmount("ar-carry-forward", carryForward);

    setHistoryAmount("ar-discount-amount", discountAmount);

    setHistoryAmount("ar-total-amount", totalAmount);

    setHistoryAmount("ar-receivable-balance", receivableBalance);
}


// ======================================================
// INITIALIZE HISTORY CALCULATION EVENTS
// ======================================================
function initializeHistoryCalculations() {

    const billingInputIds = [
        "bh-previous-billing",
        "bh-payment-amount",
        "bh-adjustment-amount",
        "bh-freight-amount",
        "bh-taxable-surcharge",
        "bh-nontaxable-surcharge",
        "bh-taxable-discount",
        "bh-nontaxable-discount",
        "bh-consumption-tax"
    ];

    const receivableInputIds = [
        "ar-previous-balance",
        "ar-payment-amount",
        "ar-adjustment-amount",
        "ar-freight-amount",
        "ar-taxable-surcharge",
        "ar-nontaxable-surcharge",
        "ar-taxable-discount",
        "ar-nontaxable-discount",
        "ar-consumption-tax"
    ];

    billingInputIds.forEach(id => {
        const field = document.getElementById(id);
        if (!field) return;

        field.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                calculateBillingHistory();
            }
        });

        field.addEventListener("blur", function () {
            calculateBillingHistory();
        });

        field.addEventListener("change", function () {

            calculateBillingHistory();
        });
    });

    receivableInputIds.forEach(id => {
        const field = document.getElementById(id);
        if (!field) return;

        field.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                calculateReceivableHistory();

            }
        });

        field.addEventListener("blur", function () {
            calculateReceivableHistory();

        });

        field.addEventListener("change", function () {
            calculateReceivableHistory();

        });
    });
}

function getActiveTabFields() {

    const activeTab = document.querySelector(
        ".tab-content.active"
    );

    if (!activeTab) {
        return [];
    }

    return Array.from(
        activeTab.querySelectorAll(
            "input:not([type='hidden']):not([type='button']):not([type='submit']), " +
            "select, textarea"
        )
    ).filter(field => {

        return (
            !field.disabled &&
            !field.readOnly &&
            field.offsetParent !== null &&
            field.type !== "hidden" &&
            field.type !== "button" &&
            field.type !== "submit" &&
            field.getClientRects().length > 0
        );

    });

}

function focusFirstActiveTabField() {

    const fields = getActiveTabFields();

    if (fields.length > 0) {
        fields[0].focus();
    }

}

function getHistoryAmountForSave(fieldId) {

    const value = getValue(fieldId);

    if (!value) {
        return 0;
    }

    const number = Number(
        String(value).replace(/,/g, "")
    );

    return Number.isFinite(number) ? number : 0;
}

// Enable/disable F6 master search button based on focused field.
function updateMasterSearchButton() {

    const masterSearchButton = getField("btnMasterSearch");

    if (!masterSearchButton) return;

    masterSearchButton.disabled = !masterSearchMapping[activeMasterSearchField];
}