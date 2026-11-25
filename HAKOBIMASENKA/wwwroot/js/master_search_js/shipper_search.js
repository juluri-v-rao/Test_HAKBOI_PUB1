document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("shipperSearchPopup");
    const win = document.getElementById("shipperSearchWindow");

    if (!popup || !win) return;
     
    // Hide disabled function keys except F9.
    popup.querySelectorAll(".shipper-search-footer button:disabled")
        .forEach(button => {
            if (button.id !== "btnShipperSearchF9") {
                button.hidden = true;
            }
        });

    const furigana = document.getElementById("searchShipperFurigana");
    const name = document.getElementById("searchShipperName");
    const phoneNumber = document.getElementById("searchShipperPhone");

    // Legacy field navigation and typed-value restoration.
    const order = [furigana, name, phoneNumber];

    const keptValues = new Map(
        order.map(input => [input, input.value])
    );

    const resultsBody = document.getElementById("shipperSearchResults");
    const resultCount = document.getElementById("shipperSearchCount");
    const message = document.getElementById("shipperSearchMessage");

    const btnSearch = document.getElementById("btnShipperSearchExecute");
    const btnSelect = document.getElementById("btnShipperSearchSelect");
    const btnCancel = document.getElementById("btnShipperSearchCancel");
    const btnExit = document.getElementById("btnShipperSearchExit");
    const btnMinimize = document.getElementById("btnShipperSearchMinimize");
    const btnMaximize = document.getElementById("btnShipperSearchMaximize");
    const btnClose = document.getElementById("btnShipperSearchClose");

    let selectedShipper = null;
    let isMinimized = false;
    let isMaximized = false;
    // Identify whether the popup was opened from normal search or master search.
    let isMasterSearchMode = false;

    let sortColumn = null;
    let sortAsc = true;
    let focusBeforeSearch = null;
    // Display a message.
    function setMessage(text) {
        message.textContent = text;
    }

    // =========================================
    // Product Name Search Popup - Drag Window
    // =========================================

    // =========================================
    // Shipper Search - Input Limits
    // =========================================

    // Convert full-width characters to half-width.
    // Use the same conversion function as 品名マスタ フリガナ
    // if that function is already available globally.
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

    // 名称: 30 bytes.
    name.addEventListener("input", function () {
        this.value = limitBytes(this.value, 30);
    });

    function normalizePhoneNumber(value) {
        return value
            .normalize("NFKC")
            .replace(/[^0-9\-()+ ]/g, "");
    }

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
     
    // Limit input by legacy Shift-JIS-style byte length.
    function limitBytes(value, maxBytes) {

        let result = "";
        let bytes = 0;

        for (const ch of value) {

            const c = ch.codePointAt(0);

            // ASCII and half-width Katakana = 1 byte.
            // All other characters = 2 bytes.
            const width =
                (c <= 0x7E || (c >= 0xFF61 && c <= 0xFF9F))
                    ? 1
                    : 2;

            if (bytes + width > maxBytes) {
                break;
            }

            result += ch;
            bytes += width;
        }

        return result;
    }

    function initializeshipperSearchDrag() {

        const popup = document.getElementById("shipperSearchWindow");
        const titlebar = popup?.querySelector(
            ".shipper-search-titlebar"
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

    initializeshipperSearchDrag();

    // 取引終了日 IS NULL only: set by the caller on open (legacy SelMX = "9" in 新規)
    let activeOnly = false;

    // Open the Shipper Search popup directly.
    function openPopup() {

        // Reset search conditions and previous results on every open.
        clearFields();
        document.getElementById("shipperSearchTradeHeader").hidden = activeOnly;
        renderResults([]);

        // Reset sorting state.
        sortColumn = null;
        sortAsc = true;

        // Clear previous search focus reference.
        focusBeforeSearch = null;

        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");

        setMessage("");

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
        selectedShipper = null;

        document.dispatchEvent(
            new CustomEvent(
                "shipper-search-closed",
                {
                    detail: {
                        mode: isMasterSearchMode
                            ? "settlement"
                            : "normal"
                    }
                }
            )
        );
    }
    　
    // Clear search conditions and reset stored input values.
    function clearFields() {

        furigana.value = "";
        name.value = "";
        phoneNumber.value = "";

        // Reset legacy kept values (Dsp_Clr behavior).
        order.forEach(input => keptValues.set(input, ""));
    }

    // Select a result row.
    function selectRow(row, shipper) {
        resultsBody.querySelectorAll("tr").forEach(item => {
            item.classList.remove("is-selected");
        });

        row.classList.add("is-selected");
        selectedShipper = shipper;
        setMessage("");
    }

    // Render the search results.
    function renderResults(items) {
        selectedShipper = null;
        resultsBody.replaceChildren();

        resultCount.textContent = items.length
            ? `件数：${items.length.toLocaleString("en-US")}`
            : "件数:0";

        items.forEach(shipper => {
            const row = document.createElement("tr");

            const values = [
                shipper.shipperCode ?? "",
                shipper.abbreviation ?? "",
                shipper.tradeEndDate ? "[×]" : "",
                shipper.phoneNumber ?? "",
                shipper.shipperName ?? "",
                shipper.address ?? ""
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = String(value);
                row.appendChild(cell);
            });

            // Hide the 取引 column in active-only mode.
            row.children[2].hidden = activeOnly;

            row.tabIndex = 0;

            row.addEventListener("click", function () {
                selectRow(row, shipper);
            });

            row.addEventListener("dblclick", function () {
                selectRow(row, shipper);
                applySelectedShipper();
            });

            row.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    selectRow(row, shipper);
                    applySelectedShipper();
                }

                if (event.key === "ArrowDown") {
                    event.preventDefault();

                    const next = row.nextElementSibling;

                    if (next) {
                        next.focus();
                        next.click();
                    }
                }

                if (event.key === "ArrowUp") {
                    event.preventDefault();

                    const previous =
                        row.previousElementSibling;

                    if (previous) {
                        previous.focus();
                        previous.click();
                    }
                }

            });

            resultsBody.appendChild(row);
        });

        const firstRow = resultsBody.querySelector("tr");

        if (firstRow) {
            selectRow(firstRow, items[0]);
        }
    }

    // Execute the search.

    async function executeSearch() {

        const searchUrl = win.dataset.searchUrl;
        const params = new URLSearchParams();

        if (furigana.value.trim()) {
            params.set("furigana", furigana.value.trim());
        }

        if (name.value.trim()) {
            params.set("name", name.value.trim());
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

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Accept: "application/json"
                }
            });

            const responseText = await response.text();

            let data;

            try {
                data = JSON.parse(responseText);
            } catch (error) {

                console.error("Invalid JSON Response:", responseText);

                throw new Error(
                    `サーバーエラーが発生しました。HTTP Status: ${response.status}`
                );
            }

            if (!response.ok || data.success === false) {
                throw new Error(
                    data.message || "荷主検索に失敗しました。"
                );
            }

            const items = Array.isArray(data)
                ? data
                : (data.items ?? data.results ?? []);

            console.log("Shipper Search Results:", items);

            renderResults(items);

            if (items.length === 0) {

                alert("対象データがありません");

                setMessage("");

                // Restore focus to the control active before F5 search.
                if (focusBeforeSearch && document.contains(focusBeforeSearch)) {
                    focusBeforeSearch.focus();
                }

            } else {

                setMessage("");

                resultsBody.querySelector("tr")?.focus();
            }

        } catch (error) {

            console.error("Shipper Search Error:", error);

            renderResults([]);

            setMessage("荷主検索に失敗しました。");

        } finally {

            btnSearch.disabled = false;
        }
    }


    // Apply the selected shipper.
    function applySelectedShipper() {
        if (!selectedShipper) {
            return;
        }

        if (isMasterSearchMode) {

            // F6 - Return only shipper code and shipper name.
            document.dispatchEvent(
                new CustomEvent("master-shipper-search-selected", {
                    detail: {
                        code: selectedShipper.shipperCode,
                        name: selectedShipper.abbreviation
                    }
                })
            );

        } else {

            // F5 - Return shipper code for complete record lookup.
            document.dispatchEvent(
                new CustomEvent("shipper-search-selected", {
                    detail: {
                        shipperCode: selectedShipper.shipperCode
                    }
                })
            );

        }

        closePopup();
    }

    // Cancel the current search and clear its conditions.
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
    // Preserve focus before the Search button receives mouse focus.
    btnSearch.addEventListener("mousedown", function () {
        focusBeforeSearch = document.activeElement;
    });

    // Prevent the Search button from taking focus on mouse click.
    btnSearch.addEventListener("mousedown", function (event) {
        event.preventDefault();
    });
    // Register button events.
    btnSearch.addEventListener("click", executeSearch);
    btnSelect.addEventListener("click", applySelectedShipper);
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
    document.addEventListener("openShipperSearchPopup", function (event) {

        isMasterSearchMode = false;
        activeOnly = event?.detail?.activeOnly === true;

        openPopup();

    });

    // F6 - Master Shipper Search.
    document.addEventListener("openMasterShipperSearchPopup", function (event) {

        isMasterSearchMode = true;
        activeOnly = event?.detail?.activeOnly === true;

        openPopup();

    });

    // Legacy field navigation and typed-value restoration.
    //const order = [furigana, name, phoneNumber];

    //const keptValues = new Map(
    //    order.map(input => [input, input.value])
    //);

    order.forEach((input, i) => {

        const nextInput = order[(i + 1) % 3];

        input.addEventListener("keydown", e => {

            // Forward navigation: save the current typed value.
            if (e.key === "Enter" || e.key === "ArrowDown") {
                e.preventDefault();

                keptValues.set(input, input.value);
                nextInput.focus();
            }

            // Backward navigation.
            if (e.key === "ArrowUp" || e.key === "Escape") {
                e.preventDefault();
                order[(i + 2) % 3].focus();
            }
        });

        // Restore the last kept value when focus leaves
        // for anything other than the next field.
        input.addEventListener("blur", e => {

            if (e.relatedTarget !== nextInput) {
                input.value = keptValues.get(input);
            }
        });
    });

    // Handle function keys while the popup is open.
    //document.addEventListener("keydown", function (event) {
    //    if (!popup.classList.contains("is-open")) return;

    //    if (event.key === "F1") {
    //        event.preventDefault();
    //        applySelectedShipper();
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

    // Sort results by clicking a sortable column heading.
    popup.querySelectorAll(".shipper-search-table th[data-sort]")
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

                if (sortColumn === column) {
                    sortAsc = !sortAsc;
                } else {
                    sortColumn = column;
                    sortAsc = true;
                }

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
    // F10 - Open Shipper Master Registration
    // =========================================

    const shipperMasterModal =
        document.getElementById("shipperMasterModal");

    const shipperMasterWindow =
        document.getElementById("shipperMasterWindow");

    const shipperMasterFrame =
        document.getElementById("shipperMasterFrame");

    const btnShipperMasterMinimize =
        document.getElementById("btnShipperMasterMinimize");

    const btnShipperMasterMaximize =
        document.getElementById("btnShipperMasterMaximize");

    const btnShipperMasterClose =
        document.getElementById("btnShipperMasterClose");

    let isShipperMasterMinimized = false;
    let isShipperMasterMaximized = false;

    // F10 - Open Shipper Master.
    document.getElementById("btnShipperSearchRegister")
        ?.addEventListener("click", function () {

            if (!shipperMasterModal || !shipperMasterFrame) {
                console.error("Shipper Master modal elements not found.");
                return;
            }

            // Reset window state.
            shipperMasterWindow?.classList.remove(
                "is-minimized",
                "is-maximized"
            );

            isShipperMasterMinimized = false;
            isShipperMasterMaximized = false;

            // Load Shipper Master registration screen.
            shipperMasterFrame.src =
                "/ShipperMaster/Shipper_master?popupMode=true";

            // Display above Shipper Search.
            shipperMasterModal.style.display = "flex";
        });

    // Minimize / restore.
    btnShipperMasterMinimize?.addEventListener("click", function () {

        if (!shipperMasterWindow) return;

        if (!isShipperMasterMinimized) {

            shipperMasterWindow.classList.remove("is-maximized");
            shipperMasterWindow.classList.add("is-minimized");

            isShipperMasterMinimized = true;
            isShipperMasterMaximized = false;

        } else {

            shipperMasterWindow.classList.remove("is-minimized");
            isShipperMasterMinimized = false;
        }
    });

    // Maximize / restore.
    btnShipperMasterMaximize?.addEventListener("click", function () {

        if (!shipperMasterWindow) return;

        if (!isShipperMasterMaximized) {

            shipperMasterWindow.classList.remove("is-minimized");
            shipperMasterWindow.classList.add("is-maximized");

            isShipperMasterMaximized = true;
            isShipperMasterMinimized = false;

        } else {

            shipperMasterWindow.classList.remove("is-maximized");
            isShipperMasterMaximized = false;
        }
    });

    // Close Shipper Master modal.
    function closeShipperMasterModal() {

        if (!shipperMasterModal || !shipperMasterFrame) return;

        shipperMasterModal.style.display = "none";
        shipperMasterFrame.src = "about:blank";

        shipperMasterWindow?.classList.remove(
            "is-minimized",
            "is-maximized"
        );

        isShipperMasterMinimized = false;
        isShipperMasterMaximized = false;

        // Return focus to F10.
        document.getElementById("btnShipperSearchRegister")?.focus();
    }

    btnShipperMasterClose?.addEventListener(
        "click",
        closeShipperMasterModal
    );

    // Receive close request from Shipper Master iframe.
    window.addEventListener("message", function (event) {

        if (event.origin !== window.location.origin) return;

        if (
            event.data?.action === "close" ||
            event.data?.action === "closeShipperMasterModal"
        ) {
            closeShipperMasterModal();
        }
    });

    //// F10 - Open Shipper Master in popup mode.
    //document.getElementById("btnShipperSearchRegister")
    //    ?.addEventListener("click", function () {
    //        const masterUrl = "/ShipperMaster/Shipper_master?popupMode=true";

    //        // Open the master screen in the parent modal.
    //        window.parent.postMessage(
    //            {
    //                action: "openMasterPopup",
    //                url: masterUrl,
    //                returnFocusId: "btnShipperSearchRegister"
    //            },
    //            window.location.origin
    //        );
    //    });
});