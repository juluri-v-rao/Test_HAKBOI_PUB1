document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("driverSearchPopup");
    const win = document.getElementById("driverSearchWindow");

    if (!popup || !win) return;

    popup.querySelectorAll(".driver-search-footer button:disabled")
        .forEach(button => {
            if (button.id === "btnDriverSearchF9" ||
                button.id === "btnDriverSearchMasterSearch") return;
            button.hidden = true;
        });


    const furigana = document.getElementById("searchDriverFurigana");
    const driverName = document.getElementById("searchDriverName");
    const category = document.getElementById("searchDriverCategory");
    const subcontractor = document.getElementById("searchDriverSubcontractor");

    // =========================================
    // Driver Search - Input Conversion
    // =========================================

    // Convert full-width characters to half-width.
    // Same conversion logic as Shipper Search.
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

    // Handle Japanese IME composition.
    furigana.addEventListener("compositionstart", function () {
        this.dataset.composing = "true";
    });

    furigana.addEventListener("compositionend", function () {
        delete this.dataset.composing;

        this.value = limitBytes(
            convertToHalfWidth(this.value),
            16
        );
    });

    // Convert and limit フリガナ during typing and paste.
    furigana.addEventListener("input", function (event) {

        if (event.isComposing || this.dataset.composing === "true") {
            return;
        }

        this.value = limitBytes(
            convertToHalfWidth(this.value),
            16
        );
    });

    // 運転手名: 16-byte limit.
    driverName.addEventListener("input", function () {
        this.value = limitBytes(this.value, 16);
    });

    // =========================================
    // Legacy .Tag behavior for search fields
    // =========================================

    // フリガナ:
    // Keep value only when moving to 運転手名.
    furigana.addEventListener("focusout", function (event) {

        if (event.relatedTarget === driverName) {
            keptFurigana = furigana.value;
        } else {
            furigana.value = keptFurigana;
        }
    });

    // 運転手名:
    // Keep value only when moving to 運転手区分.
    driverName.addEventListener("focusout", function (event) {

        if (event.relatedTarget === category) {
            keptDriverName = driverName.value;
        } else {
            driverName.value = keptDriverName;
        }
    });

    // 区分: 1 digit only.
    category.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 1);
    });

    // 車輌・傭車コード: 10 digits only.
    subcontractor.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 10);
    });

    const driverCodeLabel =
        document.getElementById("driverCodeLabel");

    const driverCodeDropdown =
        document.getElementById("driverCodeDropdown");

    const driverCodeName =
        document.getElementById("driverCodeName");


    const resultsBody = document.getElementById("driverSearchResults");
    const resultCount = document.getElementById("driverSearchCount");
    const message = document.getElementById("driverSearchMessage");

    const btnSearch = document.getElementById("btnDriverSearchExecute");
    const btnSelect = document.getElementById("btnDriverSearchSelect");
    const btnCancel = document.getElementById("btnDriverSearchCancel");
    const btnExit = document.getElementById("btnDriverSearchExit");
    const btnF6 = document.getElementById("btnDriverSearchMasterSearch");
    const btnF10 = document.getElementById("btnDriverSearchRegister");

    const btnMinimize = document.getElementById("btnDriverSearchMinimize");
    const btnMaximize = document.getElementById("btnDriverSearchMaximize");
    const btnClose = document.getElementById("btnDriverSearchClose");

 
    let searchResults = [];
    let selectedDriver = null;
    let isDriverSearchMaximized = false;
    let isDriverSearchMinimized = false;

    let sortColumn = null;
    let sortAsc = true;

    let keptDriverCode = "";

    let keptFurigana = "";
    let keptDriverName = "";

    let isDriverCodeValidating = false;

    const categoryLabels = {
        "0": "自社",
        "1": "傭車",
        "2": "契約"
    };

    function setMessage(text) {
        if (message) {
            message.textContent = text;
        }
    }

    // =========================================
    // Vehicle / Chartered Dropdown
    // =========================================

    let currentCategory = "";
    let driverCodeOptionsController = null;

    function clearDriverCodeDropdown() {
        driverCodeDropdown.replaceChildren();

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "選択してください";

        driverCodeDropdown.appendChild(defaultOption);
        driverCodeDropdown.value = "";
        driverCodeDropdown.disabled = true;

        driverCodeName.textContent = "";
    }

    async function loadDriverCodeOptions(driverCategory) {

        // Cancel any previous dropdown request.
        if (driverCodeOptionsController) {
            driverCodeOptionsController.abort();
            driverCodeOptionsController = null;
        }

        clearDriverCodeDropdown();

        if (!["0", "1", "2"].includes(driverCategory)) {
            return;
        }

        const optionsUrl = win.dataset.codeOptionsUrl;

        if (!optionsUrl) {
            console.error("Driver code options URL is not configured.");
            return;
        }

        const controller = new AbortController();
        driverCodeOptionsController = controller;

        driverCodeDropdown.disabled = true;

        try {
            const params = new URLSearchParams({
                driverCategory: driverCategory
            });

            const response = await fetch(
                `${optionsUrl}?${params.toString()}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json"
                    },
                    signal: controller.signal
                }
            );

            if (!response.ok) {
                throw new Error("Failed to load driver code options.");
            }

            const data = await response.json();

            // Ignore outdated responses.
            if (
                controller.signal.aborted ||
                currentCategory !== driverCategory
            ) {
                return;
            }

            if (data.success !== true) {
                throw new Error(
                    data.message || "Dropdown loading failed."
                );
            }

            const items = data.items ?? [];

            items.forEach(item => {
                const option = document.createElement("option");

                option.value = item.code ?? "";
                option.textContent = item.displayName ?? "";
                option.dataset.name = item.displayName ?? "";

                driverCodeDropdown.appendChild(option);
            });

            driverCodeDropdown.disabled = false;

        } catch (error) {

            if (error.name === "AbortError") {
                return;
            }

            console.error(
                "Driver code dropdown loading error:",
                error
            );

            setMessage("車輌・傭車マスタの読込に失敗しました。");

            driverCodeDropdown.disabled = true;

        } finally {
            if (driverCodeOptionsController === controller) {
                driverCodeOptionsController = null;
            }
        }
    }
    // =========================================
    // Validate and select Vehicle / Chartered Code
    // =========================================

    async function validateAndSelectDriverCode() {

        const enteredCode = subcontractor.value.trim();

        // Blank code: no validation required.
        if (!enteredCode) {
            keptDriverCode = "";
            driverCodeDropdown.value = "";
            driverCodeName.textContent = "";
            return true;
        }

        const driverCategory = category.value.trim();

        // 区分 is blank or invalid.
        // Restore the kept code and move focus to 区分.
        if (!["0", "1", "2"].includes(driverCategory)) {

            subcontractor.value = keptDriverCode;
            category.focus();

            return false;
        }

        // Legacy: Always pad to 10 characters.
        // Do not reject non-numeric values before lookup.
        const normalizedCode = enteredCode.padStart(10, "0");

        subcontractor.value = normalizedCode;

        // Ensure dropdown options have finished loading.
        if (driverCodeDropdown.disabled) {
            await loadDriverCodeOptions(driverCategory);
        }

        const matchingOption = Array.from(
            driverCodeDropdown.options
        ).find(option =>
            option.value.trim().padStart(10, "0") === normalizedCode
        ); 

        if (!matchingOption || !matchingOption.value) {

            alert(
                "指定したコード『" +
                normalizedCode +
                "』は未登録です！！"
            );

            // Restore the previously kept value.
            subcontractor.value = keptDriverCode;

            subcontractor.focus();
            subcontractor.select();

            return false;
        }

        // Select the matching dropdown option.
        driverCodeDropdown.value = matchingOption.value;

        // Update the code and name.
        subcontractor.value = normalizedCode;

        driverCodeName.textContent =
            matchingOption.dataset.name || matchingOption.textContent;

        keptDriverCode = normalizedCode;

        setMessage("");

        return true;
    }
 
    // =========================================
    // Search Popup - Drag Window
    // =========================================

    function initializedriverNameSearchDrag() {
        const dragWindow = document.getElementById("driverSearchWindow");
        const titlebar = dragWindow?.querySelector(
            ".driver-search-titlebar"
        );

        if (!dragWindow || !titlebar) return;

        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        titlebar.addEventListener("mousedown", function (event) {
            if (event.target.closest("button")) return;

            isDragging = true;

            const rect = dragWindow.getBoundingClientRect();

            offsetX = event.clientX - rect.left;
            offsetY = event.clientY - rect.top;

            dragWindow.style.position = "fixed";
            dragWindow.style.margin = "0";
            dragWindow.style.transform = "none";

            event.preventDefault();
        });

        document.addEventListener("mousemove", function (event) {
            if (!isDragging) return;

            dragWindow.style.left =
                (event.clientX - offsetX) + "px";

            dragWindow.style.top =
                (event.clientY - offsetY) + "px";
        });

        document.addEventListener("mouseup", function () {
            isDragging = false;
        });
    }

    initializedriverNameSearchDrag();

    // =========================================
    // Driver Code Validation
    // =========================================

    
    // =========================================
    // Validate Driver Code when moving to フリガナ
    // =========================================

    subcontractor.addEventListener("blur", async function (event) {

        // Ignore blur caused by keyboard validation.
        if (isDriverCodeValidating) {
            return;
        }

        // Validate only when focus moves to フリガナ.
        if (event.relatedTarget !== furigana) {
            return;
        }

        isDriverCodeValidating = true;

        try {
            const isValid = await validateAndSelectDriverCode();

            if (!isValid) {
                subcontractor.focus();
                subcontractor.select();
            }
        } finally {
            isDriverCodeValidating = false;
        }
    }); 

    // =========================================
    // F6 Button State
    // =========================================

    function updateF6State() {

        const validCategory = ["0", "1", "2"].includes(
            category.value.trim()
        );

        const codeFieldFocused =
            document.activeElement === subcontractor;

        btnF6.disabled = !(validCategory && codeFieldFocused);
    }

    subcontractor.addEventListener("focus", updateF6State);
    subcontractor.addEventListener("blur", updateF6State);

    category.addEventListener("input", updateF6State);
    category.addEventListener("change", updateF6State);

    // Initialize F6 state.
    updateF6State();

    // =========================================
    // Driver Category
    // =========================================

    function setCategory(value) {

        value = String(value ?? "").trim();

        const previousCategory = currentCategory;

        category.value = value;

        if (["0", "1", "2"].includes(value)) {
            keptCategory = value;
        }

        popup.querySelectorAll(".driver-category-options button")
            .forEach(button => {
                button.classList.toggle(
                    "active",
                    button.dataset.value === value
                );
            });

        // Update the fourth-row label.
        if (value === "0") {
            driverCodeLabel.textContent = "車　　輌";
        }
        else if (value === "1" || value === "2") {
            driverCodeLabel.textContent = "傭　　車";
        }
        else {
            driverCodeLabel.textContent = "";
        }

        // Clear and reload only when the category changes.
        if (previousCategory !== value) {

            subcontractor.value = "";
            keptDriverCode = "";

            clearDriverCodeDropdown();

            if (["0", "1", "2"].includes(value)) {
                loadDriverCodeOptions(value);
            }
        }

        currentCategory = value;

        updateF6State();
    }

    btnF6.addEventListener("mousedown", function (event) {
        event.preventDefault();
    });

    // =========================================
    // Prevent footer buttons from taking focus
    // =========================================

    [btnSelect, btnSearch, btnCancel, btnExit].forEach(button => {
        button?.addEventListener("mousedown", function (event) {
            event.preventDefault();
        });
    });

    function validateCategory() {
        const value = category.value.trim();

        if (!["0", "1", "2"].includes(value)) {
            alert(
                "運転手区分を正しく入力して下さい！！（0・1・2）"
            );

            setCategory(keptCategory);
            category.focus();

            return false;
        }

        setCategory(value);
        keptCategory = value;

        return true;
    }

    // =========================================
    // Legacy Search-Condition Keyboard Navigation
    // =========================================

    const driverSearchFields = [
        furigana,
        driverName,
        category,
        subcontractor
    ];

    function getPreviousSearchField(currentField) {
        const index = driverSearchFields.indexOf(currentField);

        if (index < 0) return null;

        return driverSearchFields[
            (index - 1 + driverSearchFields.length) %
            driverSearchFields.length
        ];
    }

    function getNextSearchField(currentField) {
        const index = driverSearchFields.indexOf(currentField);

        if (index < 0) return null;

        return driverSearchFields[
            (index + 1) % driverSearchFields.length
        ];
    }

    driverSearchFields.forEach(field => {
        field.addEventListener("keydown", async function (event) {

            // Enter / ArrowDown: Next field.
            if (
                event.key === "Enter" ||
                event.key === "ArrowDown"
            ) {
                event.preventDefault();

                if (field === category) {
                    if (!validateCategory()) {
                        return;
                    }

                    isCategoryValidating = true;

                    try {
                        getNextSearchField(field)?.focus();
                    } finally {
                        isCategoryValidating = false;
                    }

                    return;
                }

                if (field === subcontractor) {

                    isDriverCodeValidating = true;

                    try {

                        const isValid = await validateAndSelectDriverCode();

                        if (!isValid) {
                            event.preventDefault();
                            return;
                        }

                        getNextSearchField(field)?.focus();

                    } finally {
                        isDriverCodeValidating = false;
                    }

                    return;
                }

                getNextSearchField(field)?.focus();
                return;
            }
            // Tab from code input: validate before moving focus.
            if (field === subcontractor && event.key === "Tab" && !event.shiftKey) {

                event.preventDefault();

                isDriverCodeValidating = true;

                try {

                    const isValid = await validateAndSelectDriverCode();

                    if (isValid) {
                        furigana.focus();
                    }

                } finally {
                    isDriverCodeValidating = false;
                }

                return;
            }
            // ArrowUp / Escape: Previous field.
            if (
                event.key === "ArrowUp" ||
                event.key === "Escape"
            ) {
                event.preventDefault();

                getPreviousSearchField(field)?.focus();
            }
        });
    });

    // =========================================
    // Category Change
    // =========================================

    category.addEventListener("change", function () {
        setCategory(category.value.trim());
    });

    // 退社日 IS NULL only:
    // Set by caller on open (legacy SelMX = "9" in 新規).
    let activeOnly = false;
    let keptCategory = "";
    let isCategoryValidating = false;

    // Mouse navigation: validate 区分 when moving to コード.
    // Keyboard navigation validates in the keydown handler.
    category.addEventListener("focusout", function (event) {
        if (
            isCategoryValidating ||
            event.relatedTarget !== subcontractor
        ) {
            return;
        }

        if (!validateCategory()) {
            category.focus();
        }
    });

    // =========================================
    // Open Driver Search Popup
    // =========================================

    function openPopup(event) {
        activeOnly = event?.detail?.activeOnly === true;

        clearFields();
        renderResults([]);
        setMessage("");

        sortColumn = null;
        sortAsc = true;

        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");

        furigana.focus();
    }

    // =========================================
    // Close Driver Search Popup
    // =========================================

    function closePopup() {
        popup.classList.remove("is-open");
        popup.setAttribute("aria-hidden", "true");

        win.classList.remove(
            "is-minimized",
            "is-maximized",
            "minimized",
            "maximized"
        );

        win.style.width = "";
        win.style.height = "";

        isDriverSearchMaximized = false;
        isDriverSearchMinimized = false;
        selectedDriver = null;
    }

    

    // =========================================
    // Clear Search Fields
    // =========================================

    function clearFields() {
        furigana.value = "";
        driverName.value = "";
        subcontractor.value = "";

        // Reset legacy kept values.
        keptFurigana = "";
        keptDriverName = "";

        keptDriverCode = "";
        keptCategory = "";

        const codeName = document.getElementById("driverCodeName");

        if (codeName) {
            codeName.textContent = "";
        }

        setCategory("");
    }

    // =========================================
    // Select Result Row
    // =========================================

    function selectRow(row, driver) {
        resultsBody.querySelectorAll("tr").forEach(item => {
            item.classList.remove("is-selected");
        });

        row.classList.add("is-selected");
        selectedDriver = driver;

        setMessage("");
    }
    // =========================================
    // Display Search Results
    // =========================================

    function renderResults(items) {
        searchResults = Array.isArray(items) ? items : [];
        selectedDriver = null;

        resultsBody.replaceChildren();

        // Hide retirement column in active-only mode.
        const retirementHeader = popup.querySelector(
            '.driver-search-table th[data-sort="retirementDate"]'
        );

        if (retirementHeader) {
            retirementHeader.hidden = activeOnly;
        }

        resultCount.textContent = searchResults.length
            ? `件数：${searchResults.length.toLocaleString("en-US")}`
            : "件数:0";

        searchResults.forEach(driver => {
            const row = document.createElement("tr");

            const values = [
                driver.driverCode ?? "",
                driver.driverName ?? "",
                driver.retirementDate ? "[済]" : "",
                driver.mobileNumber ?? "",
                categoryLabels[String(driver.driverCategory)] ??
                driver.driverCategory ?? "",
                driver.vehicleCode ?? "",
                driver.subcontractorName ?? ""
            ];

            values.forEach((value, index) => {
                const cell = document.createElement("td");

                cell.textContent = String(value);

                // Hide third column (退職) in active-only mode.
                if (index === 2) {
                    cell.hidden = activeOnly;
                }

                row.appendChild(cell);
            });

            row.tabIndex = 0;

            // Keep the driver associated with its row.
            row._driver = driver;

            row.addEventListener("click", function () {
                selectRow(row, driver);
            });

            row.addEventListener("dblclick", function () {
                selectRow(row, driver);
                applySelectedDriver();
            });

            row.addEventListener("keydown", function (event) {

                // ArrowDown: Move to the next row.
                if (event.key === "ArrowDown") {
                    event.preventDefault();

                    const nextRow = row.nextElementSibling;

                    if (nextRow) {
                        selectRow(nextRow, nextRow._driver);
                        nextRow.focus();
                    }

                    return;
                }

                // ArrowUp: Move to the previous row.
                if (event.key === "ArrowUp") {
                    event.preventDefault();

                    const previousRow = row.previousElementSibling;

                    if (previousRow) {
                        selectRow(previousRow, previousRow._driver);
                        previousRow.focus();
                    }

                    return;
                }

                // Enter: Select the current row.
                if (event.key === "Enter") {
                    event.preventDefault();

                    selectRow(row, driver);
                    applySelectedDriver();
                }
            });

            resultsBody.appendChild(row);
        });

        const firstRow = resultsBody.querySelector("tr");

        if (firstRow && searchResults.length > 0) {
            selectRow(firstRow, searchResults[0]);
        }
    }

    // =========================================
    // Execute Driver Search
    // =========================================

    async function executeSearch() {
        const searchUrl = win.dataset.searchUrl;

        if (!searchUrl) {
            setMessage("検索URLが設定されていません。");
            return;
        }

        const params = new URLSearchParams();

        if (furigana.value) {
            params.set("furigana", furigana.value);
        }

        if (driverName.value) {
            params.set("driverName", driverName.value);
        }

        // Send driver category to search API.
        if (category.value.trim()) {
            const driverCategory = category.value.trim();

            if (!["0", "1", "2"].includes(driverCategory)) {
                alert(
                    "運転手区分を正しく入力して下さい！！（0・1・2）"
                );

                category.focus();
                return;
            }

            params.set("driverCategory", driverCategory);
        }

        if (subcontractor.value.trim()) {
            params.set(
                "subcontractorCode",
                subcontractor.value.trim()
            );
        }

        if (activeOnly) {
            params.set("activeOnly", "true");
        }

        btnSearch.disabled = true;
        setMessage("検索中！！　暫くお待ち下さい");

        try {
            const query = params.toString();

            const url = query
                ? `${searchUrl}?${query}`
                : searchUrl;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Accept: "application/json"
                }
            });

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(
                    data.message || "運転手検索に失敗しました。"
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
            console.error("Driver Search Error:", error);

            renderResults([]);
            setMessage("運転手検索に失敗しました。");

        } finally {
            btnSearch.disabled = false;
        }
    }

    // =========================================
    // Apply Selected Driver
    // =========================================

    function applySelectedDriver() {
        if (!selectedDriver) return;

        document.dispatchEvent(
            new CustomEvent("driver-search-selected", {
                detail: {
                    driverCode: selectedDriver.driverCode ?? "",
                    driverName: selectedDriver.driverName ?? ""
                }
            })
        );

        clearFields();
        renderResults([]);
        setMessage("");

        closePopup();
    }

    // =========================================
    // Cancel Search
    // =========================================

    function cancelSearch() {
        clearFields();
        renderResults([]);
        setMessage("");

        furigana.focus();
        furigana.select();
    }

    // =========================================
    // Minimize Driver Search Window
    // =========================================

    function minimizeDriverSearchPopup() {
        if (!isDriverSearchMinimized) {
            win.classList.remove(
                "maximized",
                "is-maximized"
            );

            win.classList.add("minimized");

            win.style.width = "";
            win.style.height = "100px";

            isDriverSearchMinimized = true;
            isDriverSearchMaximized = false;

        } else {
            win.classList.remove(
                "minimized",
                "is-minimized"
            );

            win.style.height = "";

            isDriverSearchMinimized = false;
        }
    }

    // =========================================
    // Maximize Driver Search Window
    // =========================================

    function maximizeDriverSearchPopup() {
        if (!isDriverSearchMaximized) {
            win.classList.remove(
                "minimized",
                "is-minimized"
            );

            win.classList.add("maximized");

            win.style.width = "100vw";
            win.style.height = "100vh";

            isDriverSearchMaximized = true;
            isDriverSearchMinimized = false;

        } else {
            win.classList.remove(
                "maximized",
                "is-maximized"
            );

            win.style.width = "";
            win.style.height = "";

            isDriverSearchMaximized = false;
        }
    }

    // =========================================
    // Close Driver Search Window
    // =========================================

    function closeDriverSearchPopup() {
        closePopup();
    }
    // =========================================
    // Driver Category Selection Buttons
    // =========================================

    popup.querySelectorAll(".driver-category-options button")
        .forEach(button => {
            button.addEventListener("click", function () {

                const newCategory = button.dataset.value;

                setCategory(newCategory);

                subcontractor.focus();
            });
        });
    // =========================================
    // Button Event Registration
    // =========================================

    btnSearch.addEventListener("click", executeSearch);
    btnSelect.addEventListener("click", applySelectedDriver);
    btnCancel.addEventListener("click", cancelSearch);

    btnExit.addEventListener("click", function () {
        cancelSearch();
        closePopup();
    });

    // =========================================
    // Window Control Buttons
    // =========================================

    btnMinimize?.addEventListener(
        "click",
        minimizeDriverSearchPopup
    );

    btnMaximize?.addEventListener(
        "click",
        maximizeDriverSearchPopup
    );

    btnClose?.addEventListener(
        "click",
        closeDriverSearchPopup
    );

    // =========================================
    // F6 - Vehicle / Chartered Master Search
    // =========================================

    btnF6.addEventListener("mousedown", function (event) {
        event.preventDefault();
    });

    function openMasterSearch() {

        const driverCategory = category.value.trim();

        if (!["0", "1", "2"].includes(driverCategory)) {
            return;
        }

        if (driverCategory === "0") {

            document.dispatchEvent(
                new CustomEvent("openVehicleSearchPopup", {
                    detail: {
                        activeOnly: false,
                        source: "driverSearch"
                    }
                })
            );

        } else {

            document.dispatchEvent(
                new CustomEvent("openCharteredSearchPopup", {
                    detail: {
                        activeOnly: false,
                        source: "driverSearch"
                    }
                })
            );
        }
    }

    btnF6.addEventListener("click", openMasterSearch);

    
    // =========================================
    // Vehicle Search Selection
    // =========================================

    let vehicleSelectionCompleted = false;

    document.addEventListener(
        "vehicle-search-selected",
        function (event) {

            const data = event.detail;
            if (!data) return;

            subcontractor.value = data.vehicleCode ?? "";
            keptDriverCode = subcontractor.value;
            const opt = Array.from(driverCodeDropdown.options)
                .find(o =>
                    o.value.trim().padStart(10, "0") ===
                    subcontractor.value.trim().padStart(10, "0")
                );

            driverCodeDropdown.value = opt ? opt.value : "";

            if (driverCodeName) {
                driverCodeName.textContent =
                    data.vehicleNumber ?? "";
            }

            vehicleSelectionCompleted = true;

            // Legacy: move focus to フリガナ.
            furigana.focus();
        }
    );

    // =========================================
    // Return focus after Vehicle Search closes
    // =========================================

    document.addEventListener(
        "vehicle-search-closed",
        function () {

            if (!vehicleSelectionCompleted) {
                subcontractor.focus();
                updateF6State();
            }

            vehicleSelectionCompleted = false;
        }
    );

    let charteredSelectionCompleted = false;

    document.addEventListener(
        "chartered-search-selected",
        function (event) {
            const data = event.detail;
            if (!data) return;

            subcontractor.value = data.charteredCode ?? "";
            const opt = Array.from(driverCodeDropdown.options)
                .find(o =>
                    o.value.trim().padStart(10, "0") ===
                    subcontractor.value.trim().padStart(10, "0")
                );

            driverCodeDropdown.value = opt ? opt.value : "";
            if (driverCodeName) {
                driverCodeName.textContent =
                    data.abbreviation ??
                    data.charteredName ??
                    "";
            }

            keptDriverCode = subcontractor.value;
            charteredSelectionCompleted = true;

            furigana.focus();
        }
    );

    document.addEventListener(
        "chartered-search-closed",
        function () {
            if (!charteredSelectionCompleted) {
                subcontractor.focus();
                updateF6State();
            }

            charteredSelectionCompleted = false;
        }
    );

    // =========================================
    // Vehicle / Chartered Dropdown Selection
    // =========================================

    driverCodeDropdown.addEventListener("change", function () {

        const selectedOption = this.selectedOptions[0];

        if (!selectedOption || !selectedOption.value) {
            return;
        }

        let selectedCode = selectedOption.value.trim();

        // Apply the same 10-digit padding used by manual validation.
        if (/^\d+$/.test(selectedCode) && selectedCode.length <= 10) {
            selectedCode = selectedCode.padStart(10, "0");
        }

        subcontractor.value = selectedCode;
        keptDriverCode = selectedCode;

        driverCodeName.textContent =
            selectedOption.dataset.name || "";

        // Move focus to フリガナ, as in the legacy screen.
        furigana.focus();
    });

    // =========================================
    // Chartered Search Selection
    // =========================================
     

    // =========================================
    // F10 - Driver Master Registration
    // =========================================

    const masterModal = document.getElementById(
        "driverMasterModal"
    );

    const masterWindow = document.getElementById(
        "driverMasterWindow"
    );

    const masterFrame = document.getElementById(
        "driverMasterFrame"
    );

    const masterMinimizeButton = document.getElementById(
        "btnDriverMasterMinimize"
    );

    const masterMaximizeButton = document.getElementById(
        "btnDriverMasterMaximize"
    );

    const masterCloseButton = document.getElementById(
        "btnDriverMasterClose"
    );

    // Open Driver Master.
    function openDriverMaster() {

        if (!masterModal || !masterFrame) {
            console.error("Driver Master modal was not found.");
            return;
        }

        masterWindow?.classList.remove(
            "is-minimized",
            "is-maximized"
        );

        masterFrame.src =
            "/DriverMaster/Driver_master?mode=search";

        masterModal.classList.add("is-open");
        masterModal.style.display = "flex";
    }

    // Close Driver Master.
    function closeDriverMaster() {

        if (!masterModal || !masterFrame) return;

        masterModal.classList.remove("is-open");
        masterModal.style.display = "none";

        masterWindow?.classList.remove(
            "is-minimized",
            "is-maximized"
        );

        masterFrame.src = "about:blank";
    }

    // F10: Open Driver Master.
    btnF10?.addEventListener("mousedown", function (event) {
        event.preventDefault();
    });

    btnF10?.addEventListener("click", function () {
        openDriverMaster();
    });

    // Minimize.
    masterMinimizeButton?.addEventListener("click", function () {

        masterWindow?.classList.toggle("is-minimized");
        masterWindow?.classList.remove("is-maximized");

    });

    // Maximize.
    masterMaximizeButton?.addEventListener("click", function () {

        masterWindow?.classList.toggle("is-maximized");
        masterWindow?.classList.remove("is-minimized");

    });

    // Close using title-bar button.
    masterCloseButton?.addEventListener(
        "click",
        closeDriverMaster
    );

    // Receive F12 close request from Driver Master iframe.
    window.addEventListener("message", function (event) {

        if (event.origin !== window.location.origin) return;

        if (event.data?.action === "closeDriverMasterModal") {
            closeDriverMaster();
        }
    });

    // =========================================
    // Grid Sorting
    // =========================================

    popup.querySelectorAll(
        ".driver-search-table th[data-sort]"
    ).forEach(header => {
        header.addEventListener("click", function () {
            const column = this.dataset.sort;

            const headers = Array.from(
                popup.querySelectorAll(
                    ".driver-search-table th[data-sort]"
                )
            );

            const columnIndex = headers.indexOf(this);

            const rows = Array.from(
                resultsBody.querySelectorAll("tr")
            );

            if (columnIndex < 0 || rows.length === 0) {
                return;
            }

            if (sortColumn === column) {
                sortAsc = !sortAsc;
            } else {
                sortColumn = column;
                sortAsc = true;
            }

            const direction = sortAsc ? "asc" : "desc";

            rows.sort((a, b) => {
                const left =
                    a.children[columnIndex].textContent.trim();

                const right =
                    b.children[columnIndex].textContent.trim();

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

            rows.forEach(row => {
                resultsBody.appendChild(row);
            });
        });
    });

    // =========================================
    // Open Driver Search Popup
    // =========================================

    document.addEventListener(
        "openDriverSearchPopup",
        openPopup
    );

    // =========================================
    // Function Keys
    // =========================================

    // Function-key handling can be enabled here if required.
    // F1  = Select
    // F5  = Search
    // F6  = Master Search
    // F10 = Driver Master Registration
    // F11 = Cancel
    // F12 = Exit

});