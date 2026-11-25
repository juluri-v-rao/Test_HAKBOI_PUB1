
document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("companyBranchSearchPopup");
    const win = document.getElementById("companyBranchSearchWindow");

    if (!popup || !win) return;

    // Hide all disabled function-key buttons.
    popup.querySelectorAll(".company-branch-search-footer button:disabled")
        .forEach(button => {
            if (button.id === "btnCompanyBranchSearchF10") return;
            button.hidden = true;
        });
    const resultsBody = document.getElementById("companyBranchSearchResults");
    const message = document.getElementById("companyBranchSearchMessage");

    const btnSelect = document.getElementById("btnCompanyBranchSearchSelect");
    const btnExit = document.getElementById("btnCompanyBranchSearchExit");
    const btnMinimize = document.getElementById("btnCompanyBranchSearchMinimize");
    const btnMaximize = document.getElementById("btnCompanyBranchSearchMaximize");
    const btnClose = document.getElementById("btnCompanyBranchSearchClose");

    let selectedBranch = null;
    let isMinimized = false;
    let isMaximized = false;
    let isLoading = false;

    const sortDirections = {};

    let sortColumn = null;
    let sortAsc = true;

    // Display a message.
    function setMessage(text) {
        message.textContent = text;
    }
    // =========================================
    //Search Popup - Drag Window
    // =========================================

    function initializecompanyNameSearchDrag() {

        const popup = document.getElementById("companyBranchSearchWindow");
        const titlebar = popup?.querySelector(
            ".company-branch-search-titlebar"
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

    initializecompanyNameSearchDrag();

    // Open the popup and load company branches.
    async function openPopup() {
        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");

        sortColumn = null;
        sortAsc = true;

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
        selectedBranch = null;

        document.dispatchEvent(
            new CustomEvent("company-branch-search-closed")
        );
    }

    // Select a branch row.
    function selectRow(row, branch) {
        resultsBody.querySelectorAll("tr").forEach(item => {
            item.classList.remove("is-selected");
        });

        row.classList.add("is-selected");
        selectedBranch = branch;
        setMessage("メッセージ：");
    }

    // Render company branch results.
    function renderResults(items) {
        selectedBranch = null;
        resultsBody.replaceChildren();

        items.forEach(branch => {
            const row = document.createElement("tr");

            [branch.companyCode ?? "", branch.abbreviation ?? ""]
                .forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = String(value);
                    row.appendChild(cell);
                });

            row.tabIndex = 0;

            row.addEventListener("click", function () {
                selectRow(row, branch);
            });

            row.addEventListener("dblclick", function () {
                selectRow(row, branch);
                applySelectedBranch();
            });

            row.addEventListener("keydown", function (event) {

                // Move selection between grid rows.
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();

                    const next = event.key === "ArrowDown"
                        ? row.nextElementSibling
                        : row.previousElementSibling;

                    if (next) {
                        next.focus();
                        next.click();
                    }

                    return;
                }

                // Apply the selected branch using Enter.
                if (event.key === "Enter") {
                    event.preventDefault();
                    selectRow(row, branch);
                    applySelectedBranch();
                }
            });

            resultsBody.appendChild(row);
        });

        // Select and focus the first branch row.
        const firstRow = resultsBody.querySelector("tr");

        if (firstRow && items.length > 0) {
            selectRow(firstRow, items[0]);
            firstRow.focus();
        }
    }

    // Retrieve company branches from the server.
    async function executeSearch() {
        if (isLoading) return;

        isLoading = true;
        setMessage("検索中！！　暫くお待ち下さい");

        try {
            const response = await fetch(win.dataset.searchUrl, {
                method: "GET",
                headers: { Accept: "application/json" }
            });

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(
                    data.message || "自社支店検索に失敗しました。"
                );
            }

            const items = Array.isArray(data)
                ? data
                : (data.items ?? data.results ?? []);

            renderResults(items);

            if (items.length === 0) {
                alert("対象データがありません");
                setMessage("");
            } else {
                setMessage("メッセージ：");
            }
        } catch (error) {
            console.error("Company Branch Search Error:", error);
            renderResults([]);
            setMessage("自社支店検索に失敗しました。");
        } finally {
            isLoading = false;
        }
    }

    // Apply the selected branch and notify the calling screen.
    function applySelectedBranch() {
        if (!selectedBranch) {
            
            return;
        }

        document.dispatchEvent(
            new CustomEvent("company-branch-search-selected", {
                detail: {
                    companyCode: selectedBranch.companyCode,
                    abbreviation: selectedBranch.abbreviation
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
    btnSelect.addEventListener("click", applySelectedBranch);
    btnExit.addEventListener("click", closePopup);
    btnClose.addEventListener("click", closePopup);
    btnMinimize.addEventListener("click", minimizePopup);
    btnMaximize.addEventListener("click", maximizePopup);

    // Open the popup from the calling screen.
    document.addEventListener("openCompanyBranchSearchPopup", openPopup);

    // Handle function keys while the popup is open.
    //document.addEventListener("keydown", function (event) {
    //    if (!popup.classList.contains("is-open")) return;

    //    if (event.key === "F1") {
    //        event.preventDefault();
    //        applySelectedBranch();
    //    } else if (event.key === "F12" || event.key === "Escape") {
    //        event.preventDefault();
    //        closePopup();
    //    }
    //});

    // Sort results by clicking a column heading.
    popup.querySelectorAll(
        ".company-branch-search-table th[data-sort]"
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

            // New column starts ascending.
            // Same column toggles ascending/descending.
            sortAsc = (sortColumn === column) ? !sortAsc : true;
            sortColumn = column;

            const direction = sortAsc ? "asc" : "desc";

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

            // Preserve the selected branch after sorting.
            const selectedRow = resultsBody.querySelector(".is-selected");

            if (selectedRow) {
                selectedBranch = {
                    companyCode: selectedRow.children[0].textContent,
                    abbreviation: selectedRow.children[1].textContent
                };
            }
        });
    });
});
