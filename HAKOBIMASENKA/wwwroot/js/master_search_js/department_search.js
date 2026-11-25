
document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("departmentSearchPopup");
    const win = document.getElementById("departmentSearchWindow");

    if (!popup || !win) return;

    const resultsBody = document.getElementById("departmentSearchResults");
    const message = document.getElementById("departmentSearchMessage");

    const btnSelect = document.getElementById("btnDepartmentSearchSelect");
    const btnExit = document.getElementById("btnDepartmentSearchExit");
    const btnMinimize = document.getElementById("btnDepartmentSearchMinimize");
    const btnMaximize = document.getElementById("btnDepartmentSearchMaximize");
    const btnClose = document.getElementById("btnDepartmentSearchClose");

    let selectedDepartment = null;
    let isMinimized = false;
    let isMaximized = false;
    let isLoading = false;

    const sortDirections = {};

    // Display a message.
    function setMessage(text) {
        message.textContent = text;
    }
    // =========================================
    //Search Popup - Drag Window
    // =========================================

    function initializedepartmentNameSearchDrag() {

        const popup = document.getElementById("departmentSearchWindow");
        const titlebar = popup?.querySelector(
            ".department-search-titlebar"
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

    initializedepartmentNameSearchDrag();

    // Open the popup and load departments.
    async function openPopup() {
        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");

        await executeSearch();
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
        selectedDepartment = null;

        document.dispatchEvent(
            new CustomEvent("department-search-closed")
        );
    }

    // Select a department row.
    function selectRow(row, department) {
        resultsBody.querySelectorAll("tr").forEach(item => {
            item.classList.remove("is-selected");
        });

        row.classList.add("is-selected");
        selectedDepartment = department;
        setMessage("メッセージ：");
    }

    // Render department results.
    function renderResults(items) {
        selectedDepartment = null;
        resultsBody.replaceChildren();

        items.forEach(department => {
            const row = document.createElement("tr");

            [department.code ?? "", department.departmentName ?? ""]
                .forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = String(value);
                    row.appendChild(cell);
                });

            row.tabIndex = 0;

            // Select a department when the row is clicked.
            row.addEventListener("click", function () {
                selectRow(row, department);
            });

            // Select a department when the row is double-clicked.
            row.addEventListener("dblclick", function () {
                selectRow(row, department);
                applySelectedDepartment();
            });

            // Select a department by pressing Enter on the row.
            row.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    selectRow(row, department);
                    applySelectedDepartment();
                }
            });

            resultsBody.appendChild(row);
        });

        // Select the first department by default.
        const firstRow = resultsBody.querySelector("tr");

        if (firstRow) {
            selectRow(firstRow, items[0]);
        }
    }

    // Retrieve departments from the server.
    async function executeSearch() {
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
                    data.message || "部門検索に失敗しました。"
                );
            }

            const items = Array.isArray(data)
                ? data
                : (data.items ?? data.results ?? []);

            renderResults(items);

            setMessage(
                items.length === 0
                    ? "対象データがありません。"
                    : "メッセージ："
            );
        } catch (error) {
            console.error("Department Search Error:", error);
            renderResults([]);
            setMessage("部門検索に失敗しました。");
        } finally {
            isLoading = false;
        }
    }

    // Apply the selected department and notify the calling screen.
    function applySelectedDepartment() {
        if (!selectedDepartment) {
            setMessage("部門を選択してください。");
            return;
        }

        document.dispatchEvent(
            new CustomEvent("department-search-selected", {
                detail: {
                    code: selectedDepartment.code,
                    departmentName: selectedDepartment.departmentName
                }
            })
        );

        closePopup();
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
    btnSelect.addEventListener("click", applySelectedDepartment);
    btnExit.addEventListener("click", closePopup);
    btnClose.addEventListener("click", closePopup);
    btnMinimize.addEventListener("click", minimizePopup);
    btnMaximize.addEventListener("click", maximizePopup);

    // Open the popup from the calling screen.
    document.addEventListener("openDepartmentSearchPopup", openPopup);

    // Handle function keys while the popup is open.
    //document.addEventListener("keydown", function (event) {
    //    if (!popup.classList.contains("is-open")) return;

    //    if (event.key === "F1") {
    //        event.preventDefault();
    //        applySelectedDepartment();
    //    } else if (event.key === "F12" || event.key === "Escape") {
    //        event.preventDefault();
    //        closePopup();
    //    }
    //});

    // Sort results by clicking a column heading.
    popup.querySelectorAll(
        ".department-search-table th[data-sort]"
    ).forEach(header => {
        header.addEventListener("click", function () {
            const columnIndex = Array.from(
                header.parentElement.children
            ).indexOf(header);

            const column = header.dataset.sort;
            const rows = Array.from(
                resultsBody.querySelectorAll("tr")
            );

            if (columnIndex < 0 || rows.length === 0) return;

            const direction =
                sortDirections[column] === "asc" ? "desc" : "asc";

            sortDirections[column] = direction;

            rows.sort((a, b) => {
                const left = a.children[columnIndex].textContent.trim();
                const right = b.children[columnIndex].textContent.trim();

                const comparison = left.localeCompare(
                    right,
                    "ja",
                    { numeric: true, sensitivity: "base" }
                );

                return direction === "asc" ? comparison : -comparison;
            });

            rows.forEach(row => resultsBody.appendChild(row));

            // Preserve the selected department after sorting.
            const selectedRow = resultsBody.querySelector(".is-selected");

            if (selectedRow) {
                selectedDepartment = {
                    code: selectedRow.children[0].textContent,
                    departmentName: selectedRow.children[1].textContent
                };
            }
        });
    });
});
