// =====================================================
// SHARED VEHICLE MASTER HELPER FUNCTIONS
// Available to all DOMContentLoaded callbacks.
// =====================================================

// Normalize accounting method: 0 / 1 / 0:毎月 / 1:月指定.
function normalizeAccountingMethod(value) {

    const text = String(value ?? "").trim();
    const match = text.match(/^([01])(?:\s*:|$)/);

    return match ? match[1] : "";
}

// Format numeric values with comma separators.
function formatNumber(value) {

    if (value === null || value === undefined || value === "") {
        return "";
    }

    const number = Number(
        String(value).replace(/,/g, "").trim()
    );

    return Number.isFinite(number)
        ? number.toLocaleString("en-US", {
            maximumFractionDigits: 2
        })
        : value;
}

function formatLoadedKm(value, maximum) {
    if (value === null || value === undefined || value === "") {
        return "";
    }

    const number = Number(
        String(value).replace(/,/g, "").trim()
    );

    if (!Number.isFinite(number)) {
        return formatNumber(value);
    }

    return formatNumber(
        number < 0 || number > maximum ? 0 : number
    );
}

// Vehicle Type Selection 
document.querySelectorAll(".vehicle-type").forEach(button => {

    button.addEventListener("click", function () {

        // Update active button.
        document.querySelectorAll(".vehicle-type").forEach(x => {
            x.classList.remove("active");
        });

        this.classList.add("active");

        // Update vehicle type code.
        document.getElementById("vehicleTypeCode").value =
            this.dataset.value;

        // Move focus to department code.
        const departmentId = document.getElementById("departmentid");

        if (departmentId) {
            departmentId.focus();
            departmentId.select();
        }
    });
});
// Transport Type Selection
const fareTypeSelect = document.getElementById("transportType");
const fareTypeCode = document.getElementById("transportTypeCode");

if (fareTypeSelect && fareTypeCode) {
    fareTypeSelect.addEventListener("change", function () {
        fareTypeCode.value = this.value;
    });
}

/// MAin PArt Data Getting

document.addEventListener("DOMContentLoaded", function () {

    // Tracks whether the screen is in new-registration mode.
    let isNewRegistrationMode = true;
    window.isNewRecord = true;
    let isManualCodeEntry = false;
    let isCopyMode = false;


    // =============================================
    // VEHICLE MASTER KEYBOARD NAVIGATION
    // ArrowDown : Move to next field
    // ArrowUp   : Move to previous field
    // =============================================

    function getTabInputFields(tab) {

        const fields = Array.from(
            tab.querySelectorAll(
                'input:not([type="hidden"]):not(:disabled), ' +
                'select:not(:disabled), ' +
                'textarea:not(:disabled)'
            )
        ).filter(element => element.getClientRects().length > 0);

        // Reorder the 12 月指定 fields chronologically.
        if (tab.id === "fixedCost") {

            const monthFields = Array.from(
                { length: 12 },
                (_, index) => document.getElementById(`month${index + 1}`)
            ).filter(field =>
                field &&
                !field.disabled &&
                field.getClientRects().length > 0
            );

            const firstMonthIndex = fields.findIndex(
                field => field.classList.contains("month-value-input")
                    && field.id.startsWith("month")
            );

            if (firstMonthIndex !== -1) {

                const remainingFields = fields.filter(
                    field => !field.classList.contains("month-value-input")
                        || !/^month(?:[1-9]|1[0-2])$/.test(field.id)
                );

                const insertIndex = remainingFields.findIndex(
                    field => fields.indexOf(field) >= firstMonthIndex
                );

                remainingFields.splice(
                    insertIndex === -1 ? remainingFields.length : insertIndex,
                    0,
                    ...monthFields
                );

                return remainingFields;
            }
        }

        return fields;
    }

    function focusAndSelectField(element) {

        if (!element) return;

        element.focus();

        // Select the complete value in text-based inputs.
        if (
            element instanceof HTMLInputElement &&
            ["text", "search", "tel", "url", "password"].includes(element.type)
        ) {
            element.select();
        }
    }

    // =============================================
    // COMMON TAB KEYBOARD NAVIGATION
    // =============================================

    function navigateFieldList(event, fields, header) {

        const currentIndex = fields.indexOf(event.target);

        if (currentIndex === -1) return false;

        const forward =
            event.key === "Enter" ||
            event.key === "ArrowDown";

        const backward =
            event.key === "ArrowUp" ||
            event.key === "Escape";

        if (!forward && !backward) return false;

        event.preventDefault();

        const nextIndex = forward
            ? currentIndex + 1
            : currentIndex - 1;

        if (nextIndex >= 0 && nextIndex < fields.length) {
            focusAndSelectField(fields[nextIndex]);
        } else {
            header?.focus();
        }

        return true;
    }

    // Handle each tab.
    // Handle keyboard navigation for each tab.
    document.querySelectorAll(".tab-content").forEach(tab => {

        const header = document.querySelector(
            `.tab-button[data-tab="${tab.id}"]`
        );

        tab.addEventListener("keydown", function (event) {

            // Do not override a lookup, validation, or other field handler.
            if (event.defaultPrevented) return;

            // Special field order for the tire management tab.
            if (tab.id === "vehicleManagement") {

                const tireFields = [];

                // Oil fields first.
                ["exchangecriteria", "lastexchangedate", "afterreplacement"]
                    .forEach(id => {
                        const field = document.getElementById(id);

                        if (field && !field.disabled) {
                            tireFields.push(field);
                        }
                    });

                // Tire positions 1 → 22.
                for (let position = 1; position <= 22; position++) {

                    ["criteria", "date", "after"].forEach(fieldType => {

                        const field = tab.querySelector(
                            `[data-tire-position="${position}"][data-tire-field="${fieldType}"]`
                        );

                        if (field && !field.disabled) {
                            tireFields.push(field);
                        }
                    });
                }

                navigateFieldList(event, tireFields, header);
                return;
            }

            // Build the current visible and enabled field list at keydown time.
            navigateFieldList(
                event,
                getTabInputFields(tab),
                header
            );
        });
    });

    // Handle ArrowDown and ArrowUp in every tab.
    //document.querySelectorAll(".tab-content").forEach(tab => {

    //    tab.addEventListener("keydown", function (event) {

    //        if (
    //            event.key !== "ArrowDown" &&
    //            event.key !== "ArrowUp"
    //        ) {
    //            return;
    //        }

    //        const fields = getTabInputFields(tab);
    //        const currentIndex = fields.indexOf(event.target);

    //        if (currentIndex === -1) return;

    //        if (
    //            tab.id === "vehicleManagement" &&
    //            event.target.matches("[data-tire-position][data-tire-field]")
    //        ) {
    //            return;
    //        }

    //        event.preventDefault();

    //        const nextIndex =
    //            event.key === "ArrowDown"
    //                ? currentIndex + 1
    //                : currentIndex - 1;

    //        // Move to the next or previous field.
    //        if (nextIndex >= 0 && nextIndex < fields.length) {

    //            focusAndSelectField(fields[nextIndex]);
    //            return;
    //        }

    //        // At either end, focus the current tab header.
    //        const header = document.querySelector(
    //            `.tab-button[data-tab="${tab.id}"]`
    //        );

    //        header?.focus();
    //    });
    //});



    // =============================================
    // UNSAVED CHANGES TRACKING
    // =============================================

    

    window.isVehicleDirty = false;

    // Track committed changes in ordinary fields.
    function trackVehicleFieldChanges() {

        const excludedIds = [
            "carCode",
            "transportTypeCode",
            "vehicleTypeCode",
            "departmentid",
            "expenseitems",
            "drivercode",
            "accountingmethod",
            "expenseCategoryCode",
            "expenseItemCode"
        ];

        document.addEventListener("focusin", function (event) {
            const field = event.target;

            if (
                !field.matches("input, select, textarea") ||
                excludedIds.includes(field.id)
            ) {
                return;
            }

            field.dataset.keepValue = field.value;
        });

        document.addEventListener("change", function (event) {
            const field = event.target;

            if (
                !field.matches("input, select, textarea") ||
                excludedIds.includes(field.id)
            ) {
                return;
            }

            const previousValue = field.dataset.keepValue ?? "";

            // Decide after the field's own blur put-back has run.
            setTimeout(function () {
                if (field.value !== previousValue) {
                    window.isVehicleDirty = true;
                }

                field.dataset.keepValue = field.value;
            });
        });
    }

    trackVehicleFieldChanges();



    function confirmUnsavedChanges() {
        if (!isVehicleDirty) {
            return true;
        }

        return confirm("内容が変更されております。よろしいですか？");
    }

    function resetVehicleDirtyState() { 
        window.isVehicleDirty = false;
    }


    // =========================================
    // VEHICLE MASTER ELEMENTS
    // =========================================

    getNextVehicleCode();

    // =========================================
    // GET CURRENTLY ACTIVE TAB
    // =========================================
    function getActiveVehicleTab() {
        // Switch to the Basic Settings tab.
        const basicTab = document.querySelector(
            '.tab-navigation .tab-button[data-tab="basicSetting"]'
        );

        if (basicTab) {
            basicTab.click();
        }
    }

    const carCode = document.getElementById("carCode");
    const carNumber = document.getElementById("carNumber");

    const transportTypeCode = document.getElementById("transportTypeCode");
    const transportType = document.getElementById("transportType");
    const deliveryDate = document.getElementById("deliveryDate");

    if (!carCode) {
        console.error("Vehicle code input #carCode not found.");
        return;
    }

    // Store the previous valid transport type code.
    let previousValidCode = "";
    let hasPreviousValidCode = false; 
    // Prevent duplicate vehicle lookup requests.
    let lookupInProgress = false;
    let lastLookupCode = "";


    //async function getNextVehicleCode() {
    //    console.log("Getting next Vehicle Code...");

    //    try {
    //        const response = await fetch("/VehicleMaster/NextCode", {
    //            method: "GET",
    //            headers: {
    //                "Accept": "application/json"
    //            }
    //        });

    //        if (!response.ok) {
    //            throw new Error("HTTP Error: " + response.status);
    //        }

    //        const result = await response.json();

    //        if (!result.success || !result.vehicleCode) {
    //            carCode.value = "";
    //            setVehicleCodeState(false);
    //            lastLookupCode = "";
    //            return false;
    //        }

    //        // Set the next vehicle code.
    //        carCode.value = result.vehicleCode;

    //        // Set new-entry state.
    //        setVehicleCodeState(false);
    //        lastLookupCode = "";

    //        // Focus and select the vehicle code.
    //        carCode.focus();
    //        carCode.select();

    //        console.log("Next Vehicle Code:", result.vehicleCode);

    //        return true;

    //    } catch (error) {
    //        console.error("Next Vehicle Code Error:", error);

    //        carCode.value = "";
    //        setVehicleCodeState(false);
    //        lastLookupCode = "";

    //        return false;
    //    }
    //}


    async function getNextVehicleCode() {
        console.log("Getting next Vehicle Code...");

        try {
            const response = await fetch("/VehicleMaster/NextCode", {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("HTTP Error: " + response.status);
            }

            const result = await response.json();

            if (!result.success || !result.vehicleCodeRequest) {
                carCode.value = "";
                setVehicleCodeState(false);
                lastLookupCode = "";
                return false;
            }

            // Set the next vehicle code.
            carCode.value = result.vehicleCodeRequest;

            // Set new registration mode.
            setVehicleCodeState(false);
            setVehicleEditMode(false);

            // Remember the generated code to prevent duplicate lookup on Enter.
            lastLookupCode = result.vehicleCodeRequest;

            // Focus and select the vehicle code.
            carCode.focus();
            carCode.select();

            console.log("Next Vehicle Code:", result.vehicleCodeRequest);

            return true;

        } catch (error) {
            console.error("Next Vehicle Code Error:", error);

            carCode.value = "";
            setVehicleCodeState(false);
            setVehicleEditMode(false);
            lastLookupCode = "";

            return false;
        }
    }

    document.addEventListener("vehicle-search-selected", function (event) {

        const carCode = document.getElementById("carCode");

        if (!carCode) return;

        // Confirm only after a vehicle has been selected.
        if (!confirmUnsavedChanges()) {
            carCode.focus();
            return;
        }

        // Set the selected 車輌コード.
        carCode.value = event.detail.vehicleCode ?? "";

        // Trigger the existing lookup immediately.
        fetchVehicle(carCode.value);

        // Keep focus on the vehicle code field.
        carNumber.focus();
    });

    // =========================================
    // COMMON HELPER FUNCTIONS
    // =========================================

    // Set a field value only when the element exists.
    function setValue(id, value) {
        const element = document.getElementById(id);

        if (!element) return;

        element.value = value ?? "";
    }

    // Normalize a vehicle code to 10 digits.
    function normalizeVehicleCode(value) {
        const code = value.trim();

        if (!/^\d{1,10}$/.test(code)) {
            return null;
        }

        return code.padStart(10, "0");
    } 

    // Convert a date to YYYY-MM-DD.
    function toDateInputValue(value) {
        if (!value) return "";

        // Handle date-only strings without timezone shifting.
        const dateOnlyMatch = String(value).match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

        if (dateOnlyMatch) {
            return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    // Format a date for the Japanese date display.
    function formatJapaneseDate(value, showDay) {
        const dateValue = toDateInputValue(value);

        if (!dateValue) return "";

        const [year, month, day] = dateValue.split("-");

        return showDay
            ? `${year}年${month}月${day}日`
            : `${year}年${month}月`;
    }

    // Apply the pink background to an existing vehicle code.
    function setVehicleCodeState(found) {
        carCode.classList.toggle("vehicle-code-selected", found);
        // Existing vehicle: make code non-editable.
        // New vehicle: allow code editing.
        carCode.readOnly = found;
    }

    // =========================================
    // TRANSPORT TYPE VALIDATION
    // =========================================

    // Validate the entered transport type and synchronize its dropdown.
    //function updateTransportType() {
    //    if (!transportTypeCode || !transportType) return true;

    //    const code = transportTypeCode.value.trim();

    //    const optionExists = Array.from(transportType.options)
    //        .some(option => option.value === code && code !== "0");

    //    if (optionExists) {
    //        transportType.value = code;
    //        previousValidCode = code;
    //        hasPreviousValidCode = true;
    //        return true;
    //    }

    //    if (code === "0" || code === "") {
    //        transportType.value = "0";
    //        return true;
    //    }

    //    alert(`指定した運賃形態『${code}』は未登録です！！`);

    //    if (hasPreviousValidCode) {
    //        transportTypeCode.value = previousValidCode;
    //        transportType.value = previousValidCode;
    //    } else {
    //        transportTypeCode.value = "";
    //        transportType.value = "0";
    //    }

    //    transportTypeCode.focus();
    //    transportTypeCode.select();

    //    return false;
    //}

    //if (transportTypeCode && transportType) {
    //    // Validate when Enter or Tab is pressed.
    //    transportTypeCode.addEventListener("keydown", function (event) {
    //        if (event.key !== "Enter" && event.key !== "Tab") return;

    //        const isValid = updateTransportType();

    //        if (!isValid) {
    //            event.preventDefault();
    //            return;
    //        }

    //        if (event.key === "Enter") {
    //            event.preventDefault();
    //            deliveryDate?.focus();
    //        }
    //    });

    //    // Validate when focus moves away from the code field.
    //    transportTypeCode.addEventListener("blur", function () {
    //        updateTransportType();
    //    });

    //    // Synchronize the code when the dropdown changes.
    //    transportType.addEventListener("change", function () {
    //        transportTypeCode.value =
    //            transportType.value === "0" ? "" : transportType.value;

    //        if (transportType.value !== "0") {
    //            previousValidCode = transportType.value;
    //            hasPreviousValidCode = true;
    //        } else {
    //            previousValidCode = "";
    //            hasPreviousValidCode = false;
    //        }

    //        deliveryDate?.focus();
    //    });
    //}

    // =========================================
    // CLEAR VEHICLE FIELDS
    // =========================================


    function clearVehicleFields() {

        const fieldIds = [
            // Main vehicle details
            "carNumber",
            "makerName",
            "chassisNumber",
            "model",
            "engine",

            // Basic settings
            "firstYear",
            "firstYearMonth",
            "registrationDate",
            "registrationDateValue",
            "inspectionDate",
            "inspectionDateValue",
            "totaldistancetraveled",
            "maximumloadcapacity",
            "transportTypeCode",
            "transportType",
            "deliveryDate",
            "deliveryDateValue",
            "deregistrationdate",
            "deregistrationDateValue",
            "vehicleTypeCode",
            "departmentid",
            "departmentname",

            // Digital tachograph
            "digitaltachographcode",
            "cardnumber",

            // Tire / oil maintenance
            "exchangecriteria",
            "lastexchangedate",
            "lastexchangedateValue",
            "afterreplacement",
            // Salary Option Setting
            "salary",
            // Fixed Expense Settings - Tab 3
            "expenseitems",
            "drivercode",
            "accountingmethod",
            "monthly",
            "month1",
            "month2",
            "month3",
            "month4",
            "month5",
            "month6",
            "month7",
            "month8",
            "month9",
            "month10",
            "month11",
            "month12",
            "monthlyTotal"
        ];

        fieldIds.forEach(function (id) {

            const element = document.getElementById(id);

            if (!element) return;

            if (element.type === "checkbox") {
                element.checked = false;
            } else {
                element.value = "";
            }
        });

        // Reset salary to the default value.
        const salary = document.getElementById("salary");

        if (salary) {
            salary.value = "100.00";
        }

        // Clear fixed expense master names.
        document.querySelectorAll(
            ".master-name-expenseitems, " +
            ".master-name-drivercode, " +
            ".master-name-accountingmethod"
        ).forEach(function (element) {
            element.value = "";
        });

        // Reset accounting method to monthly.
        const accountingMethod = document.getElementById("accountingmethod");

        if (accountingMethod) {
            accountingMethod.value = "0";
        }

        const accountingMethodName = document.querySelector(
            ".master-name-accountingmethod"
        );

        if (accountingMethodName) {
            accountingMethodName.value = "毎　月";
        }

        // Clear dispatch checkbox.
        const dispatchCheckbox =
            document.getElementById("dispatchTableCheckbox");

        if (dispatchCheckbox) {
            dispatchCheckbox.checked = false;
        }

        // Reset transport type.
        if (transportType) {
            transportType.value = "0";
        }

        previousValidCode = "";
        hasPreviousValidCode = false;

        // Reset vehicle type buttons.
        document.querySelectorAll(".vehicle-type").forEach(function (button) {
            button.classList.remove("active");
        });

        // Clear maintenance fields.
        document.querySelectorAll(
            ".oil-grid input, .tire-grid input"
        ).forEach(function (input) {
            input.value = "";
        });
    }


    // =========================================
    // FILL MAIN VEHICLE FIELDS
    // =========================================

    function fillVehicleFields(vehicle) {
        setValue("carNumber", vehicle.vehicleCarNumber);
        setValue("makerName", vehicle.vehicleMakerName);
        setValue("chassisNumber", vehicle.vehicleChassisNumber);
        setValue("model", vehicle.vehicleModel);
        setValue("engine", vehicle.vehicleEngine);

        setValue(
            "firstYearMonth",
            toDateInputValue(vehicle.vehicleFirstYear)
        );
        setValue(
            "firstYear",
            formatJapaneseDate(vehicle.vehicleFirstYear, false)
        );

        setValue(
            "registrationDateValue",
            toDateInputValue(vehicle.vehicleRegistrationDate)
        );
        setValue(
            "registrationDate",
            formatJapaneseDate(vehicle.vehicleRegistrationDate, true)
        );

        setValue(
            "inspectionDateValue",
            toDateInputValue(vehicle.vehicleInspectionDate)
        );
        setValue(
            "inspectionDate",
            formatJapaneseDate(vehicle.vehicleInspectionDate, true)
        );

        setValue(
            "totaldistancetraveled",
            formatLoadedKm(vehicle.vehicleTotalDistanceKm, 9999999)
        );
        setValue(
            "maximumloadcapacity",
            formatNumber(vehicle.vehicleMaximumLoadCapacity)
        );

        setValue(
            "transportTypeCode",
            vehicle.vehicleTransportTypeCode
        );
        setValue(
            "transportType",
            vehicle.vehicleTransportTypeCode ?? "0"
        );

        setValue(
            "deliveryDateValue",
            toDateInputValue(vehicle.vehicleDeliveryDate)
        );
        setValue(
            "deliveryDate",
            formatJapaneseDate(vehicle.vehicleDeliveryDate, true)
        );

        setValue(
            "deregistrationDateValue",
            toDateInputValue(vehicle.vehicleDeregistrationDate)
        );
        setValue(
            "deregistrationdate",
            formatJapaneseDate(vehicle.vehicleDeregistrationDate, true)
        );

        setValue("vehicleTypeCode", vehicle.vehicleTypeCode);

        // Pre-fill the vehicle-assigned driver (運転手コード2 / 運転手名2).
        setValue("drivercode", vehicle.vehicleDriverCode2);
        document.querySelector(".master-name-drivercode").value =
            vehicle.vehicleDriverName2 ?? "";

        setValue("departmentid", vehicle.vehicleDepartmentCode);
        setValue("departmentname", vehicle.vehicleDepartmentName);
        // Load saved 手当掛率.
        const salary = document.getElementById("salary");

        if (salary) {
            salary.value = Number(
                vehicle.vehicleAllowanceRate ?? 100
            ).toFixed(2);
        }
        setValue(
            "digitaltachographcode",
            vehicle.vehicleDigitalTachographCode
        );
         
        
        setValue("cardnumber", vehicle.vehicleEtcCard);

        // Set the dispatch checkbox. 
        // Database 配車表示 = '1' means checkbox is checked.
        const dispatchCheckbox =
            document.getElementById("dispatchTableCheckbox");

        if (dispatchCheckbox) {
            dispatchCheckbox.checked =
                String(vehicle.vehicleDispatchDisplay ?? "").trim() === "1";
        }

        // Fill oil management fields.
        setValue(
            "exchangecriteria",
            formatLoadedKm(vehicle.vehicleOilCriteriaKm, 999999)
        );
        setValue(
            "lastexchangedateValue",
            toDateInputValue(vehicle.vehicleOilExchangeDate)
        );
        setValue(
            "lastexchangedate",
            formatJapaneseDate(vehicle.vehicleOilExchangeDate, true)
        );
        setValue(
            "afterreplacement",
            formatLoadedKm(vehicle.vehicleOilExchangeKm, 999999)
        );

        // Synchronize the transport type's previous valid code.
        if (transportTypeCode && transportType) {
            previousValidCode = vehicle.vehicleTransportTypeCode
                ? String(vehicle.vehicleTransportTypeCode)
                : "";

            hasPreviousValidCode = previousValidCode !== "";

            transportTypeCode.value = previousValidCode;
            transportType.value = previousValidCode || "0";
        }

        // Synchronize vehicle type buttons.
        document.querySelectorAll(".vehicle-type").forEach(function (button) {
            button.classList.toggle(
                "active",
                button.dataset.value === String(
                    vehicle.vehicleTypeCode ?? ""
                )
            );
        });
    }

    // =========================================
    // FETCH AND FILL TIRE MANAGEMENT DATA
    // =========================================

    // Retrieve tire records for an existing vehicle.
    async function loadVehicleTires(vehicleCode) {
        const response = await fetch(
            `/VehicleMaster/GetVehicleTiresByCode?code=${encodeURIComponent(vehicleCode)}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "タイヤ管理データの取得に失敗しました。"
            );
        }

        fillVehicleTireFields(result.data || []);

        console.log("Vehicle tire data loaded successfully.");
    }

    // Fill all 22 tire positions using the returned records.
    function fillVehicleTireFields(tires) {
        // Clear all tire fields first to prevent stale values.
        document.querySelectorAll(
            ".tire-grid [data-tire-position]"
        ).forEach(function (input) {
            input.value = "";
        });

        tires.forEach(function (tire) {
            // The controller serializes VehicleTirePositionCode
            // as vehicleTirePositionCode.
            const position = String(tire.vehicleTirePositionCode);

            if (!/^(?:[1-9]|1\d|2[0-2])$/.test(position)) {
                console.warn("Invalid tire position returned:", position);
                return;
            }

            const criteriaInput = document.querySelector(
                `.tire-grid [data-tire-position="${position}"][data-tire-field="criteria"]`
            );

            const dateInput = document.querySelector(
                `.tire-grid [data-tire-position="${position}"][data-tire-field="date"]`
            );

            const dateValueInput = document.querySelector(
                `.tire-grid [data-tire-position="${position}"][data-tire-field="date-value"]`
            );

            const afterInput = document.querySelector(
                `.tire-grid [data-tire-position="${position}"][data-tire-field="after"]`
            );

            if (criteriaInput) {
                criteriaInput.value = formatLoadedKm(
                    tire.vehicleTireCriteriaKm,
                    999999
                );
            }

            if (dateValueInput) {
                dateValueInput.value = toDateInputValue(
                    tire.vehicleTireExchangeDate
                );
            }

            if (dateInput) {
                dateInput.value = formatJapaneseDate(
                    tire.vehicleTireExchangeDate,
                    true
                );
            }

            if (afterInput) {
                afterInput.value = formatLoadedKm(
                    tire.vehicleTireExchangeKm,
                    999999
                );
            }
        });
    }

    // Retrieve fixed expense records for a vehicle.
    async function loadVehicleFixedExpenses(vehicleCode) {
        try {
            const response = await fetch(
                `/VehicleMaster/GetVehicleFixedExpenses?code=${encodeURIComponent(vehicleCode)}`
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "固定経費マスタのデータ取得に失敗しました。"
                );
            }

            const expenses = result.data || [];

            // Load the fixed-expense grid.
            fillVehicleFixedExpenses(expenses);

            //// Pre-fill the driver details from 運転手コード2 / 運転手名2.
            //const firstExpense = expenses[0];

            //const driverCodeInput = document.getElementById("drivercode");
            //const driverNameInput = document.querySelector(".master-name-drivercode");

            //if (driverCodeInput) {
            //    driverCodeInput.value =
            //        firstExpense?.vehicleFixedExpenseDriverCode ?? "";
            //}

            //if (driverNameInput) {
            //    driverNameInput.value =
            //        firstExpense?.vehicleFixedExpenseDriverName ?? "";
            //}

            console.log("Vehicle fixed expenses loaded successfully.");

        } catch (error) {
            console.error("Fixed expense loading failed:", error);

            alert(
                error.message || "固定経費マスタのデータ取得に失敗しました。"
            );
        }
    }

    // Populate the fixed expense grid.

    function fillVehicleFixedExpenses(expenses) {

        const tbody = document.getElementById("expenseTableBody");

        if (!tbody) {
            console.error("Expense table body #expenseTableBody not found.");
            return;
        }

        tbody.replaceChildren();

        expenses.forEach(function (expense) {

            const row = document.createElement("tr");

            row.dataset.vehicleCode =
                document.getElementById("carCode")?.value.trim() || "";

            const method =
                normalizeAccountingMethod(
                    expense.vehicleFixedExpenseSplitMethod
                ) || "0";

            // Store row information.
            row.dataset.expenseKey =
                expense.vehicleFixedExpenseKey ?? "";

            row.dataset.key =
                expense.vehicleFixedExpenseKey ?? 0;

            row.dataset.driverCode =
                expense.vehicleFixedExpenseDriverCode ?? "";

            row.dataset.accountingMethod = method;
            row.dataset.splitMethod = method;

            // Store the 毎月 amount.
            row.dataset.monthlyAmount =
                expense.vehicleFixedExpenseAmount ?? "";

            row.dataset.amount =
                expense.vehicleFixedExpenseAmount ?? "";

            // Store all 12 monthly amounts in JSON format.
            const monthlyValues = {};

            for (let month = 1; month <= 12; month++) {

                const value =
                    expense[`vehicleFixedExpenseAmount${month}`] ?? "";

                monthlyValues[`month${month}`] = value;

                // Keep compatibility with the existing save function.
                row.dataset[`amount${month}`] = value;
            }

            row.dataset.monthlyValues =
                JSON.stringify(monthlyValues);

            // Create grid columns.
            const values = [
                expense.vehicleFixedExpenseCode,
                expense.vehicleFixedExpenseName,
                expense.vehicleFixedExpenseDriverCode,
                expense.vehicleFixedExpenseDriverName,
                method === "0" ? "0:毎　月" : "1:月指定",
                formatNumber(expense.vehicleFixedExpenseAmount)
            ];

            values.forEach(function (value) {

                const cell = document.createElement("td");
                cell.textContent = value ?? "";

                row.appendChild(cell);
            });

            // Single-click: select and display row details.
            row.addEventListener("click", function () {
                selectFixedExpenseRow(row, expense);
            });

            // Allow keyboard selection.
            row.tabIndex = 0;

            tbody.appendChild(row);
        });
        // Initially select the first row in the grid.
        selectedExpenseRow = null;

        const firstRow = tbody.querySelector("tr");

        if (firstRow) {
            selectFixedExpenseRow(firstRow, expenses[0]);
        }
    }


    // Format the split method for display.
    function formatSplitMethod(value) {
        if (value === null || value === undefined || value === "") {
            return "";
        }

        // Replace this mapping with the actual 分割方法 definitions
        // used in your application if the database stores numeric codes.
        return String(value);
    }

    // Single-click: select and highlight the row only.
    function selectFixedExpenseRow(row, expense) {

        const tbody = document.getElementById("expenseTableBody");

        if (!row || !tbody) return;

        // Remember the selected row.
        selectedExpenseRow = row;

        // Remove previous selection.
        tbody.querySelectorAll("tr").forEach(function (item) {
            item.classList.remove("selected-expense-row");
        });

        // Highlight the current row.
        row.classList.add("selected-expense-row");

        // Do not load data into the input fields.
    }



    //// =========================================
    //// FETCH VEHICLE DATA FROM THE DATABASE
    //// =========================================

    //async function fetchVehicle() {
    //    const normalizedCode = normalizeVehicleCode(carCode.value);

    //    if (!normalizedCode) {
    //        alert("号車は1～10桁の数字で入力してください。");
    //        carCode.focus();
    //        carCode.select();
    //        return;
    //    }

    //    // Avoid repeating the same lookup when already loading.
    //    if (lookupInProgress) return;

    //    if (normalizedCode === lastLookupCode) return;

    //    lookupInProgress = true;
    //    carCode.value = normalizedCode;

    //    try {
    //        const response = await fetch(
    //            `/VehicleMaster/GetVehicleByCode?code=${encodeURIComponent(normalizedCode)}`
    //        );

    //        const result = await response.json();

    //        if (!response.ok || !result.success) {
    //            throw new Error(
    //                result.message || "車輌マスタのデータ取得に失敗しました。"
    //            );
    //        }

    //        if (result.found && result.data) {
    //            // Vehicle exists: fill the main vehicle fields.
    //            fillVehicleFields(result.data);
    //            setVehicleCodeState(true);

    //            // Retrieve tire records only for an existing vehicle.
    //            await loadVehicleTires(normalizedCode);

    //            lastLookupCode = normalizedCode;

    //            console.log("Vehicle record loaded:", result.data);
    //        } else {
    //            // Vehicle does not exist: prepare a new entry.
    //            clearVehicleFields();
    //            fillVehicleTireFields([]);

    //            carCode.value = normalizedCode;
    //            setVehicleCodeState(false);

    //            lastLookupCode = normalizedCode;

    //            console.log("Vehicle not found. New entry mode.");
    //        }
    //    } catch (error) {
    //        console.error("Vehicle lookup failed:", error);

    //        // Permit retry after a failed request.
    //        lastLookupCode = "";

    //        alert(
    //            error.message || "車輌マスタのデータ取得に失敗しました。"
    //        );
    //    } finally {
    //        lookupInProgress = false;
    //    }
    //}



    // =========================================
    // FETCH VEHICLE DATA FROM THE DATABASE
    // =========================================
    async function fetchVehicle() {
        const normalizedCode = normalizeVehicleCode(carCode.value);

        // Validate vehicle code.
        if (!normalizedCode) {
            alert("号車は1～10桁の数字で入力してください。");
            carCode.focus();
            carCode.select();
            return;
        }

        // Avoid repeating the same lookup when already loading.
        if (lookupInProgress) return;
        if (normalizedCode === lastLookupCode) return;

        lookupInProgress = true;
        carCode.value = normalizedCode;

        try {
            const response = await fetch(
                `/VehicleMaster/GetVehicleByCode?code=${encodeURIComponent(normalizedCode)}`
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "車輌マスタのデータ取得に失敗しました。"
                );
            }

            // Existing vehicle record found.
            if (result.found && result.data) {

                // In copy mode, reject any existing vehicle code.
                if (isCopyMode) {
                    alert(
                        `指定したコード『${normalizedCode}』は存在します！！`
                    );

                    // Keep copy mode and copied vehicle details.
                    setVehicleEditMode(false);
                    setVehicleCodeState(false);
                    lastLookupCode = "";

                    // Restore the next available vehicle code.
                    await getNextVehicleCode();

                    carCode.focus();
                    carCode.select();

                    return;
                }

                // Normal lookup: load the existing vehicle.
                fillVehicleFields(result.data);
                setVehicleCodeState(true);
                setVehicleEditMode(true);

                await loadVehicleTires(normalizedCode);
                await loadVehicleFixedExpenses(normalizedCode);

                lastLookupCode = normalizedCode;

                console.log("Vehicle record loaded:", result.data);

            } else {
                // Vehicle does not exist: prepare a new entry.
                // Keep copied fields when copy mode is active.
                if (!isCopyMode) {
                    clearVehicleFields();
                    fillVehicleTireFields([]);
                    fillVehicleFixedExpenses([]);
                }

                // Keep the entered code for new registration.
                carCode.value = normalizedCode;

                setVehicleCodeState(false);
                setVehicleEditMode(false);

                lastLookupCode = normalizedCode;

                console.log("Vehicle not found. New entry mode.");
            }

        } catch (error) {
            console.error("Vehicle lookup failed:", error);

            lastLookupCode = "";

            alert(
                error.message || "車輌マスタのデータ取得に失敗しました。"
            );

        } finally {
            lookupInProgress = false;
            isManualCodeEntry = false;
        }
    }



    // =========================================
    // VEHICLE CODE EVENTS
    // VEHICLE CODE EVENTS 
    // =========================================

    // Lookup on Enter.
    //carCode.addEventListener("keydown", function (event) {
    //    if (event.key !== "Enter") return;

    //    event.preventDefault();
    //    isManualCodeEntry = true;
    //    fetchVehicle();
    //});

    carCode.addEventListener("keydown", function (event) {

        if (event.key === "Enter" || event.key === "ArrowDown") {

            event.preventDefault();
            isManualCodeEntry = true;

            fetchVehicle().then(() => {

                carNumber.focus();
                carNumber.select();

            });

            return;
        }

        if (event.key === "Tab" && carCode.value.trim() !== "") {
            isManualCodeEntry = true;
            fetchVehicle();
        }
    });


    // Move from 車番 to the first field in 基本設定. 
    // Keep the last nonblank 車番 value.
    let lastValidCarNumber = carNumber.value.trim();

    carNumber.addEventListener("input", function () {
        const value = carNumber.value.trim();

        if (value !== "") {
            lastValidCarNumber = carNumber.value;
        }
    });

    // Move from 車番 to the first field in 基本設定.
    carNumber.addEventListener("keydown", function (event) {

        if (event.key !== "Enter" && event.key !== "ArrowDown") {
            return;
        }

        if (carNumber.value.trim() === "") {

            event.preventDefault();
            event.stopImmediatePropagation();

            // Restore the previous value.
            carNumber.value = lastValidCarNumber;

            carNumber.focus();
            carNumber.select();

            return;
        }

        event.preventDefault();

        focusAndSelectField(
            document.getElementById("makerName")
        );
    });

    // Keep the last nonblank 最大積載量 value.
    const maximumLoadCapacityInput =
        document.getElementById("maximumloadcapacity");

    if (maximumLoadCapacityInput) {

        let lastValidMaximumLoadCapacity =
            maximumLoadCapacityInput.value.trim();

        maximumLoadCapacityInput.addEventListener("input", function () {

            const value = maximumLoadCapacityInput.value.trim();

            if (value !== "") {
                lastValidMaximumLoadCapacity =
                    maximumLoadCapacityInput.value;
            }
        });

        maximumLoadCapacityInput.addEventListener("keydown", function (event) {

            if (event.key !== "Enter" && event.key !== "ArrowDown") {
                return;
            }

            if (maximumLoadCapacityInput.value.trim() === "") {

                event.preventDefault();
                event.stopImmediatePropagation();

                // Restore the previous value.
                maximumLoadCapacityInput.value =
                    lastValidMaximumLoadCapacity;

                maximumLoadCapacityInput.focus();
                maximumLoadCapacityInput.select();

                return;
            }
        });
    }

  const mainVehicleFields = [
    "makerName",
    "model",
    "chassisNumber",
    "engine"
];

    mainVehicleFields.forEach((id, index) => {

        const field = document.getElementById(id);

        if (!field) return;

        field.addEventListener("keydown", function (event) {

            if (event.key !== "Enter" && event.key !== "ArrowDown") {
                return;
            }

            event.preventDefault();

            const nextField =
                document.getElementById(mainVehicleFields[index + 1]);

            if (nextField) {
                focusAndSelectField(nextField);
            } else {
                // Move to the first field in 基本設定.
                const firstBasicField =
                    document.getElementById("firstYear");

                focusAndSelectField(firstBasicField);
            }
        });
    });

    function focusAndSelect(element) {

        if (!element) return;

        element.focus();

        if (typeof element.select === "function") {
            element.select();
        }
    }
    // Lookup only when moving from 車輌コード to 車番.
    carCode.addEventListener("blur", function (e) {

        if (e.relatedTarget === carNumber) {

            if (carCode.value.trim()) {
                fetchVehicle();
            }

        } else {

            // Restore the previously processed vehicle code.
            carCode.value = lastLookupCode || carCode.value;
        }
    });

    //// Lookup on Tab before moving to the next field.
    //carCode.addEventListener("keydown", function (event) {
    //    if (event.key !== "Tab") return;

    //    const normalizedCode = normalizeVehicleCode(carCode.value);

    //    if (!normalizedCode) return;

    //    carCode.value = normalizedCode;

    //    // Start the lookup; normal Tab navigation is preserved.
    //    fetchVehicle();
    //});
    // F5: Open the Vehicle Search popup.
    btnF5?.addEventListener("click", function () {

        document.dispatchEvent(
            new CustomEvent("openVehicleSearchPopup")
        );
    });

    // =========================================
    // F11: 中止 - CLEAR ALL VEHICLE DATA
    // =========================================

    const btnClear = document.getElementById("btnClear"); 

    if (btnClear) {
        btnClear.addEventListener("click", async function () {

            // Confirm before discarding unsaved changes.
            if (!confirmUnsavedChanges()) {
                return;
            }

            // Remember the currently active tab.
            const activeTab = getActiveVehicleTab();

            // Clear all vehicle fields.
            clearVehicleFields();

            // Clear tire management data.
            if (typeof fillVehicleTireFields === "function") {
                fillVehicleTireFields([]);
            }

            // Clear fixed expense data.
            if (typeof fillVehicleFixedExpenses === "function") {
                fillVehicleFixedExpenses([]);
            }

            // Clear repair history results.
            //const repairTableBody =
            //    document.getElementById("repairTableBody");

            //if (repairTableBody) {
            //    repairTableBody.replaceChildren();
            //}

            // Clear Tab 4 repair history results and totals.
            window.clearRepairHistoryGrid?.();

            // Clear vehicle code and remove pink background.
            carCode.value = "";
            setVehicleCodeState(false);

            isCopyMode = false;

            // Return to new registration mode.
            setVehicleEditMode(false);

            // Reset lookup state.
            lastLookupCode = "";

            // Clear displayed message.
            const messageText =
                document.getElementById("messageText");

            if (messageText) {
                messageText.textContent = "";
            }

            // Reset dirty state after clearing.
            resetVehicleDirtyState();

            // Generate the next vehicle code.
            await getNextVehicleCode();

            // Focus and select vehicle code.
            carCode.focus();
            carCode.select();

            console.log(
                "F11: Vehicle Master screen cleared and next code generated."
            );
        });
    }

    // =========================================
    // F7: PREVIOUS VEHICLE
    // =========================================
    const btnF7 = document.getElementById("btnF7");

    if (btnF7) {
        btnF7.addEventListener("click", async function () {

            if (!confirmUnsavedChanges()) {
                return;
            }

            await navigateVehicle("previous");
        });
    }

    // =========================================
    // F8: NEXT VEHICLE
    // =========================================
    const btnF8 = document.getElementById("btnF8");

    if (btnF8) {
        btnF8.addEventListener("click", async function () {

            if (!confirmUnsavedChanges()) {
                return;
            }

            await navigateVehicle("next");
        });
    }

    // =========================================
    // NAVIGATE TO PREVIOUS / NEXT VEHICLE
    // =========================================
    async function navigateVehicle(direction) {
        const currentCode = carCode.value.trim();

        if (!/^\d{1,10}$/.test(currentCode)) {
            alert("号車は1～10桁の数字で入力してください。");
            carCode.focus();
            carCode.select();
            return;
        }

        const normalizedCode = currentCode.padStart(10, "0");

        try {
            const endpoint = direction === "next"
                ? "/VehicleMaster/GetNextVehicle"
                : "/VehicleMaster/GetPreviousVehicle";

            const response = await fetch(
                `${endpoint}?code=${encodeURIComponent(normalizedCode)}`
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "車輌データの取得に失敗しました。"
                );
            }

            // No previous or next vehicle exists.
            if (!result.found || !result.vehicleCode) {
                if (direction === "next") {
                    alert("これより次のデータは有りません！！");
                } else {
                    alert("これより前のデータはありません！！");
                }
                // Return focus to 車番, matching the legacy behavior.
                carNumber.focus();
                carNumber.select();
                return;
            }

            // Set the target vehicle code.
            carCode.value = result.vehicleCode;

            // Reset the duplicate-lookup check.
            lastLookupCode = "";

            // Focus and select the 車番 input field.
            carNumber.focus();
            carNumber.select();

            // Load the selected vehicle using the existing lookup function.
            await fetchVehicle();

        } catch (error) {
            console.error("Vehicle navigation error:", error);

            alert(
                error.message || "車輌データの取得に失敗しました。"
            );
        }
    }


    // =========================================
    // SET VEHICLE REGISTER / EDIT MODE
    // =========================================
    function setVehicleEditMode(isEditMode) {
        const btnCopy = document.getElementById("btnCopy");
        const btnDelete = document.getElementById("btnDelete");
        const modeLabel = document.getElementById("mode-lbl");

        // Enable F2 and F4 only for existing vehicle records.
        if (btnCopy) {
            btnCopy.disabled = !isEditMode;
        }

        if (btnDelete) {
            btnDelete.disabled = !isEditMode;
        }

        // Change the label according to the current mode.
        if (modeLabel) {
            modeLabel.textContent = isEditMode ? "修　正" : "新　規";
        }
        isNewRegistrationMode = !isEditMode;
        window.isNewRecord = isNewRegistrationMode;
    }


    // =========================================
    // F4: DELETE VEHICLE
    // =========================================
    const btnDelete = document.getElementById("btnDelete");

    if (btnDelete) {
        btnDelete.addEventListener("click", async function () {

            // Deletion is permitted only for an existing vehicle.
            if (btnDelete.disabled) {
                return;
            }

            const delvehicleCode = carCode.value.trim();

            if (!/^\d{10}$/.test(delvehicleCode)) {
                return;
            }

            // Run legacy deletion checks before confirmation.
            try {
                const checkResponse = await fetch(
                    `/VehicleMaster/CheckDelete?vehicleCode=${encodeURIComponent(delvehicleCode)}`,
                    {
                        method: "GET",
                        headers: {
                            "Accept": "application/json"
                        }
                    }
                );

                const checkResult = await checkResponse.json();

                if (!checkResponse.ok || !checkResult.success) {
                    throw new Error(
                        checkResult.message || "削除可否の確認に失敗しました。"
                    );
                }

                if (!checkResult.canDelete) {
                    alert(checkResult.message);
                    return;
                }

            } catch (error) {
                console.error("Vehicle delete check failed:", error);
                alert(error.message || "削除可否の確認に失敗しました。");
                carNumber.focus();
                return;
            }

            // Show confirmation only once.
            const confirmed = confirm("削除してもよいですか？");

            if (!confirmed) {
                carNumber.focus();
                return;
            }

            btnDelete.disabled = true;

            try {
                const response = await fetch(
                    "/VehicleMaster/DeleteVehicle",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify({
                            deleteVehicleRequest: delvehicleCode
                        })
                    }
                );

                const responseText = await response.text();

                console.log("F4 HTTP Status:", response.status);
                console.log("F4 Response:", responseText);

                if (!responseText.trim()) {
                    throw new Error(
                        "サーバーから空の応答が返されました。"
                    );
                }

                let result;

                try {
                    result = JSON.parse(responseText);
                } catch (parseError) {
                    console.error("F4 JSON parsing error:", parseError);
                    throw new Error(
                        "サーバーから正しいJSON応答が返されませんでした。"
                    );
                }

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message || "車輌データの削除に失敗しました。"
                    );
                }

                // Clear all vehicle data.
                clearVehicleFields();

                fillVehicleTireFields([]);
                fillVehicleFixedExpenses([]);

                // Clear repair history.
                const repairTableBody =
                    document.getElementById("repairTableBody");

                if (repairTableBody) {
                    repairTableBody.replaceChildren();
                }

                // Return to new registration mode.
                carCode.value = "";
                setVehicleCodeState(false);
                setVehicleEditMode(false);
                lastLookupCode = "";

                // Clear displayed message.
                const messageText =
                    document.getElementById("messageText");

                if (messageText) {
                    messageText.textContent = "";
                }

                // Generate the next vehicle code.
                await getNextVehicleCode();

                carCode.focus();
                carCode.select();

            } catch (error) {
                console.error("Vehicle deletion failed:", error);
                alert(error.message || "削除に失敗しました！！");
                carNumber.focus();

            } finally {
                btnDelete.disabled = !carCode.classList.contains(
                    "vehicle-code-selected"
                );
            }
        });
    }


    // =====================================================
    // F1: Register / Update Vehicle
    // =====================================================

    if (btnRegister) {

        btnRegister.addEventListener("click", async function () {

            // =============================================
            // COMMON INPUT HELPERS
            // =============================================

            const carCodeInput = document.getElementById("carCode");

            const getValue = id =>
                document.getElementById(id)?.value?.trim() || "";

            const getNumber = id => {
                const value = getValue(id).replace(/,/g, "");
                return value === "" ? 0 : Number(value);
            };

            const getDate = id => {
                const value = getValue(id);
                return value || null;
            };

            // =============================================
            // F1: LEGACY INPUT VALIDATION (Input_Chk)
            // Validation order must match the legacy system.
            // =============================================

            // 1. 号車を入力してください
            const rawVehicleCode = carCodeInput?.value.trim() || "";

            if (rawVehicleCode === "") {
                alert("号車を入力してください");
                carCodeInput?.focus();
                return;
            }

            // Normalize vehicle code to 10 digits.
            const vehicleCode = normalizeVehicleCode(rawVehicleCode);

            if (!vehicleCode) {
                alert("車輌コードを正しく入力してください。");
                carCodeInput?.focus();
                carCodeInput?.select();
                return;
            }

            // 2. Check the raw input before zero-padding.
            if (rawVehicleCode === "0000000000") {
                alert("号車：0000000000 は手入力用コードなのでマスタ登録はできません");
                carCodeInput?.focus();
                carCodeInput?.select();
                return;
            }

            // 3. 車番を入力してください
            const carNumber = getValue("carNumber");

            if (carNumber === "") {
                alert("車番を入力してください");
                document.getElementById("carNumber")?.focus();
                return;
            }

            // 4. 最大積載量を入力してください
            const maximumLoadCapacity = getValue("maximumloadcapacity");

            if (maximumLoadCapacity === "") {
                alert("最大積載量を入力してください");
                switchTab("basicSetting");
                document.getElementById("maximumloadcapacity")?.focus();
                return;
            }

            // 5. 運賃形態 must be 1 through 9.
            const transportTypeCode = getValue("transportTypeCode");

            if (!["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(transportTypeCode)) {
                alert("運賃形態を正しく入力して下さい！！（1・2・3・4・5・6・7・8・9）");
                switchTab("basicSetting");
                document.getElementById("transportTypeCode")?.focus();
                document.getElementById("transportTypeCode")?.select();
                return;
            }

            // 6. 車輌区分 must be 0, 1, or 2.
            const vehicleTypeCode = getValue("vehicleTypeCode");

            if (!["0", "1", "2"].includes(vehicleTypeCode)) {
                alert("車輌区分を正しく入力して下さい！！（0・1・2）");
                switchTab("basicSetting");
                document.getElementById("vehicleTypeCode")?.focus();
                document.getElementById("vehicleTypeCode")?.select();
                return;
            }

            // =============================================
            // COLLECT TIRE MANAGEMENT DATA
            // =============================================

            const tires = Array.from({ length: 22 }, (_, index) => {

                const position = index + 1;

                const field = name =>
                    document.querySelector(
                        `[data-tire-position="${position}"][data-tire-field="${name}"]`
                    );

                const criteria = field("criteria")?.value || "";
                const after = field("after")?.value || "";

                const date = document.getElementById(
                    `maintenanceDateValue${position}`
                )?.value || "";

                return {
                    positionCode: position,
                    criteriaKm: Number(criteria.replace(/,/g, "")) || 0,
                    exchangeDate: date || null,
                    afterReplacementKm:
                        Number(after.replace(/,/g, "")) || 0
                };
            });

            // =============================================
            // COLLECT FIXED EXPENSE DATA
            // =============================================

            // Convert blank amounts to null instead of zero.
            const parseNullableAmount = value => {
                const normalized = String(value ?? "")
                    .replace(/,/g, "")
                    .trim();

                if (normalized === "") {
                    return null;
                }

                const number = Number(normalized);

                return Number.isFinite(number) ? number : null;
            };

            const fixedExpenses = Array.from(
                document.querySelectorAll("#expenseTableBody tr")
            ).map(row => {

                const cells = row.querySelectorAll("td");

                // Get accounting method.
                const splitMethod =
                    normalizeAccountingMethod(
                        row.dataset.accountingMethod ||
                        row.dataset.splitMethod ||
                        cells[4]?.textContent
                    ) || "0";

                // Restore monthly values stored in the row.
                let monthlyValues = {};

                try {
                    monthlyValues = JSON.parse(
                        row.dataset.monthlyValues || "{}"
                    );
                } catch (error) {
                    console.error("Monthly values parsing error:", error);
                }
                // Read the 12 monthly amounts.
                const amounts = {};

                for (let month = 1; month <= 12; month++) {

                    const value =
                        monthlyValues[`month${month}`] ??
                        row.dataset[`amount${month}`] ??
                        "";

                    amounts[`amount${month}`] =
                        parseNullableAmount(value);
                }
 

                // Read monthly amount.
                const amountValue =
                    row.dataset.monthlyAmount ??
                    row.dataset.amount ??
                    cells[5]?.textContent.trim() ??
                    "";

                return {
                    expenseCode: cells[0]?.textContent.trim() || "",

                    driverCode:
                        row.dataset.driverCode ||
                        cells[2]?.textContent.trim() ||
                        "",

                    splitMethod: splitMethod,

                    amount: parseNullableAmount(amountValue),

                    ...amounts,

                    key: Number(
                        row.dataset.expenseKey ||
                        row.dataset.key ||
                        0
                    )
                };
            });

            // =============================================
            // BUILD SAVE REQUEST
            // =============================================

            const requestData = {

                vehicleCode: vehicleCode,

                carNumber: carNumber,
                makerName: getValue("makerName"),
                model: getValue("model"),
                chassisNumber: getValue("chassisNumber"),
                engine: getValue("engine"),

                firstYear: getDate("firstYearMonth"),
                registrationDate: getDate("registrationDateValue"),
                inspectionDate: getDate("inspectionDateValue"),

                totalDistanceTraveled: getNumber("totaldistancetraveled"),

                maximumLoadCapacity:
                    Number(maximumLoadCapacity.replace(/,/g, "")),

                transportTypeCode: transportTypeCode,

                deliveryDate: getDate("deliveryDateValue"),
                deregistrationDate: getDate("deregistrationDateValue"),

                vehicleTypeCode: vehicleTypeCode,
                departmentCode: getValue("departmentid"),
                vehicleAllowanceRate: getNumber("salary"),
                hideFromDispatch:
                    document.getElementById("dispatchTableCheckbox")?.checked ?? false,

                oilExchangeCriteriaKm: getNumber("exchangecriteria"),
                oilLastExchangeDate: getDate("lastexchangedateValue"),
                oilAfterReplacementKm: getNumber("afterreplacement"),

                digitalTachographCode: getValue("digitaltachographcode"),

                etcCardNumber: getValue("cardnumber"),
                //allowanceRate: getNumber("salary"),
                tires: tires,
                fixedExpenses: fixedExpenses
            };

            // =============================================
            // SAVE VEHICLE
            // =============================================

            btnRegister.disabled = true;

            try {

                const response = await fetch("/VehicleMaster/Save", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestData)
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    alert(
                        result.message ||
                        "車輌データを登録できませんでした。"
                    );
                    return;
                }

                isCopyMode = false;
                lastLookupCode = vehicleCode;

                //alert(result.message || "車輌データを登録しました。");

                // Clear all vehicle fields.
                clearVehicleFields();

                // Clear tire management records.
                fillVehicleTireFields([]);

                // Clear fixed-expense grid.
                fillVehicleFixedExpenses([]);

                // Return to the first tab: 基本設定.
                document.querySelectorAll(".tab-button").forEach(function (tab) {
                    tab.classList.toggle(
                        "active",
                        tab.dataset.tab === "basicSetting"
                    );
                });

                document.querySelectorAll(".tab-content").forEach(function (content) {
                    content.classList.toggle(
                        "active",
                        content.id === "basicSetting"
                    );
                });

                // Reset copy and lookup states.
                isCopyMode = false;
                lastLookupCode = "";

                setVehicleEditMode(false);
                setVehicleCodeState(false);

                // Get the next available vehicle code.
                await getNextVehicleCode();

                // Focus the vehicle code field.
                carCode.focus();
                carCode.select();

            } catch (error) {

                console.error("Vehicle registration error:", error);

                alert("登録処理中にエラーが発生しました。");

            } finally {

                btnRegister.disabled = false;
            }
        });
    }


    // =========================================
    // F2: COPY VEHICLE
    // =========================================
    const btnCopy = document.getElementById("btnCopy");

    if (btnCopy) {
        btnCopy.addEventListener("click", async function () {

            // Copy is available only for an existing vehicle.
            if (btnCopy.disabled) {
                return;
            }

            // Keep the current vehicle details in the fields.
            // Generate a new vehicle code.
            const success = await getNextVehicleCode();

            //if (!success) {
            //    alert("新しい車輌コードを取得できませんでした。");
            //    return;
            //}
            // Enable duplicate validation only after copying.
            isCopyMode = true;

            // Switch to new-registration mode.
            setVehicleEditMode(false);
            setVehicleCodeState(false);

            // Clear Tab 4 repair history grid.
            window.clearRepairHistoryGrid?.();

            // Clear fixed-expense records.
            // Legacy behavior: copied vehicle starts with no fixed expenses.
            const expenseTableBody =
                document.getElementById("expenseTableBody");

            if (expenseTableBody) {
                expenseTableBody.replaceChildren();
            }

            // Clear any previous expense-row selection.
            recalledExpenseRow = null;

            //// Clear fixed-expense entry fields.
            //document.getElementById("expenseitems").value = "";
            //document.querySelector(".master-name-expenseitems").value = "";

            //document.getElementById("drivercode").value = "";
            //document.querySelector(".master-name-drivercode").value = "";

            //document.getElementById("accountingmethod").value = "0";
            //document.querySelector(".master-name-accountingmethod").value = "毎　月";

            //document.getElementById("monthly").value = "";
            //document.getElementById("monthly").disabled = false;

            //for (let month = 1; month <= 12; month++) {
            //    const input = document.getElementById(`month${month}`);

            //    if (input) {
            //        input.value = "";
            //        input.disabled = true;
            //    }
            //}

            //document.getElementById("monthlyTotal").value = "";

            // Clear duplicate-lookup state.
            lastLookupCode = "";

            // Keep the copied details and focus the new vehicle code.
            carCode.focus();
            carCode.select();

            console.log("F2: Vehicle copied. New registration mode.");
        });
    }


});

// VEhicle Search popup/model
document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const isPopupMode = params.get("popupMode") === "true";

    // Disable F5:検索 only in popup mode.
    // Disable function keys in popup mode.
    if (isPopupMode) {

        const btnF5 = document.getElementById("btnF5");
        const btnList = document.getElementById("btnList");
        const btnF10 = document.getElementById("btnF10");

        if (btnF5) {
            btnF5.textContent = "F5:　　";
            btnF5.disabled = true;
        }

        if (btnList) {
            btnList.textContent = "F9:　　";
            btnList.disabled = true;
        }

        if (btnF10) {
            btnF10.textContent = "F10:　　";
            btnF10.disabled = true;
        }
    }

    // F12:終了 - Return to Vehicle Search in popup mode.
    const btnExitF12 = document.getElementById("btnExit_F12");

    if (btnExitF12) {
        btnExitF12.addEventListener("click", function (event) {
            if (!isPopupMode) {
                return; // Keep normal Main Menu navigation.
            }

            // Prevent navigation to Main_menu.
            event.preventDefault();
            event.stopImmediatePropagation();

            // Request the parent Search popup to close the registration modal.
            if (window.parent !== window) {
                window.parent.postMessage(
                    { action: "closeVehicleMasterModal" },
                    window.location.origin
                );
            }
        }, true);
    }
});

//document.addEventListener("DOMContentLoaded", function () {
//    const carCode = document.getElementById("carCode");
//    const carNumber = document.getElementById("carNumber");

//    if (!carCode) return;

//    // Normalize the vehicle code to 10 digits.
//    function normalizeVehicleCode(value) {
//        const code = value.trim();

//        if (!/^\d{1,10}$/.test(code)) {
//            return null;
//        }

//        return code.padStart(10, "0");
//    }

//    // Set an input value safely when the element exists.
//    function setValue(id, value) {
//        const element = document.getElementById(id);

//        if (element) {
//            element.value = value ?? "";
//        }
//    }

//    // Apply the pink background to an existing vehicle code.
//    function setVehicleCodeState(found) {
//        carCode.classList.toggle("vehicle-code-selected", found);
//    }

//    // Clear vehicle fields before starting a new record.
//    function clearVehicleFields() {
//        const ids = [
//            "carNumber",
//            "makerName",
//            "chassisNumber",
//            "model",
//            "engine",
//            "firstYear",
//            "firstYearMonth",
//            "registrationDate",
//            "registrationDateValue",
//            "inspectionDate",
//            "inspectionDateValue",
//            "totaldistancetraveled",
//            "maximumloadcapacity",
//            "transportTypeCode",
//            "deliveryDate",
//            "deliveryDateValue",
//            "deregistrationdate",
//            "deregistrationDateValue",
//            "vehicleTypeCode",
//            "departmentid",
//            "departmentname",
//            "dispatchTableCheckbox",
//            "digitaltachographcode",
//            "cardnumber"
//        ];

//        ids.forEach(function (id) {
//            const element = document.getElementById(id);

//            if (!element) return;

//            if (element.type === "checkbox") {
//                element.checked = false;
//            } else {
//                element.value = "";
//            }
//        });

//        // Reset the transport type dropdown.
//        setValue("transportType", "0");

//        // Reset the vehicle type buttons to their default state.
//        document.querySelectorAll(".vehicle-type").forEach(function (button) {
//            button.classList.toggle("active", button.dataset.value === "0");
//        });

//        // Clear maintenance fields.
//        document.querySelectorAll(
//            ".oil-grid input, .tire-grid input"
//        ).forEach(function (input) {
//            input.value = "";
//        });
//    }

//    // Fill the vehicle fields using the API response.
//    // Fill vehicle fields using the database response.
//    function fillVehicleFields(vehicle) {
//        setValue("carNumber", vehicle.vehicleCarNumber);
//        setValue("makerName", vehicle.vehicleMakerName);
//        setValue("chassisNumber", vehicle.vehicleChassisNumber);
//        setValue("model", vehicle.vehicleModel);
//        setValue("engine", vehicle.vehicleEngine);

//        setValue(
//            "firstYearMonth",
//            toDateInputValue(vehicle.vehicleFirstYear)
//        );
//        setValue(
//            "firstYear",
//            formatJapaneseDate(vehicle.vehicleFirstYear, false)
//        );

//        setValue(
//            "registrationDateValue",
//            toDateInputValue(vehicle.vehicleRegistrationDate)
//        );
//        setValue(
//            "registrationDate",
//            formatJapaneseDate(vehicle.vehicleRegistrationDate, true)
//        );

//        setValue(
//            "inspectionDateValue",
//            toDateInputValue(vehicle.vehicleInspectionDate)
//        );
//        setValue(
//            "inspectionDate",
//            formatJapaneseDate(vehicle.vehicleInspectionDate, true)
//        );

//        setValue(
//            "totaldistancetraveled",
//            formatNumber(vehicle.vehicleTotalDistanceKm)
//        );
//        setValue(
//            "maximumloadcapacity",
//            formatNumber(vehicle.vehicleMaximumLoadCapacity)
//        );

//        setValue(
//            "transportTypeCode",
//            vehicle.vehicleTransportTypeCode
//        );
//        setValue(
//            "transportType",
//            vehicle.vehicleTransportTypeCode
//        );

//        setValue(
//            "deliveryDateValue",
//            toDateInputValue(vehicle.vehicleDeliveryDate)
//        );
//        setValue(
//            "deliveryDate",
//            formatJapaneseDate(vehicle.vehicleDeliveryDate, true)
//        );

//        setValue(
//            "deregistrationDateValue",
//            toDateInputValue(vehicle.vehicleDeregistrationDate)
//        );
//        setValue(
//            "deregistrationdate",
//            formatJapaneseDate(vehicle.vehicleDeregistrationDate, true)
//        );

//        setValue("vehicleTypeCode", vehicle.vehicleTypeCode);

//        setValue(
//            "departmentid",
//            vehicle.vehicleDepartmentCode
//        );
//        setValue(
//            "departmentname",
//            vehicle.vehicleDepartmentName
//        );

//        setValue(
//            "digitaltachographcode",
//            vehicle.vehicleDigitalTachographCode
//        );
//        setValue("cardnumber", vehicle.vehicleEtcCard);

//        // Set the dispatch-table checkbox.
//        const dispatchCheckbox =
//            document.getElementById("dispatchTableCheckbox");

//        if (dispatchCheckbox) {
//            // Confirm whether 0 means "do not display" in the database.
//            dispatchCheckbox.checked =
//                String(vehicle.vehicleDispatchDisplay) === "0";
//        }

//        // Fill oil management fields.
//        setValue(
//            "exchangecriteria",
//            formatNumber(vehicle.vehicleOilCriteriaKm)
//        );
//        setValue(
//            "lastexchangedateValue",
//            toDateInputValue(vehicle.vehicleOilExchangeDate)
//        );
//        setValue(
//            "lastexchangedate",
//            formatJapaneseDate(vehicle.vehicleOilExchangeDate, true)
//        );
//        setValue(
//            "afterreplacement",
//            formatNumber(vehicle.vehicleOilExchangeKm)
//        );

//        // Synchronize the vehicle type buttons.
//        document.querySelectorAll(".vehicle-type").forEach(function (button) {
//            button.classList.toggle(
//                "active",
//                button.dataset.value === String(vehicle.vehicleTypeCode ?? "")
//            );
//        });
//    }


//    // Convert an API date into YYYY-MM-DD for hidden date fields.
//    function toDateInputValue(value) {
//        if (!value) return "";

//        const date = new Date(value);

//        if (Number.isNaN(date.getTime())) {
//            return "";
//        }

//        const year = date.getFullYear();
//        const month = String(date.getMonth() + 1).padStart(2, "0");
//        const day = String(date.getDate()).padStart(2, "0");

//        return `${year}-${month}-${day}`;
//    }

//    // Format dates for the Japanese calendar display.
//    function formatJapaneseDate(value, showDay) {
//        const dateValue = toDateInputValue(value);

//        if (!dateValue) return "";

//        const [year, month, day] = dateValue.split("-");

//        return showDay
//            ? `${year}年${month}月${day}日`
//            : `${year}年${month}月`;
//    }

//    // Format numeric fields with thousands separators.
//    function formatNumber(value) {
//        if (value === null || value === undefined || value === "") {
//            return "";
//        }

//        const number = Number(value);

//        return Number.isFinite(number)
//            ? number.toLocaleString("en-US", { maximumFractionDigits: 2 })
//            : value;
//    }

//    // Fetch the vehicle record from the database.
//    async function fetchVehicle() {
//        const normalizedCode = normalizeVehicleCode(carCode.value);

//        if (!normalizedCode) {
//            alert("号車は1～10桁の数字で入力してください。");
//            carCode.focus();
//            carCode.select();
//            return;
//        }

//        carCode.value = normalizedCode;

//        try {
//            const response = await fetch(
//                `/VehicleMaster/GetVehicleByCode?code=${encodeURIComponent(normalizedCode)}`
//            );

//            const result = await response.json();

//            if (!response.ok || !result.success) {
//                throw new Error(
//                    result.message || "車輌マスタのデータ取得に失敗しました。"
//                );
//            }

//            if (result.found) {
//                fillVehicleFields(result.data);
//                setVehicleCodeState(true);

//                console.log("Vehicle record loaded:", result.data);
//            } else {
//                clearVehicleFields();
//                carCode.value = normalizedCode;
//                setVehicleCodeState(false);

//                console.log("Vehicle not found. New entry mode.");
//            }
//        } catch (error) {
//            console.error("Vehicle lookup failed:", error);
//            alert(error.message || "車輌マスタのデータ取得に失敗しました。");
//        }
//    }

//    // Lookup on Enter.
//    carCode.addEventListener("keydown", function (event) {
//        if (event.key === "Enter") {
//            event.preventDefault();
//            fetchVehicle();
//        }
//    });

//    // Lookup when leaving the vehicle code field.
//    carCode.addEventListener("blur", function () {
//        if (carCode.value.trim() !== "") {
//            fetchVehicle();
//        }
//    });
//});

// Tab 1–5: Tab Switching

// =============================================
// VEHICLE MASTER TAB LICENSE SETTINGS
// 1 = Enabled, 0 = Disabled
// =============================================
// =============================================
// VEHICLE MASTER TAB SWITCHING
// Tab visibility is controlled by the server.
// =============================================
document.addEventListener("DOMContentLoaded", function () {

    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    // Check whether the currently active tab is available.
    const activeButton = document.querySelector(
        ".tab-button.active"
    );

    if (activeButton && activeButton.hidden) {

        activeButton.classList.remove("active");

        const activeContent = document.getElementById(
            activeButton.dataset.tab
        );

        activeContent?.classList.remove("active");
    }

    // If the active tab is hidden, return to 基本設定.
    if (!document.querySelector(".tab-button.active:not([hidden])")) {

        const basicButton = document.querySelector(
            '.tab-button[data-tab="basicSetting"]'
        );

        const basicContent = document.getElementById("basicSetting");

        basicButton?.classList.add("active");
        basicContent?.classList.add("active");
    }

    // Tab switching.
    tabButtons.forEach(button => {

        button.addEventListener("click", function () {

            // Do not allow hidden tabs to be selected.
            if (this.hidden) return;

            const targetTab = this.dataset.tab;

            tabButtons.forEach(tab => {
                tab.classList.remove("active");
            });

            tabContents.forEach(content => {
                content.classList.remove("active");
            });

            this.classList.add("active");

            document.getElementById(targetTab)?.classList.add("active");
        });
    });
});


// Select all input values when the field receives focus.
document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll("input").forEach(function (input) {

        input.addEventListener("focus", function () {
            this.select();
        });

    });

});

// Tab 1 Tab:
// Transport Type Code and Dropdown Synchronization
//document.addEventListener("DOMContentLoaded", function () {

//    const transportTypeCode = document.getElementById("transportTypeCode");
//    const transportType = document.getElementById("transportType");
//    const deliveryDate = document.getElementById("deliveryDate");

//    if (!transportTypeCode || !transportType) return;

//    // Store the previous valid code.
//    let previousValidCode = "";
//    let hasPreviousValidCode = false;

//    // Validate the entered code and synchronize the dropdown.
//    function updateTransportType() {
//        const code = transportTypeCode.value.trim();

//        const optionExists = Array.from(transportType.options)
//            .some(option => option.value === code && code !== "0");

//        if (optionExists) {
//            transportType.value = code;
//            previousValidCode = code;
//            hasPreviousValidCode = true;
//            return true;
//        }

//        if (code === "0" || code === "") {
//            transportType.value = "0";
//            return true;
//        }

//        // Show an error for an unregistered transport type.
//        alert(`指定した運賃形態『${code}』は未登録です！！`);

//        if (hasPreviousValidCode) {
//            // Restore the previous valid code.
//            transportTypeCode.value = previousValidCode;
//            transportType.value = previousValidCode;
//        } else {
//            // Clear the field when no valid code was entered before.
//            transportTypeCode.value = "";
//            transportType.value = "0";
//        }

//        transportTypeCode.focus();
//        transportTypeCode.select();

//        return false;
//    }

//    // Validate when Enter or Tab is pressed.
//    transportTypeCode.addEventListener("keydown", function (event) {
//        if (event.key !== "Enter" && event.key !== "Tab") return;

//        const isValid = updateTransportType();

//        if (!isValid) {
//            event.preventDefault();
//            return;
//        }

//        if (event.key === "Enter") {
//            event.preventDefault();
//            deliveryDate?.focus();
//        }
//    });

//    // Validate when focus moves away from the code field.
//    transportTypeCode.addEventListener("blur", function () {
//        updateTransportType();
//    });

//    // Synchronize the code when the dropdown selection changes.
//    transportType.addEventListener("change", function () {
//        transportTypeCode.value = transportType.value;

//        if (transportType.value !== "0") {
//            previousValidCode = transportType.value;
//            hasPreviousValidCode = true;
//        } else {
//            previousValidCode = "";
//            hasPreviousValidCode = false;
//        }

//        deliveryDate?.focus();
//    });

//});

document.addEventListener("DOMContentLoaded", function () {

    const transportTypeCode = document.getElementById("transportTypeCode");
    const transportType = document.getElementById("transportType");
    const deliveryDate = document.getElementById("deliveryDate");

    if (!transportTypeCode || !transportType) return;

    // Store the previous valid code.
    let previousValidCode = "";
    let hasPreviousValidCode = false;
    let isShowingTransportTypeAlert = false;

    let hasTransportTypeValidationError = false;

    // ADD HERE
    transportTypeCode.addEventListener("focus", function () {
        previousValidCode = transportTypeCode.value.trim();
        hasPreviousValidCode = previousValidCode !== "";
    });

    // Load Transport Type Master data from the controller.
    async function loadTransportTypes() {
        try {
            const response = await fetch("/VehicleMaster/GetTransportTypes");

            if (!response.ok) {
                throw new Error(
                    `Failed to load transport types: ${response.status}`
                );
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.message || "運賃形態マスタのデータ取得に失敗しました。"
                );
            }

            // Clear existing options and add the blank option.
            transportType.replaceChildren(new Option("", "0"));

            // Populate the dropdown using database values.
            result.data.forEach(function (item) {
                transportType.add(
                    new Option(item.name, String(item.code))
                );
            });

            console.log("Transport types loaded successfully.");
        } catch (error) {
            console.error("Error loading transport types:", error);
            alert("運賃形態マスタのデータ取得に失敗しました。");
        }
    }
     
    // Validate the entered code and synchronize the dropdown.
    function updateTransportType() {
        if (isShowingTransportTypeAlert || hasTransportTypeValidationError) {
            return false;
        }

        const code = transportTypeCode.value.trim();

        // Code must be 1–9.
        if (!/^[1-9]$/.test(code)) {
            hasTransportTypeValidationError = true;

            isShowingTransportTypeAlert = true;
            alert("運賃形態を正しく入力して下さい！！");
            isShowingTransportTypeAlert = false;

            restoreTransportTypeCode();
            return false;
        }

        // Check master registration.
        const optionExists = Array.from(transportType.options)
            .some(option => option.value === code);

        if (!optionExists) {
            alert(`指定した運賃形態『${code}』は未登録です！！`);

            restoreTransportTypeCode();
            hasTransportTypeValidationError = true;

            return false;
        }

        transportType.value = code;
        previousValidCode = code;
        hasPreviousValidCode = true; 
        return true;
    }

    function restoreTransportTypeCode() {
        if (hasPreviousValidCode) {
            transportTypeCode.value = previousValidCode;
            transportType.value = previousValidCode;
        } else {
            transportTypeCode.value = "";
            transportType.value = "0";
        }
    }

    // Validate when Enter or Tab is pressed.
    transportTypeCode.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== "Tab") return;
        const oldCode = previousValidCode;
        const isValid = updateTransportType();

        if (!isValid) {
            event.preventDefault();

            transportTypeCode.focus();
            transportTypeCode.select();
            return;
        }
        if (transportTypeCode.value.trim() !== oldCode) {
            window.isVehicleDirty = true;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            deliveryDate?.focus();
        }
    });

    // Allow validation again when the user edits the code.
    transportTypeCode.addEventListener("input", function () {
        hasTransportTypeValidationError = false;
    });

    // Validate only when focus moves to Delivery Date.
    transportTypeCode.addEventListener("blur", function (event) {
        if (event.relatedTarget === deliveryDate) {
            if (!hasTransportTypeValidationError) {
                updateTransportType();
            }
            return;
        }

        // Restore the last accepted value without validation or alert.
        restoreTransportTypeCode();
        hasTransportTypeValidationError = false;
    });

    // Synchronize the code when the dropdown selection changes.
    transportType.addEventListener("change", function () {
        transportTypeCode.value =
            transportType.value === "0" ? "" : transportType.value;

        if (transportType.value !== "0") {
            previousValidCode = transportType.value;
            hasPreviousValidCode = true;
        } else {
            previousValidCode = "";
            hasPreviousValidCode = false;
        }

        deliveryDate?.focus();
    });

    // Load the dropdown before validating entered codes.
    loadTransportTypes();

});


// Vehicle Type Code Entry and Button Synchronization
document.addEventListener("DOMContentLoaded", function () {

    const vehicleTypeCode = document.getElementById("vehicleTypeCode");
    const vehicleTypeButtons = document.querySelectorAll(".vehicle-type");
    const departmentid = document.getElementById("departmentid");

    if (!vehicleTypeCode || vehicleTypeButtons.length === 0) return;

    // Store the previous valid vehicle type code.
    let previousVehicleTypeCode = ["0", "1", "2"].includes(vehicleTypeCode.value)
        ? vehicleTypeCode.value
        : "";


    vehicleTypeCode.addEventListener("focus", function () {
        previousVehicleTypeCode = vehicleTypeCode.value.trim();
    });
    // Update the active button based on the code.
    function updateVehicleTypeSelection(code) {
        vehicleTypeButtons.forEach(function (button) {
            button.classList.toggle("active", button.dataset.value === code);
        });
    }

    // Validate the entered vehicle type code.
    function validateVehicleType() {
        const code = vehicleTypeCode.value.trim();

        if (["0", "1", "2"].includes(code)) {
            previousVehicleTypeCode = code;
            updateVehicleTypeSelection(code);
            return true;
        }

        // Show an error for an invalid vehicle type code.
        alert("車輌区分を正しく入力して下さい！！（0・1・2）");

        // Restore the previous valid code.
        vehicleTypeCode.value = previousVehicleTypeCode;
        updateVehicleTypeSelection(previousVehicleTypeCode);

        return false;
    }

    // Validate the code and move focus to Department ID.
    vehicleTypeCode.addEventListener("keydown", function (event) {

        if (event.key !== "Enter" && event.key !== "Tab") return;

        if (!validateVehicleType()) {
            event.preventDefault();
            vehicleTypeCode.focus();
            vehicleTypeCode.select();
            return;
        }

        // Move focus to Department ID after a valid code.
        event.preventDefault();

        if (departmentid) {
            departmentid.focus();
            departmentid.select();
        }
    });

    // Validate when the user moves focus with the mouse.
    vehicleTypeCode.addEventListener("blur", function (event) {
        if (event.relatedTarget === departmentid) {
            validateVehicleType();
            return;
        }

        vehicleTypeCode.value = previousVehicleTypeCode;
        updateVehicleTypeSelection(previousVehicleTypeCode);
    });

    // Update the code when a vehicle type button is clicked.
    vehicleTypeButtons.forEach(function (button) {

        button.addEventListener("click", function () {
            const code = button.dataset.value;

            vehicleTypeCode.value = code;
            previousVehicleTypeCode = code;

            updateVehicleTypeSelection(code);
        });

        // Move focus to Department ID when Enter or Tab is pressed.
        button.addEventListener("keydown", function (event) {

            if (event.key !== "Enter" && event.key !== "Tab") return;

            event.preventDefault();

            if (departmentid) {
                departmentid.focus();
                departmentid.select();
            }
        });

    });

});
// Vehicle Master - Department Code Lookup
document.addEventListener("DOMContentLoaded", function () {

    const departmentId = document.getElementById("departmentid");
    const departmentName = document.getElementById("departmentname");
    const dispatchTableCheckbox = document.getElementById("dispatchTableCheckbox");

    if (!departmentId || !departmentName) return;

    // Store the previous valid department details.
    let previousCode = "";
    let previousName = "";
    let isLookingUp = false;
    let lastLookupCode = "";
    // ADD HERE
    departmentId.addEventListener("focus", function () {
        previousCode = departmentId.value;
        previousName = departmentName.value;
        lastLookupCode = previousCode;
    });

    // Retrieve department details from Vehicle Master controller.
    async function lookupDepartment() {

        const inputCode = departmentId.value.trim();

        // Add leading zero to department codes below 10.
        const code = inputCode !== "" && Number(inputCode) < 10
            ? inputCode.padStart(2, "0")
            : inputCode;

        if (!code) {
            departmentName.value = "";
            previousCode = "";
            previousName = "";
            lastLookupCode = "";
            return true;
        }

        if (isLookingUp) return false;

        if (code === lastLookupCode) return true;

        isLookingUp = true;
        departmentId.value = code;

        try {
            const response = await fetch(
                `/VehicleMaster/GetDepartment?code=${encodeURIComponent(code)}`
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                alert(
                    result.message ||
                    `指定した部門『${code}』は未登録です！！`
                );

                departmentId.value = previousCode;
                departmentName.value = previousName;
                lastLookupCode = previousCode;

                departmentId.focus();
                departmentId.select();

                return false;
            }
            // Mark dirty before updating the previous valid values.
            const previousNormalizedCode =
                previousCode.trim() !== "" && Number(previousCode) < 10
                    ? previousCode.trim().padStart(2, "0")
                    : previousCode.trim();

            if (code !== previousNormalizedCode) {
                window.isVehicleDirty = true;
            }

            // Display and store the returned department details.
            departmentId.value = result.code;
            departmentName.value = result.name;

            // Update the previous valid values.
            departmentId.dataset.keepValue = result.code;

            previousCode = result.code;
            previousName = result.name;
            lastLookupCode = result.code;

            return true;

        } catch (error) {
            console.error("Vehicle Master lookup failed:", error);

            alert("部門マスタのデータ取得に失敗しました。");

            departmentId.value = previousCode;
            departmentName.value = previousName;
            lastLookupCode = previousCode;

            departmentId.focus();
            departmentId.select();

            return false;

        } finally {
            isLookingUp = false;
        }
    }

    // Move focus to Dispatch Table Checkbox on Enter or Tab.
    departmentId.addEventListener("keydown", async function (event) {

        if (event.key !== "Enter" && event.key !== "Tab") return;

        event.preventDefault();

        const isValid = await lookupDepartment();

        if (isValid && dispatchTableCheckbox) {
            requestAnimationFrame(function () {
                dispatchTableCheckbox.focus();
            });
        }

    });

    // Validate when the user moves focus with the mouse.
    departmentId.addEventListener("blur", function (event) {
        if (event.relatedTarget === dispatchTableCheckbox) {
            lookupDepartment();
            return;
        }

        departmentId.value = previousCode;
        departmentName.value = previousName;
        lastLookupCode = previousCode;
    });
});

// Tab 2 Tab:
//Vehicle Diagram and Tire Maintenance Input Handling


// Vehicle Diagram and Tire Maintenance Input Handling

document.addEventListener("DOMContentLoaded", function () {
    const diagram = document.querySelector(".vehicle-diagram-panel");
    const tireGrid = document.querySelector(".tire-grid");
    const oilGrid = document.querySelector(".oil-grid");

    if (!diagram || !tireGrid || !oilGrid) {
        console.error("Vehicle diagram, tire grid, or oil grid not found.");
        return;
    }

    // Get the maintenance inputs corresponding to a tire number
    function getTireInputs(tireNo) {
        const numberCell = tireGrid.querySelector(
            `.maintenance-no[data-tire-no="${tireNo}"]`
        );

        if (!numberCell) {
            console.error("Tire number not found in tire grid:", tireNo);
            return null;
        }

        const cells = Array.from(numberCell.parentElement.children);
        const index = cells.indexOf(numberCell);

        // Return the replacement criteria and after-replacement inputs
        return {
            criteria: cells[index + 1]?.querySelector("input") || null,
            after: cells[index + 3]?.querySelector("input") || null
        };
    }

    // Highlight the selected tire in the vehicle diagram.
    function highlightTire(tireNo) {
        const diagramTires = diagram.querySelectorAll("[data-tire-no]");

        diagramTires.forEach(function (tire) {
            const selected = tire.dataset.tireNo === String(tireNo);

            tire.classList.toggle("tire-selected", selected);

            if (selected) {
                tire.style.setProperty("background", "#00ff00", "important");
                tire.style.setProperty("background-color", "#00ff00", "important");
            } else {
                tire.style.removeProperty("background");
                tire.style.removeProperty("background-color");
            }
        });

        console.log("Green highlight applied to tire:", tireNo);
    }

    // Clear the selected tire highlight.
    function clearTireHighlight() {
        diagram.querySelectorAll("[data-tire-no]").forEach(function (tire) {
            tire.classList.remove("tire-selected");
            tire.style.removeProperty("background");
            tire.style.removeProperty("background-color");
        });

        console.log("Tire highlight cleared.");
    }

    //// Highlight the selected tire in the vehicle diagram
    //function highlightTire(tireNo) {
    //    const diagramTires = document.querySelectorAll(
    //        ".vehicle-diagram-panel [data-tire-no]"
    //    );

    //    diagramTires.forEach(function (tire) {
    //        const selected = tire.dataset.tireNo === String(tireNo);

    //        tire.classList.toggle("tire-selected", selected);

    //        if (selected) {
    //            tire.style.setProperty("background", "#00ff00", "important");
    //            tire.style.setProperty("background-color", "#00ff00", "important");
    //        } else {
    //            tire.style.removeProperty("background");
    //            tire.style.removeProperty("background-color");
    //        }
    //    });

    //    console.log("Green highlight applied to tire:", tireNo);
    //}

    //// Highlight the corresponding vehicle tire when a maintenance input receives focus
    //function handleMaintenanceFocus(event) {
    //    const input = event.target.closest(
    //        '.tire-grid .km-cell input[type="text"]'
    //    );

    //    if (!input) return;

    //    const row = input.closest(".maintenance-row");
    //    const cell = input.closest(".km-cell");

    //    if (!row || !cell) return;

    //    const cells = Array.from(row.children);
    //    const cellIndex = cells.indexOf(cell);

    //    // Identify the tire-number cell based on the input column
    //    let numberIndex;

    //    if ([1, 3].includes(cellIndex)) {
    //        numberIndex = 0;
    //    } else if ([5, 7].includes(cellIndex)) {
    //        numberIndex = 4;
    //    } else {
    //        return;
    //    }

    //    const numberCell = cells[numberIndex];

    //    if (!numberCell?.matches(".maintenance-no")) return;

    //    highlightTire(numberCell.dataset.tireNo);
    //}

    //// Highlight the corresponding tire when a maintenance input receives focus.
    //tireGrid.addEventListener("focusin", handleMaintenanceFocus);

    // Highlight the corresponding vehicle tire when a maintenance input receives focus
    function handleMaintenanceFocus(event) {
        const input = event.target.closest(
            ".tire-grid .maintenance-row input"
        );

        if (!input) return;

        const row = input.closest(".maintenance-row");

        if (!row) return;

        const cells = Array.from(row.children);
        const inputCell = input.closest("td, .km-cell, .date-cell");

        if (!inputCell) return;

        const cellIndex = cells.indexOf(inputCell);

        // Identify the tire-number cell for the left or right tire group.
        let numberIndex;

        if (cellIndex >= 1 && cellIndex <= 3) {
            numberIndex = 0; // Left group: tire No. 1–11
        } else if (cellIndex >= 5 && cellIndex <= 7) {
            numberIndex = 4; // Right group: tire No. 12–22
        } else {
            return;
        }

        const numberCell = cells[numberIndex];

        if (!numberCell?.matches(".maintenance-no[data-tire-no]")) {
            return;
        }

        highlightTire(numberCell.dataset.tireNo);
    }

    // Highlight the corresponding tire when a maintenance input receives focus.
    tireGrid.addEventListener("focusin", handleMaintenanceFocus);

    // Clicking a tire highlights it and focuses its replacement-criteria input.
    diagram.addEventListener("click", function (event) {
        const tire = event.target.closest("[data-tire-no]");

        if (!tire || !diagram.contains(tire)) return;

        const tireNo = tire.dataset.tireNo;
        const inputs = getTireInputs(tireNo);

        highlightTire(tireNo);

        if (!inputs || !inputs.criteria) {
            console.error("Criteria input not found for tire:", tireNo);
            return;
        }

        inputs.criteria.focus();
        inputs.criteria.select();

        console.log("Focused criteria input:", inputs.criteria);
    });

    //// Highlight a tire when its diagram element is clicked.
    //document.querySelectorAll(
    //    ".vehicle-diagram-panel [data-tire-no]"
    //).forEach(function (tire) {
    //    tire.addEventListener("click", function (event) {
    //        event.stopPropagation();

    //        console.log("Clicked truck tire:", this.dataset.tireNo);
    //        highlightTire(this.dataset.tireNo);
    //    });
    //});

    // Highlight a tire when its diagram element is clicked
    // Individual tire click handlers are not required because the diagram
    // click handler above handles all tire clicks.

    // Clear the highlight only when clicking outside both the diagram and maintenance grids.
    //document.addEventListener("click", function (event) {
    //    if (
    //        event.target.closest(".vehicle-diagram-panel") ||
    //        event.target.closest(".tire-grid") ||
    //        event.target.closest(".oil-grid")
    //    ) {
    //        return;
    //    }

    //    clearTireHighlight();
    //});

    // Clear the tire highlight when clicking outside the tire diagram and tire maintenance grid.
    document.addEventListener("click", function (event) {
        // Keep the highlight when clicking a tire in the diagram.
        if (event.target.closest(".vehicle-diagram-panel [data-tire-no]")) {
            return;
        }

        // Keep the highlight when clicking an input in the tire maintenance grid.
        if (event.target.closest(".tire-grid")) {
            return;
        }

        // Clear the highlight when clicking the oil grid or anywhere else.
        clearTireHighlight();
    });
});


// Tab 3 Tab Fixed Expense Master



document.addEventListener("DOMContentLoaded", function () {

    // Vehicle Master - Expense Item Code Lookup
    const expenseItems = document.getElementById("expenseitems");
    const expenseName = document.querySelector(".master-name-expenseitems");
    const driverCode = document.getElementById("drivercode");

    // Initialize expense lookup only when its required fields exist.
    if (expenseItems && expenseName) {

        let previousCode = "";
        let previousName = "";
        let isLookingUp = false;
        let lastLookupCode = "";

        expenseItems.addEventListener("focus", function () {
            previousCode = expenseItems.value;
            previousName = expenseName.value;
            lastLookupCode = previousCode;
        });

        // Retrieve expense details from the Vehicle Master controller.
        async function lookupExpense() {
            const inputCode = expenseItems.value.trim();

            const code = inputCode !== "" && Number(inputCode) < 1000
                ? inputCode.padStart(4, "0")
                : inputCode;

            if (!code) {
                expenseName.value = "";
                previousCode = "";
                previousName = "";
                lastLookupCode = "";
                return true;
            }

            if (isLookingUp) return false;
            if (code === lastLookupCode) return true;

            isLookingUp = true;
            expenseItems.value = code;

            try {
                const response = await fetch(
                    `/VehicleMaster/GetExpense?code=${encodeURIComponent(code)}`
                );

                const result = await response.json();

                if (!response.ok || !result.success) {
                    alert(`指定した経費『${code}』は未登録です！！`);

                    expenseItems.value = previousCode;
                    expenseName.value = previousName;
                    lastLookupCode = previousCode;

                    expenseItems.focus();
                    expenseItems.select();

                    return false;
                }

                expenseItems.value = result.code;
                expenseName.value = result.name;

                previousCode = result.code;
                previousName = result.name;
                lastLookupCode = result.code;

                return true;

            } catch (error) {
                console.error("Expense Master lookup failed:", error);

                alert("経費マスタのデータ取得に失敗しました。");

                expenseItems.value = previousCode;
                expenseName.value = previousName;
                lastLookupCode = previousCode;

                expenseItems.focus();
                expenseItems.select();

                return false;

            } finally {
                isLookingUp = false;
            }
        }

        // Validate the expense code and move focus on Enter or Tab.
        expenseItems.addEventListener("keydown", async function (event) {
            if (event.key !== "Enter" && event.key !== "Tab") return;

            event.preventDefault();

            const isValid = await lookupExpense();

            if (isValid && driverCode) {
                requestAnimationFrame(function () {
                    driverCode.focus();
                    driverCode.select();
                });
            }
        });

        // Validate the expense code when focus leaves the field.
        expenseItems.addEventListener("blur", function (event) {
            if (event.relatedTarget === driverCode) {
                lookupExpense();
                return;
            }

            expenseItems.value = previousCode;
            expenseName.value = previousName;
            lastLookupCode = previousCode;
        });
    }
     

    // =============================================
    // F6: MASTER SEARCH
    // =============================================

    const driverCodesearch = document.getElementById("drivercode");
    const masterSearchButton = document.getElementById("btnMasterSearch");
    const messageText = document.getElementById("messageText");

    // Fields where F6 should display the not-implemented message.
    const notImplementedFields = [
        "departmentid",
        "expenseitems",
        "expenseItemCode"
    ];

    // Remember which field activated F6.
    let activeF6Field = null;

    // Display message in the existing message area.
    function showNotImplementedMessage() {
        if (messageText) {
            messageText.textContent = "まだ実装されていません";
        }
    }
    // Clear the message when focus moves away from the input.
    notImplementedFields.forEach(function (fieldId) {
        const field = document.getElementById(fieldId);

        if (field) {
            field.addEventListener("blur", function () {
                if (messageText) {
                    messageText.textContent = "";
                }
            });
        }
    });

    if (masterSearchButton) {

        // Keep F6 disabled initially.
        masterSearchButton.disabled = true;

        // Enable F6 when one of the supported fields receives focus.
        document.addEventListener("focusin", function (event) {

            const fieldId = event.target.id;

            if (
                fieldId === "drivercode" ||
                notImplementedFields.includes(fieldId)
            ) {
                activeF6Field = fieldId;
                masterSearchButton.disabled = false;
                return;
            }

            // Do not clear the active field when F6 button receives focus.
            if (fieldId === "btnMasterSearch") {
                return;
            }

            activeF6Field = null;
            masterSearchButton.disabled = true;
        });

        // Existing Driver Search popup behavior.
        function openDriverSearch() {

            const driverPopup =
                document.getElementById("driverSearchPopup");

            if (!driverPopup) {
                console.error(
                    "Driver Search popup not found. Check whether " +
                    "_DriverSearchPartial.cshtml is rendered on this page."
                );
                return;
            }

            document.dispatchEvent(
                new CustomEvent("openDriverSearchPopup", {
                    detail: {
                        activeOnly: window.isNewRecord
                    }
                })
            );
        }

        // Handle F6 button click.
        masterSearchButton.addEventListener("click", function () {

            if (activeF6Field === "drivercode") {
                openDriverSearch();
                return;
            }

            if (notImplementedFields.includes(activeF6Field)) {
                showNotImplementedMessage();
            }
        });

        
    }


});


// Vehicle Master - Driver Code Lookup
document.addEventListener("DOMContentLoaded", function () {

    const driverCode = document.getElementById("drivercode");
    const driverName = document.querySelector(".master-name-drivercode");
    const accountingMethod = document.getElementById("accountingmethod");


    if (!driverCode || !driverName) return;

    // Use the current Vehicle Master registration mode.
    const isNewRecord = window.isNewRecord;
    const sinkFlg = isNewRecord;

    // Store the previous valid driver details.
    let previousCode = "";
    let previousName = "";
    let lastLookupCode = "";
    let isLookingUp = false;

    // ADD HERE
    driverCode.addEventListener("focus", function () {
        previousCode = driverCode.value;
        previousName = driverName.value;
        lastLookupCode = previousCode;
    });

    // Retrieve driver details from Driver Master.
    async function lookupDriver() {

        const inputCode = driverCode.value.trim();

        // Format Driver Code as 10 digits with leading zeros.
        const code = inputCode !== "" && /^\d+$/.test(inputCode)
            ? inputCode.padStart(10, "0")
            : inputCode;
        // Clear the driver name when the code is empty.
        if (!code) {
            driverName.value = "";
            previousCode = "";
            previousName = "";
            lastLookupCode = "";
            return true;
        }

        // Prevent duplicate lookups.
        if (isLookingUp) return false;

        // Skip lookup if this code has already been validated.
        if (code === lastLookupCode) return true;

        isLookingUp = true;

        try {
            const sinkFlg = window.isNewRecord;
            const response = await fetch(
                `/VehicleMaster/GetDriver?code=${encodeURIComponent(code)}&sinkFlg=${sinkFlg}`
            );

            const responseText = await response.text();

            let result;

            // Safely parse the response.
            try {
                result = responseText ? JSON.parse(responseText) : {};
            } catch {
                throw new Error("Invalid response received from Driver Master.");
            }

            // Restore the previous valid value if the code is invalid.
            if (!response.ok || !result.success) {
                alert(
                    result.message ||
                    `指定した運転手『${code}』は未登録です！！`
                );

                driverCode.value = previousCode;
                driverName.value = previousName;
                lastLookupCode = previousCode;

                driverCode.focus();
                driverCode.select();

                return false;
            }

            // Display and store the returned driver details.
            driverCode.value = result.code;
            driverName.value = result.name;

            previousCode = result.code;
            previousName = result.name;
            lastLookupCode = result.code;

            return true;

        } catch (error) {
            console.error("Driver Master lookup failed:", error);

            alert("運転手マスタのデータ取得に失敗しました。");

            driverCode.value = previousCode;
            driverName.value = previousName;
            lastLookupCode = previousCode;

            driverCode.focus();
            driverCode.select();

            return false;

        } finally {
            isLookingUp = false;
        }
    }
    // =========================================
    // Driver Search Popup - Selected Driver
    // =========================================

    document.addEventListener("driver-search-selected", function (event) {

        const data = event.detail;

        if (!data) return;

        // Get selected driver details.
        const selectedCode = String(data.driverCode ?? "").trim();
        const selectedName = String(data.driverName ?? "");

        if (!selectedCode) return;

        // Populate Driver Code.
        driverCode.value = selectedCode;

        // Populate Driver Name.
        driverName.value = selectedName;

        // Update previous valid values.
        // This prevents the blur handler from restoring old values.
        previousCode = selectedCode;
        previousName = selectedName;
        lastLookupCode = selectedCode;

        // Move focus to Accounting Method.
        if (accountingMethod) {
            requestAnimationFrame(function () {
                accountingMethod.focus();
                accountingMethod.select();
            });
        }
    });
    // Validate the driver code and move focus on Enter or Tab.
    driverCode.addEventListener("keydown", async function (event) {

        if (event.key !== "Enter" && event.key !== "Tab") return;

        event.preventDefault();

        const isValid = await lookupDriver();

        if (isValid && accountingMethod) {
            requestAnimationFrame(function () {
                accountingMethod.focus();
                accountingMethod.select();
            });
        }
    });

    // Validate the driver code when focus leaves the field.
    driverCode.addEventListener("blur", function (event) {
        if (event.relatedTarget === accountingMethod) {
            lookupDriver();
            return;
        }

        driverCode.value = previousCode;
        driverName.value = previousName;
        lastLookupCode = previousCode;
    });

});

let recalledExpenseRow = null;
let selectedExpenseRow = null;
let lastRecalledExpenseData = null;

// Vehicle Master - Expense Delete Button
document.addEventListener("DOMContentLoaded", function () {

    const deleteButton = document.getElementById("btnExpenseDelete");
    const expenseTableBody = document.getElementById("expenseTableBody");

    if (!deleteButton || !expenseTableBody) {
        return;
    }

    // Track the row recalled by double-clicking or pressing Enter.
    //let recalledExpenseRow = null;

    // Remember the row when it is recalled from the grid.
    expenseTableBody.addEventListener("dblclick", function (event) {

        const row = event.target.closest("tr");

        if (row && expenseTableBody.contains(row) && row.cells.length >= 6) {
            recalledExpenseRow = row;
        }
    });

    expenseTableBody.addEventListener("keydown", function (event) {

        if (event.key !== "Enter") {
            return;
        }

        const row = event.target.closest("tr");

        if (row && expenseTableBody.contains(row) && row.cells.length >= 6) {
            recalledExpenseRow = row;
        }
    });

    // Delete the selected grid row.
    // Delete the recalled expense grid row.
    deleteButton.addEventListener("click", function () {

        // Do nothing if no row has been recalled or it is no longer in the grid.
        if (
            !recalledExpenseRow ||
            !expenseTableBody.contains(recalledExpenseRow)
        ) {
            return;
        }

        // Confirm before deleting.
        if (!window.confirm("削除してもよいですか？")) {
            return;
        }

        // Remove the recalled row.
        recalledExpenseRow.remove();

        // Clear the recalled row reference.
        recalledExpenseRow = null;

        // Clear the selected row reference if it points to the deleted row.
        selectedExpenseRow = null;

        // Clear the last recalled data.
        lastRecalledExpenseData = null;

        // Remove remaining row highlights.
        expenseTableBody.querySelectorAll("tr").forEach(function (row) {
            row.classList.remove(
                "selected-expense-row",
                "selected"
            );
        });

        // Focus the Expense Item field.
        document.getElementById("expenseitems")?.focus();

        // Mark Vehicle Master as modified.
        window.isVehicleDirty = true;
    });
});

// Vehicle Master - Expense Cancel Button
document.addEventListener("DOMContentLoaded", function () {

    const cancelButton = document.getElementById("btnExpenseCancel");

    if (!cancelButton) {
        return;
    }
    recalledExpenseRow = null;
    // Clear all Expense Entry fields when Cancel is clicked.
    cancelButton.addEventListener("click", function () {

        // Clear the recalled row reference without deleting the grid data.
        recalledExpenseRow = null;

        // Clear expense item code and name.
        document.getElementById("expenseitems").value = "";
        document.querySelector(".master-name-expenseitems").value = "";

        // Clear driver code and name.
        document.getElementById("drivercode").value = "";
        document.querySelector(".master-name-drivercode").value = "";

        // Reset accounting method to 0:毎月.
        document.getElementById("accountingmethod").value = "0";
        document.querySelector(".master-name-accountingmethod").value = "毎　月";

        // Clear the monthly amount.
        document.getElementById("monthly").value = "";

        // Clear all 12 monthly amount fields.
        for (let month = 1; month <= 12; month++) {
            const monthInput = document.getElementById(`month${month}`);

            if (monthInput) {
                monthInput.value = "";
            }
        }

        // Clear the monthly total.
        document.getElementById("monthlyTotal").value = "";

        // Reset field states for accounting method 0.
        document.getElementById("monthly").disabled = false;

        for (let month = 1; month <= 12; month++) {
            const monthInput = document.getElementById(`month${month}`);

            if (monthInput) {
                monthInput.disabled = true;
            }
        }

        //// Remove the selected grid row highlight.
        //const expenseTableBody = document.getElementById("expenseTableBody");

        //if (expenseTableBody) {
        //    expenseTableBody.querySelectorAll("tr").forEach(function (row) {
        //        row.classList.remove("selected-expense-row");
        //    });
        //}

        // Focus on the Expense Item input.
        document.getElementById("expenseitems").focus();
    });
});

// ←呼出: Recall the last recalled row or the first remaining row.
document.getElementById("btnExpenseRecall").addEventListener("click", function () {

    // ←呼出: Recall only the currently selected row.
    const expenseTableBody = document.getElementById("expenseTableBody");

    if (!expenseTableBody) return;

    // Use only the row selected by single-click.
    const rowToRecall = selectedExpenseRow;

    // Nothing selected: do nothing.
    if (
        !rowToRecall ||
        !expenseTableBody.contains(rowToRecall) ||
        rowToRecall.cells.length < 6
    ) {
        return;
    }
     

    // Remember the row being recalled.
    recalledExpenseRow = rowToRecall;

    // Restore expense information.
    document.getElementById("expenseitems").value =
        rowToRecall.cells[0].textContent.trim();

    document.querySelector(".master-name-expenseitems").value =
        rowToRecall.cells[1].textContent.trim();

    // Restore driver information.
    document.getElementById("drivercode").value =
        rowToRecall.cells[2].textContent.trim();

    document.querySelector(".master-name-drivercode").value =
        rowToRecall.cells[3].textContent.trim();

    // Restore accounting method.
    const method = rowToRecall.dataset.accountingMethod || "0";
    document.getElementById("accountingmethod").value = method;

    document.querySelector(".master-name-accountingmethod").value =
        method === "1" ? "月指定" : "毎　月";

    // Restore monthly amount.
    document.getElementById("monthly").value =
        rowToRecall.dataset.monthlyAmount || rowToRecall.cells[5].textContent.trim();

    // Restore the twelve monthly values.
    let monthlyValues = {};

    try {
        monthlyValues = JSON.parse(rowToRecall.dataset.monthlyValues || "{}");
    } catch (error) {
        monthlyValues = {};
    }

    for (let month = 1; month <= 12; month++) {
        const input = document.getElementById("month" + month);

        if (input) {
            input.value = monthlyValues["month" + month] ?? "";
            input.disabled = method !== "1";
        }
    }

    // Apply the correct input state for the accounting method.
    const monthlyInput = document.getElementById("monthly");
    monthlyInput.disabled = method !== "0";

    if (method === "1") {
        // Calculate the total of the twelve monthly values.
        let total = 0;

        for (let month = 1; month <= 12; month++) {
            const input = document.getElementById("month" + month);
            const value = input ? input.value.replace(/,/g, "").trim() : "";

            if (value !== "" && !isNaN(Number(value))) {
                total += Number(value);
            }
        }

        document.getElementById("monthlyTotal").value =
            total.toLocaleString("ja-JP");
    } else {
        document.getElementById("monthlyTotal").value = "";
    }

    // Store the latest recalled data separately.
    lastRecalledExpenseData = {
        expenseCode: rowToRecall.cells[0].textContent.trim(),
        expenseName: rowToRecall.cells[1].textContent.trim(),
        driverCode: rowToRecall.cells[2].textContent.trim(),
        driverName: rowToRecall.cells[3].textContent.trim(),
        accountingMethod: method,
        monthlyAmount: rowToRecall.dataset.monthlyAmount || "",
        monthlyValues: rowToRecall.dataset.monthlyValues || "{}"
    };

    // Highlight the recalled row.
    expenseTableBody.querySelectorAll("tr").forEach(row => {
        row.classList.remove("selected", "selected-expense-row");
    });

    rowToRecall.classList.add("selected-expense-row");

    // Focus the expense code field.
    document.getElementById("expenseitems").focus();
});

/* =========================================================
   Vehicle Master - Expense Modify Button
   ========================================================= */

// Use the existing global declaration if already present.
// Do not declare recalledExpenseRow a second time.
document.addEventListener("DOMContentLoaded", function () {

    const modifyButton = document.getElementById("btnExpenseModify");
    const expenseTableBody = document.getElementById("expenseTableBody");

    const expenseItems = document.getElementById("expenseitems");
    const expenseName = document.querySelector(".master-name-expenseitems");

    const driverCode = document.getElementById("drivercode");
    const driverName = document.querySelector(".master-name-drivercode");

    const accountingMethod = document.getElementById("accountingmethod");
    const monthlyInput = document.getElementById("monthly");
    const monthlyTotal = document.getElementById("monthlyTotal");

    const accountingMethodName =
        document.querySelector(".master-name-accountingmethod");

    const monthInputs = Array.from(
        { length: 12 },
        (_, index) => document.getElementById(`month${index + 1}`)
    ).filter(Boolean);

    if (
        !modifyButton ||
        !expenseTableBody ||
        !expenseItems ||
        !expenseName ||
        !driverCode ||
        !driverName ||
        !accountingMethod
    ) {
        return;
    }

    // Get the expense amount based on the accounting method.
    function getExpenseAmount() {

        const method = accountingMethod.value.trim();

        // Accounting method 0: Use the monthly amount.
        if (method === "0") {
            return monthlyInput ? monthlyInput.value.trim() : "";
        }

        // Accounting method 1: Use the total of the 12 monthly amounts.
        if (method === "1") {
            calculateMonthlyTotal();

            return monthlyTotal ? monthlyTotal.value.trim() : "";
        }

        return null;
    }

    // Store all 12 monthly amounts for the individual grid row.
    function getMonthlyValues() {

        const monthlyValues = {};

        for (let month = 1; month <= 12; month++) {
            const monthInput = document.getElementById(`month${month}`);

            monthlyValues[`month${month}`] = monthInput
                ? monthInput.value.trim()
                : "";
        }

        return monthlyValues;
    }

    // Highlight the selected grid row.
    function selectExpenseRow(selectedRow) {

        expenseTableBody.querySelectorAll("tr").forEach(function (row) {
            row.classList.remove("selected-expense-row");
        });

        selectedRow.classList.add("selected-expense-row");
    }

    // Sort grid by 経費コード → 車輌コード → キー.
    function sortExpenseRows() {

        const rows = Array.from(
            expenseTableBody.querySelectorAll("tr")
        );

        rows.sort(function (a, b) {

            // 1. Sort by 経費コード.
            const expenseCodeA = a.cells[0]?.textContent.trim() || "";
            const expenseCodeB = b.cells[0]?.textContent.trim() || "";

            const expenseCompare = expenseCodeA.localeCompare(
                expenseCodeB,
                "ja",
                { numeric: true }
            );

            if (expenseCompare !== 0) {
                return expenseCompare;
            }

            // 2. Sort by 車輌コード.
            const vehicleCodeA = a.dataset.vehicleCode || "";
            const vehicleCodeB = b.dataset.vehicleCode || "";

            const vehicleCompare = vehicleCodeA.localeCompare(
                vehicleCodeB,
                "ja",
                { numeric: true }
            );

            if (vehicleCompare !== 0) {
                return vehicleCompare;
            }

            // 3. Sort by キー.
            const keyA = Number(a.dataset.expenseKey || a.dataset.key || 0);
            const keyB = Number(b.dataset.expenseKey || b.dataset.key || 0);

            const sortKeyA = keyA > 0 ? keyA : Number.MAX_SAFE_INTEGER;
            const sortKeyB = keyB > 0 ? keyB : Number.MAX_SAFE_INTEGER;

            return sortKeyA - sortKeyB;
        });

        // Re-append rows in sorted order.
        rows.forEach(function (row) {
            expenseTableBody.appendChild(row);
        });
    }

    // Calculate the total of the 12 monthly expense amounts.
    function calculateMonthlyTotal() {

        let total = 0;

        monthInputs.forEach(function (input) {

            const value = input.value.replace(/,/g, "").trim();

            if (value !== "" && !isNaN(Number(value))) {
                total += Number(value);
            }
        });

        if (monthlyTotal) {
            monthlyTotal.value = total.toLocaleString("en-US");
        }

        return total;
    }

    // Restore the selected row's data to the input fields.


    function recallExpenseRow(row) {

        if (!row || row.cells.length < 6) {
            return;
        }

        recalledExpenseRow = row;

        // Restore expense and driver details.
        expenseItems.value = row.cells[0].textContent.trim();
        expenseName.value = row.cells[1].textContent.trim();

        driverCode.value = row.cells[2].textContent.trim();
        driverName.value = row.cells[3].textContent.trim();

        // Restore accounting method.
        const rawMethod =
            row.dataset.accountingMethod ||
            row.dataset.splitMethod ||
            row.cells[4].textContent;

        const method =
            normalizeAccountingMethod(rawMethod) || "0";

        accountingMethod.value = method;

        // Synchronize the accounting method validation state.
        accountingMethod.dispatchEvent(
            new CustomEvent("accounting-method-restored", {
                detail: { method: method }
            })
        );

        // Restore 毎月 amount.
        if (monthlyInput) {

            const savedAmount =
                row.dataset.monthlyAmount ??
                row.dataset.amount ??
                "";

            monthlyInput.value = method === "0"
                ? (savedAmount === "" ? "" : formatNumber(savedAmount))
                : "";

            monthlyInput.disabled = method !== "0";
        }

        // Restore monthly values.
        let monthlyValues = {};

        try {
            monthlyValues = JSON.parse(
                row.dataset.monthlyValues || "{}"
            );
        } catch (error) {
            console.error("Monthly values parsing error:", error);
        }

        // Fallback for individually stored monthly values.
        for (let month = 1; month <= 12; month++) {

            const key = `month${month}`;

            if (monthlyValues[key] == null) {
                monthlyValues[key] =
                    row.dataset[`amount${month}`] ?? "";
            }
        }

        // Restore all 12 monthly inputs.
        let total = 0;

        monthInputs.forEach(function (input, index) {

            const value = monthlyValues[`month${index + 1}`];

            input.value =
                method === "1" && value !== null && value !== ""
                    ? formatNumber(value)
                    : "";

            input.disabled = method !== "1";

            if (method === "1") {
                total += Number(
                    String(value ?? "").replace(/,/g, "")
                ) || 0;
            }
        });

        // Restore monthly total.
        if (monthlyTotal) {
            monthlyTotal.value = method === "1"
                ? total.toLocaleString("en-US")
                : "";
        }

        // Restore accounting method description.
        if (accountingMethodName) {
            accountingMethodName.value =
                method === "0" ? "毎　月" : "月指定";
        }

        // Highlight selected row and return focus.
        selectExpenseRow(row);
        expenseItems.focus();
    }



    // Update the values of an existing row without inserting a new row.
    function updateExpenseRow(
        row,
        rowValues,
        method,
        monthlyValues,
        monthlyAmount
    ) {

        // Update the six visible columns.
        rowValues.forEach(function (value, index) {
            row.cells[index].textContent = String(value ?? "");
        });

        // Update the stored accounting method and monthly values.
        row.dataset.accountingMethod = method;
        row.dataset.monthlyValues = JSON.stringify(monthlyValues);
        row.dataset.monthlyAmount = monthlyAmount;

        // Keep the updated row highlighted.
        selectExpenseRow(row);
    }

    // Clear the form after a successful insert or update.
    function clearExpenseFields() {

        // Clear expense item details.
        expenseItems.value = "";
        expenseName.value = "";

        // Clear driver details.
        driverCode.value = "";
        driverName.value = "";

        // Reset accounting method to 0:毎月.
        accountingMethod.value = "0";

        if (accountingMethodName) {
            accountingMethodName.value = "毎　月";
        }

        // Clear the monthly amount.
        if (monthlyInput) {
            monthlyInput.value = "";
            monthlyInput.disabled = false;
        }

        // Clear all 12 monthly amounts and disable them.
        monthInputs.forEach(function (input) {
            input.value = "";
            input.disabled = true;
        });

        // Clear the monthly total.
        if (monthlyTotal) {
            monthlyTotal.value = "";
        }

        // Exit edit mode without deleting the grid row.
        recalledExpenseRow = null;

        // Focus on Expense Item.
        expenseItems.focus();
    }



    // Vehicle Master - Expense Modify Button.

    // Vehicle Master - Expense Modify Button.
    modifyButton.addEventListener("click", function () {

        const code = expenseItems.value.trim();
        const name = expenseName.value.trim();

        const driver = driverCode.value.trim();
        const driverNameValue = driverName.value.trim();

        const method = accountingMethod.value.trim();

        // Legacy validation: only Expense Item is required.
        if (!code) {
            alert("経費項目を入力してください");
            expenseItems.focus();
            return;
        }

        // Get the expense amount without requiring it.
        const amount = getExpenseAmount() ?? "";

        // Capture monthly values before clearing the form.
        const monthlyValues = getMonthlyValues();

        const monthlyAmount = monthlyInput
            ? monthlyInput.value.trim()
            : "";

        // Display the accounting method in the grid.
        const methodText = method === "0"
            ? "0:毎　月"
            : "1:月指定";

        // Prepare the six displayed column values.
        const rowValues = [
            code,
            name,
            driver,
            driverNameValue,
            methodText,
            amount
        ];

        // Check whether an existing row is being edited.
        const isEditMode =
            recalledExpenseRow !== null &&
            expenseTableBody.contains(recalledExpenseRow) &&
            recalledExpenseRow.cells.length >= 6;

        // Legacy behavior: always ask the same confirmation.
        const confirmed = window.confirm("修正してもよいですか？");

        if (!confirmed) {
            expenseItems.focus();
            return;
        }

        if (isEditMode) {

            // Update the existing row.
            updateExpenseRow(
                recalledExpenseRow,
                rowValues,
                method,
                monthlyValues,
                monthlyAmount
            );

        } else {

            // Insert a new row.
            const row = document.createElement("tr");

            row.dataset.vehicleCode =
                document.getElementById("carCode")?.value.trim() || "";

            rowValues.forEach(function (value) {
                const cell = document.createElement("td");
                cell.textContent = String(value ?? "");
                row.appendChild(cell);
            });

            // Store accounting method and monthly values.
            row.dataset.accountingMethod = method;
            row.dataset.monthlyValues = JSON.stringify(monthlyValues);
            row.dataset.monthlyAmount = monthlyAmount;

            // Allow keyboard focus on the row.
            row.tabIndex = 0;
            // Allow single-click selection of the new row.
            row.addEventListener("click", function () {
                selectedExpenseRow = row;
                selectExpenseRow(row);
            });
            // Append the new row.
            expenseTableBody.appendChild(row);

            // Highlight the newly inserted row.
            selectExpenseRow(row);
        }
        // Sort the grid after inserting or updating a row.
        sortExpenseRows();
        // Clear the form after successful insert or update.
        clearExpenseFields();
        // Mark Vehicle Master as modified.
        window.isVehicleDirty = true;
    });


    // Recall the row when it is double-clicked.
    expenseTableBody.addEventListener("dblclick", function (event) {

        const row = event.target.closest("tr");

        if (!row || !expenseTableBody.contains(row)) {
            return;
        }

        recallExpenseRow(row);
    });

    // Recall the focused row when Enter is pressed.
    expenseTableBody.addEventListener("keydown", function (event) {

        if (event.key !== "Enter") {
            return;
        }

        const row = event.target.closest("tr");

        if (!row || !expenseTableBody.contains(row)) {
            return;
        }

        event.preventDefault();
        recallExpenseRow(row);
    });

});


//  Accounting Method
document.addEventListener("DOMContentLoaded", function () {

    const accountingMethod = document.getElementById("accountingmethod");
    const accountingMethodName = document.querySelector(".master-name-accountingmethod");
    const monthlyInput = document.getElementById("monthly");
    const monthGrid = document.querySelector(".group-box-vehicle .month-grid");
    const monthlyTotal = document.getElementById("monthlyTotal");

    if (!accountingMethod || !accountingMethodName || !monthlyInput || !monthGrid || !monthlyTotal) {
        return;
    }


    // Accept only 0 or 1 in 計上方法.
    accountingMethod.addEventListener("input", function () {

        const value = this.value;

        if (value !== "0" && value !== "1") {
            this.value = "";
        }
    });

    // Prevent invalid values from being pasted.
    accountingMethod.addEventListener("paste", function (event) {

        const pastedValue = (
            event.clipboardData || window.clipboardData
        ).getData("text").trim();

        if (pastedValue !== "0" && pastedValue !== "1") {
            event.preventDefault();
        }
    });


    // Always maintain chronological order: 1月 → 12月.
    const monthInputs = Array.from(
        { length: 12 },
        (_, index) => document.getElementById(`month${index + 1}`)
    ).filter(Boolean);

    // Store the previous valid accounting method.
    let previousAccountingMethod = ["0", "1"].includes(accountingMethod.value)
        ? accountingMethod.value
        : "0";


    accountingMethod.addEventListener("focus", function () {
        const code = accountingMethod.value.trim();

        if (code === "0" || code === "1") {
            previousAccountingMethod = code;
        }
    });
    // Synchronize the previous valid method when a grid row is recalled.
    accountingMethod.addEventListener(
        "accounting-method-restored",
        function (event) {

            const method = event.detail?.method;

            if (method === "0" || method === "1") {
                previousAccountingMethod = method;
            }
        }
    );

    // Calculate the sum of the 12 monthly values.
    function calculateMonthlyTotal() {
        let total = 0;

        monthInputs.forEach(function (input) {
            // Remove commas before converting the value to a number.
            const value = input.value.replace(/,/g, "").trim();

            if (value !== "" && !isNaN(value)) {
                total += Number(value);
            }
        });

        // Display the total with comma separators.
        monthlyTotal.value = total.toLocaleString("en-US", {
            maximumFractionDigits: 2
        });
    }

    // Enable or disable inputs based on the accounting method.
    function updateAccountingMethodFields() {

        const code = accountingMethod.value.trim();

        // Clear the previous accounting method's input data when the method changes.
        if (code !== previousAccountingMethod) {

            if (previousAccountingMethod === "0") {

                // Clear 毎月 amount when switching from 0 to 1.
                if (monthlyInput) {
                    monthlyInput.value = "";
                }

            } else if (previousAccountingMethod === "1") {

                // Clear all 月指定 amounts when switching from 1 to 0.
                monthInputs.forEach(function (input) {
                    input.value = "";
                });

                // Clear the monthly total.
                if (monthlyTotal) {
                    monthlyTotal.value = "";
                }
            }
        }

        if (code === "0") {

            accountingMethodName.value = "毎　月";

            // Enable 毎月 and disable 月指定.
            monthlyInput.disabled = false;

            monthInputs.forEach(function (input) {
                input.disabled = true;
            });

            previousAccountingMethod = "0";

            // Clear the monthly total when 月指定 is inactive.
            monthlyTotal.value = "";

            return true;
        }

        if (code === "1") {

            accountingMethodName.value = "月指定";

            // Disable 毎月 and enable 月指定.
            monthlyInput.disabled = true;

            monthInputs.forEach(function (input) {
                input.disabled = false;
            });

            previousAccountingMethod = "1";

            // Calculate the total for the 12 months.
            calculateMonthlyTotal();

            return true;
        }

        // Restore the previous valid value when the code is invalid.
        //alert("計上方法を正しく入力して下さい！！（0・1）");

        accountingMethod.value = previousAccountingMethod;

        accountingMethodName.value =
            previousAccountingMethod === "0" ? "毎　月" : "月指定";

        updateAccountingMethodFields();

        accountingMethod.focus();
        accountingMethod.select();

        return false;
    }
     

    // Move focus according to the accounting method when Enter is pressed.
    accountingMethod.addEventListener("keydown", function (event) {

        if (event.key !== "Enter") {
            return;
        }

        event.preventDefault();

        if (!updateAccountingMethodFields()) {
            return;
        }

        if (accountingMethod.value === "0") {
            // 毎月 → 毎月金額
            monthlyInput.focus();
            monthlyInput.select();
        } else {
            // 月指定 → 1月
            const firstMonthInput = monthInputs[0];

            if (firstMonthInput) {
                firstMonthInput.focus();
                firstMonthInput.select();
            }
        }
    });

    // 毎月: 金額入力 → 修正
    // Register this listener only once.
    monthlyInput.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById("btnExpenseModify")?.focus();
        }
    });


    // 月指定: 1月 → 12月 → 修正
    monthInputs.forEach(function (input, index) {

        input.addEventListener("keydown", function (event) {

            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();

            if (index < monthInputs.length - 1) {
                // Move to the next month.
                const nextInput = monthInputs[index + 1];

                nextInput.focus();
                nextInput.select();

            } else {
                // 12月 → 修正
                document.getElementById("btnExpenseModify")?.focus();
            }
        });
    });

    // Update the description and input states when focus leaves the field.
    accountingMethod.addEventListener("blur", function (event) {
        const nextField =
            accountingMethod.value === "0"
                ? monthlyInput
                : monthInputs[0];

        if (event.relatedTarget === nextField) {
            updateAccountingMethodFields();
            return;
        }

        accountingMethod.value = previousAccountingMethod;
        updateAccountingMethodFields();
    });

    // Recalculate the total whenever a monthly value changes.
    monthInputs.forEach(function (input) {
        input.addEventListener("input", function () {
            calculateMonthlyTotal();
        });
    });

    // Initialize the screen according to the default accounting method.
    updateAccountingMethodFields();
});



//document.addEventListener("DOMContentLoaded", function () {

//    const accountingMethod = document.getElementById("accountingmethod");
//    const accountingMethodName = document.querySelector(".master-name-accountingmethod");
//    const monthlyInput = document.getElementById("monthly");
//    const monthGrid = document.querySelector(".group-box-vehicle .month-grid");

//    if (!accountingMethod || !accountingMethodName) return;

//    // Store the previous valid accounting method.
//    let previousAccountingMethod = ["0", "1"].includes(accountingMethod.value)
//        ? accountingMethod.value
//        : "0";

//    // Update the description based on the accounting method.
//    function updateAccountingMethod() {
//        const code = accountingMethod.value.trim();

//        if (code === "0") {
//            accountingMethodName.value = "毎　月";
//            previousAccountingMethod = "0";
//            return true;
//        }

//        if (code === "1") {
//            accountingMethodName.value = "月指定";
//            previousAccountingMethod = "1";
//            return true;
//        }

//        // Restore the previous valid value when the code is invalid.
//        alert("計上方法を正しく入力して下さい！！（0・1）");

//        accountingMethod.value = previousAccountingMethod;
//        accountingMethodName.value =
//            previousAccountingMethod === "0" ? "毎　月" : "月指定";

//        accountingMethod.focus();
//        accountingMethod.select();

//        return false;
//    }

//    // Validate and move focus when Enter or Tab is pressed.
//    accountingMethod.addEventListener("keydown", function (event) {

//        if (event.key !== "Enter" && event.key !== "Tab") return;

//        event.preventDefault();

//        if (!updateAccountingMethod()) return;

//        // Move focus based on the selected accounting method.
//        if (accountingMethod.value === "0") {
//            monthlyInput?.focus();
//            monthlyInput?.select();
//        } else if (accountingMethod.value === "1") {
//            const firstMonthInput = monthGrid?.querySelector("input");
//            firstMonthInput?.focus();
//            firstMonthInput?.select();
//        }
//    });

//    // Update the description when focus leaves the field.
//    accountingMethod.addEventListener("blur", function () {
//        updateAccountingMethod();
//    });

//});

// Tab 4 Tab Repair and tire replacement history

// Expense Category Loading - Tab 4
document.addEventListener("DOMContentLoaded", function () {

    const categoryCode = document.getElementById("expenseCategoryCode");
    const categorySelect = document.getElementById("expenseCategory");
    const expenseItemCode = document.getElementById("expenseItemCode");

    if (!categoryCode || !categorySelect) return;

    let previousValidCode = "0";
    let isLoadingCategories = false;

    categoryCode.addEventListener("focus", function () {
        const code = categoryCode.value.trim();
        previousValidCode = code || "0";
    });

    // Load all expense categories from the controller.
    async function loadExpenseCategories() {

        if (isLoadingCategories) return;

        isLoadingCategories = true;

        try {
            const response = await fetch(
                "/VehicleMaster/GetExpenseCategories"
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to load expense categories."
                );
            }

            // Keep the default empty option.
            categorySelect.replaceChildren(new Option("", "0"));

            // Populate the dropdown with database records.
            result.data.forEach(function (item) {
                const code = String(item.code).padStart(2, "0");

                categorySelect.add(
                    new Option(item.name, code)
                );
            });

        } catch (error) {
            console.error("Expense category loading failed:", error);
            alert("経費区分マスタのデータ取得に失敗しました。");

        } finally {
            isLoadingCategories = false;
        }
    }

    // Validate the entered category code and synchronize the dropdown.
    function updateExpenseCategory() {

        const inputCode = categoryCode.value.trim();

        // Reset when the code is empty.
        if (inputCode === "") {
            categorySelect.value = "0";
            previousValidCode = "0";
            return true;
        }

        // Add a leading zero to single-digit category codes.
        const code = inputCode.padStart(2, "0");

        const optionExists = Array.from(categorySelect.options)
            .some(option => option.value === code && code !== "00");

        if (optionExists) {
            categoryCode.value = code;
            categorySelect.value = code;
            previousValidCode = code;
            return true;
        }

        // Restore the previous valid category code.
        alert(`指定した経費区分『${code}』は未登録です！！`);

        categoryCode.value = previousValidCode === "0"
            ? ""
            : previousValidCode;

        categorySelect.value = previousValidCode;

        categoryCode.focus();
        categoryCode.select();

        return false;
    }

    // Validate on Enter or Tab and move focus to Expense Item.
    categoryCode.addEventListener("keydown", function (event) {

        if (event.key !== "Enter" && event.key !== "Tab") return;

        if (isLoadingCategories) {
            event.preventDefault();
            return;
        }

        const isValid = updateExpenseCategory();

        if (!isValid) {
            event.preventDefault();
            return;
        }

        // Move to Expense Item after successful validation.
        event.preventDefault();
        expenseItemCode?.focus();
    });

    // Validate when leaving the category code field.
    categoryCode.addEventListener("blur", function (event) {
        if (event.relatedTarget === expenseItemCode) {
            updateExpenseCategory();
            return;
        }

        categoryCode.value =
            previousValidCode === "0" ? "" : previousValidCode;

        categorySelect.value = previousValidCode;
    });

    // Synchronize the code when the dropdown selection changes.
    categorySelect.addEventListener("change", function () {

        categoryCode.value =
            categorySelect.value === "0" ? "" : categorySelect.value;

        previousValidCode = categorySelect.value;

        expenseItemCode?.focus();
    });

    // Load database records when the page opens.
    loadExpenseCategories();
});


// Vehicle Master -  Expense Item Code Lookup Function Expense Loading
document.addEventListener("DOMContentLoaded", function () {

    const expenseItems = document.getElementById("expenseItemCode");
    const expenseName = document.getElementById("expenseItemName");
    const startDate = document.getElementById("startDate");

    if (!expenseItems || !expenseName) return;

    // Store the previous valid expense details.
    let previousCode = "";
    let previousName = "";
    let isLookingUp = false;
    let lastLookupCode = "";

    expenseItems.addEventListener("focus", function () {
        previousCode = expenseItems.value;
        previousName = expenseName.value;
        lastLookupCode = previousCode;
    });

    // Retrieve expense details from the Vehicle Master controller.
    async function lookupExpense() {

        const inputCode = expenseItems.value.trim();

        // Add leading zeros to expense codes below 1000.
        const code = inputCode !== "" && Number(inputCode) < 1000
            ? inputCode.padStart(4, "0")
            : inputCode;

        // Clear the expense name when the code is empty.
        if (!code) {
            expenseName.value = "";
            previousCode = "";
            previousName = "";
            lastLookupCode = "";
            return true;
        }

        // Prevent duplicate lookups while a request is in progress.
        if (isLookingUp) return false;

        // Skip the lookup if this code was already validated.
        if (code === lastLookupCode) return true;

        isLookingUp = true;
        expenseItems.value = code;

        try {
            const response = await fetch(
                `/VehicleMaster/GetExpense?code=${encodeURIComponent(code)}`
            );

            const result = await response.json();

            // Restore the previous valid value if the code is not registered.
            if (!response.ok || !result.success) {
                alert(
                    result.message ||
                    `指定した経費『${code}』は未登録です！！`
                );

                expenseItems.value = previousCode;
                expenseName.value = previousName;
                lastLookupCode = previousCode;

                expenseItems.focus();
                expenseItems.select();

                return false;
            }

            // Display and store the returned expense details.
            expenseItems.value = result.code;
            expenseName.value = result.name;

            previousCode = result.code;
            previousName = result.name;
            lastLookupCode = result.code;

            return true;

        } catch (error) {
            console.error("Tab 4 expense lookup failed:", error);

            alert("経費マスタのデータ取得に失敗しました。");

            expenseItems.value = previousCode;
            expenseName.value = previousName;
            lastLookupCode = previousCode;

            expenseItems.focus();
            expenseItems.select();

            return false;

        } finally {
            isLookingUp = false;
        }
    }

    // Validate the expense code and move focus to Start Date on Enter or Tab.
    expenseItems.addEventListener("keydown", async function (event) {

        if (event.key !== "Enter" && event.key !== "Tab") return;

        event.preventDefault();

        const isValid = await lookupExpense();

        if (isValid && startDate) {
            requestAnimationFrame(function () {
                startDate.focus();
            });
        }
    });

    // Validate the expense code when the input loses focus.
    expenseItems.addEventListener("blur", function (event) {
        if (event.relatedTarget === startDate) {
            lookupExpense();
            return;
        }

        expenseItems.value = previousCode;
        expenseName.value = previousName;
        lastLookupCode = previousCode;
    });

});

// =====================================================
// TAB 4: REPAIR / TIRE REPLACEMENT HISTORY
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const carCode = document.getElementById("carCode");

    const categoryCode =
        document.getElementById("expenseCategoryCode");

    const categorySelect =
        document.getElementById("expenseCategory");

    const expenseCode =
        document.getElementById("expenseItemCode");

    const expenseName =
        document.getElementById("expenseItemName");

    const startDate =
        document.getElementById("startDateValue");

    const endDate =
        document.getElementById("endDateValue");

    const btnSearch =
        document.getElementById("btnSearch");

    const btnCancel =
        document.getElementById("btnCancel");

    const gridBody =
        document.getElementById("repairHistoryBody");

    const quantityTotal =
        document.getElementById("repairQuantityTotal");

    const amountTotal =
        document.getElementById("repairAmountTotal");

    if (!btnSearch || !gridBody) return;

     
    // Format numeric values. Keep blank values empty.
    function formatHistoryNumber(value, decimals = 0) {

        if (value === null || value === undefined || value === "") {
            return "";
        }

        const number = Number(value);

        return Number.isFinite(number)
            ? number.toLocaleString("en-US", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            })
            : "";
    }

    // Date display mode: 1 = 和暦, 0 = 西暦
    //document.body.dataset.dateEra = "1";
    function formatHistoryDate(value) {

        if (!value) return "";

        const date = new Date(value);

        if (isNaN(date.getTime())) return "";

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        // 西暦
        if (document.body.dataset.dateEra !== "1") {
            return `${year}/${month}/${day}`;
        }

        // 和暦
        const parts = new Intl.DateTimeFormat(
            "ja-JP-u-ca-japanese",
            {
                era: "long",
                year: "2-digit"
            }
        ).formatToParts(date);

        const era = parts.find(p => p.type === "era")?.value;
        const eraYear = parts.find(p => p.type === "year")?.value;

        if (!era || !eraYear) {
            return `${year}/${month}/${day}`;
        }

        return `${era}${eraYear.padStart(2, "0")}.${month}.${day}`;
    }

    // Clear grid and totals.
    function clearRepairGrid() {

        gridBody.replaceChildren();

        quantityTotal.value = "0.00";
        amountTotal.value = "0";
    }


    // Display search results.
    function displayRepairHistory(records) {

        clearRepairGrid();

        let totalQuantity = 0;
        let totalAmount = 0;

        records.forEach(function (item) {

            const row = document.createElement("tr");

            const values = [
                formatHistoryDate(item.settlementDate),
                item.driverName || "",
                item.expenseName || "",
                formatHistoryNumber(item.quantity, 2),
                formatHistoryNumber(item.unitPrice, 2),
                formatHistoryNumber(item.amount),
                formatHistoryNumber(item.returnMileage)
            ];

            values.forEach(function (value) {

                const cell = document.createElement("td");

                cell.textContent = value;

                row.appendChild(cell);
            });

            // Select row when clicked.
            row.addEventListener("click", function () {

                gridBody.querySelectorAll("tr").forEach(function (tr) {
                    tr.classList.remove("selected");
                });

                row.classList.add("selected");
            });

            gridBody.appendChild(row);

            totalQuantity += Number(item.quantity || 0);
            totalAmount += Number(item.amount || 0);
        });

        // Automatically select the first row after search.
        const firstRow = gridBody.querySelector("tr");

        if (firstRow) {
            firstRow.classList.add("selected");
        }

        quantityTotal.value =
            formatHistoryNumber(totalQuantity, 2);

        amountTotal.value =
            formatHistoryNumber(totalAmount);
    }


    // F5: Search repair history.
    async function searchRepairHistory() {

        const vehicleCode = carCode.value.trim();

        //if (!/^\d{10}$/.test(vehicleCode)) {

        //    alert("車輌コードを正しく入力してください。");

        //    carCode.focus();

        //    return;
        //}

        const fromDate = startDate.value.trim();
        const toDate = endDate.value.trim();

        const parameters = new URLSearchParams();

        parameters.append("vehicleCode", vehicleCode);

        parameters.append(
            "expenseCategoryCode",
            categorySelect.value === "0"
                ? ""
                : categorySelect.value
        );

        parameters.append("expenseCode", expenseCode.value.trim());
        parameters.append("expenseName", expenseName.value.trim());

        parameters.append("fromDate", fromDate);
        parameters.append("toDate", toDate);

        try {

            btnSearch.disabled = true;

            const response = await fetch(
                `/VehicleMaster/GetRepairHistory?${parameters.toString()}`
            );

            const result = await response.json();

            if (!response.ok || !result.success) {

                throw new Error(
                    result.message ||
                    "修理・タイヤ交換履歴の取得に失敗しました。"
                );
            }

            displayRepairHistory(result.data || []);

            //if (!result.data || result.data.length === 0) {
            //    alert("該当するデータがありません。");
            //}

        } catch (error) {

            console.error("Repair History Search Error:", error);

            alert(error.message);

            clearRepairGrid();

        } finally {

            btnSearch.disabled = false;
        }
    }


    // 中止: Clear Tab 4 search conditions.
    function cancelRepairSearch() {

        categoryCode.value = "";
        categorySelect.value = "0";

        expenseCode.value = "";
        expenseName.value = "";

        document.getElementById("startDate").value = "";
        document.getElementById("endDate").value = "";

        startDate.value = "";
        endDate.value = "";

        // Return focus to 経費区分.
        categoryCode.focus();
        categoryCode.select();

        clearRepairGrid();
    }
    // Make the grid-clear function accessible to F2 and F11.
    window.clearRepairHistoryGrid = clearRepairGrid;

    btnSearch.addEventListener("click", searchRepairHistory);

    btnCancel?.addEventListener("click", cancelRepairSearch);

});

// Keep the last valid end date.
let previousValidEndDate = "";
let previousValidEndDateValue = "";

// Validate the date range and move focus accordingly.
function validateDateRange() {

    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const endDateValueInput = document.getElementById("endDateValue");

    if (!startDateInput || !endDateInput || !endDateValueInput) {
        return true;
    }

    const startText = startDateInput.value.trim();
    const endText = endDateInput.value.trim();

    // Skip validation if either date is empty.
    if (!startText || !endText) {
        return true;
    }

    // Convert yyyy年MM月dd日 to yyyyMMdd for comparison.
    function toDateNumber(value) {
        const match = value.match(
            /^(\d{4})年(\d{1,2})月(\d{1,2})日$/
        );

        if (!match) {
            console.error("Invalid date format:", value);
            return null;
        }

        return Number(
            match[1] +
            match[2].padStart(2, "0") +
            match[3].padStart(2, "0")
        );
    }

    const startDate = toDateNumber(startText);
    const endDate = toDateNumber(endText);

    if (startDate === null || endDate === null) {
        return false;
    }

    // Show an error if the end date is earlier than the start date.
    if (endDate < startDate) {

        alert("対象期間の指定が異常です！！");

        // Restore the previously valid end date.
        endDateInput.value = previousValidEndDate;
        endDateValueInput.value = previousValidEndDateValue;

        // Return focus to the start date field.
        setTimeout(function () {
            startDateInput.focus();
        }, 0);

        return false;
    }

    // Store the current end date as the last valid value.
    previousValidEndDate = endDateInput.value;
    previousValidEndDateValue = endDateValueInput.value;

    return true;
}

// Make the function accessible to japanesecalendar.js.
window.validateDateRange = validateDateRange;

// Validate when the end date display changes.
document.getElementById("endDate").addEventListener("change", function () {
    validateDateRange();
});

// Validate when the hidden end-date value changes.
document.getElementById("endDateValue").addEventListener("change", function () {
    validateDateRange();
});


// Tab 3 Validation - Monthly Value Formatting and Validation

document.addEventListener("DOMContentLoaded", function () {

    const monthInputs = document.querySelectorAll(".month-value-input");
    const MIN_VALUE = -9999999;
    const MAX_VALUE = 9999999;

    monthInputs.forEach(function (input) {

        // Format monthly values and display negative values in red.
        input.addEventListener("input", function () {

            let value = this.value.replace(/,/g, "");

            // Allow a minus sign only at the beginning.
            value = value.replace(/(?!^)-/g, "");
            value = value.replace(/[^0-9-]/g, "");

            // Allow the user to type a minus sign before entering digits.
            if (value === "-") {
                this.value = "-";
                this.classList.add("negative-value");
                return;
            }

            const isNegative = value.startsWith("-");
            let digits = value.replace(/-/g, "");

            // Limit to seven digits.
            digits = digits.slice(0, 7);

            let numberValue = Number(digits || "0");

            // Prevent values outside the permitted range.
            if (numberValue > MAX_VALUE) {
                numberValue = MAX_VALUE;
                digits = String(MAX_VALUE);
            }

            let formattedValue = digits.replace(
                /\B(?=(\d{3})+(?!\d))/g,
                ","
            );

            if (isNegative && digits !== "") {
                formattedValue = "-" + formattedValue;
            }

            this.value = formattedValue;

            // Change text color based on the sign.
            const numericValue = Number(this.value.replace(/,/g, ""));

            this.classList.toggle(
                "negative-value",
                numericValue < 0
            );

        });

        // Validate the final value when focus leaves the field.
        input.addEventListener("blur", function () {

            if (this.value.trim() === "" || this.value === "-") {
                this.value = "";
                this.classList.remove("negative-value");
                return;
            }

            let numericValue = Number(this.value.replace(/,/g, ""));

            if (!Number.isFinite(numericValue)) {
                this.value = "";
                this.classList.remove("negative-value");
                return;
            }

            // Enforce the permitted range.
            numericValue = Math.max(
                MIN_VALUE,
                Math.min(MAX_VALUE, numericValue)
            );

            this.value = numericValue.toLocaleString("en-US");

            this.classList.toggle(
                "negative-value",
                numericValue < 0
            );

        });

    });

});


// Message Handling: Display Input Range Guidance
document.addEventListener("DOMContentLoaded", function () {
    const messageText = document.getElementById("messageText");

    // Japanese era guidance
    const eraHint =
        "明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]";

    const isJapaneseEra = document.body.dataset.dateEra === "1";

    // Display a message when an input receives focus and clear it on blur
    function setInputMessage(inputIds, message) {
        if (!messageText) return;

        if (!Array.isArray(inputIds)) {
            inputIds = [inputIds];
        }

        inputIds.forEach(function (inputId) {
            const input = document.getElementById(inputId);

            if (!input) return;

            input.addEventListener("focus", function () {
                messageText.textContent = message;
            });

            input.addEventListener("blur", function () {
                messageText.textContent = "";
            });
        });
    }

    // Input range guidance
    setInputMessage(
        "totaldistancetraveled",
        "入力可能範囲[ 0～9,999,999 ]"
    );

    setInputMessage(
        "maximumloadcapacity",
        "入力可能範囲[ 0～99,999 ]"
    );

    setInputMessage(
        ["exchangecriteria", "afterreplacement"],
        "入力可能範囲[ 0～999,999 ]"
    );

    setInputMessage(
        ["monthly"],
        "入力可能範囲[ -9,999,999～9,999,999 ]"
    );

    // Date fields: Always display Japanese era guidance.
    setInputMessage(["registrationDate"], eraHint); // 登録年月日
    setInputMessage(["firstYear"], eraHint);        // 初年度
    setInputMessage(["inspectionDate"], eraHint);   // 車検日

    // Date fields: Display Japanese era guidance only in 和暦 mode.
    if (isJapaneseEra) {
        setInputMessage(["deliveryDate"], eraHint);       // 納車日
        setInputMessage(["deregistrationdate"], eraHint); // 廃車日
        setInputMessage(["lastexchangedate"], eraHint);   // オイル交換日

        setInputMessage(["startDate"], eraHint); // 履歴 開始日
        setInputMessage(["endDate"], eraHint);   // 履歴 終了日
    }

    // Accounting method guidance
    setInputMessage(
        "accountingmethod",
        "[ 0: 毎　月  1: 月指定]"
    );

    // Salary input range
    setInputMessage(
        "salary",
        "入力可能範囲[ 0.00～100.00 ]"
    );
});


// Tab 2 Message: Tire Maintenance Input Guidance
document.addEventListener("DOMContentLoaded", function () {
    const messageText = document.getElementById("messageText");
    const tireGrid = document.querySelector(".tire-grid");

    if (!messageText || !tireGrid) return;

    const isJapaneseEra = document.body.dataset.dateEra === "1";

    const eraHint =
        "明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]";

    // Display guidance when a tire maintenance input receives focus.
    tireGrid.addEventListener("focusin", function (event) {

        // Tire maintenance date fields.
        if (event.target.matches('[data-tire-field="date"]')) {
            messageText.textContent = isJapaneseEra ? eraHint : "";
            return;
        }

        // Tire maintenance kilometer fields.
        if (event.target.matches('.km-cell input[type="text"]')) {
            messageText.textContent = "入力可能範囲[ 0～999,999 ]";
        }
    });

    // Clear guidance when a tire maintenance input loses focus.
    tireGrid.addEventListener("focusout", function (event) {
        if (
            event.target.matches('[data-tire-field="date"]') ||
            event.target.matches('.km-cell input[type="text"]')
        ) {
            messageText.textContent = "";
        }
    });
});


// Tab 2 Message: Tire Maintenance Input Range Message
document.addEventListener("DOMContentLoaded", function () {
    const messageText = document.getElementById("messageText");
    const tireGrid = document.querySelector(".tire-grid");

    if (!messageText || !tireGrid) return;

    // Display the permitted range or Japanese era guidance.
    tireGrid.addEventListener("focusin", function (event) {

        // Tire maintenance date fields.
        if (event.target.matches('[data-tire-field="date"]')) {
            if (document.body.dataset.dateEra === "1") {
                messageText.textContent =
                    "明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]";
            } else {
                messageText.textContent = "";
            }
            return;
        }

        // Tire maintenance kilometer fields.
        if (event.target.matches('.km-cell input[type="text"]')) {
            messageText.textContent = "入力可能範囲[ 0～999,999 ]";
        }
    });

    // Clear the message when the input loses focus.
    tireGrid.addEventListener("focusout", function (event) {
        if (
            event.target.matches('[data-tire-field="date"]') ||
            event.target.matches('.km-cell input[type="text"]')
        ) {
            messageText.textContent = "";
        }
    });
});

// Tab 3 Message: Monthly Input Range Message
document.addEventListener("DOMContentLoaded", function () {
    const messageText = document.getElementById("messageText");
    const monthGrid = document.querySelector(".month-grid");

    if (monthGrid && messageText) {
        // Display the permitted range when a monthly input receives focus
        monthGrid.addEventListener("focusin", function (event) {
            if (event.target.tagName === "INPUT") {
                messageText.textContent =
                    "入力可能範囲[ -9,999,999～9,999,999 ]";
            }
        });

        // Clear the message when a monthly input loses focus
        monthGrid.addEventListener("focusout", function (event) {
            if (event.target.tagName === "INPUT") {
                messageText.textContent = "";
            }
        });
    }
}); 
// F12: Exit to Main Menu
document.addEventListener("DOMContentLoaded", function () {

    const btnExit = document.getElementById("btnExit_F12");

    if (!btnExit) return;

    btnExit.addEventListener("click", function () {

        // Confirm only when vehicle data has been changed.
        if (
            window.isVehicleDirty &&
            !confirm("変更されていますが、よろしいですか ?")
        ) {
            return;
        }

        window.location.href = "/MainMenu/Main_menu";
    });
});

// =========================================
// 給与オプション設定 - 手当掛率
// Format: ##0.00
// Range: 0.00 - 100.00
// =========================================

document.addEventListener("DOMContentLoaded", function () {

    const salary = document.getElementById("salary");

    if (!salary) return;

    // Select the integer part when the field receives focus.
    salary.addEventListener("focus", function () {
        this.select();
        
    });
    // Format input and limit the value to 100.00.
    salary.addEventListener("input", function () {

        const rawValue = this.value;
        const cursorPosition = this.selectionStart ?? rawValue.length;

        if (rawValue === "") return;

        const decimalIndex = rawValue.indexOf(".");

        const integerText = decimalIndex < 0
            ? rawValue
            : rawValue.substring(0, decimalIndex);

        const decimalText = decimalIndex < 0
            ? ""
            : rawValue.substring(decimalIndex + 1);

        const integerDigits = integerText.replace(/\D/g, "").substring(0, 3);
        const decimalDigits = decimalText.replace(/\D/g, "").substring(0, 2);

        const integerValue = integerDigits === ""
            ? "0"
            : String(Number(integerDigits));

        const numericValue = Number(
            integerValue + "." + (decimalDigits || "0")
        );

        const cursorIsInDecimals =
            decimalIndex >= 0 && cursorPosition > decimalIndex;

        const decimalDigitsBeforeCursor = cursorIsInDecimals
            ? rawValue
                .substring(decimalIndex + 1, cursorPosition)
                .replace(/\D/g, "").length
            : 0;

        if (numericValue > 100) {

            this.value = "100.00";

            const clampedCursor = cursorIsInDecimals
                ? 4 + Math.min(decimalDigitsBeforeCursor, 2)
                : 3;

            this.setSelectionRange(clampedCursor, clampedCursor);
            return;
        }

        this.value =
            integerValue + "." + decimalDigits.padEnd(2, "0");

        const formattedCursor = cursorIsInDecimals
            ? integerValue.length + 1 +
            Math.min(decimalDigitsBeforeCursor, 2)
            : Math.min(
                rawValue
                    .substring(0, cursorPosition)
                    .replace(/\D/g, "").length,
                integerValue.length
            );

        this.setSelectionRange(formattedCursor, formattedCursor);
    });

    // Validate and format when leaving the field.
    salary.addEventListener("blur", function () {

        const value = this.value.trim();

        if (!value) {
            this.value = "";
            return;
        }

        let number = Number(value);

        if (!Number.isFinite(number) || number < 0) {
            number = 0;
        }

        if (number > 100) {
            number = 100;
        }

        this.value = number.toFixed(2);
    });

    // Decimal point and keyboard navigation.
    salary.addEventListener("keydown", function (event) {

        if (event.key === "." || event.key === "Decimal") {

            event.preventDefault();

            if (!this.value) {
                this.value = "0.00";
            }

            const decimalIndex = this.value.indexOf(".");
            const position = decimalIndex < 0
                ? this.value.length
                : decimalIndex + 1;

            this.setSelectionRange(position, position);
            return;
        }

        //const forward =
        //    event.key === "Enter" ||
        //    event.key === "ArrowDown" ||
        //    (event.key === "Tab" && !event.shiftKey);

        //if (!forward) return;

        //event.preventDefault();

        //document.querySelector(".tab-button.active")?.focus();
    });
});

// Prevent footer button clicks from triggering input blur restoration.
document.querySelectorAll(".function-footer button").forEach(button => {
    button.addEventListener("mousedown", event => {
        event.preventDefault();
    });
});