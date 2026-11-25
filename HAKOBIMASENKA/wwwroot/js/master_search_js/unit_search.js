
document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("unitSearchPopup");
    const win = document.getElementById("unitSearchWindow");

    if (!popup || !win) return;

    // Hide all disabled function-key buttons.
    popup.querySelectorAll(".unit-search-footer button:disabled")
        .forEach(button => {
            button.hidden = true;
        });

    const resultsBody = document.getElementById("unitSearchResults");
    const message = document.getElementById("unitSearchMessage");

    const btnSelect = document.getElementById("btnUnitSearchSelect");
    const btnExit = document.getElementById("btnUnitSearchExit");
    const btnMinimize = document.getElementById("btnUnitSearchMinimize");
    const btnMaximize = document.getElementById("btnUnitSearchMaximize");
    const btnClose = document.getElementById("btnUnitSearchClose");

    let selectedUnit = null;
    let isMinimized = false;
    let isMaximized = false;
    let isLoading = false;

    let sortColumn = null;
    let sortAsc = true;

    // Display a message.
    function setMessage(text) {
        message.textContent = text;
    }

    // =========================================
    //Search Popup - Drag Window
    // =========================================

    function initializeunitNameSearchDrag() {

        const popup = document.getElementById("unitSearchWindow");
        const titlebar = popup?.querySelector(
            ".unit-search-titlebar-model"
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

    initializeunitNameSearchDrag();

    // Open the Unit Search popup and load the unit list.
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
        selectedUnit = null;

        document.dispatchEvent(
            new CustomEvent("unit-search-closed")
        );
    }

    // Select a unit row.
    function selectRow(row, unit) {
        resultsBody.querySelectorAll("tr").forEach(item => {
            item.classList.remove("is-selected");
        });

        row.classList.add("is-selected");
        selectedUnit = unit;
        setMessage("メッセージ：");
    }

    // Render the unit list.
    function renderResults(items) {
        selectedUnit = null;
        resultsBody.replaceChildren();

        items.forEach(unit => {
            const row = document.createElement("tr");

            const values = [
                unit.code ?? "",
                unit.unitName ?? ""
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = String(value);
                row.appendChild(cell);
            });

            row.tabIndex = 0;

            // Select a unit when the row is clicked.
            row.addEventListener("click", function () {
                selectRow(row, unit);
            });

            // Select a unit when the row is double-clicked.
            row.addEventListener("dblclick", function () {
                selectRow(row, unit);
                applySelectedUnit();
            });

            // Select a unit by pressing Enter on the row.
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

                // Select the current row using Enter.
                if (event.key === "Enter") {
                    event.preventDefault();
                    selectRow(row, unit);
                    applySelectedUnit();
                }
            });

            resultsBody.appendChild(row);
        });

        // Select and focus the first unit row.
        const firstRow = resultsBody.querySelector("tr");

        if (firstRow) {
            selectRow(firstRow, items[0]);
            firstRow.focus();
        }
    }

    // Retrieve units from the Unit Master.
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
                    data.message || "単位検索に失敗しました。"
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
            console.error("Unit Search Error:", error);
            renderResults([]);
            setMessage("単位検索に失敗しました。");
        } finally {
            isLoading = false;
        }
    }

    // Apply the selected unit and notify the calling screen.
    function applySelectedUnit() {
        if (!selectedUnit) {
            return;
        }

        document.dispatchEvent(
            new CustomEvent("unit-search-selected", {
                detail: {
                    code: selectedUnit.code,
                    unitName: selectedUnit.unitName
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

    // Store the original window position before maximizing.
    let previousWindowPosition = null;

    // Maximize or restore the popup.
    function maximizePopup() {
        if (!isMaximized) {

            // Save the current dragged position and styles.
            previousWindowPosition = {
                left: win.style.left,
                top: win.style.top,
                position: win.style.position,
                margin: win.style.margin,
                transform: win.style.transform
            };

            win.classList.remove("is-minimized");
            win.classList.add("is-maximized");

            // Reset the window position to the full viewport.
            win.style.position = "fixed";
            win.style.left = "0";
            win.style.top = "0";
            win.style.margin = "0";
            win.style.transform = "none";

            win.style.width = "100%";
            win.style.height = "100%";

            isMaximized = true;
            isMinimized = false;

        } else {

            win.classList.remove("is-maximized");

            win.style.width = "";
            win.style.height = "";

            // Restore the previous window position.
            if (previousWindowPosition) {
                win.style.left = previousWindowPosition.left;
                win.style.top = previousWindowPosition.top;
                win.style.position = previousWindowPosition.position;
                win.style.margin = previousWindowPosition.margin;
                win.style.transform = previousWindowPosition.transform;
            }

            previousWindowPosition = null;
            isMaximized = false;
        }
    }

    // Register button events.
    btnSelect.addEventListener("click", applySelectedUnit);
    btnExit.addEventListener("click", closePopup);
    btnClose.addEventListener("click", closePopup);
    btnMinimize.addEventListener("click", minimizePopup);
    btnMaximize.addEventListener("click", maximizePopup);

    // Open the popup from the calling screen.
    document.addEventListener("openUnitSearchPopup", openPopup);

    // Handle function keys while this popup is open.
    //document.addEventListener("keydown", function (event) {
    //    if (!popup.classList.contains("is-open")) return;

    //    if (event.key === "F1") {
    //        event.preventDefault();
    //        applySelectedUnit();
    //    } else if (event.key === "F12" || event.key === "Escape") {
    //        event.preventDefault();
    //        closePopup();
    //    }
    //});

    // Sort results by clicking a column heading.
    // Sort results by clicking a column heading.
    popup.querySelectorAll(".unit-search-table th[data-sort]")
        .forEach(header => {
            header.addEventListener("click", function () {
                const columnIndex = Array.from(
                    header.parentElement.children
                ).indexOf(header);

                const column = header.dataset.sort;
                const rows = Array.from(
                    resultsBody.querySelectorAll("tr")
                );

                if (columnIndex < 0 || rows.length === 0) return;

                // A new column starts ascending.
                // Clicking the same column toggles its direction.
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

                // Preserve the selected unit after sorting.
                const selectedRow = resultsBody.querySelector(".is-selected");

                if (selectedRow) {
                    selectedUnit = {
                        code: selectedRow.children[0].textContent,
                        unitName: selectedRow.children[1].textContent
                    };
                }
            });
        });
});

document.addEventListener("DOMContentLoaded", function () {
    const unitMasterModal =
        document.getElementById("unitMasterModal");

    const unitMasterWindow =
        document.getElementById("unitMasterWindow");

    const unitMasterFrame =
        document.getElementById("unitMasterFrame");

    const btnOpenUnitMaster =
        document.getElementById("btnUnitSearchRegister");

    const btnMinimize =
        document.getElementById("btnUnitMasterMinimize");

    const btnMaximize =
        document.getElementById("btnUnitMasterMaximize");

    const btnClose =
        document.getElementById("btnUnitMasterClose");

    // Close Unit Master modal and refresh Unit Search list.
    function closeUnitMasterModal() {
        unitMasterModal.style.display = "none";

        unitMasterWindow.classList.remove(
            "is-minimized",
            "is-maximized"
        );

        unitMasterFrame.src = "about:blank";

        // Reload the Unit Search list after Unit Master closes.
        //document.dispatchEvent(
        //    new CustomEvent("openUnitSearchPopup")
        //);
    }

    if (
        !unitMasterModal ||
        !unitMasterWindow ||
        !unitMasterFrame
    ) {
        return;
    }

    window.addEventListener("message", function (event) {
        if (event.origin !== window.location.origin) return;

        if (event.data?.action === "closeUnitMasterModal") {
            closeUnitMasterModal();
        }
    });

    // Open Unit Master registration.
    btnOpenUnitMaster?.addEventListener("click", function () {
        unitMasterFrame.src =
            "/UnitMaster/Unit_Master?popupMode=true";

        unitMasterModal.style.display = "flex";

        unitMasterWindow.classList.remove(
            "is-minimized",
            "is-maximized"
        );
    });
    // Minimize the modal.
    btnMinimize?.addEventListener("click", function () {
        unitMasterWindow.classList.toggle("is-minimized");
        unitMasterWindow.classList.remove("is-maximized");
    });

    // Maximize or restore the modal.
    btnMaximize?.addEventListener("click", function () {
        if (unitMasterWindow.classList.contains("is-maximized")) {
            unitMasterWindow.classList.remove("is-maximized");
        } else {
            unitMasterWindow.classList.remove("is-minimized");
            unitMasterWindow.classList.add("is-maximized");
        }
    });

    // Close the modal.
    btnClose?.addEventListener("click", function () {
        unitMasterModal.style.display = "none";
        unitMasterWindow.classList.remove(
            "is-minimized",
            "is-maximized"
        );

        unitMasterFrame.src = "about:blank";
    });
});
