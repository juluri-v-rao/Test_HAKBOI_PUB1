
document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById(
        "transportationRecordSearchPopup"
    );

    const win = document.getElementById(
        "transportationRecordSearchWindow"
    );

    if (!popup || !win) return;


    // Hide all disabled function-key buttons.
    popup.querySelectorAll(".transportation-record-search-footer button:disabled")
        .forEach(button => {
            button.hidden = true;
        });

    const recordName = document.getElementById(
        "searchTransportationRecordNameinput"
    );

    // Limit the search name to 16 bytes (Shift-JIS).
    recordName.addEventListener("input", function () {
        this.value = limitBytes(this.value, 16);
    });

    function limitBytes(value, maxBytes) {
        let result = "";
        let totalBytes = 0;

        for (const char of value) {
            // ASCII and half-width katakana count as 1 byte.
            // Other characters count as 2 bytes.
            const code = char.codePointAt(0);

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
    const resultsBody = document.getElementById(
        "transportationRecordSearchResults"
    );

    const resultCount = document.getElementById(
        "transportationRecordSearchCount"
    );

    const message = document.getElementById(
        "transportationRecordSearchMessage"
    );

    const btnSearch = document.getElementById(
        "btnTransportationRecordSearchExecute"
    );

    const btnSelect = document.getElementById(
        "btnTransportationRecordSearchSelect"
    );

    const btnCancel = document.getElementById(
        "btnTransportationRecordSearchCancel"
    );

    const btnExit = document.getElementById(
        "btnTransportationRecordSearchExit"
    );

    const btnMinimize = document.getElementById(
        "btnTransportationRecordSearchMinimize"
    );

    const btnMaximize = document.getElementById(
        "btnTransportationRecordSearchMaximize"
    );

    const btnClose = document.getElementById(
        "btnTransportationRecordSearchClose"
    );

    let selectedRecord = null;
    let isMinimized = false;
    let isMaximized = false;
    let isLoading = false;

    let transportationPopupSource = null;

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

    function initializetransportationNameSearchDrag() {

        const popup = document.getElementById("transportationRecordSearchWindow");
        const titlebar = popup?.querySelector(
            ".transportation-record-search-titlebar"
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

    initializetransportationNameSearchDrag();

    // Open the popup without automatically fetching records.
    function openPopup() {
        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");

        clearFields();
        renderResults([]);
        setMessage("");

        sortColumn = null;
        sortAsc = true;

        recordName.focus();
    }

    // Close the popup, clear the grid, and restore its dimensions.
    function closePopup() {
        renderResults([]);
        clearFields();
        setMessage("");

        popup.classList.remove("is-open");
        popup.setAttribute("aria-hidden", "true");

        win.classList.remove("is-minimized", "is-maximized");
        win.style.width = "";
        win.style.height = "";

        isMinimized = false;
        isMaximized = false;
        selectedRecord = null;

        document.dispatchEvent(
            new CustomEvent("transportation-record-search-closed", {
                detail: {
                    source: transportationPopupSource
                }
            })
        );

        transportationPopupSource = null;
    }

    // Clear the search condition.
    function clearFields() {
        recordName.value = "";
    }

    // Select a result row.
    function selectRow(row, record) {
        resultsBody.querySelectorAll("tr").forEach(item => {
            item.classList.remove("is-selected");
        });

        row.classList.add("is-selected");
        selectedRecord = record;
        setMessage("");
    }

    // Render search results.
    function renderResults(items) {
        selectedRecord = null;
        resultsBody.replaceChildren();

        resultCount.textContent = items.length
            ? `件数：${items.length.toLocaleString("en-US")}`
            : "件数:0";

        items.forEach(record => {
            const row = document.createElement("tr");

            const values = [
                record.code ?? "",
                record.transportationRecordName ?? ""
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = String(value);
                row.appendChild(cell);
            });

            row.tabIndex = 0;

            // Select a record when the row is clicked.
            row.addEventListener("click", function () {
                selectRow(row, record);
            });

            // Select a record when the row is double-clicked.
            row.addEventListener("dblclick", function () {
                selectRow(row, record);
                applySelectedRecord();
            });

            // Select a record by pressing Enter on the row.
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
                    selectRow(row, record);
                    applySelectedRecord();
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

    // Execute the search when F5:検索 is clicked.
    async function executeSearch() {
        if (isLoading) return;

        isLoading = true;
        setMessage("検索中！！　暫くお待ち下さい");

        const params = new URLSearchParams();

        //const recordName = document.getElementById(
        //    "searchTransportationRecordNameinput"
        //);

        //console.log("Input element:", recordName);
        //console.log("Input value:", recordName?.value);
        //console.log("Read only:", recordName?.readOnly);
        //console.log("Disabled:", recordName?.disabled);

        //console.log(
        //    "Elements with same ID:",
        //    document.querySelectorAll("#searchTransportationRecordNameinput").length
        //);

        //recordName.value = "鉄鋼";

        if (recordName.value.trim()) {
            params.set(
                "transportationRecordName",
                recordName.value.trim()
            );
        }

        try {
            // Get the search URL.
            const query = params.toString();
            const searchUrl = win.dataset.searchUrl;

            // Validate the search URL.
            if (!searchUrl) {
                throw new Error(
                    "検索URLが設定されていません。data-search-urlを確認してください。"
                );
            }

            // Build the request URL.
            const url = query
                ? `${searchUrl}?${query}`
                : searchUrl; 

            

            // Send the search request.
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Accept: "application/json"
                }
            });

            // Check the HTTP response.
            if (!response.ok) {
                throw new Error("輸送実績区分検索に失敗しました。");
            }
            // Read the JSON response.
            const data = await response.json(); 

            // Check the application response.
            if (data.success === false) {
                throw new Error(
                    data.message || "輸送実績区分検索に失敗しました。"
                );
            }

            // Extract the search results.
            const items = Array.isArray(data)
                ? data
                : (
                    data.items ??
                    data.results ??
                    data.data ??
                    []
                );

            if (!Array.isArray(items)) {
                throw new Error(
                    "検索結果のデータ形式が正しくありません。"
                );
            }

            // Display the search results.
            renderResults(items);

            if (items.length === 0) {
                alert("対象データがありません");
                setMessage("");
                recordName.focus();
            } else {
                setMessage("");
            }

        } catch (error) {
            console.error(
                "Transportation Record Search Error:",
                error
            );

            renderResults([]);
            setMessage("輸送実績区分検索に失敗しました。");

        } finally {
            isLoading = false;
        }
    }

    // Apply the selected record and notify only the calling screen.
    function applySelectedRecord() {
        if (!selectedRecord) {
            return;
        }

        document.dispatchEvent(
            new CustomEvent("transportation-record-search-selected", {
                detail: {
                    source: transportationPopupSource,
                    code: selectedRecord.code,
                    transportationRecordName:
                        selectedRecord.transportationRecordName
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
        recordName.focus();
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
    btnSelect.addEventListener("click", applySelectedRecord);
    btnCancel.addEventListener("click", cancelSearch);

    btnExit.addEventListener("click", closePopup);
    btnClose.addEventListener("click", closePopup);
    btnMinimize.addEventListener("click", minimizePopup);
    btnMaximize.addEventListener("click", maximizePopup);

    // Open the popup from the calling screen. 
    document.addEventListener(
        "openTransportationRecordSearchPopup",
        function (event) {
            transportationPopupSource =
                event.detail?.source || null; 
            openPopup();
        }
    );

    //// Search when Enter is pressed in the search field.
    //recordName.addEventListener("keydown", function (event) {
    //    if (event.key === "Enter") {
    //        event.preventDefault();
    //        executeSearch();
    //    }
    //});

    //// Handle function keys while the popup is open.
    //document.addEventListener("keydown", function (event) {
    //    if (!popup.classList.contains("is-open")) return;

    //    if (event.key === "F1") {
    //        event.preventDefault();
    //        applySelectedRecord();
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
    popup.querySelectorAll(
        ".transportation-record-search-table th[data-sort]"
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

            // Preserve the selected record after sorting.
            const selectedRow = resultsBody.querySelector(".is-selected");

            if (selectedRow) {
                const code = selectedRow.children[0].textContent;
                selectedRecord = itemsForSelection(code);
            }
        });
    });

    // Find the selected record by its code in the current result rows.
    function itemsForSelection(code) {
        const selectedRow = Array.from(
            resultsBody.querySelectorAll("tr")
        ).find(row => row.children[0].textContent === code);

        if (!selectedRow) return null;

        return {
            code: selectedRow.children[0].textContent,
            transportationRecordName:
                selectedRow.children[1].textContent
        };
    }

    // for dummy master registration , need to remove once master screen done

    document.getElementById("btnTransportationRecordSearchRegister")
        ?.addEventListener("click", function () {
            window.parent.postMessage(
                { action: "openDummyMasterRegistration" },
                window.location.origin
            );
        });
});
