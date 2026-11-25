
document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("originDestinationSearchPopup");
    const win = document.getElementById("originDestinationSearchWindow");

    if (!popup || !win) return;

    popup.querySelectorAll(
        ".origin-destination-search-footer button:disabled"
    ).forEach(button => {
        // Keep F9 visible even when disabled.
        if (button.id === "btnOriginDestinationSearchF9") {
            return;
        }

        button.hidden = true;
    });

    const nameFurigana = document.getElementById("searchOriginDestinationFurigana");
    const nameInput = document.getElementById("searchOriginDestinationName");
    const areaInput = document.getElementById("searchOriginDestinationArea");
    const areaInputcode = document.getElementById("searchOriginDestinationAreaCode");
    const resultsBody = document.getElementById("originDestinationSearchResults");
    const resultCount = document.getElementById("originDestinationSearchCount");
    const message = document.getElementById("originDestinationSearchMessage");

    const btnSearch = document.getElementById("btnOriginDestinationSearchExecute");
    const btnSelect = document.getElementById("btnOriginDestinationSearchSelect");
    const btnCancel = document.getElementById("btnOriginDestinationSearchCancel");
    const btnExit = document.getElementById("btnOriginDestinationSearchExit");
    const btnClose = document.getElementById("btnOriginDestinationSearchClose");
    const btnMinimize = document.getElementById("btnOriginDestinationSearchMinimize");
    const btnMaximize = document.getElementById("btnOriginDestinationSearchMaximize");


    const shipperRow = document.getElementById(
        "originDestinationShipperRow"
    );

    const shipperCodeInput = document.getElementById(
        "searchOriginDestinationShipperCode"
    );

    const shipperNameInput = document.getElementById(
        "searchOriginDestinationShipperName"
    );
     
    let displayedItems = [];
    let selectedItem = null;
    let isLoading = false;
    let isMinimized = false;
    let isMaximized = false;

    let sortColumn = null;
    let sortAsc = true;
    let isCommonMode = false;
    // Display a message.
    function setMessage(text) {
        message.textContent = text;
    }
    // Limit フリガナ to 32 bytes.
    nameFurigana.addEventListener("input", function () {
        this.value = limitBytes(this.value, 32);
    });

    // Limit 発着地名 to 30 bytes.
    nameInput.addEventListener("input", function () {
        this.value = limitBytes(this.value, 30);
    });
    function limitBytes(value, maxBytes) {
        let result = "";
        let bytes = 0;

        for (const char of value) {
            const code = char.charCodeAt(0);

            const charBytes =
                (code <= 0x7E || (code >= 0xFF61 && code <= 0xFF9F))
                    ? 1
                    : 2;

            if (bytes + charBytes > maxBytes) {
                break;
            }

            result += char;
            bytes += charBytes;
        }

        return result;
    }

    // =========================================
    // フリガナ - Half-width Kana Conversion
    // =========================================

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
    nameFurigana.addEventListener("compositionstart", function () {
        this.dataset.composing = "true";
    });

    nameFurigana.addEventListener("compositionend", function () {
        delete this.dataset.composing;

        this.value = limitBytes(convertToHalfWidth(this.value), 32);
    });

    nameFurigana.addEventListener("input", function (event) {
        if (event.isComposing || this.dataset.composing === "true") return;

        this.value = limitBytes(convertToHalfWidth(this.value), 32);
    });

    const order = [
        nameFurigana,
        nameInput,
        areaInputcode
    ];

    const keptValues = new Map();

    order.forEach(input => keptValues.set(input, ""));

    // =========================================
    // Legacy field navigation and typed-value restoration
    // =========================================

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

    // =========================================
    //Search Popup - Drag Window
    // =========================================

    function initializeoriginNameSearchDrag() {

        const popup = document.getElementById("originDestinationSearchWindow");
        const titlebar = popup?.querySelector(
            ".origin-destination-search-titlebar"
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

    initializeoriginNameSearchDrag();

    // Open the popup and load the records.
    async function openPopup() {
        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");

        await updateShipperRowVisibility();

        sortColumn = null;
        sortAsc = true;
        clearSearchScreen();

        nameFurigana.focus();
    }

    async function updateShipperRowVisibility() {
        try {
            const response = await fetch(
                "/SearchScreen/GetRegistrationMode"
            );

            if (!response.ok) {
                throw new Error("登録区分を取得できませんでした。");
            }

            const result = await response.json();

            isCommonMode = result.isCommonMode === true;

            shipperRow.hidden = isCommonMode;
        }
        catch (error) {
            console.error(error);
            isCommonMode = false;
            shipperRow.hidden = false;
        }
    }

    // Retrieve origin/destination records from the server.
    

    // Select a row and highlight it.
    function selectRow(row, item) {
        resultsBody.querySelectorAll("tr").forEach(existingRow => {
            existingRow.classList.remove("is-selected");
        });

        row.classList.add("is-selected");
        selectedItem = item;
        setMessage("");
    }

    // Render search results.
    function renderResults(items) {
        selectedItem = null;
        resultsBody.replaceChildren();

        resultCount.textContent = items.length
            ? `件数：${items.length.toLocaleString("en-US")}`
            : "件数:0";

        items.forEach(item => {
            const row = document.createElement("tr");

            [
                item.originDestinationCode,
                item.originDestinationName,
                item.areaName,
                item.phoneNumber,
                item.address1
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            row.tabIndex = 0;

            row.addEventListener("click", function () {
                selectRow(row, item);
            });

            row.addEventListener("dblclick", function () {
                selectRow(row, item);
                applySelectedItem();
            });

            row.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    selectRow(row, item);
                    applySelectedItem();
                    return;
                }

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
            });
             
            resultsBody.appendChild(row);
        });

        // Select and focus the first result.
        const firstRow = resultsBody.querySelector("tr");

        if (firstRow && items.length > 0) {
            selectRow(firstRow, items[0]);
            firstRow.focus();
        }
    }

     

    async function executeSearch() {
        if (isLoading) return;

     

        const searchUrl = win.dataset.searchUrl;
        const params = new URLSearchParams();

        // Common Mode: Search only records with blank 荷主コード.
        if (isCommonMode) {
            params.set("shipperCode", "");
            params.set("commonMode", "1");
        }
        else {
            params.set("commonMode", "0");

            if (shipperCodeInput.value.trim()) {
                params.set("shipperCode", shipperCodeInput.value.trim());
            }
        }

        if (nameInput.value) {
            params.set("originDestinationName", nameInput.value);
        }

        if (nameFurigana.value) {
            params.set("nameFurigana", nameFurigana.value);
        }

        if (areaInputcode.value) {
            params.set("areaCode", areaInputcode.value);
        }

        isLoading = true;
        btnSearch.disabled = true;
        selectedItem = null;
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
                    data.message || "発着地検索に失敗しました。"
                );
            }

            const items = Array.isArray(data)
                ? data
                : (data.items ?? data.results ?? []);

            displayedItems = items.map(item => ({
                originDestinationCode: String(item.originDestinationCode ?? ""),
                originDestinationName: String(item.originDestinationName ?? ""),
                areaName: String(item.areaName ?? ""),
                phoneNumber: String(item.phoneNumber ?? ""),
                address1: String(item.address1 ?? "")
            }));
            renderResults(displayedItems);
            //if (firstRow && items.length > 0) {
            //    selectRow(firstRow, items[0]);
            //    firstRow.focus();
            //}
            if (displayedItems.length === 0) {
                alert("対象データがありません");
                setMessage("");
                nameFurigana.focus();
            } else {
                setMessage("");
            }
        } catch (error) {
            console.error("Origin/Destination Search Error:", error);

          
            displayedItems = [];
            renderResults([]);
            setMessage("発着地検索に失敗しました。");
        } finally {
            isLoading = false;
            btnSearch.disabled = false;
        }
    }



    // Apply the selected item and notify the calling screen.
    function applySelectedItem() {
        if (!selectedItem) {
            return;
        }

        document.dispatchEvent(
            new CustomEvent("origin-destination-search-selected", {
                detail: {
                    originDestinationCode: selectedItem.originDestinationCode,
                    originDestinationName: selectedItem.originDestinationName,
                    areaName: selectedItem.areaName,
                    phoneNumber: selectedItem.phoneNumber,
                    address1: selectedItem.address1
                }
            })
        );

        closePopup();
    }

    // Clear search fields and restore the full result list.
    function cancelSearch() {
        clearSearchScreen();
        nameFurigana.focus();
    }

    // Close the popup and restore its dimensions.

    function closePopup() {
        clearSearchScreen();

        popup.classList.remove("is-open");
        popup.setAttribute("aria-hidden", "true");

        win.classList.remove("is-minimized", "is-maximized");
        win.style.width = "";
        win.style.height = "";

        isMinimized = false;
        isMaximized = false;
        selectedItem = null;

        document.dispatchEvent(
            new CustomEvent("origin-destination-search-closed")
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
    btnSearch.addEventListener("click", executeSearch);
    btnSelect.addEventListener("click", applySelectedItem);
    btnCancel.addEventListener("click", cancelSearch);

    btnExit.addEventListener("click", closePopup);
    btnClose.addEventListener("click", closePopup);
    btnMinimize.addEventListener("click", minimizePopup);
    btnMaximize.addEventListener("click", maximizePopup);

    // Open the popup through the calling screen's event.
    document.addEventListener(
        "openOriginDestinationSearchPopup",
        function (event) {
            const shipperCode = String(
                event.detail?.shipperCode ?? ""
            ).trim();

            const shipperName = String(
                event.detail?.shipperName ?? ""
            ).trim();

            shipperCodeInput.value = shipperCode;
            shipperNameInput.value = shipperName;

            //shipperCodeInput.dataset.lookupCode = shipperCode;

            openPopup();
        }
    );
    shipperCodeInput.readOnly = true;
    shipperNameInput.readOnly = true;
      
    // Sort the result list by clicking a column heading.
    popup.querySelectorAll(
        ".origin-destination-search-table th[data-sort]"
    ).forEach(header => {
        header.addEventListener("click", function () {
            const columnIndex = Array.from(
                header.parentElement.children
            ).indexOf(header);

            const column = header.dataset.sort;

            if (columnIndex < 0 || displayedItems.length === 0) return;

            sortAsc = (sortColumn === column) ? !sortAsc : true;
            sortColumn = column;

            const direction = sortAsc ? "asc" : "desc";

            displayedItems.sort((a, b) => {
                const comparison = String(a[column] ?? "").localeCompare(
                    String(b[column] ?? ""),
                    "ja",
                    { numeric: true, sensitivity: "base" }
                );

                return direction === "asc" ? comparison : -comparison;
            });

            renderResults(displayedItems);
        });
    });
    function clearSearchScreen() {
        nameFurigana.value = "";
        nameInput.value = "";
        areaInput.value = "";
        areaInputcode.value = "";
         
        displayedItems = [];
        selectedItem = null;

        // Reset legacy kept values.
        order.forEach(input => keptValues.set(input, ""));

        resultsBody.replaceChildren();
        resultCount.textContent = "件数:0";
        setMessage("");
    }

    const areaCodeInput = document.getElementById(
        "searchOriginDestinationAreaCode"
    );

    const btnAreaSearchF6 = document.getElementById(
        "btnOriginDestinationSearchF6"
    );

    // Enable F6 only when the Area Code field is active.
    if (areaCodeInput && btnAreaSearchF6) {

        btnAreaSearchF6.disabled = true;

        areaCodeInput.addEventListener("focus", function () {
            btnAreaSearchF6.disabled = false;
        });

        areaCodeInput.addEventListener("blur", function (event) {

            // Keep F6 enabled when focus moves to the F6 button.
            if (event.relatedTarget === btnAreaSearchF6) {
                return;
            }

            btnAreaSearchF6.disabled = true;
        });

        // Keep the input focused when clicking F6.
        btnAreaSearchF6.addEventListener("mousedown", function (event) {
            event.preventDefault();
        });

        // Open Area Search when F6 is clicked.
        btnAreaSearchF6.addEventListener("click", function () {

            if (btnAreaSearchF6.disabled) return;
            areaSelectedFromPopup = false;
            document.dispatchEvent(
                new CustomEvent("openAreaSearchPopup", {
                    detail: {
                        source: "originDestinationSearch"
                    }
                })
            );
        });
 
    }


    // Origin/Destination Search - Area Code Lookup 
    const areaCode = document.getElementById(
        "searchOriginDestinationAreaCode"
    );

    const areaName = document.getElementById(
        "searchOriginDestinationArea"
    );

    if (!areaCode || !areaName) return;

    const lookupUrl = areaCode.dataset.lookupUrl;

    let previousCode = "";
    let previousName = "";
    let lastLookupCode = "";
    let isLookingUp = false;

    let areaSelectedFromPopup = false;

    async function lookupArea() {
        const inputCode = areaCode.value.trim();

        // Clear the lookup when the code is empty.
        if (!inputCode) {
            areaName.value = "";
            previousCode = "";
            previousName = "";
            lastLookupCode = "";
            return true;
        }

        // Normalize: 1 -> 0001, 12 -> 0012.
        const code = inputCode.padStart(4, "0");

        if (isLookingUp) return false;

        if (code === lastLookupCode) {
            areaCode.value = code;
            return true;
        }

        isLookingUp = true;
        areaCode.value = code;

        try {
            const response = await fetch(
                `${lookupUrl}?code=${encodeURIComponent(code)}`,
                {
                    method: "GET",
                    headers: { Accept: "application/json" }
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                alert("対象データがありません！");

                areaCode.value = previousCode;
                areaName.value = previousName;
                lastLookupCode = previousCode;

                areaCode.focus();
                areaCode.select();

                return false;
            }

            // Populate the area code and name returned by the server.
            areaCode.value = result.code;
            areaName.value = result.name;

            previousCode = result.code;
            previousName = result.name;
            lastLookupCode = result.code;

            return true;
        } catch (error) {
            console.error("Area lookup failed:", error);

            alert("対象データがありません！");

            areaCode.value = previousCode;
            areaName.value = previousName;
            lastLookupCode = previousCode;

            areaCode.focus();
            areaCode.select();

            return false;
        
        } finally {
            isLookingUp = false;
        }
    } 
    // Receive the selected area from Area Search.
    document.addEventListener(
        "area-search-selected",
        function (event) {

            // Accept only selections from this popup.
            if (event.detail?.source !== "originDestinationSearch") {
                return;
            }

            const code = String(event.detail.code ?? "").padStart(4, "0");
            const name = String(event.detail.areaName ?? "");

            if (!code || !name) {
                console.error("Invalid selected area:", event.detail);
                return;
            }

            areaSelectedFromPopup = true;

            // Populate the Area Code and Area Name fields.
            areaCode.value = code;
            areaName.value = name;

            // Update lookup state to prevent an unnecessary lookup on blur.
            previousCode = code;
            previousName = name;
            lastLookupCode = code;

            setMessage("");

            // Return focus to the Area Code field.
            areaCode.focus();

            //console.log("Selected Area:", {
            //    code: code,
            //    areaName: name
            //});
        }
    );

    // Return focus to Area Code when Area Search closes without selection.
    document.addEventListener("area-search-closed", function () {

        if (!areaSelectedFromPopup) {
            areaCode.focus();
        }

        areaSelectedFromPopup = false;
    });
     
    // Legacy behavior: validate only when moving to Furigana.
    areaCode.addEventListener("blur", function (event) {

        if (event.relatedTarget === nameFurigana) {
            lookupArea();
        } else {
            // Restore the previously confirmed values without a message.
            areaCode.value = previousCode;
            areaName.value = previousName;
        }
    });

    // Lookup immediately when Enter is pressed.
    areaCode.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            nameFurigana.focus();
        }
    });
 
    // =========================================
    // F10 - Open Origin/Destination Master Modal
    // =========================================

    const masterModal = document.getElementById(
        "originDestinationMasterModal"
    );

    const masterFrame = document.getElementById(
        "originDestinationMasterFrame"
    );

    const masterMinimizeButton = document.getElementById(
        "btnOriginDestinationMasterMinimize"
    );

    const masterMaximizeButton = document.getElementById(
        "btnOriginDestinationMasterMaximize"
    );

    const masterCloseButton = document.getElementById(
        "btnOriginDestinationMasterClose"
    );

    function openOriginDestinationMaster() {

        if (!masterModal || !masterFrame) {
            console.error("Origin/Destination Master modal was not found.");
            return;
        }

        masterFrame.src =
            "/OriginDestinationMaster/OriginDest_master?mode=search";

        masterModal.classList.remove("is-minimized", "is-maximized");
        masterModal.classList.add("is-open");
        masterModal.style.display = "flex";
    }

    // Receive close request from Origin/Destination Master.
    window.addEventListener("message", function (event) {

        if (event.origin !== window.location.origin) {
            return;
        }

        if (event.data?.action === "closeOriginDestMasterModal") {
            closeOriginDestinationMaster();
        }
    });
    function closeOriginDestinationMaster() {

        if (!masterModal || !masterFrame) return;

        masterModal.classList.remove(
            "is-open",
            "is-minimized",
            "is-maximized"
        );

        masterModal.style.display = "none";
        masterFrame.src = "about:blank";
    }

    // F10: マスタ登録 
    document.getElementById("btnOriginDestinationSearchRegister")
        ?.addEventListener("click", function () {
            openOriginDestinationMaster();
        });

    // Minimize
    masterMinimizeButton?.addEventListener("click", function () {

        masterModal.classList.toggle("is-minimized");
        masterModal.classList.remove("is-maximized");

    });

    // Maximize
    masterMaximizeButton?.addEventListener("click", function () {

        masterModal.classList.toggle("is-maximized");
        masterModal.classList.remove("is-minimized");

    });

    // Close
    masterCloseButton?.addEventListener(
        "click",
        closeOriginDestinationMaster
    );


});
