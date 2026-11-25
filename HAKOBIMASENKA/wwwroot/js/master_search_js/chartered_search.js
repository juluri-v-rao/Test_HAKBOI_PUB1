
document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("charteredSearchPopup");
    const win = document.getElementById("charteredSearchWindow");

    if (!popup || !win) return;

    // Hide all disabled function-key buttons.
    //popup.querySelectorAll(".chartered-search-footer button:disabled")
    //    .forEach(button => {
    //        button.hidden = true;
    //    });

    popup.querySelectorAll(".chartered-search-footer button:disabled")
        .forEach(button => {
            if (
                 
                button.id === "btnCharteredSearchF9"
            ) return;

            button.hidden = true;
        });

    const furigana = document.getElementById("searchCharteredFurigana");
    const abbreviation = document.getElementById("searchCharteredAbbreviation");
    const phoneNumber = document.getElementById("searchCharteredPhone");

    // Legacy field navigation and typed-value restoration.
    const order = [furigana, abbreviation, phoneNumber];

    const keptValues = new Map(
        order.map(input => [input, input.value])
    );

    const resultsBody = document.getElementById("charteredSearchResults");
    const resultCount = document.getElementById("charteredSearchCount");
    const message = document.getElementById("charteredSearchMessage");

    const btnSearch = document.getElementById("btnCharteredSearchExecute");
    const btnSelect = document.getElementById("btnCharteredSearchSelect");
    const btnCancel = document.getElementById("btnCharteredSearchCancel");
    const btnExit = document.getElementById("btnCharteredSearchExit");
    const btnMinimize = document.getElementById("btnCharteredSearchMinimize");
    const btnMaximize = document.getElementById("btnCharteredSearchMaximize");
    const btnClose = document.getElementById("btnCharteredSearchClose");

    let selectedChartered = null;
    let activeOnly = false;     // 取引終了日 IS NULL only (set by the caller on open)
    let isMinimized = false;
    let isMaximized = false;

    //const sortDirections = {};

    let sortColumn = null;
    let sortAsc = true;


    let focusBeforeMaster = null;

    const btnCharteredSearchRegister =
        document.getElementById("btnCharteredSearchRegister");

    // Display a message.
    function setMessage(text) {
        message.textContent = text;
    }

    // =========================================
    // Chartered Search - Half-width Kana Input
    // =========================================

    // Convert full-width characters to half-width.
    function convertToHalfWidth(value) {

        // Hiragana → Katakana.
        const katakana = value.replace(/[\u3041-\u3096]/g, char =>
            String.fromCharCode(char.charCodeAt(0) + 0x60)
        );

        // Build half-width Katakana conversion map.
        const map = new Map();

        for (let code = 0xFF61; code <= 0xFF9F; code++) {
            const half = String.fromCharCode(code);
            map.set(half.normalize("NFKC"), half);
        }

        for (let code = 0xFF61; code <= 0xFF9D; code++) {
            const base = String.fromCharCode(code);

            for (const mark of ["ﾞ", "ﾟ"]) {
                const half = base + mark;
                map.set(half.normalize("NFKC"), half);
            }
        }

        // Normalize full-width ASCII, numbers and punctuation.
        const normalized = katakana.normalize("NFKC");

        // Convert Katakana back to half-width.
        const keys = [...map.keys()].sort((a, b) => b.length - a.length);

        const pattern = new RegExp(
            keys.map(key => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
            "g"
        );

        return normalized.replace(pattern, char => map.get(char));
    }

    furigana.addEventListener("compositionstart", function () {
        this.dataset.composing = "true";
    });

    furigana.addEventListener("compositionend", function () {
        delete this.dataset.composing;

        this.value = limitBytes(
            convertToHalfWidth(this.value),
            32
        );
    });

    furigana.addEventListener("input", function (event) {
        if (event.isComposing || this.dataset.composing === "true") return;

        this.value = limitBytes(
            convertToHalfWidth(this.value),
            32
        );
    });

    // =========================================
    // 電話番号 - Half-width conversion
    // Same behavior as Shipper Search
    // =========================================

    phoneNumber.addEventListener("compositionstart", function () {
        this.dataset.composing = "true";
    });

    phoneNumber.addEventListener("compositionend", function () {
        delete this.dataset.composing;

        this.value = limitBytes(
            convertToHalfWidth(this.value),
            15
        );
    });

    phoneNumber.addEventListener("input", function (event) {
        if (event.isComposing || this.dataset.composing === "true") return;

        this.value = limitBytes(
            convertToHalfWidth(this.value),
            15
        );
    });

    // 名称: 30 bytes.
    abbreviation.addEventListener("input", function () {
        this.value = limitBytes(this.value, 30);
    });

    function limitBytes(value, maxBytes) {
        let result = "";
        let bytes = 0;

        for (const ch of value) {
            const c = ch.codePointAt(0);

            const width =
                (c <= 0x7E || (c >= 0xFF61 && c <= 0xFF9F))
                    ? 1
                    : 2;

            if (bytes + width > maxBytes) break;

            result += ch;
            bytes += width;
        }

        return result;
    }


    // =========================================
    //Search Popup - Drag Window
    // =========================================
     
    function initializecharteredNameSearchDrag() {

        const popup = document.getElementById("charteredSearchWindow");
        const titlebar = popup?.querySelector(
            ".chartered-search-titlebar"
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

    initializecharteredNameSearchDrag();

    // Open the Charter Carrier Search popup.
    function openPopup(event) {
        // 傭車マスタ F6 in 新規: only 傭車 still trading.
        activeOnly = event?.detail?.activeOnly === true;

        const tradeHeader = document.getElementById("charteredSearchTradeHeader");

        if (tradeHeader) {
            tradeHeader.hidden = activeOnly;
        }

        clearFields();
        renderResults([]);
        setMessage("");

        sortColumn = null;
        sortAsc = true;

        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");

        furigana.focus();
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
        selectedChartered = null;

        document.dispatchEvent(
            new CustomEvent("chartered-search-closed")
        );
    }

    // Clear search conditions.
    function clearFields() {
        furigana.value = "";
        abbreviation.value = "";
        phoneNumber.value = "";

        // Reset legacy kept values (Dsp_Clr behavior).
        order.forEach(input => keptValues.set(input, ""));
    }

    // Legacy field navigation and typed-value restoration.
    order.forEach((input, i) => {

        const nextInput = order[(i + 1) % order.length];

        input.addEventListener("keydown", function (event) {

            // Forward navigation: Enter / ArrowDown.
            if (event.key === "Enter" || event.key === "ArrowDown") {
                event.preventDefault();

                keptValues.set(input, input.value);
                nextInput.focus();
            }

            // Backward navigation: ArrowUp / Escape.
            if (event.key === "ArrowUp" || event.key === "Escape") {
                event.preventDefault();

                order[(i + order.length - 1) % order.length].focus();
            }
        });

        // Restore the last kept value when focus leaves
        // for anything other than the next field.
        input.addEventListener("blur", function (event) {

            if (event.relatedTarget !== nextInput) {
                input.value = keptValues.get(input);
            }
        });
    });

    // Select a result row.
    function selectRow(row, chartered) {
        resultsBody.querySelectorAll("tr").forEach(item => {
            item.classList.remove("is-selected");
        });

        row.classList.add("is-selected");
        selectedChartered = chartered;
        setMessage("");
    }

    // Render search results.

    function renderResults(items) {
        selectedChartered = null;
        resultsBody.replaceChildren();

        resultCount.textContent = items.length
            ? `件数：${items.length.toLocaleString("en-US")}`
            : "件数:0";

        items.forEach(chartered => {
            const row = document.createElement("tr");

            const values = [
                chartered.charteredCode ?? "",
                chartered.abbreviation ?? "",
                chartered.tradeEndDate ? "[×]" : "",
                chartered.phoneNumber ?? "",
                chartered.charteredName ?? "",
                chartered.address ?? ""
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = String(value);
                row.appendChild(cell);
            });

            // Hide 取引 column in active-only mode.
            row.children[2].hidden = activeOnly;

            row.tabIndex = 0;

            row.addEventListener("click", function () {
                selectRow(row, chartered);
            });

            row.addEventListener("dblclick", function () {
                selectRow(row, chartered);
                applySelectedChartered();
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
                    selectRow(row, chartered);
                    applySelectedChartered();
                }
            });

            resultsBody.appendChild(row);
        });

        const firstRow = resultsBody.querySelector("tr");

        if (firstRow) {
            selectRow(firstRow, items[0]);
            firstRow.focus();
        }
    }


    // Execute the carrier search.

    async function executeSearch() {
        const searchUrl = win.dataset.searchUrl;
        const params = new URLSearchParams();

        if (furigana.value.trim()) {
            params.set("furigana", furigana.value.trim());
        }

        if (abbreviation.value.trim()) {
            params.set("name", abbreviation.value.trim());
        }

        if (phoneNumber.value.trim()) {
            params.set("phoneNumber", phoneNumber.value.trim());
        }

        if (activeOnly) {
            params.set("activeOnly", "true");
        }

        btnSearch.disabled = true;
        setMessage("検索中！！　暫くお待ち下さい");

        try {
            const query = params.toString();
            const url = query ? `${searchUrl}?${query}` : searchUrl;

            //console.log("Chartered Search URL:", url);

            const response = await fetch(url, {
                method: "GET",
                headers: { Accept: "application/json" }
            });

            const responseText = await response.text();

            //console.log("HTTP Status:", response.status);
            //console.log("Server Response:", responseText);

            let data;

            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error(
                    `Invalid JSON response. HTTP Status: ${response.status}`
                );
            }

            if (!response.ok || data.success === false) {
                throw new Error(
                    data.message || `HTTP Error: ${response.status}`
                );
            }

            const items = Array.isArray(data)
                ? data
                : (data.items ?? data.results ?? []);

            renderResults(items);

            if (items.length === 0) {
                alert("対象データがありません");
                setMessage("");
                furigana.focus();
            } else {
                setMessage("");
                resultsBody.querySelector("tr")?.focus();
            }

        } catch (error) {
            console.error("Chartered Search Error:", error);
            renderResults([]);
            setMessage("傭車検索に失敗しました。");

        } finally {
            btnSearch.disabled = false;
        }
    }


    // Apply the selected carrier and notify the calling screen.
    function applySelectedChartered() {
        if (!selectedChartered) { 
            return;
        }

        document.dispatchEvent(
            new CustomEvent("chartered-search-selected", {
                detail: {
                    charteredCode: selectedChartered.charteredCode,
                    abbreviation: selectedChartered.abbreviation,
                    charteredName: selectedChartered.charteredName,
                    address: selectedChartered.address
                }
            })
        );

        closePopup();
    }

    // Clear search conditions and results.
    function cancelSearch() {
        clearFields();
        renderResults([]);
        setMessage("");
        furigana.focus();
        furigana.select();
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
    btnSelect.addEventListener("click", applySelectedChartered);
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
    document.addEventListener("openCharteredSearchPopup", openPopup);

    // Search when Enter is pressed in a condition field.
    //popup.querySelectorAll(".chartered-search-conditions input")
    //    .forEach(input => {
    //        input.addEventListener("keydown", function (event) {
    //            if (event.key === "Enter") {
    //                event.preventDefault();
    //                executeSearch();
    //            }
    //        });
    //    });

    // Handle function keys while the popup is open.
    //document.addEventListener("keydown", function (event) {
    //    if (!popup.classList.contains("is-open")) return;

    //    if (event.key === "F1") {
    //        event.preventDefault();
    //        applySelectedChartered();
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
    popup.querySelectorAll(".chartered-search-table th[data-sort]")
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

    // =========================================
    // F10 ﾏｽﾀ登録: 傭車マスタ in a modal (legacy SYORID2 = "検索")
    // =========================================
    // As 車輌検索 does: the master opens in an iframe with ?mode=search (F5 / F9 / F10 blanked there),
    // and its F12 asks this page to close the modal (closeCharteredMasterModal).

    const masterModal = document.getElementById("charteredMasterModal");
    const masterWindow = document.getElementById("charteredMasterWindow");
    const masterFrame = document.getElementById("charteredMasterFrame");

    function closeMasterModal() {
        if (!masterModal || !masterFrame) return;

        masterModal.style.display = "none";
        masterFrame.src = "about:blank";

        masterWindow?.classList.remove(
            "is-minimized",
            "is-maximized"
        );

        // Restore focus to the field active before opening the modal.
        (focusBeforeMaster ?? furigana).focus();

        focusBeforeMaster = null;
    }

    // Keep focus on the search condition field when F10 is clicked.
    btnCharteredSearchRegister?.addEventListener("mousedown", function (event) {
        event.preventDefault();
    });

    // F10: Open Chartered Master in search mode.
    btnCharteredSearchRegister?.addEventListener("click", function () {

        if (!masterModal || !masterFrame) return;

        // Remember the active search condition field.
        focusBeforeMaster = [
            furigana,
            abbreviation,
            phoneNumber
        ].includes(document.activeElement)
            ? document.activeElement
            : furigana;

        masterWindow?.classList.remove(
            "is-minimized",
            "is-maximized"
        );

        masterFrame.src =
            "/CharteredVehicleMaster/Chartered_Vehicle_Master?mode=search";

        masterModal.style.display = "flex";
    });

    //document.getElementById("btnCharteredSearchRegister")
    //    ?.addEventListener("click", function () {
    //        if (!masterModal || !masterFrame) return;

    //        masterWindow?.classList.remove("is-minimized", "is-maximized");
    //        masterFrame.src = "/CharteredVehicleMaster/Chartered_Vehicle_Master?mode=search";
    //        masterModal.style.display = "flex";
    //    });

    document.getElementById("btnCharteredMasterMinimize")
        ?.addEventListener("click", function () {
            masterWindow?.classList.remove("is-maximized");
            masterWindow?.classList.toggle("is-minimized");
        });

    document.getElementById("btnCharteredMasterMaximize")
        ?.addEventListener("click", function () {
            masterWindow?.classList.remove("is-minimized");
            masterWindow?.classList.toggle("is-maximized");
        });

    document.getElementById("btnCharteredMasterClose")
        ?.addEventListener("click", closeMasterModal);

    window.addEventListener("message", function (event) {
        if (event.origin !== window.location.origin) return;

        if (event.data?.action === "closeCharteredMasterModal") {
            closeMasterModal();
        }
    });
});
