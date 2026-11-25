
document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("areaSearchPopup");
    const win = document.getElementById("areaSearchWindow");

    if (!popup || !win) return;

    // Hide all disabled function-key buttons.
    popup.querySelectorAll(".area-search-footer button:disabled")
        .forEach(button => {
            button.hidden = true;
        });

    const areaName = document.getElementById("searchAreaName");

    // Limit the area name to 16 bytes (Shift-JIS).
    areaName.addEventListener("input", function () {
        this.value = limitBytes(this.value, 16);
    });

    function limitBytes(value, maxBytes) {
        let result = "";
        let totalBytes = 0;

        for (const char of value) {
            const code = char.codePointAt(0);

            // ASCII and half-width katakana count as 1 byte.
            // Other characters count as 2 bytes.
            const charBytes =
                (code <= 0x7E || (code >= 0xFF61 && code <= 0xFF9F))
                    ? 1
                    : 2;

            if (totalBytes + charBytes > maxBytes) {
                break;
            }

            result += char;
            totalBytes += charBytes;
        }

        return result;
    }

    const resultsBody = document.getElementById("areaSearchResults");
    const resultCount = document.getElementById("areaSearchCount");
    const message = document.getElementById("areaSearchMessage");

    const btnSearch = document.getElementById("btnAreaSearchExecute");
    const btnSelect = document.getElementById("btnAreaSearchSelect");
    const btnCancel = document.getElementById("btnAreaSearchCancel");
    const btnExit = document.getElementById("btnAreaSearchExit");
    const btnMinimize = document.getElementById("btnAreaSearchMinimize");
    const btnMaximize = document.getElementById("btnAreaSearchMaximize");
    const btnClose = document.getElementById("btnAreaSearchClose");

    let selectedArea = null;
    let isMinimized = false;
    let isMaximized = false;

    let areaPopupSource = null;

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

    function initializeAreaNameSearchDrag() {

        const popup = document.getElementById("areaSearchWindow");
        const titlebar = popup?.querySelector(
            ".area-search-titlebar"
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

    initializeAreaNameSearchDrag();

    // Open the Area Search popup.
    function openPopup() {
        clearFields();
        renderResults([]);
        setMessage("");

        sortColumn = null;
        sortAsc = true;

        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");

        areaName.focus();
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
        selectedArea = null;

        document.dispatchEvent(
            new CustomEvent("area-search-closed", {
                detail: {
                    source: areaPopupSource
                }
            })
        );

        areaPopupSource = null;
    }

    // Clear the search condition.
    function clearFields() {
        areaName.value = "";
    }

    // Select a result row.
    function selectRow(row, area) {
        resultsBody.querySelectorAll("tr").forEach(item => {
            item.classList.remove("is-selected");
        });

        row.classList.add("is-selected");
        selectedArea = area;
        setMessage("");
    }

    // Render search results.
    function renderResults(items) {
        selectedArea = null;
        resultsBody.replaceChildren();

        resultCount.textContent = items.length
            ? `件数：${items.length.toLocaleString("en-US")}`
            : "件数:0";

        items.forEach(area => {
            const row = document.createElement("tr");

            const values = [
                area.code ?? "",
                area.areaName ?? ""
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = String(value);
                row.appendChild(cell);
            });

            row.tabIndex = 0;

            // Select an area when the row is clicked.
            row.addEventListener("click", function () {
                selectRow(row, area);
            });

            // Select an area when the row is double-clicked.
            row.addEventListener("dblclick", function () {
                selectRow(row, area);
                applySelectedArea();
            });

            row.addEventListener("keydown", function (event) {

                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();

                    const next = event.key === "ArrowDown"
                        ? row.nextElementSibling
                        : row.previousElementSibling;

                    if (next) {
                        next.focus();
                        next.click();
                    }
                }

                if (event.key === "Enter") {
                    event.preventDefault();
                    selectRow(row, area);
                    applySelectedArea();
                }
            });

            resultsBody.appendChild(row);
        });

        // Select the first result by default.
        const firstRow = resultsBody.querySelector("tr");

        if (firstRow) {
            selectRow(firstRow, items[0]);
            firstRow.focus();
        }
    }

    // Execute the area search.
    async function executeSearch() {
        const searchUrl = win.dataset.searchUrl;
        const params = new URLSearchParams();

        if (areaName.value.trim()) {
            params.set("areaName", areaName.value.trim());
        }

        btnSearch.disabled = true;
        setMessage("検索中！！　暫くお待ち下さい");

        try {
            const query = params.toString();
            const url = query ? `${searchUrl}?${query}` : searchUrl;

            const response = await fetch(url, {
                method: "GET",
                headers: { Accept: "application/json" }
            });

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(
                    data.message || "エリア検索に失敗しました。"
                );
            }

            const items = Array.isArray(data)
                ? data
                : (data.items ?? data.results ?? []);

            renderResults(items);
 
            if (items.length === 0) {
                alert("対象データがありません");

                setMessage("");
                areaName.focus();
            } else {
                setMessage("");
                resultsBody.querySelector("tr")?.focus();
            }
        } catch (error) {
            console.error("Area Search Error:", error);
            renderResults([]);
            setMessage("エリア検索に失敗しました。");
        } finally {
            btnSearch.disabled = false;
        }
    }

    // Apply the selected area and notify the calling screen.
    // Apply the selected area and notify the calling screen.
    function applySelectedArea() {

        if (!selectedArea) {
            return;
        }

        document.dispatchEvent(
            new CustomEvent("area-search-selected", {
                detail: {
                    source: areaPopupSource,
                    code: selectedArea.code,
                    areaName: selectedArea.areaName
                }
            })
        );

        closePopup();
    }

    // Cancel the search and clear the condition.
    function cancelSearch() {
        clearFields();
        renderResults([]);
        setMessage("");
        areaName.focus();
        areaName.select();
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
    btnSearch.addEventListener("click", executeSearch);
    btnSelect.addEventListener("click", applySelectedArea);
    btnCancel.addEventListener("click", cancelSearch);

    btnExit.addEventListener("click", function () {
        clearFields();
        renderResults([]);
        closePopup();
    });

    btnClose.addEventListener("click", closePopup);
    btnMinimize.addEventListener("click", minimizePopup);
    btnMaximize.addEventListener("click", maximizePopup);

    // Open the popup from the calling screen.
    //document.addEventListener("openAreaSearchPopup", openPopup);

    // Open Area Search from the calling screen.
    document.addEventListener(
        "openAreaSearchPopup",
        function (event) {

            areaPopupSource = event.detail?.source || null;

            //console.log(
            //    "Area Search opened from:",
            //    areaPopupSource
            //);

            openPopup();
        }
    );

    // Handle Enter in the area field.
    areaName.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
        }
    });

    // Handle function keys while the popup is open.
    //document.addEventListener("keydown", function (event) {
    //    if (!popup.classList.contains("is-open")) return;

    //    if (event.key === "F1") {
    //        event.preventDefault();
    //        applySelectedArea();
    //    } else if (event.key === "F5") {
    //        event.preventDefault();
    //        executeSearch();
    //    } else if (event.key === "F11") {
    //        event.preventDefault();
    //        cancelSearch();
    //    } else if (event.key === "F12" || event.key === "Escape") {
    //        event.preventDefault();
    //        closePopup();
    //    }
    //});

    // Sort results by clicking a column heading.
    popup.querySelectorAll(".area-search-table th[data-sort]")
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
            });
        });
    // for dummy master registration , need to remove once master screen done

    document.getElementById("btnAreaSearchRegister")
        ?.addEventListener("click", function () {
            window.parent.postMessage(
                { action: "openDummyMasterRegistration" },
                window.location.origin
            );
        });
});
