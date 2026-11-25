// ======================================================
//              GLOBAL SCREEN FLAGS
// ======================================================

// Indicates whether the current screen is in Edit mode.
let isEditMode = false;

// Prevents multiple execution of expense code validation.
let isProcessingExpenseCode = false;

// Tracks whether user changed any data.
let hasChanges = false;

// Indicates whether Copy mode is active.
let isCopyMode = false;

//======================================================
//              GLOBAL SCREEN ELEMENTS
//======================================================
let expenseCode;

let expenseName;

let categoryCode;

let categoryDropdown;

let unitPrice;

let digitaco;

let lastValidUnitPrice = "";

let editingControl = null;

let isCommitted = false;

let lastFocusedFieldBeforeBtnAction = null;

// Global Sort Direction Tracking
const sortDirection = {};


// =========================================
//        ENTER/TAB NAVIGATION
// =========================================

document.addEventListener("keydown", function (event) {

    if (event.key !== "Enter" && event.key !== "Tab" && event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Escape") {
        return;
    }

    const currentField = event.target;

    expenseCode =
        document.getElementById("expenseCode");

    expenseName =
        document.getElementById("expenseName");

    // Fields above the tabs.
    const topFields = [
        expenseCode,
        expenseName
    ].filter(field => field && !field.disabled);

    // Keep the existing Expense Code validation.
    if (currentField === expenseCode) {
        return;
    }

    // Get fields from the currently active tab only.
    const activeTab = document.querySelector(
        ".tab-content.active"
    );

    const activeTabButton = document.querySelector(".tab-button.active");


    const activeTabFields = activeTab
        ? Array.from(
            activeTab.querySelectorAll(
                "input:not([disabled]):not([type='hidden']), " +
                "textarea:not([disabled])"
            )
        ).filter(field => !field.readOnly)
        : [];


    // -------------------------------------------------
    // UP ARROW: Move to previous field.
    // -------------------------------------------------
    if (event.key === "ArrowUp" || event.key === "Escape") {

        const allFields = [
            expenseCode,
            expenseName,
            ...activeTabFields
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


    // =========================================
    // ENTER KEY
    // =========================================
    if (event.key === "Enter" || event.key === "ArrowDown") {

        // Top fields
        if (topFields.includes(currentField)) {
            event.preventDefault();

            if (currentField === expenseName && event.key !== "ArrowUp") {
                if (expenseName.value.trim() === "") {
                    expenseName.focus();
                    return;
                }


                if (activeTabFields.length > 0) {
                    // Edit mode: enter the active tab.
                    /*activeTabFields[0].focus();*/
                    if (activeTabButton) {
                        activeTabButton.focus();
                    }
                }
            }

            return;
        }

        // Active tab fields: cycle only inside the active tab.
        const currentIndex =
            activeTabFields.indexOf(currentField);

        if (currentIndex !== -1 && activeTabFields.length > 0) {
            event.preventDefault();

            if (currentIndex < activeTabFields.length - 1) {
                activeTabFields[currentIndex + 1].focus();
            }
            else {
                if (activeTabButton) {
                    activeTabButton.focus();
                }
                else {
                    activeTabFields[0].focus();
                }
            }

            return;
        }

        if (activeTabButton && currentField === activeTabButton) {
            event.preventDefault();

            if (activeTabFields.length > 0) {
                activeTabFields[0].focus();
            }
            return;
        }

        return;
    }

    // =========================================
    // TAB KEY
    // =========================================

    // Handle fields above the tabs.
    if (topFields.includes(currentField)) {
        event.preventDefault();

        if (event.shiftKey) {
            const currentIndex = topFields.indexOf(currentField);

            topFields[Math.max(currentIndex - 1, 0)].focus();
            return;
        }

        if (currentField === expenseCode) {
            // Existing expense-code validation handles this key.
            return;
        }

        if (currentField === expenseName) {

            // Stay on 名称 when it is empty.
            if (expenseName.value.trim() === "") {
                expenseName.focus();
                return;
            }

            // Edit mode: Tab enters the active tab.
            if (activeTabFields.length > 0) {
                activeTabFields[0].focus();
            }

            return;
        }
    }

    // Tab from the active tab includes top fields
    // and active-tab fields, but excludes inactive tabs.
    const navigationFields = [
        ...topFields,
        ...activeTabFields
    ];

    const currentIndex =
        navigationFields.indexOf(currentField);

    if (currentIndex === -1 || navigationFields.length === 0) {
        return;
    }

    event.preventDefault();

    let nextIndex;

    if (event.shiftKey) {
        nextIndex =
            (currentIndex - 1 + navigationFields.length) %
            navigationFields.length;
    } else {
        nextIndex =
            (currentIndex + 1) % navigationFields.length;
    }

    navigationFields[nextIndex].focus();
    return;
});

// =========================================
//         PAGE INITIALIZATION
// =========================================
document.addEventListener("DOMContentLoaded", function () {

    initializeTabs();

    // Select all text in input fields when focused
    document.querySelectorAll(".input-value").forEach(input => {

        input.addEventListener("focus", function () {
            this.dataset.oldValue = this.value;
            isCommitted = false;
            this.select();
        });

        input.addEventListener("blur", function () {
            if (this.id === "expenseCode") {
                return;
            }

            // Unit price has its own rollback handler below.
            if (this.id === "unitPrice") {
                return;
            }

            if (!isCommitted) {
                this.value = this.dataset.oldValue ?? "";
            }
        });
    });

    // Makes all buttons commit values before blur event fires
    document.querySelectorAll("button").forEach(button => {
        button.addEventListener("mousedown", function () {
            if (this.id === "btnRegister" || this.id === "btnCopy") {
                isCommitted = true;
            }
        });
    });

    const registerButton = document.getElementById("btnRegister");

    // F1 - Register button events
    if (registerButton) {
        registerButton.addEventListener("click", saveExpense);
    }

    // F2 - Copy button events
    const copyButton = document.getElementById("btnCopy");
    if (copyButton) {
        copyButton.addEventListener("click", copyExpense);
    }

    // F4 - Delete button events
    const deleteButton = document.getElementById("btnDelete");
    if (deleteButton) {
        deleteButton.addEventListener("click", deleteExpense);
    }

    // F11 - Cancel button events
    const cancelButton = document.getElementById("btnCancel");
    if (cancelButton) {
        previousActiveField(cancelButton);

        cancelButton.addEventListener("click", cancelExpense);
    }

    //F12 - ExitButton with popup
    const btnExit = document.getElementById("btnExit");
    if (btnExit) {
        previousActiveField(btnExit);

        btnExit.addEventListener("click", function (event) {

            event.preventDefault();

            if (hasChanges) {
                if (!confirm(
                    "変更されていますが、よろしいですか ?")) {

                    if (lastFocusedFieldBeforeBtnAction) {
                        lastFocusedFieldBeforeBtnAction.focus();
                    }
                    return;
                }
            }

            const exitUrl = btnExit.dataset.exitUrl;

            if (exitUrl) {
                window.location.href = exitUrl;
            }

        });

    }

    //Expense Code field events
    expenseCode = document.getElementById("expenseCode");
    restrictNumericInput(expenseCode, 4);
    if (expenseCode) {
        expenseCode.addEventListener("blur", async function () {

            // Do not restore the previous code when Enter/Tab
            // has already started code processing.
            if (isProcessingExpenseCode) {
                return;
            }

            if (!isCommitted) {
                expenseCode.value = expenseCode.dataset.oldValue;
                return;
            }

            const value = expenseCode.value.trim();

            if (value === "") {
                return;
            }
            expenseCode.value =
                zeroPad(expenseCode.value.trim(), 4);

        });
        expenseCode.addEventListener("keydown", async function (event) {

            if (event.key === "Enter" || event.key === "Tab" || event.key === "ArrowDown") {
                isCommitted = true;
                event.preventDefault();
                event.stopPropagation();
                await processExpenseCode(event);
            }

        });
    }

    // Expense Category field events
    categoryCode = document.getElementById("expenseCategory-code");
    restrictNumericInput(categoryCode, 2);
    if (categoryCode) {
        // Store the last successfully committed category.
        categoryCode.addEventListener("focus", function () {
            if (this.dataset.previousValidCode === undefined) {
                this.dataset.previousValidCode = this.value;
                this.dataset.previousValidCategory = categoryDropdown.value;
            }
        });

        categoryCode.addEventListener("keydown", async function (event) {
            //categoryDropdown.value = this.value;
            if (event.key === "Enter" || event.key === "Tab" || event.key === "ArrowDown") {
                event.preventDefault();
                event.stopPropagation();

                categoryCode.value = zeroPad(categoryCode.value.trim(), 2);

                const success = await lookupCategory();
                if (success) {
                    unitPrice.focus();
                    unitPrice.select();
                }
                else {
                    categoryCode.focus();
                    categoryCode.select();
                }
            }
            else {
                return;
            }
        });

    }

    //Unit Master Field events
    unitPrice = document.getElementById("unitPrice");
    if (unitPrice) {
        unitPrice.addEventListener("focus", function () {
            // Capture the original value before the user starts editing.
            this.dataset.oldValue = this.value;
            lastValidUnitPrice = this.value;

            isCommitted = false;
            showUnitPriceMessage();
        });

        unitPrice.addEventListener("input", validateUnitPrice);

        unitPrice.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === "Tab" || event.key === "ArrowDown") {
                // Commit this field only when Enter or Tab is pressed.
                isCommitted = true;

                if (this.value !== this.dataset.oldValue) {
                    hasChanges = true;
                }
            }
        });

        unitPrice.addEventListener("blur", function () {
            setMessage("");

            if (!isCommitted) {
                this.value = this.dataset.oldValue ?? "";
                lastValidUnitPrice = this.value;
                return;
            }

            if (this.value.trim() && this.value !== "0.00") {
                if (lastValidUnitPrice !== "") {
                    this.value = lastValidUnitPrice;
                }
            }

        });
    }

    // Expense Name field events
    expenseName = document.getElementById("expenseName");
    expenseName.addEventListener("mousedown", async function (event) {
        if (expenseCode && !expenseCode.readOnly && expenseCode.value !== expenseCode.dataset.oldValue && !isCommitted) {
            expenseCode.value = zeroPad(expenseCode.value.trim(), 4);
            isCommitted = true;

            await processExpenseCode(event);
        }
    });
    expenseName.addEventListener("input", validateByteLength(28));

    // Expense Category dropdown events
    categoryDropdown = document.getElementById("expenseCategory-name");
    if (categoryDropdown) {
        categoryDropdown.addEventListener("change", function () {
            // Synchronize the category code with the selected dropdown value.
            categoryCode.value = this.value;

            // The category selection is an intentional change.
            categoryCode.dataset.oldValue = categoryCode.value;
            this.dataset.oldValue = this.value;

            // Move focus to Unit Price.
            if (unitPrice) {
                unitPrice.focus();
                unitPrice.select();
            }
        });
    }

    // Digitaco field events
    digitaco = document.getElementById("digitaco");
    digitaco.addEventListener("input", validateByteLength(15));

    // Grid row click/double-click events
    document.querySelectorAll(".table-body tr").forEach(function (row) {

        row.addEventListener("dblclick", function () {
            const code = row.dataset.code;
            getByCode(event, code);

        });

        row.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                const code = row.dataset.code;
                getByCode(event, code);
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


    document.querySelectorAll(".input-value").forEach(control => {
        control.addEventListener("keydown", function (event) {
            if (event.key !== "Enter" && event.key !== "Tab" && event.key !== "ArrowDown") {
                return;
            }

            // Do not commit a value that was just restored.
            isCommitted = true;

            if (this.id !== "expenseCategory-code" && this.value !== this.dataset.oldValue) {

                hasChanges = true;
            }
        });
    });

    document.addEventListener("mousedown", function (event) {
        const activeInput = document.activeElement;

        if (activeInput && activeInput.matches(".input-value") && !isCommitted && !event.target.matches("input,textarea,select")) {
            event.preventDefault();
            activeInput.focus();
        }
    });

    // Store the old value of input fields when they gain focus
    document.addEventListener("focusin", function (e) {
        if (e.target.matches("input, textarea")) {
            editingControl = e.target;
        }
    });

    // function to sort the grid based on the column name/type and direction (ascending/descending)

    document.querySelectorAll(".table-list th[data-sort]")

        .forEach(header => {
            header.addEventListener("click",

                function () {
                    sortGrid(this.dataset.sort);
                });
        });

    isEditMode = false;
    setEditMode();

    focusExpenseCode();

});

// =====================================================
//      STORE PREVIOUS ACTIVE FIELD FOR FOCUSING
// =====================================================
function previousActiveField(buttonElement) {
    buttonElement.addEventListener("mousedown", function () {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.matches("input,textarea,select")) {
            lastFocusedFieldBeforeBtnAction = activeElement;
        }
    });
}

// ======================================================
//              FOCUS EXPENSE CODE
// ======================================================
// Focuses and selects the expense code input field.
function focusExpenseCode() {
    if (expenseCode) {
        expenseCode.focus();
        expenseCode.select();
    }
}

// ======================================================
//              UNIT PRICE VALIDATION
// ======================================================
// Validates and formats the unit price input.
// Ensures only valid numeric input with up to 7 digits before the decimal
// and up to 2 digits after the decimal.
// Displays a message indicating the valid input range.
function validateUnitPrice(event) {

    let value = this.value.replace(/,/g, "");

    value = value.replace(/[０-９]/g, function (ch) {
        return String.fromCharCode(
            ch.charCodeAt(0) - 0xFEE0
        );
    });

    value = value.replace(/[^0-9.]/g, "");

    const parts = value.split(".");
    //Only one decimal point allowed
    if (parts.length > 2) {
        value = parts[0] + "." + parts[1];
    }

    const updatedParts = value.split(".");
    //Maximum 7 digits before decimal
    if (updatedParts[0].length > 7) {
        this.value = lastValidUnitPrice;
        requestAnimationFrame(() => {
            const decimalPos =
                this.value.length - 3;

            this.setSelectionRange(
                decimalPos,
                decimalPos
            );
        });
        return;
    }

    //Maximum 2 digits after decimal
    if (updatedParts.length > 1) {
        updatedParts[1] = updatedParts[1].substring(0, 2);
    }

    value = updatedParts.join(".");

    if (value === "") {
        this.value = "";
        lastValidUnitPrice = "";
        return;
    }

    let number = parseFloat(value);

    if (isNaN(number)) {
        this.value = "";
        return;
    }

    if (number > 9999999.99) {
        this.value = lastValidUnitPrice;
        requestAnimationFrame(() => {
            const decimalPos =
                this.value.length - 3;

            this.setSelectionRange(
                decimalPos,
                decimalPos
            );
        });
        return;
    }

    const formattedValue = formatCurrency(number);
    this.value = formattedValue;
    lastValidUnitPrice = formattedValue;
    requestAnimationFrame(() => {
        const decimalPos =
            this.value.length - 3;

        this.setSelectionRange(
            decimalPos,
            decimalPos
        );
    });
}
// ======================================================
//              UNIT PRICE FORMATTER
// ======================================================
//
// Formats entered amount.
//
// Example:
//
// 1000
// =>
// 1,000.00

function formatCurrency(value) {
    return Number(value).toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
}

//======================================================
//          UNIT PRICE MESSAGE DISPLAY
//======================================================
// Displays a message indicating the valid input range for unit price.
// Example:
// Input range [ 0.00～9,999,999.99 ]
function showUnitPriceMessage() {
    const minValue = formatCurrency(0);
    const maxValue = formatCurrency(9999999.99);
    setMessage(`入力可能範囲[ ${minValue}～${maxValue} ]`);
}

//======================================================
//              MESSAGE DISPLAY
//======================================================
// Sets the message text in the message label element.
function setMessage(message) {
    document.getElementById("message-label").textContent = message;
}

// ======================================================
//              CATEGORY LOOKUP
// ======================================================
// Looks up category name based on entered code.
//
// Calls: ExpenseMasterController.CategoryLookup()
//
// Updates the category dropdown with the retrieved name.
// If the code is invalid, alerts the user and clears the code and dropdown.
//
//Example:
// 01 -> "交通費"

async function lookupCategory() {

    const code = categoryCode.value.trim();

    if (!code) {
        categoryDropdown.value = "";
        categoryCode.dataset.previousValidCode = "";
        categoryCode.dataset.previousValidCategory = "";
        return true;
    }

    const response = await fetch(`/ExpenseMaster/CategoryLookup?code=${encodeURIComponent(code)}`);

    const result = await response.json();
    if (!response.ok) {
        alert(result.message);
        // Restore the previous valid category code.
        categoryCode.value = categoryCode.dataset.previousValidCode ?? "";
        // Restore the previous category name.
        categoryDropdown.value = categoryCode.dataset.previousValidCategory ?? "";
        categoryCode.focus();
        categoryCode.select();
        //categoryDropdown.value = "";
        //categoryCode.value = "";
        return false;
    }
    categoryDropdown.value = code;

    // Update the saved values because this category is now valid.
    categoryCode.dataset.previousValidCode = code;
    categoryCode.dataset.previousValidCategory = code;
    hasChanges = true;
    return true;
}

// ======================================================
//              F1 - REGISTER BUTTON
// ======================================================
// Saves the current expense.
//
// New Record
// => INSERT
//
// Existing Record
// => UPDATE
//
// Calls:
// ExpenseMasterController.Save()
async function saveExpense() {

    const model = {
        経費コード: expenseCode.value,
        名称: expenseName.value,
        経費区分コード: categoryCode.value,
        単価: unitPrice.value.trim() === "" ? "0" : parseFloat(unitPrice.value.replace(/,/g, "")),
        デジタココード: digitaco.value
    };

    const response = await fetch(
        "/ExpenseMaster/Save",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(model)
        }
    );

    const result = await response.json();
    if (!response.ok) {
        alert(result.message);
        if (result.message.includes("経費コード")) {
            /*await getNextCode();*/
            focusExpenseCode();
        }
        else if (result.message.includes("経費名")) {
            expenseName.focus();
        }
        return;
    }
    hasChanges = false;
    location.reload();
}

// ======================================================
//      GET DATA BY CODE/GRID ROW DOUBLE CLICK
// ======================================================
// Loads selected expense record
// into screen fields.
//
// Calls:
// ExpenseMasterController.GetByCode()
async function getByCode(event, code) {
    const response = await fetch(
        `/ExpenseMaster/GetByCode?code=${encodeURIComponent(code)}`
    );

    if (!response.ok) {

        alert("データが見つかりません。");
        location.reload();
        return;
    }

    const data = await response.json();

    // Fill input fields
    expenseCode.value = data.経費コード;

    expenseName.value = data.名称;

    categoryCode.value = data.経費区分コード;

    if (data.単価 === null || data.単価 === undefined || data.単価 === 0) {
        unitPrice.value = "";
    }
    else {
        unitPrice.value = formatCurrency(data.単価);
    }

    lastValidUnitPrice = unitPrice.value;

    digitaco.value = data.デジタココード;

    const catgryCode = data.経費区分コード;

    categoryCode.value = catgryCode;

    categoryDropdown.value = catgryCode;

    // Lock the expense code after loading an existing record
    expenseCode.readOnly = true;
    expenseCode.classList.add("existing-code");

    if (event.type === "dblclick" || (event.type === "keydown" && event.key === "Enter" || event.key === "mousedown")) {
        expenseName.focus();
        expenseName.setSelectionRange(0, expenseName.value.length);
    }

    isEditMode = true;
    setEditMode();
    hasChanges = false;
    isCommitted = false;
}

// ======================================================
//              SCREEN MODE MANAGEMENT
// ======================================================
//
// New Mode
// mode label = 新規
//
// Edit Mode
// mode label = 修正
function setEditMode() {
    const modeLabel = document.getElementById("mode-lbl");
    modeLabel.textContent = isEditMode
        ? "修　正"
        : "新　規";

    // Disable F4 Delete button
    document.getElementById("btnDelete").disabled = !isEditMode;
    // Disable F2 Copy Button
    document.getElementById("btnCopy").disabled = !isEditMode;

    // Active first tab
    if (isEditMode) {
        activeFirstTab();
    }

}

// ======================================================
//               CLEAR SCREEN FIELDS
// ======================================================
//
// Clears:
//
// Expense Name
// Category Code
// Category Name
// Unit Price
// Digitaco Code
//
// Changes screen mode back to 新規
function clearExpenseFields() {

    // Clear 経費名
    if (expenseName) {
        expenseName.value = "";
    }

    // Clear 経費区分コード
    if (categoryCode) {
        categoryCode.value = "";
    }

    // Reset 経費区分
    if (categoryDropdown) {
        categoryDropdown.selectedIndex = 0;
    }

    // Clear 単価
    if (unitPrice) {
        unitPrice.value = "";
    }

    // Clear デジタコオプション設定
    if (digitaco) {
        digitaco.value = "";
    }

};


// ======================================================
//              GET NEXT EXPENSE CODE
// ======================================================
//
// Requests the next available
// expense code from server.
//
// Calls:
// ExpenseMasterController.NextCode()
//
// Example:
// 0024 -> 0025
async function getNextCode() {

    const response = await fetch(
        "/ExpenseMaster/NextCode"
    );

    if (!response.ok) {
        alert("次の経費コードを取得できません。");
        return;
    }

    const data = await response.json();

    expenseCode.value = data.code;
}

// ======================================================
//              F11 - CANCEL BUTTON
// ======================================================
//
// Warns if unsaved changes exist.
//
// Clears screen.
//
// Generates next expense code.
//
// Returns screen to New mode.
//
// Disables:
//
// F4 Delete
// F2 Copy/*CANCEL*/
async function cancelExpense() {

    if (hasChanges) {

        if (!confirm(
            "内容が変更されております。よろしいですか？")) {
            if (lastFocusedFieldBeforeBtnAction) {
                lastFocusedFieldBeforeBtnAction.focus();
            }
            return;
        }
    }

    // Clear all fields except the code
    clearExpenseFields();

    // Unlock the expense code
    expenseCode.readOnly = false;
    expenseCode.classList.remove("existing-code");

    // Get a new/default code
    await getNextCode();

    // Return to new mode
    isEditMode = false;
    isCopyMode = false;
    setEditMode();
    hasChanges = false;
    location.reload();

}

// ======================================================
//              F4 - DELETE BUTTON
// ======================================================
//
// Deletes the currently selected expense.
//
// Calls:
// ExpenseMasterController.Delete()
//
// Steps:
// 1. Confirm delete
// 2. Delete from DB
// 3. Reload screen
async function deleteExpense() {

    const code = expenseCode.value;

    const checkResponse = await fetch(`/ExpenseMaster/DeleteCheck?code=${code}`);

    const checkResult = await checkResponse.json();

    if (!checkResponse.ok) {
        alert(checkResult.message);

        expenseName.focus();
        expenseName.select();
        return;
    }

    if (!confirm("削除してもよいですか？")) {
        expenseName.focus();
        expenseName.select();
        return;
    }

    const response = await fetch(
        `/ExpenseMaster/Delete?code=${code}`,
        {
            method: "POST"
        });

    const result = await response.json();
    if (!response.ok) {
        alert(result.message);
        expenseName.focus();
        expenseName.select();
        return;
    }

    location.reload();
}

// ======================================================
//          F2 - COPY BUTTON FUNCTIONALITY
// ======================================================
//
// Creates a copy of selected record.
async function copyExpense() {
    restoreUncommittedValues();
    const response = await fetch("/ExpenseMaster/NextCode");
    const result = await response.json();

    if (!result.code) {
        expenseCode.value = "";

        expenseCode.readOnly = false;
        expenseCode.classList.remove("existing-code");

        isEditMode = false;
        isCopyMode = true;

        setEditMode();

        focusExpenseCode();

        return;
    }

    // Replace with next available code
    expenseCode.value = result.code;

    expenseCode.dataset.lastValidCode = result.code;

    focusExpenseCode();

    expenseCode.readOnly = false;
    expenseCode.classList.remove("existing-code");

    // Switch to New mode
    isEditMode = false;
    setEditMode();

    // Optional flag
    isCopyMode = true;
    hasChanges = false;

}

// ======================================================
//              EXPENSE CODE PROCESSING
// ======================================================
//
// Triggered when user presses Enter
// in Expense Code field.
async function processExpenseCode(event) {

    if (!expenseCode || isProcessingExpenseCode) {
        return;
    }

    isProcessingExpenseCode = true;

    try {
        const code = zeroPad(expenseCode.value.trim(), 4);
        expenseCode.value = code;

        //If empty, retrive the next code
        if (code === "") {
            /*await getNextCode();
            return;*/
            expenseCode.value = expenseCode.dataset.oldValue || "";
            expenseCode.focus();
            expenseCode.select();

            return;
        }

        // Check whether the code exists
        const exists = await checkExpenseCode(code);

        if (isCopyMode) {
            if (exists) {
                alert(`指定したコード『${code}』は存在します！！`);

                expenseCode.value = expenseCode.dataset.lastValidCode || "";

                return;

            }
            expenseCode.dataset.lastValidCode = expenseCode.value;

            expenseName.focus();

            return;
        }
        if (exists) {
            await getByCode(event, code);

            // Lock the code field
            expenseCode.readOnly = true;
            expenseCode.classList.add("existing-code");

            //Edit mode
            isEditMode = true;
            setEditMode();
        }
        // Code does not exist.
        // Keep the user's zero-padded code instead of
        // restoring the previously generated code.
        expenseCode.value = code;
        clearExpenseFields();
        expenseName.focus();
    }
    finally {
        // Always reset the processing flag
        isProcessingExpenseCode = false;
    }
}


// ======================================================
//          EXPENSE CODE EXISTENCE CHECK
// ======================================================
//
// Checks whether entered
// expense code already exists.
//
// Calls:
// ExpenseMasterController.Exists()
//
// Returns:
// true -> code exists
// false -> code does not exist
async function checkExpenseCode(code) {

    const response = await fetch(
        `/ExpenseMaster/Exists?code=${encodeURIComponent(code)}`
    );

    if (!response.ok) {
        alert("経費コードの確認に失敗しました。");
        return false;
    }

    const data = await response.json();

    return data.exists;
}

// ====================================================
//       RESTOREUNCOMMITTEDVALUES PER INPUT CONTROL
// ====================================================
function restoreUncommittedValues() {
    if (editingControl &&
        editingControl.dataset.oldValue !== undefined) {
        editingControl.value =
            editingControl.dataset.oldValue;
    }
}

// ====================================================
//       EXPENSE NAME BYTE LENGTH VALIDATION
// ====================================================
function validateByteLength(maxBytes) {

    return function () {
        let value = this.value;
        let byteCount = 0;
        let result = "";

        for (const ch of value) {
            const bytes =
                (c <= 0x7E ||
                    (c >= 0xFF61 && c <= 0xFF9F))
                    ? 1
                    : 2;

            if (byteCount + bytes > maxBytes) {
                break;
            }

            byteCount += bytes;
            result += ch;
        }

        this.value = result;
    };
}

//=============================================
//  ACTIVE FIRST TAB IN EDIT MODE
//=============================================
function activeFirstTab() {
    document
        .querySelectorAll(".tab-button")
        .forEach(tab =>
            tab.classList.remove("active"));

    document
        .querySelectorAll(".tab-content")
        .forEach(content =>
            content.classList.remove("active"));

    document
        .querySelector(
            '.tab-button[data-tab="basicSetting"]'
        )
        ?.classList.add("active");

    document
        .getElementById("basicSetting")
        ?.classList.add("active");
}