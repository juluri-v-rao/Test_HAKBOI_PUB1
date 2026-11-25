
document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("expenseSearchPopup");
    const win = document.getElementById("expenseSearchWindow");

    if (!popup || !win) return;

    const expenseNameInput = document.getElementById("searchExpenseName");
    const categoryCodeInput = document.getElementById("searchExpenseCategoryCode");
    const categorySelect = document.getElementById("searchExpenseCategory");
    const resultsBody = document.getElementById("expenseSearchResults");
    const resultCount = document.getElementById("expenseSearchCount");
    const message = document.getElementById("expenseSearchMessage");

    const btnSearch = document.getElementById("btnExpenseSearchExecute");
    const btnSelect = document.getElementById("btnExpenseSearchSelect");
    const btnCancel = document.getElementById("btnExpenseSearchCancel");
    const btnExit = document.getElementById("btnExpenseSearchExit");
    const btnClose = document.getElementById("btnExpenseSearchClose");
    const btnMinimize = document.getElementById("btnExpenseSearchMinimize");
    const btnMaximize = document.getElementById("btnExpenseSearchMaximize");

    let allExpenses = [];
    let displayedExpenses = [];
    let selectedExpense = null;
    let isLoading = false;
    let isMinimized = false;
    let isMaximized = false;

    const sortDirections = {};

    // Display a message.
    function setMessage(text) {
        message.textContent = text;
    }

    // =========================================
    //Search Popup - Drag Window
    // =========================================

    function initializeexpenseNameSearchDrag() {

        const popup = document.getElementById("expenseSearchWindow");
        const titlebar = popup?.querySelector(
            ".expense-search-titlebar"
        );

        if (!popup || !titlebar) return;

        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        titlebar.addEventListener("mousedown", function (event) {

            // Do not drag when clicking window control buttons.
            if (event.target.closest("button")) return;

            isDragging = true;

            const rect = popup.getBoundingClientRect();

            offsetX = event.clientX - rect.left;
            offsetY = event.clientY - rect.top;

            popup.style.position = "fixed";
            popup.style.margin = "0";
            popup.style.transform = "none";

            event.preventDefault();
        });

        document.addEventListener("mousemove", function (event) {

            if (!isDragging) return;

            popup.style.left = (event.clientX - offsetX) + "px";
            popup.style.top = (event.clientY - offsetY) + "px";

        });

        document.addEventListener("mouseup", function () {
            isDragging = false;
        });
    }

    initializeexpenseNameSearchDrag();

    // Format unit price for display.
    function formatPrice(value) {
        if (value === null || value === undefined || value === "") {
            return "";
        }

        const number = Number(value);

        return Number.isFinite(number)
            ? number.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
            : String(value);
    }

    // Load all expense records from the server.
    async function loadExpenses() {
        if (isLoading) return;

        isLoading = true;
        setMessage("検索中...");

        try {
            const response = await fetch(win.dataset.searchUrl, {
                method: "GET",
                headers: { Accept: "application/json" }
            });

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(
                    data.message || "経費検索に失敗しました。"
                );
            }

            const items = Array.isArray(data)
                ? data
                : (data.items ?? data.results ?? []);

            allExpenses = items.map(item => ({
                expenseCode: String(item.expenseCode ?? ""),
                expenseName: String(item.expenseName ?? ""),
                expenseCategory: String(item.expenseCategory ?? ""),
                unitPrice: item.unitPrice
            }));

            populateCategoryDropdown();
            filterExpenses();
        } catch (error) {
            console.error("Expense Search Error:", error);

            allExpenses = [];
            displayedExpenses = [];
            renderResults([]);

            setMessage("経費検索に失敗しました。");
        } finally {
            isLoading = false;
        }
    }

    // Populate the category dropdown with unique category names.
    function populateCategoryDropdown() {
        const previousValue = categorySelect.value;

        const categories = [
            ...new Set(
                allExpenses
                    .map(item => item.expenseCategory.trim())
                    .filter(Boolean)
            )
        ].sort((a, b) => a.localeCompare(b, "ja"));

        categorySelect.replaceChildren();

        const allOption = document.createElement("option");
        allOption.value = "";
        allOption.textContent = "すべて";
        categorySelect.appendChild(allOption);

        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });

        if (categories.includes(previousValue)) {
            categorySelect.value = previousValue;
        }
    }

    // Open the popup and load the expense list.
    async function openPopup() {
        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");

        await loadExpenses();
    }

    // Select a result row.
    function selectRow(row, expense) {
        resultsBody.querySelectorAll("tr").forEach(item => {
            item.classList.remove("is-selected");
        });

        row.classList.add("is-selected");
        selectedExpense = expense;
        setMessage("メッセージ：");
    }

    // Render expense results.
    function renderResults(items) {
        selectedExpense = null;
        resultsBody.replaceChildren();

        resultCount.textContent = `件数:${items.length}`;

        items.forEach(expense => {
            const row = document.createElement("tr");

            const values = [
                expense.expenseCode,
                expense.expenseName,
                expense.expenseCategory,
                formatPrice(expense.unitPrice)
            ];

            values.forEach((value, index) => {
                const cell = document.createElement("td");
                cell.textContent = String(value);

                if (index === 3) {
                    cell.style.textAlign = "right";
                }

                row.appendChild(cell);
            });

            row.tabIndex = 0;

            row.addEventListener("click", function () {
                selectRow(row, expense);
            });

            row.addEventListener("dblclick", function () {
                selectRow(row, expense);
                applySelectedExpense();
            });

            row.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    selectRow(row, expense);
                    applySelectedExpense();
                }
            });

            resultsBody.appendChild(row);
        });

        // Select the first result by default.
        const firstRow = resultsBody.querySelector("tr");

        if (firstRow && items.length > 0) {
            selectRow(firstRow, items[0]);
        }
    }

    // Filter expenses using the entered name and selected category.
    function filterExpenses() {
        const name = expenseNameInput.value.trim().toLowerCase();
        const category = categorySelect.value;

        displayedExpenses = allExpenses.filter(expense => {
            const matchesName =
                !name || expense.expenseName.toLowerCase().includes(name);

            const matchesCategory =
                !category || expense.expenseCategory === category;

            return matchesName && matchesCategory;
        });

        renderResults(displayedExpenses);

        setMessage(
            displayedExpenses.length === 0
                ? "対象データがありません。"
                : "メッセージ："
        );
    }

    // Apply the selected expense and notify the calling screen.
    function applySelectedExpense() {
        if (!selectedExpense) {
            setMessage("経費を選択してください。");
            return;
        }

        document.dispatchEvent(
            new CustomEvent("expense-search-selected", {
                detail: {
                    expenseCode: selectedExpense.expenseCode,
                    expenseName: selectedExpense.expenseName,
                    expenseCategory: selectedExpense.expenseCategory,
                    unitPrice: selectedExpense.unitPrice
                }
            })
        );

        closePopup();
    }

    // Clear search conditions and show all expenses again.
    function cancelSearch() {
        expenseNameInput.value = "";
        categoryCodeInput.value = "";
        categorySelect.value = "";

        filterExpenses();
    }

    // Close the popup and restore its original dimensions.
    function closePopup() {
        popup.classList.remove("is-open");
        popup.setAttribute("aria-hidden", "true");

        win.classList.remove("is-minimized", "is-maximized");
        win.style.width = "";
        win.style.height = "";

        isMinimized = false;
        isMaximized = false;
        selectedExpense = null;

        document.dispatchEvent(
            new CustomEvent("expense-search-closed")
        );
    }

    // Minimize or restore the popup.
    function minimizePopup() {
        if (!isMinimized) {
            win.classList.remove("is-maximized");
            win.classList.add("is-minimized");
            win.style.width = "";
            win.style.height = "100px";

            isMinimized = true;
            isMaximized = false;
        } else {
            win.classList.remove("is-minimized");
            win.style.height = "";
            isMinimized = false;
        }
    }

    // Maximize or restore the popup.
    function maximizePopup() {
        if (!isMaximized) {
            win.classList.remove("is-minimized");
            win.classList.add("is-maximized");
            win.style.width = "100%";
            win.style.height = "100%";

            isMaximized = true;
            isMinimized = false;
        } else {
            win.classList.remove("is-maximized");
            win.style.width = "";
            win.style.height = "";
            isMaximized = false;
        }
    }

    // Register button events.
    btnSearch.addEventListener("click", filterExpenses);
    btnSelect.addEventListener("click", applySelectedExpense);
    btnCancel.addEventListener("click", cancelSearch);

    btnExit.addEventListener("click", closePopup);
    btnClose.addEventListener("click", closePopup);
    btnMinimize.addEventListener("click", minimizePopup);
    btnMaximize.addEventListener("click", maximizePopup);

    // Open the popup from the calling screen.
    document.addEventListener("openExpenseSearchPopup", openPopup);

    // Search when Enter is pressed in the expense name field.
    expenseNameInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            filterExpenses();
        }
    });

    // Filter when the category changes.
    categorySelect.addEventListener("change", filterExpenses);

    // Handle function keys while the popup is open.
    //document.addEventListener("keydown", function (event) {
    //    if (!popup.classList.contains("is-open")) return;

    //    if (event.key === "F1") {
    //        event.preventDefault();
    //        applySelectedExpense();
    //    } else if (event.key === "F5") {
    //        event.preventDefault();
    //        filterExpenses();
    //    } else if (event.key === "F11") {
    //        event.preventDefault();
    //        cancelSearch();
    //    } else if (event.key === "F12" || event.key === "Escape") {
    //        event.preventDefault();
    //        closePopup();
    //    }
    //});

    // Sort results by clicking a column heading.
    popup.querySelectorAll(
        ".expense-search-table th[data-sort]"
    ).forEach(header => {
        header.addEventListener("click", function () {
            const columnIndex = Array.from(
                header.parentElement.children
            ).indexOf(header);

            const column = header.dataset.sort;

            if (columnIndex < 0 || displayedExpenses.length === 0) {
                return;
            }

            const direction =
                sortDirections[column] === "asc" ? "desc" : "asc";

            sortDirections[column] = direction;

            displayedExpenses.sort((a, b) => {
                let left;
                let right;

                if (column === "unitPrice") {
                    left = Number(a.unitPrice ?? 0);
                    right = Number(b.unitPrice ?? 0);
                    return direction === "asc"
                        ? left - right
                        : right - left;
                }

                left = String(a[column] ?? "");
                right = String(b[column] ?? "");

                const comparison = left.localeCompare(
                    right,
                    "ja",
                    { numeric: true, sensitivity: "base" }
                );

                return direction === "asc" ? comparison : -comparison;
            });

            renderResults(displayedExpenses);
        });
    });
});
