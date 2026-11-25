// ======================================================
//              GLOBAL SCREEN FLAGS
// ======================================================

let isEditMode = false;
let isCopyMode = false;
let isProcessingDestinationCode = false;
let isProcessingCustomerCode = false;
let hasChanges = false;
let isCommitted = false;
let isLoadingRecord = false;
let isCommonMode = false;

let editingControl = null;
let lastFocusedFieldBeforeBtnAction = null;

let customerCode;
let destinationCode;
let activeMasterSearchField = null;

const originDestinationUrl = "/OriginDestinationMaster";

const masterSearchMapping = {
    "shipper-code": "openMasterShipperSearchPopup",
    "area-code": "openAreaSearchPopup"
};


// ======================================================
//              PAGE INITIALIZATION
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    initializeTabs();

    initializeOriginDestinationEvents();

    initializeOriginDestinationInputRestrictions();

    initializeOriginDestinationNavigation();

    initializeKeepValueBlurHandling();

    // Initial screen mode.
    isEditMode = false;
    isCopyMode = false;
    setEditMode();

    // Read registration mode from the ViewModel.
    isCommonMode =
        getValue("isCommonMode").toLowerCase() === "true";

    applyRegistrationMode();

    // Track changes committed with Enter or Tab.
    document.addEventListener(
        "keydown",
        trackCommittedField,
        true
    );

    // Store the currently edited field.
    document.addEventListener("focusin", function (event) {
        if (event.target.matches("input, select, textarea")) {
            editingControl = event.target;

            if (!isLoadingRecord) {
                event.target.dataset.oldValue =
                    event.target.value;
            }

            isCommitted = false;
        }

        // Disable F6 when focus moves outside the master search fields.
        // Do not clear the active field when the F6 button receives focus.
        if (event.target.id === "btnMasterSearch") {
            return;
        }

        if (!Object.keys(masterSearchMapping).includes(event.target.id)) {

            activeMasterSearchField = null;

            updateMasterSearchButton();

        }
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

    // Remember the previously focused field before button actions.
    document.querySelectorAll("button").forEach(button => {
        rememberFocusedField(button);
    });

    if (isCommonMode) {
        focusDestinationCode();
    }
    else {
        focusCustomerCode();
    }

});

// ======================================================
//              ELEMENT HELPERS
// ======================================================

function getField(id) {
    return document.getElementById(id);
}


function getValue(id) {
    const field = getField(id);

    return field ? field.value : "";
}


function setValue(id, value) {
    const field = getField(id);

    if (field) {
        field.value = value == null ? "" : value;
    }
}

const KEEP_VALUE_FIELDS =
    [
        "originName",
        "furigana",
        "abbreviation",
        "zipCode",
        "address1",
        "address2",
        "phoneNumber",
        "faxNumber",
        "remarks",
        "mapUrl",
        "digitaco"
    ];

function updateKeepValues() {
    KEEP_VALUE_FIELDS.forEach(id => {
        const field = getField(id);

        if (field) {
            field.dataset.keepValue = field.value;
        }
    });
}

function clearKeepValues() {
    KEEP_VALUE_FIELDS.forEach(id => {
        const field = getField(id);

        if (field) {
            field.dataset.keepValue = "";
        }
    });
}

function initializeKeepValueBlurHandling() {
    const nextOf =
    {
        originName: () =>
            document.querySelector(".tab-button.active"),

        furigana: () =>
            getField("abbreviation"),

        abbreviation: () =>
            getField("zipCode"),

        zipCode: () =>
            getField("address1"),

        address1: () =>
            getField("address2"),

        address2: () =>
            getField("phoneNumber"),

        phoneNumber: () =>
            getField("faxNumber"),

        faxNumber: () =>
            getField("area-code"),

        remarks: () =>
            getField("mapUrl"),

        mapUrl: () =>
            document.querySelector(".tab-button.active"),

        digitaco: () =>
            document.querySelector(".tab-button.active")
    };

    Object.entries(nextOf).forEach(([id, next]) => {
        getField(id)?.addEventListener("blur", e => {
            const field = e.target;

            if (e.relatedTarget === next()) {
                field.dataset.keepValue = field.value;
            }
            else {
                field.value =
                    field.dataset.keepValue ?? "";
            }
        });
    });
}

function clearDestinationDataFields() {
    [
        "originName",
        "furigana",
        "abbreviation",
        "zipCode",
        "address1",
        "address2",
        "phoneNumber",
        "faxNumber",
        "area-code",
        "area-name",
        "remarks",
        "mapUrl",
        "digitaco"
    ].forEach(id => {
        setValue(id, "");
    });
}

function rememberFocusedField(button) {

    button.addEventListener("mousedown", function (event) {

        event.preventDefault();

        const activeElement = document.activeElement;

        if (activeElement && activeElement.matches("input, textarea, select")) {
            lastFocusedFieldBeforeBtnAction = activeElement;
        }

        // Register and copy actions intentionally commit the field.
        if (this.id === "btnRegister" || this.id === "btnCopy") {
            isCommitted = true;
        }

    });
}

// ======================================================
//              JSON RESPONSE HELPER
// ======================================================

async function readJsonResponse(response) {

    let result = {};

    result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            "処理に失敗しました。"
        );
    }

    return result;
}

// Restrict text by half-width-unit count.
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

// ======================================================
//       ORIGIN DESTINATION INPUT RESTRICTIONS
// ======================================================

function initializeOriginDestinationInputRestrictions() {

    // Basic tab text fields.
    attachTextLimit("originName", 32);

    attachTextLimit("furigana", 32, true);

    attachTextLimit("abbreviation", 16);

    attachTextLimit("address1", 32);

    attachTextLimit("address2", 32);

    attachTextLimit("remarks", 50);

    attachTextLimit("phoneNumber", 15, true);

    attachTextLimit("faxNumber", 15, true);

    // Digitaco tab.
    attachDigitLimit("digitaco", 15);

    // Numeric code fields.
    attachDigitLimit("shipper-code", 10);

    attachDigitLimit("originCode", 10);

    attachDigitLimit("area-code", 4, 4);

    attachTextLimit("mapUrl", 250);

    // Postal code.
    initializePostalCode();

}

// ======================================================
//              CHANGE TRACKING
// ======================================================

function resetCommittedFieldValues() {

    document.querySelectorAll(
        ".main-container input, " +
        ".main-container select, " +
        ".main-container textarea"
    ).forEach(function (field) {

        if (
            field.id === "originCode" ||
            field.type === "button" ||
            field.type === "hidden"
        ) {
            return;
        }

        field.dataset.oldValue = field.value;

    });

    hasChanges = false;
}

function trackCommittedField(event) {

    if (event.key !== "Enter" && event.key !== "Tab" && event.key !== "ArrowDown") {
        return;
    }

    const field = event.target;

    if (
        !field.matches("input, select, textarea") ||
        field.id === "originCode" ||
        field.type === "button" ||
        field.type === "submit" ||
        field.type === "hidden"
    ) {
        return;
    }

    if (field.id === "shipper-code" || field.id === "mapUrl" || field.id === "area-code") {
        return;
    }

    if (
        field.dataset.oldValue !== undefined &&
        field.value !== field.dataset.oldValue
    ) {
        hasChanges = true;

        field.dataset.oldValue = field.value;
    }

}

// ======================================================
//              REGISTRATION MODE
// ======================================================

function applyRegistrationMode() {
    const customerSection = document.getElementById("customerInfoSection");

    const customerCodeField = getField("shipper-code");

    const customerNameField = getField("shipper-name");

    if (isCommonMode) {
        customerSection.style.display = "none";

        if (customerCodeField) {
            customerCodeField.value = "";
        }

        if (customerNameField) {
            customerNameField.value = "";
        }

    }
    else {
        customerSection.style.display = "flex";

        if (customerCodeField) {
            customerCodeField.disabled = false;
        }

        if (customerNameField) {
            customerNameField.disabled = false;
            customerNameField.readOnly = true;
        }

    }

}

// ======================================================
//              FOCUS HELPERS
// ======================================================

function focusCustomerCode() {

    const field = getField("shipper-code");

    if (field && !field.disabled) {
        field.focus();
        field.select();
    }

}

function focusDestinationCode() {

    const field = getField("originCode");

    if (field) {
        field.focus();
        field.select();
    }

}

function focusDestinationName() {

    const field = getField("originName");

    if (field) {
        field.focus();
        field.select();
    }

}

// ======================================================
//              SCREEN MODE
// ======================================================

function setEditMode() {

    const label = getField("mode-lbl");

    if (label) {
        label.textContent = isEditMode
            ? "修　正"
            : "新　規";
    }

    const code = getField("originCode");

    if (code) {

        code.readOnly = isEditMode;

        code.classList.toggle(
            "existing-code",
            isEditMode
        );
    }

    const copyButton = getField("btnCopy");

    const deleteButton = getField("btnDelete");

    if (copyButton) {
        copyButton.disabled = !isEditMode;
    }

    if (deleteButton) {
        deleteButton.disabled = !isEditMode;
    }

}

// ======================================================
//              EVENT INITIALIZATION
// ======================================================

function initializeOriginDestinationEvents() {

    // Customer code.
    const customerField = getField("shipper-code");

    if (customerField) {

        customerField.addEventListener(
            "keydown",
            async function (event) {

                if (event.key !== "Enter" && event.key !== "Tab" && event.key !== "ArrowDown") {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                await processCustomerCode();

            }
        );

        customerField.addEventListener("blur", async function (event) {

            const nextControl = event.relatedTarget;

            if (nextControl && nextControl.id === "originCode") {
                await processCustomerCode();
            }
            else {
                this.value = this.dataset.lastValidCode || "";
            }
        });

    }


    // Destination code.
    const destinationField = getField("originCode");

    if (destinationField) {

        destinationField.addEventListener(
            "keydown",
            async function (event) {

                if (
                    event.key !== "Enter" &&
                    event.key !== "Tab" && event.key !== "ArrowDown"
                ) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                isCommitted = true;

                const success = await processDestinationCode(event);

                if (success) {
                    focusDestinationName();
                }
                return;

            }
        );

        destinationField.addEventListener("blur", async function (event) {
            // Do not run again if Enter / Tab is already processing.
            if (isProcessingDestinationCode) {
                return;
            }

            const nextField = event.relatedTarget;

            // If the user moves directly to Origin Name,
            // check the entered code and load the existing record.
            if (nextField && nextField.id === "originName") {
                await processDestinationCode(event);
                return;
            }

            // If the user moves to any other field or button,
            // display the next generated destination code.
            //await getNextDestinationCode();
            //destinationField.dataset.lastValidCode = destinationField.value;
            destinationField.value = destinationField.dataset.lastValidCode || "";
        });

    }


    // Destination name.
    const nameField = getField("originName");
    let lastKanaReading = "";
    if (nameField) {

        nameField.addEventListener("compositionupdate", function (event) {
            const reading = event.data || "";

            if (/^[\u3041-\u3096\u30A1-\u30FCー]+$/
                .test(reading)
            ) {
                lastKanaReading = reading;
            }
        });

        nameField.addEventListener("compositionend", function () {
                const furigana = getField("furigana");

                if (!furigana) {
                    return;
                }

                furigana.value +=
                    toHalfWidth(lastKanaReading);

                lastKanaReading = "";
            });

        nameField.addEventListener("keydown", function (e) {

            if (
                e.key === "Enter" ||
                e.key === "Tab" ||
                e.key === "ArrowDown"
            ) {
                autoFillAbbreviation();
            }

        });


    }


    // District code lookup.
    const districtField = getField("area-code");

    if (districtField) {

        // Store the initial values.
        districtField.dataset.previousCode = districtField.value;
        districtField.dataset.previousName = getValue("area-name");

        districtField.addEventListener("blur", async function (event) {

            const next = event.relatedTarget;

            if (!next || next.id !== "remarks") {

                this.value = this.dataset.previousCode || "";

                setValue("area-name", this.dataset.previousName || "");

                return;
            }

            const code = normalizeCode(this.value, 4);

            if (!code) {

                this.value = this.dataset.previousCode || "";

                setValue("area-name", this.dataset.previousName || "");

                this.focus();

                return;
            }

            this.value = code;

            await lookupDistrict();

        });

    }


    // Postal code lookup.
    const postalField = getField("zipCode");

    if (postalField) {

        postalField.addEventListener("blur", async function (event) {

            const next = event.relatedTarget;

            if (!next || next.id !== "address1") {
                return;
            }

            if (this.value.trim() !== "" && getValue("address1") === "") {

                await lookupPostalAddress();
            }

        });

    }

    const mapField = getField("mapUrl");

    if (mapField) {
        mapField.addEventListener("focus", function () {

            getField("btnCopy")?.setAttribute("disabled", "disabled");
        });
    }

    // F6 - Receive selected shipper for Settlement Receipt.
    document.addEventListener("master-shipper-search-selected", async function (event) {

        if (!getField("shipper-code") || !getField("shipper-name")) {
            return;
        }

        setValue("shipper-code", event.detail.code ?? "");
        setValue("shipper-name", event.detail.name ?? "");

        await processCustomerCode();

    });

    document.addEventListener("area-search-selected", async function (event) {

        setValue("area-code", event.detail.code);
        setValue("area-name", event.detail.areaName);

        const field = getField("area-code");

        if (field.dataset.previousCode !== event.detail.code) {
            hasChanges = true;
        }

        field.dataset.previousCode = event.detail.code;

        field.dataset.previousName = event.detail.areaName;

        getField("remarks")?.focus();
    });


    // F1 - Register.
    getField("btnRegister")
        ?.addEventListener("click", saveOriginDestination);


    // F2 - Copy.
    getField("btnCopy")
        ?.addEventListener("click", copyOriginDestination);


    // F4 - Delete.
    getField("btnDelete")
        ?.addEventListener("click", deleteOriginDestination);


    // F6 - Master search.
    const masterSearchButton = getField("btnMasterSearch");
    if (masterSearchButton) {
        masterSearchButton.addEventListener("click", function () {
            const popupEvent = masterSearchMapping[activeMasterSearchField];

            if (!popupEvent) {
                return;
            }
            activeBranchSearchField = document.activeElement.id;
            document.dispatchEvent(
                new CustomEvent(popupEvent)
            );
        });
    }


    // F11 - Cancel.
    getField("btnCancel")
        ?.addEventListener("click", cancelOriginDestination);


    // F12 - Exit.
    getField("btnExit")
        ?.addEventListener("click", exitOriginDestination);


    // Postal code -> address.
    /*getField("btnZipToAddress")
        ?.addEventListener("click", lookupPostalAddress);*/
    getField("btnZipToAddress")?.addEventListener("click", () => showNAMessage());


    // Address -> postal code.
    /*getField("btnAddressToZip")
        ?.addEventListener("click", addressToPostalSearch);*/
    getField("btnAddressToZip")?.addEventListener("click", () => showNAMessage());


    // Map button.
    getField("mapBtn")?.addEventListener("click", openMap);

    // Grid events.
    initializeOriginDestinationGrid();

}

// ======================================================
//              CUSTOMER CODE PROCESSING
// ======================================================

async function processCustomerCode() {

    if (isCommonMode || isProcessingCustomerCode) {
        return;
    }

    isProcessingCustomerCode = true;

    try {

        const field = getField("shipper-code");

        const code = normalizeCode(
            field.value,
            10
        );

        field.value = code;

        const result = await lookupCustomer();

        if (!result) {

            field.value = field.dataset.lastValidCode || "";

            setValue("shipper-name", field.dataset.lastValidName || "");

            focusCustomerCode();

            return;
        }
        await reloadDestinationList();

        await getNextDestinationCode();
        field.readOnly = true;
        field.classList.add("existing-code");

        focusDestinationCode();

    }
    catch (error) {
        alert(error.message);
    }
    finally {
        isProcessingCustomerCode = false;
    }

}

// ======================================================
//              CUSTOMER MASTER LOOKUP
// ======================================================

async function lookupCustomer() {

    const code = normalizeCode(
        getValue("shipper-code"),
        10
    );

    if (!code) {
        return false;
    }

    const response = await fetch(
        `${originDestinationUrl}/GetCustomer?customerCode=` +
        encodeURIComponent(code)
    );

    const result = await readJsonResponse(response);

    if (result.success === false || !result.customerName) {

        alert(result.message || `指定した荷主『${code}』は未登録です！！`);

        setValue("shipper-name", "");

        return false;
    }

    setValue("shipper-code", code);

    setValue(
        "shipper-name",
        result.customerName
    );

    const shipperField = getField("shipper-code");

    shipperField.dataset.lastValidCode = code;
    shipperField.dataset.lastValidName = result.customerName;

    return true;

}

// ======================================================
//              DISTRICT MASTER LOOKUP
// ======================================================

async function lookupDistrict() {

    const field = getField("area-code");

    if (!field) return false;

    const code = normalizeCode(field.value, 4);

    if (!code) {

        setValue("area-name", "");
        // Update previous values when the field is cleared.
        field.dataset.previousCode = "";
        field.dataset.previousName = "";
        return false;
    }

    field.value = code;

    try {

        const response = await fetch(
            `${originDestinationUrl}/GetDistrict?districtCode=` +
            encodeURIComponent(code)
        );

        const result = await readJsonResponse(response);

        if (result.success === false || !result.districtName) {

            alert(`指定したエリア『${code}』は未登録です！！`);
            // Restore the previous Area Code and Area Name.
            field.value = field.dataset.previousCode || "";
            setValue("area-name", field.dataset.previousName || "");

            field.focus();
            field.select();

            return false;
        }

        setValue("area-name", result.districtName);

        if (field.dataset.previousCode !== code) {
            hasChanges = true;
        }

        // Store the newly validated values.
        field.dataset.previousCode = code;
        field.dataset.previousName = result.districtName;
        return true;

    }
    catch (error) {

        alert(error.message);

        // Restore the previous values.
        field.value = field.dataset.previousCode || "";
        setValue("area-name", field.dataset.previousName || "");

        field.focus();
        field.select();

        return false;
    }

}

// ======================================================
//              GET NEXT DESTINATION CODE
// ======================================================

async function getNextDestinationCode() {

    const customer = isCommonMode
        ? ""
        : normalizeCode(getValue("shipper-code"), 10);

    const response = await fetch(
        `${originDestinationUrl}/GetNextCode?customerCode=` +
        encodeURIComponent(customer)
    );

    const result = await readJsonResponse(response);

    const nextCode =
        result.nextCode ||
        result.code ||
        "";

    if (!nextCode) {
        setValue("originCode", "");

        isEditMode = false;
        isCopyMode = false;
        setEditMode();

        return;
    }

    setValue("originCode", nextCode);

    getField("originCode").dataset.lastValidCode = nextCode;

    isEditMode = false;
    isCopyMode = false;

    setEditMode();

}

// ======================================================
//              DESTINATION CODE PROCESSING
// ======================================================

async function processDestinationCode(event) {

    if (isProcessingDestinationCode) {
        return false;
    }

    const field = getField("originCode");

    if (!field) return false;

    const code = normalizeCode(field.value, 10);

    // Skip if the field already contains the generated code.
    if (code !== "" && code === field.dataset.lastValidCode) {
        return false;
    }

    isProcessingDestinationCode = true;

    try {

        if (!code) {

            //field.dataset.lastValidCode = field.value;
            field.value = field.dataset.lastValidCode || "";

            focusDestinationCode();

            return false;
        }

        field.value = code;

        const customer = isCommonMode
            ? ""
            : normalizeCode(getValue("shipper-code"), 10);

        if (!isCommonMode && !customer) {

            focusCustomerCode();

            return false;
        }

        const response = await fetch(
            `${originDestinationUrl}/GetByCode?customerCode=` +
            encodeURIComponent(customer) +
            `&destinationCode=` +
            encodeURIComponent(code)
        );

        const result = await readJsonResponse(response);

        if (result.success && result.data) {

            if (isCopyMode) {

                alert(
                    `指定したコード『${code}』は存在します！！`
                );

                field.value = field.dataset.lastValidCode || "";

                focusDestinationCode();

                return false;
            }

            await applyDestinationRecord(result.data);
            getField("originCode").dataset.lastValidCode = getValue("originCode");
            isEditMode = true;
            isCopyMode = false;

            setEditMode();

            resetCommittedFieldValues();

            // Remember the existing record code.
            field.dataset.lastValidCode = field.value;

            focusDestinationName();

            return true;
        }
        clearDestinationDataFields();

        activeFirstTab();

        resetCommittedFieldValues();

        // Code does not exist. Keep the entered code.
        field.value = code;

        isEditMode = false;

        setEditMode();

        field.dataset.lastValidCode = code;

        focusDestinationName();

        hasChanges = false;

    }
    catch (error) {
        alert(error.message);
    }
    finally {
        isProcessingDestinationCode = false;
    }

}


// ======================================================
//              GET DESTINATION BY CODE
// ======================================================

async function getByCode(event, code) {

    const customer = isCommonMode
        ? ""
        : normalizeCode(getValue("shipper-code"), 10);

    const destination = normalizeCode(code, 10);

    try {

        const response = await fetch(
            `${originDestinationUrl}/GetByCode?customerCode=` +
            encodeURIComponent(customer) +
            `&destinationCode=` +
            encodeURIComponent(destination)
        );

        const result = await readJsonResponse(response);

        if (!result.success || !result.data) {

            alert("データが見つかりません。");

            return;
        }

        await applyDestinationRecord(result.data);
        getField("originCode").dataset.lastValidCode = getValue("originCode");

        isEditMode = true;
        isCopyMode = false;

        setEditMode();

        resetCommittedFieldValues();

        if (
            event &&
            (
                event.type === "dblclick" ||
                event.type === "keydown"
            )
        ) {
            focusDestinationName();
        }

    }
    catch (error) {
        alert(error.message);
    }

}

async function reloadDestinationList() {

    const customer = isCommonMode ? "" : normalizeCode(getValue("shipper-code"), 10);

    const response = await fetch(
        `${originDestinationUrl}/GetList?customerCode=${encodeURIComponent(customer)}`
    );

    const result = await readJsonResponse(response);

    const tbody =
        document.querySelector(".table-body");

    tbody.innerHTML = "";

    (result.list || []).forEach(item => {

        const tr =
            document.createElement("tr");

        tr.className = "list-grid-row";
        tr.tabIndex = 0;

        tr.dataset.code =
            item.destinationCode;

        tr.innerHTML =
            `<td>${item.destinationCode}</td>
             <td>${item.abbreviation ?? ""}</td>`;

        tbody.appendChild(tr);
    });

    initializeOriginDestinationGrid();
}

// ======================================================
//              APPLY DESTINATION RECORD
// ======================================================

async function applyDestinationRecord(model) {

    isLoadingRecord = true;

    try {

        setValue("shipper-code", model.customerCode);

        setValue("originCode", model.destinationCode);

        setValue("originName", model.destinationName);

        setValue("furigana", model.furigana);

        setValue("abbreviation", model.abbreviation);

        setValue("zipCode", model.postalCode);

        setValue("address1", model.address1);

        setValue("address2", model.address2);

        setValue("phoneNumber", model.phoneNumber);

        setValue("faxNumber", model.faxNumber);

        setValue("area-code", model.districtCode);

        setValue("area-name", model.districtName);

        setValue("remarks", model.remarks);

        setValue("mapUrl", model.url);

        setValue("digitaco", model.digitacoCode);

        // Format postal code.
        const postalField = getField("zipCode");

        if (postalField && postalField.value) {

            const digits = postalField.value.replace(/\D/g, "");

            if (digits.length === 7) {
                postalField.value =
                    digits.substring(0, 3) +
                    "-" +
                    digits.substring(3);
            }
        }

        // Display the first tab after loading.
        activeFirstTab();

        updateKeepValues();

    }
    finally {
        isLoadingRecord = false;
    }

}

// ======================================================
//              COLLECT SCREEN VALUES
// ======================================================

function collectOriginDestinationFields() {

    const customer = isCommonMode
        ? ""
        : normalizeCode(getValue("shipper-code"), 10);

    return {

        CustomerCode: customer,

        DestinationCode: normalizeCode(
            getValue("originCode"),
            10
        ),

        DestinationName: getValue("originName"),

        Furigana: getValue("furigana"),

        Abbreviation: getValue("abbreviation"),

        PostalCode: getValue("zipCode"),

        Address1: getValue("address1"),

        Address2: getValue("address2"),

        PhoneNumber: getValue("phoneNumber"),

        FaxNumber: getValue("faxNumber"),

        DistrictCode: normalizeCode(getValue("area-code"), 4),

        DistrictName: getValue("area-name"),

        Remarks: getValue("remarks"),

        Url: getValue("mapUrl"),

        DigitacoCode: getValue("digitaco"),

        IsNewRecord: !isEditMode,

        IsCommonMode: isCommonMode

    };

}

// ======================================================
//              VALIDATION
// ======================================================

async function validateOriginDestinationFields(model) {

    if (!isCommonMode && !model.CustomerCode) {

        alert("荷主コードが未入力です。　再入力して下さい");

        focusCustomerCode();

        return false;
    }

    if (!model.DestinationCode) {

        alert("発着地コードが未入力です。　再入力して下さい");

        focusDestinationCode();

        return false;
    }

    if (model.DestinationCode === "0000000000") {

        alert("発着地コード：0000000000 は手入力用コードなのでマスタ登録はできません");

        focusDestinationCode();

        return false;
    }

    if (!model.DestinationName) {

        alert("発着地名が未入力です。　再入力して下さい");

        getField("originName")?.focus();

        return false;
    }

    if (!model.Furigana) {

        alert("フリガナが未入力です。　再入力して下さい");

        activeFirstTab();

        getField("furigana")?.focus();

        return false;
    }

    if (!model.Abbreviation) {

        alert("略称が未入力です。　再入力して下さい");

        activeFirstTab();

        getField("abbreviation")?.focus();

        return false;
    }

    if (!model.DistrictCode) {

        alert("エリアが未入力です。　再入力して下さい");

        activeFirstTab();

        getField("area-code")?.focus();

        return false;
    }

    return true;

}

// ======================================================
//              F1 - REGISTER
// ======================================================

async function saveOriginDestination() {

    try {

        const model = collectOriginDestinationFields();

        if (!await validateOriginDestinationFields(model)) {
            return;
        }

        const response = await fetch(
            `${originDestinationUrl}/Save`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(model)
            }
        );

        const result = await readJsonResponse(response);

        if (result.success === false) {

            alert(result.message || "登録に失敗しました。");

            return;
        }

        hasChanges = false;

        isEditMode = false;
        isCopyMode = false;

        // Clear destination data but retain customer.
        clearDestinationFields();

        await reloadDestinationList();

        await getNextDestinationCode();

        resetCommittedFieldValues();

        focusDestinationCode();

    }
    catch (error) {
        alert(error.message);
    }

}

// ======================================================
//              F2 - COPY
// ======================================================

async function copyOriginDestination() {

    if (!isEditMode) {
        return;
    }

    try {

        const oldModel =
            collectOriginDestinationFields();

        const response = await fetch(
            `${originDestinationUrl}/GetNextCode?customerCode=` +
            encodeURIComponent(oldModel.CustomerCode)
        );

        const result = await readJsonResponse(response);

        const nextCode = result.nextCode || "";

        if (!nextCode) {
            setValue("originCode", "");
        }
        else {
            setValue("originCode", nextCode);
        }

        // Keep the existing record's data.
        setValue("originName", oldModel.DestinationName);
        setValue("furigana", oldModel.Furigana);
        setValue("abbreviation", oldModel.Abbreviation);
        setValue("zipCode", oldModel.PostalCode);
        setValue("address1", oldModel.Address1);
        setValue("address2", oldModel.Address2);
        setValue("phoneNumber", oldModel.PhoneNumber);
        setValue("faxNumber", oldModel.FaxNumber);
        setValue("area-code", oldModel.DistrictCode);
        setValue("area-name", oldModel.DistrictName);
        setValue("remarks", oldModel.Remarks);
        setValue("mapUrl", oldModel.Url);
        setValue("digitaco", oldModel.DigitacoCode);

        setValue("originCode", nextCode);

        updateKeepValues();

        const codeField = getField("originCode");

        if (codeField) {
            codeField.dataset.lastValidCode = nextCode;
        }

        isEditMode = false;
        isCopyMode = true;

        setEditMode();
        activeFirstTab();
        hasChanges = false;

        resetCommittedFieldValues();

        focusDestinationCode();

    }
    catch (error) {
        alert(error.message);
    }

}

// ======================================================
//              F4 - DELETE
// ======================================================

async function deleteOriginDestination() {

    const customer = isCommonMode
        ? ""
        : normalizeCode(getValue("shipper-code"), 10);

    const destination =
        normalizeCode(getValue("originCode"), 10);

    if (!destination) {
        return;
    }

    const checkResponse = await fetch(`${originDestinationUrl}/CheckDelete?customerCode=` +
        encodeURIComponent(customer) + `&destinationCode=` +
        encodeURIComponent(destination) + `&isCommonMode=` +
        encodeURIComponent(isCommonMode)
    );

    const checkResult = await readJsonResponse(checkResponse);

    if (checkResult.message) {

        alert(checkResult.message);

        return;
    }

    if (!confirm("削除してもよいですか？")) {
        focusDestinationName();
        return;
    }

    try {

        const response = await fetch(
            `${originDestinationUrl}/Delete`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    CustomerCode: customer,

                    DestinationCode: destination,

                    IsCommonMode: isCommonMode

                })
            }
        );

        const result = await readJsonResponse(response);

        if (result.success === false) {

            alert(result.message);
            focusDestinationName();

            return;
        }

        hasChanges = false;

        isEditMode = false;
        isCopyMode = false;

        clearDestinationFields();

        await reloadDestinationList();

        await getNextDestinationCode();

        resetCommittedFieldValues();

        focusDestinationCode();

    }
    catch (error) {
        alert(error.message);
    }

}

// ======================================================
//              CLEAR DESTINATION FIELDS
// ======================================================

function clearDestinationFields() {

    const fieldIds = [

        "originName",
        "furigana",
        "abbreviation",
        "zipCode",
        "address1",
        "address2",
        "phoneNumber",
        "faxNumber",
        "area-code",
        "area-name",
        "remarks",
        "mapUrl",
        "digitaco"

    ];

    fieldIds.forEach(id => {
        setValue(id, "");
    });
    clearKeepValues();
    focusDestinationCode();

    isEditMode = false;
    isCopyMode = false;

    setEditMode();

    activeFirstTab();

}

// ======================================================
//              CLEAR SCREEN
// ======================================================

function clearOriginDestinationScreen() {

    clearDestinationFields();

    if (isCommonMode) {

        setValue("shipper-code", "");
        setValue("shipper-name", "");

    }

    hasChanges = false;

}

// ======================================================
//              F11 - CANCEL
// ======================================================

async function cancelOriginDestination() {

    if (
        hasChanges &&
        !confirm("内容が変更されております。よろしいですか？")
    ) {

        if (lastFocusedFieldBeforeBtnAction) {
            lastFocusedFieldBeforeBtnAction.focus();
        }

        return;
    }

    clearOriginDestinationScreen();

    isEditMode = false;
    isCopyMode = false;

    setEditMode();

    if (!isCommonMode && getValue("shipper-code")) {

        await getNextDestinationCode();

        focusDestinationName();

    }
    else {

        await getNextDestinationCode();

        focusCustomerCode();

    }

    if (isCommonMode) {
        clearOriginDestinationScreen();

        await getNextDestinationCode();

        focusDestinationCode();

        resetCommittedFieldValues();

        return;
    }

}

// ======================================================
//              F12 - EXIT
// ======================================================

function exitOriginDestination() {

    if (
        hasChanges &&
        !confirm("変更されていますが、よろしいですか ?")
    ) {

        if (lastFocusedFieldBeforeBtnAction) {
            lastFocusedFieldBeforeBtnAction.focus();
        }

        return;
    }

    // Search mode: close the parent search modal.
    const isFromSearchMode =
        getValue("isFromSearchMode").toLowerCase() === "true";

    if (isFromSearchMode) {

        window.parent.postMessage(
            { action: "closeOriginDestMasterModal" },
            location.origin
        );

        return;
    }

    // Normal mode: navigate to the main menu.
    const button = getField("btnExit");

    const exitUrl = button?.dataset.exitUrl;

    if (exitUrl) {
        window.location.href = exitUrl;
    }
    else {
        history.back();
    }

}

// ======================================================
//              POSTAL CODE -> ADDRESS
// ======================================================

async function lookupPostalAddress() {

    const postal = getValue("zipCode")
        .replace(/\D/g, "");

    // Legacy behavior: do not overwrite an existing address.
    if (getValue("address1") !== "") {
        return;
    }

    if (!postal) {
        return;
    }

    try {

        const response = await fetch(
            `${originDestinationUrl}/GetPostalAddress?postalCode=` +
            encodeURIComponent(postal)
        );

        const result = await readJsonResponse(response);

        if (!result) {
            return;
        }

        const address1 = result.address1?.trim() ?? "";
        const address2 = result.address2?.trim() ?? "";

        if (address1 === "" && address2 === "") {
            return;
        }

        if (result.success === false) {
            throw new Error(
                result.message || "郵便番号検索に失敗しました。"
            );
        }

        setValue("address1", result.address1);

        setValue("address2", result.address2);

        updateKeepValues();

        getField("address1")?.focus();

    }
    catch (error) {
        alert(error.message);
    }

}

// ======================================================
//              ADDRESS -> POSTAL CODE SEARCH
// ======================================================

function addressToPostalSearch() {

    const button = getField("btnAddressToZip");

    // The legacy application opened a postal-code search form.
    // Use the URL configured on the button when that search
    // screen is available in the web application.

    const searchUrl = button?.dataset.searchUrl;

    if (searchUrl) {

        window.open(
            searchUrl,
            "PostalSearch",
            "width=800,height=600"
        );

        return;
    }

    alert("住所から郵便番号を検索する画面がまだ接続されていません。");

}

// ======================================================
//              MAP BUTTON
// ======================================================

function openMap() {

    const url = getValue("mapUrl");

    if (!url) {
        return;
    }

    let mapUrl = url;

    if (!/^https?:\/\//i.test(mapUrl)) {
        mapUrl = "https://" + mapUrl;
    }

    window.open(
        mapUrl,
        "_blank",
        "noopener,noreferrer"
    );

}

// ======================================================
//              F6 - MASTER SEARCH
// ======================================================

async function masterSearch() {

    const activeField = document.activeElement;

    if (activeField?.id === "shipper-code") {

        const code = prompt(
            "荷主コードを入力して下さい。",
            getValue("shipper-code")
        );

        if (code === null) return;

        setValue(
            "shipper-code",
            normalizeCode(code, 10)
        );

        await processCustomerCode();

        return;
    }

    if (activeField?.id === "area-code") {

        const code = prompt(
            "地区コードを入力して下さい。",
            getValue("area-code")
        );

        if (code === null) return;

        setValue(
            "area-code",
            normalizeCode(code, 4)
        );

        await lookupDistrict();

        return;
    }

    alert("荷主コードまたは地区コードの入力欄にカーソルを置いて下さい。");

}

// ======================================================
//              GRID INITIALIZATION
// ======================================================

function initializeOriginDestinationGrid() {

    const tbody = document.querySelector(".table-body");

    if (!tbody) return;

    tbody.querySelectorAll("tr").forEach(function (row) {

        row.addEventListener("dblclick", function (event) {

            const code = this.dataset.code;

            if (code) {
                getByCode(event, code);
            }

        });

        row.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {

                const code = this.dataset.code;

                if (code) {
                    getByCode(event, code);
                }

            }

        });

    });

    // Select the first row in the grid by default
    const rows = document.querySelectorAll(".list-grid-row");
    if (rows.length > 0) {
        rows[0].classList.add("selected");
    }

    rows.forEach(row => {
        row.addEventListener("click", function () {

            rows.forEach(r =>
                r.classList.remove("selected"));

            this.classList.add("selected");
            this.focus();

        });

    });

}

// ======================================================
//              ACTIVE FIRST TAB
// ======================================================

function activeFirstTab() {

    document.querySelectorAll(".tab-button").forEach(tab => {
        tab.classList.remove("active");
    });

    document.querySelectorAll(".tab-content").forEach(content => {
        content.classList.remove("active");
    });

    document.querySelector(
        '.tab-button[data-tab="basicSetting"]'
    )?.classList.add("active");

    getField("basicSetting")?.classList.add("active");

}

// ======================================================
//              KEYBOARD NAVIGATION
// ======================================================

function initializeOriginDestinationNavigation() {

    document.addEventListener("keydown", async function (event) {

        const currentField = event.target;

        // Only handle Enter, Tab and ArrowDown.
        if (!["Enter", "Tab", "ArrowDown", "ArrowUp", "Escape"].includes(event.key)) {
            return;
        }

        if (event.defaultPrevented) {
            return;
        }
        // -------------------------------------------------
        // Tab name button: Enter moves to first tab field.
        // -------------------------------------------------
        if (currentField.classList.contains("tab-button") && (event.key === "Enter" || event.key === "ArrowDown")) {

            event.preventDefault();

            focusFirstActiveTabField();

            return;
        }

        if (
            !currentField.matches(
                "input, select, textarea"
            )
        ) {
            return;
        }

        if (currentField.tagName === "TEXTAREA") {
            return;
        }

        // Do not interfere with code-specific Enter/Tab processing.
        if (currentField.id === "shipper-code") {
            return;
        }

        // Origin Name: Enter or Tab moves to active tab.
        if (currentField.id === "originName" && event.key !== "ArrowUp") {

            if (event.key === "Enter" || event.key === "Tab" || event.key === "ArrowDown") {
                if (getValue("originName") === "") {
                    event.preventDefault();
                    focusDestinationName();
                    return;
                }
                event.preventDefault();

                document.querySelector(".tab-button.active")?.focus();

            }

            return;
        }

        // -------------------------------------------------
        // Furigana: Mandatory validation.
        // -------------------------------------------------
        const furigana = getField("furigana");
        if (currentField.id === furigana.id && event.key !== "ArrowUp") {

            if (furigana.value.trim() === "") {

                event.preventDefault();

                furigana.focus();

                return;
            }

        }

        if (currentField.id === "abbreviation" &&
            event.key !== "ArrowUp" &&
            event.key !== "Escape" &&
            getValue("abbreviation").trim() === ""
        ) {
            event.preventDefault();
            return;
        }


        if (event.key === "ArrowUp" || event.key === "Escape") {

            if (currentField.id === "originCode") {

                if (!isCommonMode) {
                    focusCustomerCode();
                }

                return;
            }

            if (currentField.id === "originName") {

                focusDestinationCode();
                return;
            }
        }

        const activeTab = document.querySelector(
            ".tab-content.active"
        );

        const activeTabButton = document.querySelector(
            ".tab-button.active"
        );

        if (!activeTab) {
            return;
        }

        const activeFields = getActiveTabFields();

        if (activeFields.length === 0) {
            return;
        }

        const index = activeFields.indexOf(currentField);

        if (index === -1) {
            return;
        }

        event.preventDefault();

        // -------------------------------------------------
        // UP ARROW: Move to previous field.
        // -------------------------------------------------
        if (event.key === "ArrowUp") {

            const shipperCode = getField("shipper-code");
            const shipperName1 = getField("shipper-name");
            const originCode = getField("originCode");
            const originName = getField("originName");

            // Get all fields above and inside the active tab.
            //const activeFields = getActiveTabFields();

            const allFields = [
                shipperCode,
                shipperName1,
                originCode,
                originName,
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
        // ENTER KEY
        // -------------------------------------------------
        if (event.key === "Enter" || event.key === "ArrowDown") {
            if (index < activeFields.length - 1) {
                activeFields[index + 1].focus();
            }
            else {
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

            if (index < activeFields.length - 1) {

                // Move to next field.
                activeFields[index + 1].focus();

            }
            else {

                // Last field -> first field.
                if (getField("originCode")) {
                    getField("originCode").focus();
                }

            }

        }

    });

}

function autoFillAbbreviation() {

    if (getValue("abbreviation")) {
        return;
    }

    const source = getValue("originName");

    if (!source) {
        return;
    }

    setValue("abbreviation", limitHalfWidthUnits(source, 16).trim());
}

// Get all enabled fields in the currently active tab.
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

// Focus the first field in the active tab.
function focusFirstActiveTabField() {

    const fields = getActiveTabFields();

    if (fields.length > 0) {
        fields[0].focus();
    }

}

function updateMasterSearchButton() {

    const masterSearchButton = getField("btnMasterSearch");

    if (!masterSearchButton) return;

    masterSearchButton.disabled = !masterSearchMapping[activeMasterSearchField];
}