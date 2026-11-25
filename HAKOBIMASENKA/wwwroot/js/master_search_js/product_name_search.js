document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("productNameSearchPopup");
    const win = document.getElementById("productNameSearchWindow");
    if (!popup || !win) return;

    popup.querySelectorAll(".product-name-search-footer button:disabled")
        .forEach(button => {
            if (
                button.id === "btnProductNameSearchF6" ||
                button.id === "btnProductNameSearchF9"
            ) return;

            button.hidden = true;
        });

    // Search condition fields.
    const productNameFurigana = document.getElementById("searchProductNameFurigana");
    const productName = document.getElementById("searchProductName");
    const productCategoryCode = popup.querySelector("#searchProductCategoryCode");
    const productCategoryName = popup.querySelector("#searchProductCategoryName");
    const transportationRecordCode = popup.querySelector("#searchTransportationRecordCode");
    const transportationRecordName = popup.querySelector("#searchTransportationRecordName");

    // Result elements.
    const resultsBody = document.getElementById("productNameSearchResults");
    const resultCount = document.getElementById("productNameSearchCount");
    const message = document.getElementById("productNameSearchMessage");

    // Buttons.
    const btnSearch = document.getElementById("btnProductNameSearchExecute");
    const btnSelect = document.getElementById("btnProductNameSearchSelect");
    const btnCancel = document.getElementById("btnProductNameSearchCancel");
    const btnExit = document.getElementById("btnProductNameSearchExit");
    const btnMinimize = document.getElementById("btnProductNameSearchMinimize");
    const btnMaximize = document.getElementById("btnProductNameSearchMaximize");
    const btnClose = document.getElementById("btnProductNameSearchClose");
    const btnRegister = document.getElementById("btnProductNameSearchRegister");

    let selectedProduct = null;
    let isMinimized = false;
    let isMaximized = false;
    let sortColumn = null;
    let sortAsc = true;

    let keptProductCategoryName = "";
    let keptTransportationRecordName = "";

    // Prevent duplicate master lookups.
    const lookupStates = new WeakMap();




    // Search condition field order.
    const searchFields = [
        productNameFurigana,
        productName,
        productCategoryCode,
        transportationRecordCode
    ];

    // Store the last accepted value of each field.
    const keptValues = new Map();

    searchFields.forEach(input => {
        keptValues.set(input, "");
    });

    // Field navigation.
    searchFields.forEach((input, index) => {

        const nextInput =
            searchFields[(index + 1) % searchFields.length];

        const previousInput =
            searchFields[
            (index + searchFields.length - 1) % searchFields.length
            ];

        input.addEventListener("keydown", function (event) {

            // Enter / Down: move to next field.
            if (event.key === "Enter" || event.key === "ArrowDown") {
                event.preventDefault();

                keptValues.set(input, input.value);

                nextInput.focus();
                return;
            }

            // Up / Escape: move to previous field.
            if (event.key === "ArrowUp" || event.key === "Escape") {
                event.preventDefault();

                previousInput.focus();
            }
        });

        // Restore the last accepted value when focus
        // moves somewhere other than the next field.
        input.addEventListener("blur", function (event) {

            if (event.relatedTarget !== nextInput) {
                input.value = keptValues.get(input);
            }
        });
    });


    // =========================================
    // Product Name Search - Half-width Kana Input
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
            keys.map(key =>
                key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            ).join("|"),
            "g"
        );

        return normalized.replace(pattern, char => map.get(char));
    }

    // Shift-JIS byte counting.
    // ASCII and half-width Katakana = 1 byte.
    // Everything else = 2 bytes.
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
    // フリガナ - Half-width conversion
    // Maximum: 30 bytes
    // =========================================

    productNameFurigana.addEventListener("compositionstart", function () {
        this.dataset.composing = "true";
    });

    productNameFurigana.addEventListener("compositionend", function () {
        delete this.dataset.composing;

        this.value = limitBytes(
            convertToHalfWidth(this.value),
            30
        );
    });

    productNameFurigana.addEventListener("input", function (event) {
        if (event.isComposing || this.dataset.composing === "true") return;

        this.value = limitBytes(
            convertToHalfWidth(this.value),
            30
        );
    });

    // =========================================
    // 品名 - Maximum: 30 bytes
    // =========================================

    productName.addEventListener("input", function () {
        this.value = limitBytes(this.value, 30);
    });

    // =========================================
    // Product Name Search Popup - Drag Window
    // =========================================

    function initializeProductNameSearchDrag() {

        const popup = document.getElementById("productNameSearchWindow");
        const titlebar = popup?.querySelector(
            ".product-name-search-titlebar"
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

    initializeProductNameSearchDrag();


    // Cancel a pending master lookup.
    function cancelLookupFor(input) {
        const state = lookupStates.get(input);
        if (state && state.controller) {
            state.controller.abort();
        }
        lookupStates.delete(input);
    }

    // Cancel all pending master lookups.
    function cancelPendingLookups() {
        cancelLookupFor(productCategoryCode);
        cancelLookupFor(transportationRecordCode);
    }

    // Display a message.
    function setMessage(text) {
        if (message) {
            message.textContent = text;
        }
    }

    // Open the popup.
    function openPopup() {
        clearFields();
        renderResults([]);
        setMessage("");

        sortColumn = null;
        sortAsc = true;

        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");

        productNameFurigana.focus();
    }

    // Close the popup.
    function closePopup() {
        cancelPendingLookups();
        popup.classList.remove("is-open");
        popup.setAttribute("aria-hidden", "true");
        win.classList.remove("is-minimized", "is-maximized");
        win.style.width = "";
        win.style.height = "";
        isMinimized = false;
        isMaximized = false;
        selectedProduct = null;
        document.dispatchEvent(new CustomEvent("product-name-search-closed"));
    }

    // Clear search conditions.
    function clearFields() {
        cancelPendingLookups();
        productNameFurigana.value = "";
        productName.value = "";
        productCategoryCode.value = "";
        productCategoryName.value = "";
        transportationRecordCode.value = "";
        transportationRecordName.value = "";

        searchFields.forEach(input => {
            keptValues.set(input, "");
        });
    }

    // Clear search results.
    function clearResults() {
        resultsBody.replaceChildren();
        resultCount.textContent = "件数:0";
        selectedProduct = null;
    }

    // Select a result row.
    function selectRow(row, product) {
        resultsBody.querySelectorAll("tr").forEach(item => {
            item.classList.remove("is-selected");
        });
        row.classList.add("is-selected");
        selectedProduct = product;
        setMessage("");
    }

    // Render search results.
    function renderResults(items) {
        selectedProduct = null;
        resultsBody.replaceChildren();
        resultCount.textContent = items.length
            ? `件数：${items.length.toLocaleString("en-US")}`
            : "件数:0";

        items.forEach(product => {
            const row = document.createElement("tr");
            const values = [
                product.code ?? "",
                product.productName ?? "",
                product.productCategory ?? "",
                product.transportationRecord ?? ""
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = String(value);
                row.appendChild(cell);
            });

            row.tabIndex = 0;

            // Select a row with a single click.
            row.addEventListener("click", function () {
                selectRow(row, product);
            });

            // Apply a product with a double-click.
            row.addEventListener("dblclick", function () {
                selectRow(row, product);
                applySelectedProduct();
            });

            // Apply a product with the Enter key.
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

                    return;
                }

                if (event.key === "Enter") {
                    event.preventDefault();
                    selectRow(row, product);
                    applySelectedProduct();
                }
            });

            resultsBody.appendChild(row);
        });

        // Select the first result by default.
        const firstRow = resultsBody.querySelector("tr");
        if (firstRow) {
            selectRow(firstRow, items[0]);
        }
    }

    // Execute product name search.
    async function executeSearch() {
        const searchUrl = win.dataset.searchUrl;
        const params = new URLSearchParams();

        if (productNameFurigana.value.trim()) {
            params.set("productNameFurigana", productNameFurigana.value.trim());
        }

        if (productName.value.trim()) {
            params.set("productName", productName.value.trim());
        }

        if (productCategoryCode.value.trim()) {
            params.set("productCategoryCode", productCategoryCode.value.trim());
        }

        if (transportationRecordCode.value.trim()) {
            params.set("transportationRecordCode", transportationRecordCode.value.trim());
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

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(data.message || "品名検索に失敗しました。");
            }

            const items = Array.isArray(data) ? data : (data.items ?? data.results ?? []);
            renderResults(items);

            if (items.length === 0) {
                alert("対象データがありません");
                setMessage("");
            } else {
                setMessage("");
                resultsBody.querySelector("tr")?.focus();
            }
        } catch (error) {
            console.error("Product Name Search Error:", error);
            renderResults([]);
            setMessage("品名検索に失敗しました。");
        } finally {
            btnSearch.disabled = false;
        }
    }
    // Look up a master name using its code.
    async function lookupMasterCode(codeInput, nameInput, lookupUrl) {
        let code = codeInput.value.trim();

        // Clear the corresponding name when the code is empty.
        if (!code) {
            nameInput.value = "";
            cancelLookupFor(codeInput);
            return true;
        }

        // Validate the numeric code.
        //if (!/^\d{1,4}$/.test(code)) {
        //    codeInput.value = "";
        //    nameInput.value = "";
        //    cancelLookupFor(codeInput);
        //    setMessage("コードは4桁の数字で入力してください。");
        //    codeInput.focus();
        //    return false;
        //}

        // Convert the code to four digits.
        code = code.padStart(4, "0");
        codeInput.value = code;

        // Check whether this code is already being looked up.
        const previousState = lookupStates.get(codeInput);

        if (previousState && previousState.code === code) {
            // Reuse an ongoing request.
            if (previousState.promise) {
                return previousState.promise;
            }

            // Do not repeat a successful lookup.
            if (previousState.status === "success") {
                return true;
            }
        }

        // Cancel an older request before starting a new one.
        cancelLookupFor(codeInput);

        // Clear the previous name before lookup.
        nameInput.value = "";
        setMessage("");

        const controller = new AbortController();

        // Register request state before starting fetch.
        const state = {
            code: code,
            controller: controller,
            promise: null,
            status: "pending"
        };

        lookupStates.set(codeInput, state);

        // Start the master lookup.
        state.promise = (async function () {
            try {
                //console.log("Lookup URL:", lookupUrl);
                console.log("Lookup Code:", code);
                //const params = new URLSearchParams({ code });
                const params = new URLSearchParams({ code });
                const response = await fetch(
                    `${lookupUrl}?${params.toString()}`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json"
                        },
                        signal: controller.signal
                    }
                );

                const data = await response.json();
                //console.log("API Response:", data);
                //console.log("Name Field:", nameInput);

                // Ignore cancelled, replaced, or closed-popup requests.
                if (
                    controller.signal.aborted ||
                    lookupStates.get(codeInput) !== state ||
                    !popup.classList.contains("is-open")
                ) {
                    return false;
                }

                // Check whether the master code exists.
                if (
                    !response.ok ||
                    data.success === false ||
                    !data.name
                ) {
                    const masterName =
                        codeInput === productCategoryCode
                            ? "品名区分"
                            : "輸送実績";

                    // Clear both fields before displaying the alert.
                    codeInput.value = "";
                    nameInput.value = "";
                    setMessage("");
                    lookupStates.delete(codeInput);

                    alert(`指定した${masterName}『${code}』は未登録です！！`);

                    // Clear both fields again after closing the alert.
                    codeInput.value = "";
                    nameInput.value = "";

                    // Return focus only if the popup is still open.
                    if (popup.classList.contains("is-open")) {
                        codeInput.focus();
                    }

                    return false;
                }

                // Do not update the name if the input changed.
                if (codeInput.value.trim() !== code) {
                    return false;
                }

                // Display the retrieved master name.
                nameInput.value = data.name;

                keptValues.set(codeInput, code);

                if (codeInput === productCategoryCode) {
                    keptProductCategoryName = data.name;
                } else if (codeInput === transportationRecordCode) {
                    keptTransportationRecordName = data.name;
                }

                // Log the assigned value for debugging.
                //console.log("Assigned Category Name:", data.name);
                //console.log("Input Field Value:", nameInput.value);
                //console.log("Input Field ID:", nameInput.id);

                setMessage("");
                state.status = "success";
                state.promise = null;
                return true;

            } catch (error) {
                // Ignore requests cancelled by F11 or F12.
                if (
                    error.name === "AbortError" ||
                    controller.signal.aborted
                ) {
                    return false;
                }

                console.error("Master Code Lookup Error:", error);

                // Do not update the UI for an obsolete request.
                if (lookupStates.get(codeInput) !== state) {
                    return false;
                }

                nameInput.value = "";
                setMessage("マスタ検索に失敗しました。");
                return false;

            } finally {
                // Remove only this request.
                if (
                    lookupStates.get(codeInput) === state &&
                    state.status !== "success"
                ) {
                    lookupStates.delete(codeInput);
                }
            }
        })();

        return state.promise;
    }

    // Look up the product category.
    async function lookupProductCategory() {
        return lookupMasterCode(
            productCategoryCode,
            productCategoryName,
            win.dataset.categoryUrl
        );
    }

    // Look up the transportation record.
    async function lookupTransportationRecord() {
        return lookupMasterCode(
            transportationRecordCode,
            transportationRecordName,
            win.dataset.transportationUrl
        );
    }

    // Apply the selected product.
    function applySelectedProduct() {
        if (!selectedProduct) return;

        document.dispatchEvent(
            new CustomEvent("product-name-search-selected", {
                detail: {
                    code: selectedProduct.code,
                    productName: selectedProduct.productName,
                    productCategory: selectedProduct.productCategory,
                    transportationRecord: selectedProduct.transportationRecord
                }
            })
        );

        closePopup();
    }

    // Cancel the search.
    function cancelSearch() {
        clearFields();
        clearResults();
        setMessage("");
        productNameFurigana.focus();
    }

    // Minimize the popup.
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

    // Maximize the popup.
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
    // Prevent blur-triggered lookup when clicking F11 or F12.
    [btnCancel, btnExit].forEach(button => {
        button.addEventListener("mousedown", function (event) {
            event.preventDefault();
        });
    });

    // Register button events.
    btnSearch.addEventListener("click", executeSearch);
    btnSelect.addEventListener("click", applySelectedProduct);
    btnCancel.addEventListener("click", cancelSearch);

    btnExit.addEventListener("click", function () {
        clearFields();
        clearResults();
        setMessage("");
        closePopup();
    });

    btnClose.addEventListener("click", closePopup);
    btnMinimize.addEventListener("click", minimizePopup);
    btnMaximize.addEventListener("click", maximizePopup);

    // Open the popup from the calling screen.
    document.addEventListener("openProductNameSearchPopup", openPopup);
     
    // Look up 品名区分 when moving to 輸送実績区分.
    productCategoryCode.addEventListener("blur", function (event) {

        if (event.relatedTarget === transportationRecordCode) {
            lookupProductCategory();
        } else {
            productCategoryCode.value = keptValues.get(productCategoryCode);
            productCategoryName.value = keptProductCategoryName;
            cancelLookupFor(productCategoryCode);
        }
    });

    // Look up 輸送実績区分 when moving to フリガナ.
    transportationRecordCode.addEventListener("blur", function (event) {

        if (event.relatedTarget === productNameFurigana) {
            lookupTransportationRecord();
        } else {
            transportationRecordCode.value =
                keptValues.get(transportationRecordCode);

            transportationRecordName.value =
                keptTransportationRecordName;

            cancelLookupFor(transportationRecordCode);
        }
    });

    // Accept numeric input only.
    [productCategoryCode, transportationRecordCode].forEach(input => {
        input.addEventListener("input", function () {
            this.value = this.value.replace(/[^0-9]/g, "").slice(0, 4);

            // Clear the previous lookup result when the code changes.
            const nameInput =
                this === productCategoryCode
                    ? productCategoryName
                    : transportationRecordName;

            nameInput.value = "";
            cancelLookupFor(this);
            setMessage("");
        });
    });

    // Handle Enter key in search condition fields.
    popup.querySelectorAll(".product-name-search-table th[data-sort]")
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

                // New column starts ascending.
                // Same column toggles ascending / descending.
                sortAsc = (sortColumn === column) ? !sortAsc : true;
                sortColumn = column;

                const direction = sortAsc ? "asc" : "desc";

                rows.sort((a, b) => {
                    const left = a.children[columnIndex].textContent.trim();
                    const right = b.children[columnIndex].textContent.trim();

                    const comparison = left.localeCompare(
                        right,
                        "ja",
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );

                    return direction === "asc"
                        ? comparison
                        : -comparison;
                });

                rows.forEach(row => resultsBody.appendChild(row));
            });
        });

     
    // Get Product Master modal elements and controls.
    const productMasterModal =
        document.getElementById("productMasterModal");

    const productMasterWindow =
        document.getElementById("productMasterWindow");

    const productMasterFrame =
        document.getElementById("productMasterFrame");

    const btnProductMasterMinimize =
        document.getElementById("btnProductMasterMinimize");

    const btnProductMasterMaximize =
        document.getElementById("btnProductMasterMaximize");

    const btnProductMasterClose =
        document.getElementById("btnProductMasterClose");


    // Track Product Master modal window state.
    let isProductMasterMinimized = false;
    let isProductMasterMaximized = false;

    // F10: Open Product Master in registration mode.
    btnRegister?.addEventListener("click", function () {

        if (!productMasterModal || !productMasterFrame) return;

        // Reset modal window state.
        productMasterWindow?.classList.remove(
            "is-minimized",
            "is-maximized"
        );

        isProductMasterMinimized = false;
        isProductMasterMaximized = false;

        // Load Product Master registration page.
        productMasterFrame.src =
            "/ProductMaster/Product_master?popupMode=true";

        // Display registration modal.
        productMasterModal.style.display = "flex";
    });

    // Minimize Product Master modal.
    btnProductMasterMinimize?.addEventListener("click", function () {

        if (!productMasterWindow) return;

        if (!isProductMasterMinimized) {

            productMasterWindow.classList.remove("is-maximized");
            productMasterWindow.classList.add("is-minimized");

            isProductMasterMinimized = true;
            isProductMasterMaximized = false;

        } else {

            productMasterWindow.classList.remove("is-minimized");

            isProductMasterMinimized = false;
        }
    });

    // Maximize or restore Product Master modal.
    btnProductMasterMaximize?.addEventListener("click", function () {

        if (!productMasterWindow) return;

        if (!isProductMasterMaximized) {

            productMasterWindow.classList.remove("is-minimized");
            productMasterWindow.classList.add("is-maximized");

            isProductMasterMaximized = true;
            isProductMasterMinimized = false;

        } else {

            productMasterWindow.classList.remove("is-maximized");

            isProductMasterMaximized = false;
        }
    });

    // Close Product Master modal.
    function closeProductMasterModal() {

        if (!productMasterModal || !productMasterFrame) return;

        // Hide modal and unload iframe.
        productMasterModal.style.display = "none";
        productMasterFrame.src = "about:blank";

        // Reset modal window state.
        productMasterWindow.classList.remove(
            "is-minimized",
            "is-maximized"
        );

        isProductMasterMinimized = false;
        isProductMasterMaximized = false;
    }

    // Attach close button event.
    btnProductMasterClose?.addEventListener(
        "click",
        closeProductMasterModal
    );

    // Close modal when iframe sends a close request.
    //window.addEventListener("message", function (event) {

    //    if (event.origin !== window.location.origin) return;

    //    if (event.data?.action === "closeProductMasterModal") {
    //        closeProductMasterModal();
    //    }
    //});

    // Close the modal when the iframe sends a close request.
    window.addEventListener("message", function (event) {

        if (event.origin !== window.location.origin) return;

        if (event.data?.action === "closeProductMasterModal") {
            btnProductMasterClose?.click();
        }
    });

    //// Open the temporary master registration screen.
    //btnRegister?.addEventListener("click", function () {
    //    window.parent.postMessage(
    //        { action: "openDummyMasterRegistration" },
    //        window.location.origin
    //    );
    //});


    // below is the Product cat & transport search screen inside the product search screen

    // =========================================
    // F6 Master Search Elements
    // =========================================

    const btnProductNameSearchF6 =
        document.getElementById("btnProductNameSearchF6");

    const searchProductCategoryCode =
        document.getElementById("searchProductCategoryCode");

    const searchProductCategoryName =
        document.getElementById("searchProductCategoryName");

    const searchTransportationRecordCode =
        document.getElementById("searchTransportationRecordCode");

    const searchTransportationRecordName =
        document.getElementById("searchTransportationRecordName");

    // Track the currently focused master field.
    let activeMasterSearchField = null;

    // Track selection from each popup.
    let isProductCategorySelectedFromPopup = false;
    let isTransportRecordSelectedFromPopup = false;


    // =========================================
    // Normalize Master Code
    // =========================================

    function normalizeMasterCode(value) {

        const code = String(value || "").trim();

        if (!/^\d{1,4}$/.test(code)) {
            return "";
        }

        return code.padStart(4, "0");
    }


    // =========================================
    // Enable / Disable F6 Button
    // =========================================

    // 品名区分 focus.
    searchProductCategoryCode?.addEventListener("focus", function () {

        activeMasterSearchField = "productCategory";

        btnProductNameSearchF6.disabled = false;
    });

    // 輸送実績区分 focus.
    searchTransportationRecordCode?.addEventListener("focus", function () {

        activeMasterSearchField = "transportationRecord";

        btnProductNameSearchF6.disabled = false;
    });

    // Disable F6 when focus moves outside both code fields.
    document.addEventListener("focusin", function (event) {

        if (
            event.target !== searchProductCategoryCode &&
            event.target !== searchTransportationRecordCode &&
            event.target !== btnProductNameSearchF6
        ) {

            btnProductNameSearchF6.disabled = true;

            activeMasterSearchField = null;
        }
    });


    // =========================================
    // Open Appropriate Master Search Popup
    // =========================================

    //function openMasterSearchPopup() {

    //    if (!activeMasterSearchField) {
    //        return;
    //    }

    //    if (activeMasterSearchField === "productCategory") {

    //        document.dispatchEvent(
    //            new CustomEvent("openProductClassificationSearchPopup")
    //        );

    //    } else if (activeMasterSearchField === "transportationRecord") {

    //        document.dispatchEvent(
    //            new CustomEvent("openTransportationRecordSearchPopup")
    //        );
    //    }
    //}

    // =========================================
    // Open Product Classification Search
    // =========================================

    function openMasterSearchPopup() {

        if (!activeMasterSearchField) return;

        if (activeMasterSearchField === "productCategory") {

            document.dispatchEvent(
                new CustomEvent("openProductClassificationSearchPopup", {
                    detail: {
                        source: "productNameSearch"
                    }
                })
            );

        } else if (activeMasterSearchField === "transportationRecord") {

            document.dispatchEvent(
                new CustomEvent("openTransportationRecordSearchPopup", {
                    detail: {
                        source: "productNameSearch"
                    }
                })
            );
        }
    }


    // =========================================
    // F6 Button Click
    // =========================================

    // Prevent focus from moving to the F6 button.
    btnProductNameSearchF6?.addEventListener("mousedown", function (event) {

        event.preventDefault();
    });

    // Open the appropriate popup when F6 button is clicked.
    btnProductNameSearchF6?.addEventListener("click", function () {

        openMasterSearchPopup();
    });


    // =========================================
    // F6 Keyboard Shortcut
    // =========================================

    //document.addEventListener("keydown", function (event) {

    //    if (
    //        event.key === "F6" &&
    //        btnProductNameSearchF6 &&
    //        !btnProductNameSearchF6.disabled
    //    ) {

    //        event.preventDefault();

    //        openMasterSearchPopup();
    //    }
    //});


    //// =========================================
    //// Receive Selected Product Classification
    //// =========================================

    //document.addEventListener(
    //    "product-classification-search-selected",
    //    function (event) {

    //        const selectedCategory = event.detail;

    //        if (!selectedCategory) {
    //            return;
    //        }

    //        const code = normalizeMasterCode(
    //            String(selectedCategory.code || "")
    //        );

    //        if (!code) {
    //            return;
    //        }

    //        // Set 品名区分コード.
    //        searchProductCategoryCode.value = code;

    //        // Set 品名区分名称.
    //        searchProductCategoryName.value =
    //            selectedCategory.productCategoryName || "";

    //        // Mark selection completed.
    //        isProductCategorySelectedFromPopup = true;
    //    }
    //);

    // =========================================
    // Receive Selected Product Classification
    // =========================================

    document.addEventListener(
        "product-classification-search-selected",
        function (event) {

            const selectedCategory = event.detail;

            // Process only Product Name Search selections.
            if (selectedCategory?.source !== "productNameSearch") {
                return;
            }

            const code = normalizeMasterCode(
                String(selectedCategory.code || "")
            );

            if (!code) return;

            // Set 品名区分コード.
            searchProductCategoryCode.value = code;
            keptValues.set(productCategoryCode, code);

            // Set 品名区分名称.
            searchProductCategoryName.value =
                selectedCategory.productCategoryName || "";

            keptProductCategoryName =
                searchProductCategoryName.value;

            isProductCategorySelectedFromPopup = true;
        }
    );


    // =========================================
    // Product Classification Popup Close
    // =========================================
    document.addEventListener(
        "product-classification-search-closed",
        function (event) {

            if (event.detail?.source !== "productNameSearch") {
                return;
            }

            if (isProductCategorySelectedFromPopup) {

                isProductCategorySelectedFromPopup = false;
                transportationRecordCode.focus();

            } else {

                productCategoryCode.focus();
            }
        }
    );


    // =========================================
    // Receive Selected Transportation Record
    // =========================================

    document.addEventListener(
        "transportation-record-search-selected",
        function (event) {

            const selectedRecord = event.detail;

            // Process only Product Name Search selections.
            if (selectedRecord?.source !== "productNameSearch") {
                return;
            }

            const code = normalizeMasterCode(
                String(selectedRecord.code || "")
            );

            if (!code) return;

            // Set 輸送実績区分コード.
            transportationRecordCode.value = code;
            keptValues.set(transportationRecordCode, code);

            // Set 輸送実績区分名称.
            transportationRecordName.value =
                selectedRecord.transportationRecordName || "";

            keptTransportationRecordName =
                transportationRecordName.value;

            isTransportRecordSelectedFromPopup = true;
        }
    );


    // =========================================
    // Transportation Record Popup Close
    // =========================================

    document.addEventListener(
        "transportation-record-search-closed",
        function (event) {

            if (event.detail?.source !== "productNameSearch") {
                return;
            }

            if (isTransportRecordSelectedFromPopup) {

                isTransportRecordSelectedFromPopup = false;
                productNameFurigana.focus();

            } else {

                transportationRecordCode.focus();
            }
        }
    );
});