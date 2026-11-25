document.addEventListener("DOMContentLoaded", function () {

    const popup = document.getElementById("orderSearchOverlay");
    const win = document.getElementById("orderSearchWindow");

    if (!popup || !win) return;

    // =========================================
    // Search Condition Fields
    // =========================================

    const shipperCode = document.getElementById("searchOrderShipperCode");
    const shipperName = document.getElementById("searchOrderShipperName");
    const charteringCompanyCode = document.getElementById("searchOrderCharteringCompanyCode");
    const driverCode = document.getElementById("searchOrderDriverCode");
    const vehicleCode = document.getElementById("searchOrderVehicleCode");
    const originCode = document.getElementById("searchOrderOriginCode");
    const destinationCode = document.getElementById("searchOrderDestinationCode");
    const productCode = document.getElementById("searchOrderProductCode");

    const startDate = document.getElementById("searchOrderStartDate");
    const endDate = document.getElementById("searchOrderEndDate");

    const dateTypeInput = document.getElementById("orderSearchDateType");

    const firstInput = shipperCode;

    // =========================================
    // Result Elements
    // =========================================

    const resultsBody = document.getElementById("orderSearchTableBody");
    const resultCount = document.getElementById("orderSearchCount");
    const message = document.getElementById("orderSearchMessage");

    // =========================================
    // Function Buttons
    // =========================================

    const btnF1 = document.getElementById("btnOrderSearchF1");
    const btnSearch = document.getElementById("btnOrderSearchF5");
    const btnCancel = document.getElementById("btnOrderSearchF11");
    const btnExit = document.getElementById("btnOrderSearchF12");
    const btnF6 = document.getElementById("btnOrderSearchF6");

    const btnMinimize = document.getElementById("btnOrderSearchMinimize");
    const btnMaximize = document.getElementById("btnOrderSearchMaximize");
    const btnClose = document.getElementById("btnOrderSearchClose");

    // =========================================
    // Variables
    // =========================================

    let isMinimized = false;
    let isMaximized = false;
    let isSearching = false;
    let searchController = null;
    let selectedOrderRow = null;
    let originDestinationSearchSource = null; 

    let isCommonMode = false; 
    // =========================================
    // Display Message
    // =========================================

    function setMessage(text) {
        message.textContent = text || "";
    }

    // =========================================
    //Search Popup - Drag Window
    // =========================================
    async function loadOrderSearchRegistrationMode() {
       

        try {
            const response = await fetch(
                "/SearchScreen/GetRegistrationMode"
            );

            if (!response.ok) {
                throw new Error("発着地登録区分を取得できませんでした。");
            }

            const result = await response.json();

            if (result.success !== true ||
                typeof result.isCommonMode !== "boolean") {
                throw new Error("発着地登録区分の応答が正しくありません。");
            }

            isCommonMode = result.isCommonMode; 

        } catch (error) {
            console.error("GetRegistrationMode Error:", error);

            isCommonMode = false; 
        }
    }
    function initializeorderNameSearchDrag() {

        const popup = document.getElementById("orderSearchWindow");
        const titlebar = popup?.querySelector(
            ".order-search-titlebar"
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

    initializeorderNameSearchDrag();

    // =========================================
    // Date Type Buttons
    // =========================================

    const dateTypeButtons = document.querySelectorAll(
        ".order-search-date-type"
    );

    function updateDateTypeButton(value) {

        dateTypeButtons.forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.value === value
            );

        });
    }

    // =========================================
    // Validate Date Type
    // =========================================

    function validateDateType() {

        const value = dateTypeInput.value.trim();

        if (!["0", "1", "2"].includes(value)) {

            alert("日付設定を正しく入力して下さい！！（0～2）");

            dateTypeInput.value = "0";

            updateDateTypeButton("0");

            dateTypeInput.focus();
            dateTypeInput.select();

            return false;
        }

        updateDateTypeButton(value);

        return true;
    }

    // =========================================
    // Get Date Type
    // =========================================

    function getDateType() {
        return dateTypeInput.value.trim();
    }

    // =========================================
    // Validate Date Type When Leaving Input
    // =========================================

    dateTypeInput.addEventListener("blur", function () {
        validateDateType();
    });

 

    // Update date type when a button is clicked.
    dateTypeButtons.forEach(button => {

        button.addEventListener("click", function () {

            const value = this.dataset.value;

            dateTypeInput.value = value;

            updateDateTypeButton(value);
        });
    });

    // Update active button when input changes.
    dateTypeInput.addEventListener("input", function () {
        updateDateTypeButton(this.value);
    });
 

    let orderSearchTargetMonth = null;

    // Retrieve 対象月度 using the server-side 自社コード.
    async function getOrderSearchTargetMonth() {

        const response = await fetch(
            "/SearchScreen/GetOrderSearchTargetMonth"
        );

        if (!response.ok) {
            const errorText = await response.text();

            console.error(
                "GetOrderSearchTargetMonth failed:",
                response.status,
                errorText
            );

            throw new Error(
                `対象月度の取得に失敗しました！！ (${response.status})`
            );
        }

        const result = await response.json();

        if (!result.success || !result.targetMonth) {
            throw new Error("管理マスタの対象月度が取得できません。");
        }

        return result.targetMonth;
    }


    // Set the date range based on 管理マスタ.対象月度.
    function setDefaultOrderDateRange(targetMonth) {

        if (!targetMonth) {
            return;
        }

        // Expected format: yyyy-MM-dd
        const match = String(targetMonth).match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

        if (!match) {
            throw new Error("対象月度の日付形式が正しくありません。");
        }

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);

        // Legacy:
        // Set_Mon
        // Set_Mon.AddMonths(1).AddDays(-1)
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, day - 1);

        setOrderSearchDate(startDate, start);
        setOrderSearchDate(endDate, end);
    }

    // =========================================
    // Set Date Using Existing Japanese Calendar
    // =========================================

    function setOrderSearchDate(input, date) {

        if (!input) return;

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // Store actual date for search and calendar selection.
        input.dataset.actualValue =
            `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        // Use the existing Japanese calendar display function.
        if (typeof updateJapaneseCalendarDisplay === "function") {

            updateJapaneseCalendarDisplay(
                year,
                month,
                day,
                input
            );

        } else {

            console.error(
                "updateJapaneseCalendarDisplay() is not available. Check calendar_common.js loading order."
            );
        }
         
    } 

     

    // =========================================
    // Get Actual Date Value
    // =========================================

    function getActualDate(input) {

        if (!input) return "";

        return input.dataset.actualValue || "";
    }

    // =========================================
    // Validate dates when moving forward
    // =========================================

    // 開始日 → 終了日
    startDate.addEventListener("blur", function (e) {

        // Validate only when moving to 終了日.
        if (e.relatedTarget !== endDate) return;

        if (!startDate.dataset.actualValue) {
            alert("日付が異常です！！");
            startDate.focus();
            return;
        }
    });

    // 終了日 → 荷主
    endDate.addEventListener("blur", function (e) {

        // Validate only when moving to 荷主.
        if (e.relatedTarget !== shipperCode) return;

        const s = startDate.dataset.actualValue || "";
        const t = endDate.dataset.actualValue || "";

        if (!t) {
            alert("日付が異常です！！");
            endDate.focus();
            return;
        }

        if (s && s > t) {
            alert("日付を正しく入力して下さい！！");
            endDate.focus();
            return;
        }
    });

    // =========================================
    // Clear Search Conditions
    // =========================================

    function clearFields() {

        // Clear date display fields.
        startDate.value = "";
        endDate.value = "";

        // Clear actual calendar date values.
        delete startDate.dataset.actualValue;
        delete endDate.dataset.actualValue;

        dateTypeInput.value = "0";
        updateDateTypeButton("0");

        // Clear master lookup fields.
        orderMasterLookupFields.forEach(field => {

            const codeInput = document.getElementById(field.codeId);
            const nameInput = document.getElementById(field.nameId);

            if (codeInput) {
                codeInput.value = "";
                delete codeInput.dataset.lookupCode;
                delete codeInput.dataset.committedCode;
            }

            if (nameInput) {
                nameInput.value = "";
                nameInput.readOnly = true;
            }
        });
    }

    // =========================================
    // Reset Search Results
    // =========================================

    function clearResults() {

        resultsBody.replaceChildren(); 

        resultCount.textContent = "件数：0";
    }

    // =========================================
    // Cancel Pending Search
    // =========================================

    function cancelPendingSearch() {

        if (searchController) {

            searchController.abort();
            searchController = null;
        }

        isSearching = false;
        btnSearch.disabled = false;
    }

    // =========================================
    // Open Order Search Popup
    // =========================================

    async function openPopup() {

        cancelPendingSearch();

        clearFields();
        clearResults();
        setMessage("");

        try {

            orderSearchTargetMonth =
                await getOrderSearchTargetMonth();

            await loadOrderSearchRegistrationMode();

            setDefaultOrderDateRange(orderSearchTargetMonth);

        } catch (error) {

            console.error("Order Search target month error:", error);

            alert("対象月度の取得に失敗しました！！");
            return;
        }

        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");

        win.classList.remove("is-minimized", "is-maximized");
        win.style.width = "";
        win.style.height = "";

        isMinimized = false;
        isMaximized = false;

        firstInput.focus();
    }

    // =========================================
    // Close Order Search Popup
    // =========================================

    function closePopup() {

        cancelPendingSearch();

        popup.classList.remove("is-open");
        popup.setAttribute("aria-hidden", "true");

        win.classList.remove("is-minimized", "is-maximized");

        win.style.width = "";
        win.style.height = "";

        isMinimized = false;
        isMaximized = false;

        // after a pick, a cancel or ×
        document.dispatchEvent(new CustomEvent("order-search-closed"));
    }

    // =========================================
    // F11: Cancel and Clear
    // =========================================

    function cancelSearch() {

        cancelPendingSearch();

        clearFields();

        // Restore the date range from 管理マスタ.対象月度.
        if (orderSearchTargetMonth) {
            setDefaultOrderDateRange(orderSearchTargetMonth);
        }

        clearResults();
        setMessage("");

        // Move focus to the first input field.
        firstInput.focus();
        firstInput.select();
    }

    // =========================================
    // F12: Clear and Exit
    // =========================================

    function exitSearch() {

        cancelPendingSearch();

        clearFields();
        clearResults();
        setMessage("");

        closePopup();
    }

    // =========================================
    // Format Date
    // =========================================


    function formatDate(value) {

        if (!value) return "";

        // Parse date-only values without timezone conversion.
        const match = String(value).match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

        let date;

        if (match) {
            date = new Date(
                Number(match[1]),
                Number(match[2]) - 1,
                Number(match[3])
            );
        } else {
            date = new Date(value);
        }

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        // 西暦: yyyy/MM/dd
        if (document.body.dataset.dateEra !== "1") {
            return `${year}/${month}/${day}`;
        }

        // 和暦: g.ee/MM/dd
        const eraParts = new Intl.DateTimeFormat(
            "ja-JP-u-ca-japanese",
            {
                era: "long",
                year: "2-digit"
            }
        ).formatToParts(date);

        const era = eraParts.find(p => p.type === "era")?.value;
        const eraYear = eraParts.find(p => p.type === "year")?.value;

        if (!era || !eraYear) {
            return `${year}/${month}/${day}`;
        }

        return `${era}.${eraYear.padStart(2, "0")}/${month}/${day}`;
    }


    // =========================================
    // Select Grid Row
    // =========================================

    function selectOrderRow(row) {

        if (!row) return;

        resultsBody.querySelectorAll("tr").forEach(item => {
            item.classList.remove("is-selected");
        });

        row.classList.add("is-selected");

        selectedOrderRow = row;
    }

    // =========================================
    // Finish Order Selection
    // =========================================

    function finishOrderSelection() {

        if (!selectedOrderRow) {
            return;
        }

        // Tell the calling screen the picked 受注NO (受注入力 F5 loads it when the popup has closed)
        document.dispatchEvent(
            new CustomEvent("order-search-selected", {
                detail: {
                    orderNo: selectedOrderRow.dataset.orderNo ?? ""
                }
            })
        );

        // Close popup and clear search conditions.
        cancelPendingSearch();

        clearFields();
        clearResults();
        setMessage("");

        selectedOrderRow = null;

        closePopup();
    }

    // =========================================
    // Render Search Results
    // =========================================

    function renderResults(items) {

        resultsBody.replaceChildren();

        selectedOrderRow = null;

        if (!items || items.length === 0) {

            clearResults();
            return;
        }

        resultCount.textContent =
            `件数：${items.length.toLocaleString("en-US")}`;

        items.forEach(order => {

            const row = document.createElement("tr");

            // Preserve the original order number for the calling screen.
            row.dataset.orderNo = order.orderNo ?? "";

            // Keep the same 30-column order as OrderSearchResultDto.
            const values = [
                order.orderDisplayNo ?? order.orderNo ?? "",
                order.content ?? "",
                formatDate(order.loadingDate),
                order.loadingTime ?? "",
                formatDate(order.unloadingDate),
                order.unloadingTime ?? "",
                order.charteringCompany ?? "",
                order.transportationCompany ?? "",
                order.driverName ?? "",
                order.vehicleNumber ?? "",
                order.vehicleType ?? "",
                order.shipperName ?? "",
                order.originName ?? "",
                order.destinationName ?? "",
                order.productName ?? "",
                order.quantity ?? "",
                order.weight ?? "",
                order.unitName ?? "",
                order.unitPrice ?? "",
                order.billingFreight ?? "",
                order.surcharge ?? "",
                order.tollFeeBilling ?? "",
                order.paymentUnitName ?? "",
                order.paymentUnitPrice ?? "",
                order.paymentFreight ?? "",
                order.paymentSurcharge ?? "",
                order.tollFeePayment ?? "",
                order.packaging ?? "",
                order.internalRemarks ?? "",
                order.dailyReportRemarks ?? ""
            ];

            values.forEach(value => {

                const cell = document.createElement("td");

                cell.textContent = String(value);

                row.appendChild(cell);
            });
             
            // Single click: select row and focus the grid container.
            row.addEventListener("click", function () {
                selectOrderRow(row);
                orderGridContainer.focus({ preventScroll: true });
            });

            // Double click: select and close popup.
            row.addEventListener("dblclick", function () {

                selectOrderRow(row);

                finishOrderSelection();
            });

            resultsBody.appendChild(row);
        });

        // Automatically select the first row.
        const firstRow = resultsBody.querySelector("tr");

        if (firstRow) {
            selectOrderRow(firstRow);
        }
    }

    // =========================================
    // F5: Execute Order Search
    // =========================================

    async function executeSearch() {

        if (isSearching) return;

        const searchUrl = win.dataset.searchUrl;

        if (!searchUrl) {

            setMessage("検索URLが設定されていません。");

            console.error("Order Search URL is missing.");

            return;
        }

        // Validate date type.
        if (!validateDateType()) {
            return;
        }

        // =========================================
        // Validate Search Date Range
        // =========================================

        const startDateValue = getActualDate(startDate);
        const endDateValue = getActualDate(endDate);

        // Validate empty Start Date.
        if (!startDateValue) {

            alert("日付を正しく入力して下さい！！");

            startDate.focus();

            return;
        }

        // Validate empty End Date.
        if (!endDateValue) {

            alert("日付を正しく入力して下さい！！");

            endDate.focus();

            return;
        }

        // Validate date range.
        if (endDateValue < startDateValue) {

            alert("対象期間の指定が異常です！！");

            startDate.focus();

            return;
        } 

        const params = new URLSearchParams();

        // Seven search conditions.
        const searchConditions = {
            shipperCode: shipperCode.value,
            charteringCompanyCode: charteringCompanyCode.value,
            driverCode: driverCode.value,
            vehicleCode: vehicleCode.value,
            originCode: originCode.value,
            destinationCode: destinationCode.value,
            productCode: productCode.value,

            driverName: document.getElementById("searchOrderDriverName").value,
            vehicleName: document.getElementById("searchOrderVehicleName").value,
            originName: document.getElementById("searchOrderOriginName").value,
            destinationName: document.getElementById("searchOrderDestinationName").value,
            productName: document.getElementById("searchOrderProductName").value
        };

        Object.entries(searchConditions).forEach(([key, value]) => {

            if (value.trim()) {
                params.set(key, value.trim());
            }
        });

        // Date conditions.
        params.set("dateType", getDateType());

        if (startDateValue) {
            params.set("StartDate", startDateValue);
        }

        if (endDateValue) {
            params.set("EndDate", endDateValue);
        }

        // Start searching.
        isSearching = true;
        btnSearch.disabled = true;

        const controller = new AbortController();

        searchController = controller;

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
                },
                signal: controller.signal
            });

            const data = await response.json();

            // Ignore results from an older or cancelled request.
            if (controller.signal.aborted ||
                searchController !== controller ||
                !popup.classList.contains("is-open")) {

                return;
            }

            if (!response.ok || data.success === false) {

                throw new Error(
                    data.message || "受注検索に失敗しました。"
                );
            }

            const items = Array.isArray(data)
                ? data
                : (data.items ?? data.results ?? []);

            renderResults(items);

            if (items.length === 0) {

                alert("対象データがありません");

                setMessage("");

                firstInput.focus();

            } else {

                setMessage("");
            }

        } catch (error) {

            if (error.name === "AbortError") {
                return;
            }

            if (searchController !== controller) {
                return;
            }

            console.error("Order Search Error:", error);

            clearResults();

            setMessage(
                error.message || "受注検索に失敗しました。"
            );

        } finally {

            // Only update the state for the current request.
            if (searchController === controller) {

                searchController = null;

                isSearching = false;

                btnSearch.disabled = false;
            }
        }
    }

    // =========================================
    // Minimize Popup
    // =========================================

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

    // =========================================
    // Maximize Popup
    // =========================================

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

    // =========================================
    // Grid Column Sorting
    // =========================================

    function initializeOrderGridSorting() {

        const table = resultsBody.closest("table");

        if (!table) return;

        const headers = table.querySelectorAll("thead th");

        headers.forEach((header, columnIndex) => {

            header.style.cursor = "pointer";

            header.addEventListener("click", function () {

                const rows = Array.from(resultsBody.querySelectorAll("tr"))
                    .filter(row => row.cells.length === 30);

                if (rows.length <= 1) return;

                // Toggle ascending / descending.
                const currentDirection = header.dataset.sortDirection;

                const direction = currentDirection === "asc"
                    ? "desc"
                    : "asc";

                // Reset sorting indicators on other columns.
                headers.forEach(item => {
                    delete item.dataset.sortDirection;
                    item.removeAttribute("aria-sort");
                });

                header.dataset.sortDirection = direction;

                header.setAttribute(
                    "aria-sort",
                    direction === "asc" ? "ascending" : "descending"
                );

                rows.sort((rowA, rowB) => {

                    const valueA = rowA.cells[columnIndex].textContent.trim();
                    const valueB = rowB.cells[columnIndex].textContent.trim();

                    let comparison = 0;

                    const numberA = Number(valueA.replace(/,/g, ""));
                    const numberB = Number(valueB.replace(/,/g, ""));

                    // Numeric sorting.
                    if (
                        valueA !== "" &&
                        valueB !== "" &&
                        !Number.isNaN(numberA) &&
                        !Number.isNaN(numberB)
                    ) {

                        comparison = numberA - numberB;

                    } else {

                        // Text and date sorting.
                        comparison = valueA.localeCompare(
                            valueB,
                            "ja",
                            {
                                numeric: true,
                                sensitivity: "base"
                            }
                        );
                    }

                    return direction === "asc"
                        ? comparison
                        : -comparison;
                });

                // Reorder rows.
                rows.forEach(row => {
                    resultsBody.appendChild(row);
                });

                // Keep the selected row highlighted.
                if (selectedOrderRow) {
                    selectOrderRow(selectedOrderRow);
                }
            });
        });
    }


    // =========================================
    // Order Search Grid Keyboard Navigation
    // =========================================

    const orderGridContainer = resultsBody.closest(
        ".order-search-table-scroll"
    );

    if (orderGridContainer) {

        orderGridContainer.setAttribute("tabindex", "0");

        orderGridContainer.addEventListener("keydown", function (event) {

            if (
                event.key !== "ArrowDown" &&
                event.key !== "ArrowUp"
            ) {
                return;
            }

            const rows = Array.from(
                resultsBody.querySelectorAll("tr")
            );

            if (rows.length === 0) return;

            event.preventDefault();

            let currentIndex = rows.indexOf(selectedOrderRow);

            if (currentIndex === -1) {
                currentIndex = 0;
            } else if (event.key === "ArrowDown") {
                currentIndex = Math.min(
                    currentIndex + 1,
                    rows.length - 1
                );
            } else {
                currentIndex = Math.max(
                    currentIndex - 1,
                    0
                );
            }

            const nextRow = rows[currentIndex];

            selectOrderRow(nextRow);

            nextRow.scrollIntoView({
                block: "nearest"
            });
        });
    }

    // ========================================
    // Master Lookup Configuration
    // ========================================

    const orderMasterLookupFields = [
        {
            type: "shipper",
            codeId: "searchOrderShipperCode",
            nameId: "searchOrderShipperName",
            label: "荷主"
        },
        {
            type: "charteringCompany",
            codeId: "searchOrderCharteringCompanyCode",
            nameId: "searchOrderCharteringCompanyName",
            label: "傭車"
        },
        {
            type: "driver",
            codeId: "searchOrderDriverCode",
            nameId: "searchOrderDriverName",
            label: "運転手"
        },
        {
            type: "vehicle",
            codeId: "searchOrderVehicleCode",
            nameId: "searchOrderVehicleName",
            label: "車輌"
        },
        {
            type: "origin",
            codeId: "searchOrderOriginCode",
            nameId: "searchOrderOriginName",
            label: "発地"
        },
        {
            type: "destination",
            codeId: "searchOrderDestinationCode",
            nameId: "searchOrderDestinationName",
            label: "着地"
        },
        {
            type: "product",
            codeId: "searchOrderProductCode",
            nameId: "searchOrderProductName",
            label: "品名"
        }
    ];
    const masterCodeInputIds = new Set(
        orderMasterLookupFields.map(field => field.codeId)
    );

    //////////// F6 Start ////////////////////////

    // =========================================
    // F6: Master Search - Shipper
    // =========================================

    function updateOrderSearchF6State() {
        const activeElement = document.activeElement;

        btnF6.disabled =
            activeElement !== shipperCode &&
            activeElement !== charteringCompanyCode &&
            activeElement !== driverCode &&
            activeElement !== vehicleCode &&
            activeElement !== originCode &&
            activeElement !== destinationCode &&
            activeElement !== productCode;
    }

    [
        shipperCode,
        charteringCompanyCode,
        driverCode,
        vehicleCode,
        originCode,
        destinationCode,
        productCode
    ].forEach(input => {
        input.addEventListener("focus", updateOrderSearchF6State);
        input.addEventListener("blur", updateOrderSearchF6State);
    });
    // Enable F6 when 荷主コード receives focus.
    shipperCode.addEventListener("focus", function () {
        updateOrderSearchF6State();
    });

    // Disable F6 when focus moves away.
    shipperCode.addEventListener("blur", function () {
        updateOrderSearchF6State();
    });
    function openOrderSearchF6Popup() {
        const activeElement = document.activeElement;

        // First input: 荷主コード
        if (activeElement === shipperCode) {
            document.dispatchEvent(
                new CustomEvent("openMasterShipperSearchPopup", {
                    detail: { activeOnly: false }
                })
            );
            return;
        }

        // Second input: 傭車コード
        if (activeElement === charteringCompanyCode) {
            document.dispatchEvent(
                new CustomEvent("openCharteredSearchPopup", {
                    detail: { activeOnly: false }
                })
            );
            return;
        }
        // Third input: 運転手コード
        if (activeElement === driverCode) {
            document.dispatchEvent(
                new CustomEvent("openDriverSearchPopup", {
                    detail: { activeOnly: false }
                })
            );
        }
        // Fourth input: 車輌コード
        if (activeElement === vehicleCode) {
            document.dispatchEvent(
                new CustomEvent("openVehicleSearchPopup", {
                    detail: { activeOnly: false }
                })
            );

            return;
        }
        // Fifth input: 発地コード
        if (activeElement === originCode) {
            originDestinationSearchSource = "origin";

           

            // Individual-registration mode only.
            if (!isCommonMode && !shipperCode.value.trim()) {
                alert("荷主が未指定の為、検索出来ません！！");

                shipperCode.focus();

                return;
            }

            document.dispatchEvent(
                new CustomEvent("openOriginDestinationSearchPopup", {
                    detail: {
                        shipperCode: shipperCode.value.trim(),
                        shipperName: shipperName.value.trim()
                    }
                })
            );

            return;
        }
        // Sixth input: 着地コード
        if (activeElement === destinationCode) {
            originDestinationSearchSource = "destination";
 

            // Individual-registration mode only.
            if (!isCommonMode && !shipperCode.value.trim()) {
                alert("荷主が未指定の為、検索出来ません！！");

                shipperCode.focus();

                return;
            }

            document.dispatchEvent(
                new CustomEvent("openOriginDestinationSearchPopup", {
                    detail: {
                        shipperCode: shipperCode.value.trim(),
                        shipperName: shipperName.value.trim()
                    }
                })
            );

            return;
        }
        // Seventh input: 品名コード
        if (activeElement === productCode) {
            document.dispatchEvent(
                new CustomEvent("openProductNameSearchPopup")
            );

            return;
        }
    }

    // =========================================
    // Receive Selected Shipper from F6 Popup
    // =========================================

    document.addEventListener(
        "master-shipper-search-selected",
        function (event) {

            const selected = event.detail;
            if (!selected) return;

            const selectedCode = normalizeMasterCode(
                selected.code ?? ""
            );

            if (selectedCode === null || selectedCode === "") return;

            const previousCode = shipperCode.dataset.committedCode ?? "";

            shipperCode.value = selectedCode;

            document.getElementById("searchOrderShipperName").value =
                selected.name ?? "";

            shipperCode.dataset.lookupCode = selectedCode;

            commitShipperOrCharteringCompany(
                shipperCode,
                previousCode
            );

            charteringCompanyCode.focus();
            charteringCompanyCode.select();
        }
    );

    btnF6.addEventListener("mousedown", function (event) {
        event.preventDefault();
    });
    btnF6.addEventListener("click", openOrderSearchF6Popup);

    

    let returnFocusToCharteringCompany = false;

    document.addEventListener(
        "chartered-search-selected",
        function (event) {

            const selected = event.detail;
            if (!selected) return;

            const selectedCode = normalizeMasterCode(
                selected.charteredCode ?? ""
            );

            if (selectedCode === null || selectedCode === "") return;

            const previousCode =
                charteringCompanyCode.dataset.committedCode ?? "";

            charteringCompanyCode.value = selectedCode;

            document.getElementById("searchOrderCharteringCompanyName").value =
                selected.abbreviation ?? "";

            charteringCompanyCode.dataset.lookupCode = selectedCode;

            commitShipperOrCharteringCompany(
                charteringCompanyCode,
                previousCode
            );

            driverCode.focus();
            driverCode.select();
        }
    );

    document.addEventListener("chartered-search-closed", function () {
        if (!returnFocusToCharteringCompany) return;

        returnFocusToCharteringCompany = false;

        charteringCompanyCode.focus();
        charteringCompanyCode.select();
    });

    document.addEventListener("driver-search-selected", function (event) {
        const selected = event.detail;
        if (!selected) return;

        const selectedCode = normalizeMasterCode(
            selected.driverCode ?? ""
        );

        if (selectedCode === null || selectedCode === "") return;

        driverCode.value = selectedCode;

        document.getElementById("searchOrderDriverName").value =
            selected.driverName ?? "";

        driverCode.dataset.lookupCode = selectedCode;

        // Move focus to the next input: 車輌コード
        vehicleCode.focus();
        vehicleCode.select();
    });

    // =========================================
    // Receive Selected Vehicle from Vehicle Search
    // =========================================


    document.addEventListener(
        "vehicle-search-selected",
        async function (event) {
            const selected = event.detail;
            if (!selected) return;

            const selectedCode = normalizeMasterCode(
                selected.vehicleCode ?? ""
            );

            if (selectedCode === null || selectedCode === "") return;

            // Set the selected vehicle code.
            vehicleCode.value = selectedCode;

            // Remove previous validation state.
            // The vehicle name must be retrieved from OrderMasterLookup.
            delete vehicleCode.dataset.lookupCode;

            // Find the Vehicle master lookup configuration.
            const vehicleField = orderMasterLookupFields.find(
                field => field.codeId === vehicleCode.id
            );

            if (!vehicleField) return;

            // Retrieve and populate the vehicle name.
            const isValid = await lookupOrderMaster(vehicleField);

            if (!isValid) return;

            // Move focus to the next input: 発地コード
            originCode.focus();
            originCode.select();
        }
    );


    document.addEventListener(
        "origin-destination-search-selected",
        function (event) {
            const selected = event.detail;
            if (!selected) return;

            const selectedCode = normalizeMasterCode(
                selected.originDestinationCode ?? ""
            );

            if (selectedCode === null || selectedCode === "") return;

            if (originDestinationSearchSource === "origin") {

                originCode.value = selectedCode;

                document.getElementById("searchOrderOriginName").value =
                    selected.originDestinationName ?? "";

                originCode.dataset.lookupCode = selectedCode;

                // Legacy: restore focus to 発地コード.
                originCode.focus();
                originCode.select();
            }
            else if (originDestinationSearchSource === "destination") {

                destinationCode.value = selectedCode;

                document.getElementById("searchOrderDestinationName").value =
                    selected.originDestinationName ?? "";

                destinationCode.dataset.lookupCode = selectedCode;

                // Legacy: restore focus to 着地コード.
                destinationCode.focus();
                destinationCode.select();
            }

            originDestinationSearchSource = null;
        }
    );

    document.addEventListener(
        "product-name-search-selected",
        function (event) {
            const selected = event.detail;
            if (!selected) return;

            const selectedCode = normalizeMasterCode(
                selected.code ?? ""
            );

            if (selectedCode === null || selectedCode === "") return;

            productCode.value = selectedCode;

            document.getElementById("searchOrderProductName").value =
                selected.productName ?? "";

            productCode.dataset.lookupCode = selectedCode;

            // Move focus to the next input: 日付設定
            dateTypeInput.focus();
            dateTypeInput.select();
        }
    );
  

    ///////////////////// F6 End ///////////////////////


    // Track requests to avoid duplicate lookups.
    const masterLookupRequests = new Map();
    // Clear 発地 and 着地 when 荷主 or 傭車 is committed with a changed value.
    function clearDependentLocationFields() {

        [originCode, destinationCode].forEach(codeInput => {

            const normalizedCode = normalizeMasterCode(codeInput.value);

            // Preserve manual location search completely.
            if (normalizedCode === "0000000000") {
                return;
            }

            const field = orderMasterLookupFields.find(
                item => item.codeId === codeInput.id
            );

            if (!field) return;

            const nameInput = document.getElementById(field.nameId);

            // Clear location code and its validation state.
            codeInput.value = "";
            delete codeInput.dataset.lookupCode;

            // Clear location name and restore read-only mode.
            if (nameInput) {
                nameInput.value = "";
                nameInput.readOnly = true;
            }
        });
    }

    // Track the last committed 荷主 and 傭車 codes.
    function commitShipperOrCharteringCompany(codeInput, previousCode) {

        const currentCode = normalizeMasterCode(codeInput.value);

        if (currentCode === null) return;

        const oldCode = normalizeMasterCode(previousCode ?? "");

        // Clear locations only when the committed value changes.
        if (currentCode !== oldCode) {
            clearDependentLocationFields();
        }

        // Remember the newly committed value.
        codeInput.dataset.committedCode = currentCode;
    }
     
    // Normalize Master Code
    // Maximum 10 numeric digits, zero-padded 
    function normalizeMasterCode(value) {

        const code = value.trim();

        if (code === "") {
            return "";
        }

        // Validate numeric code and maximum 10 digits.
        if (!/^\d+$/.test(code) || code.length > 10) {
            return null;
        }

        // Use common JavaScript zeroPad().
        return zeroPad(code, 10);
    }


    // ========================================
    // Master Lookup
    // ========================================

    async function lookupOrderMaster(field) {

        const codeInput = document.getElementById(field.codeId);
        const nameInput = document.getElementById(field.nameId);

        if (!codeInput || !nameInput) {
            return false;
        }

        const enteredCode = codeInput.value.trim();

        // Clear name when code is empty.
        if (enteredCode === "") {

            nameInput.value = "";

            delete codeInput.dataset.lookupCode;

            return true;
        }
         
        // Manual name search mode.
        // Only the exact 10-digit code enables manual name entry.
        const isManualSearch = enteredCode === "0000000000";

        // Validate code.
        const normalizedCode = normalizeMasterCode(enteredCode);

        if (normalizedCode === null) {
            codeInput.value = "";
            nameInput.value = "";
            delete codeInput.dataset.lookupCode;
            codeInput.focus();
            return false;
        }

        // Apply zero-padding.
        codeInput.value = normalizedCode;

        // Manual name search mode.
        if (isManualSearch) {
            nameInput.readOnly = false;
            delete codeInput.dataset.lookupCode;
            return true;
        }

        // Normal master lookup mode.
        nameInput.readOnly = true;

        // Skip lookup if the code was already validated.
        if (codeInput.dataset.lookupCode === normalizedCode) {
            return true;
        }
        //shipperCode.dataset.lookupCode = selectedCode;
        // Reuse an existing request for the same code.
        const pendingRequest = masterLookupRequests.get(field.codeId);

        if (pendingRequest &&
            pendingRequest.code === normalizedCode) {

            return pendingRequest.promise;
        }

        nameInput.value = "";

        const requestCode = normalizedCode;

        const lookupPromise = (async function () {

            try {

                const params = new URLSearchParams({
                    masterType: field.type,
                    code: requestCode
                });

                const response = await fetch(
                    `/SearchScreen/OrderMasterLookup?${params.toString()}`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json"
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }

                const result = await response.json();

                // Ignore response if the code has changed.
                if (codeInput.value !== requestCode) {
                    return false;
                }

                if (!result.success || !result.found) {

                    alert(
                        `指定した${field.label}『${requestCode}』は未登録です！！`
                    );

                    codeInput.value = "";
                    nameInput.value = "";

                    delete codeInput.dataset.lookupCode;

                    codeInput.focus();

                    return false;
                }

                // Set the master code and name.
                codeInput.value = result.code || requestCode;
                nameInput.value = result.name || "";

                // Mark the code as successfully validated.
                codeInput.dataset.lookupCode = requestCode;

                return true;

            } catch (error) {

                // Ignore errors from an outdated request.
                if (codeInput.value !== requestCode) {
                    return false;
                }

                console.error(
                    `${field.label} master lookup error:`,
                    error
                );

                alert(
                    `${field.label}マスタの検索中にエラーが発生しました。`
                );

                nameInput.value = "";

                delete codeInput.dataset.lookupCode;

                return false;
            }

        })();

        masterLookupRequests.set(field.codeId, {
            code: requestCode,
            promise: lookupPromise
        });

        try {

            return await lookupPromise;

        } finally {

            const currentRequest = masterLookupRequests.get(field.codeId);

            if (currentRequest &&
                currentRequest.promise === lookupPromise) {

                masterLookupRequests.delete(field.codeId);
            }
        }
    }


    // ========================================
    // Register Master Lookup Events
    // ========================================

    orderMasterLookupFields.forEach(field => {

        const codeInput = document.getElementById(field.codeId);

        if (!codeInput) {
            return;
        }

        // Clear the name and update editability when the code changes.
        codeInput.addEventListener("input", function () {

            const enteredCode = this.value.trim();
            const nameInput = document.getElementById(field.nameId);

            if (nameInput) {

                nameInput.value = "";

                // Enable manual name entry only for the exact 10-digit sentinel.
                nameInput.readOnly = enteredCode !== "0000000000";
            }

            delete this.dataset.lookupCode;
        });

        // Lookup when leaving the code field.
        codeInput.addEventListener("blur", function () {
            lookupOrderMaster(field);
        });

        // Lookup when pressing Enter.
        //codeInput.addEventListener("keydown", function (event) {

        //    if (event.key === "Enter") {

        //        event.preventDefault();
        //        event.stopPropagation();

        //        lookupOrderMaster(field);
        //    }
        //});
    });

    // =========================================
    // Initialize Grid Sorting
    // =========================================

    initializeOrderGridSorting();
    // =========================================
    // Register Button Events
    // =========================================

    btnSearch.addEventListener("click", executeSearch);

    btnCancel.addEventListener("click", cancelSearch);

    btnExit.addEventListener("click", exitSearch);

    btnClose.addEventListener("click", exitSearch);

    btnMinimize.addEventListener("click", minimizePopup);

    btnMaximize.addEventListener("click", maximizePopup);

    // F1: Confirm selected row.
    btnF1.addEventListener("click", finishOrderSelection);

    // =========================================
    // Open Popup Event
    // =========================================

    //document.addEventListener(
    //    "openOrderSearchPopup",
    //    openPopup
    //);

    document.addEventListener(
        "openOrderSearchPopup",
        async function () {

            await openPopup();
        }
    );


    // =========================================
    // Legacy Keyboard Navigation
    // SW-004 - Order Search
    // =========================================

    // Legacy focus order:
    // 荷主 → 傭車 → 運転手 → 車輌
    // → 発地 → 着地 → 品名
    // → 日付設定 → 開始日 → 終了日

    const orderSearchFocusOrder = [
        shipperCode,
        charteringCompanyCode,
        driverCode,
        vehicleCode,
        originCode,
        destinationCode,
        productCode,
        dateTypeInput,
        startDate,
        endDate
    ];

    // Find the master lookup configuration.
    function getOrderMasterField(input) {
        return orderMasterLookupFields.find(
            field => field.codeId === input.id
        );
    }

    // Get currently available controls.
    function getOrderSearchFocusableControls() {
        return orderSearchFocusOrder.filter(element => {
            return element &&
                !element.disabled &&
                element.type !== "hidden" &&
                element.tabIndex !== -1 &&
                element.getClientRects().length > 0;
        });
    }

    // Move to next / previous control.
    function moveOrderSearchFocus(forward) {

        const controls = getOrderSearchFocusableControls();

        const currentIndex = controls.indexOf(
            document.activeElement
        );

        if (currentIndex === -1) return;

        let nextIndex;

        if (forward) {

            // Legacy SelectNextControl wrap behaviour.
            nextIndex = (currentIndex + 1) % controls.length;

        } else {

            // Legacy exception:
            // Escape / Up on first control does nothing.
            if (currentIndex === 0) return;

            nextIndex = currentIndex - 1;
        }

        const nextControl = controls[nextIndex];

        if (nextControl) {
            nextControl.focus();

            if (nextControl.select &&
                !nextControl.readOnly) {
                nextControl.select();
            }
        }
    }

    // Check whether the date calendar is expanded.
    function isOrderSearchCalendarOpen(input) {

        if (!input) return false;

        return input.getAttribute("aria-expanded") === "true" ||
            input.dataset.calendarOpen === "true";
    }

    // Central keyboard handler.
    popup.addEventListener("keydown", async function (event) {

        if (!popup.classList.contains("is-open")) return;

        // Allow calendar-specific keyboard handlers to work.
        if (event.defaultPrevented) return;

        // F6: Open Search Search.
        if (
            event.key === "F6" &&
            (
                document.activeElement === shipperCode ||
                document.activeElement === charteringCompanyCode ||
                document.activeElement === driverCode ||
                document.activeElement === vehicleCode ||
                document.activeElement === originCode ||
                document.activeElement === destinationCode ||
                document.activeElement === productCode
            )
        ) {
            event.preventDefault();
            openOrderSearchF6Popup();
            return;
        }

        const activeElement = document.activeElement;

        // Do not override grid keyboard navigation.
        if (
            activeElement instanceof Element &&
            (
                activeElement.closest(".order-search-table-scroll") ||
                activeElement.closest("#orderSearchTable")
            )
        ) {
            return;
        }

        // Preserve multiline textbox behaviour.
        if (
            activeElement instanceof HTMLTextAreaElement
        ) {
            return;
        }

        // Preserve date-calendar keyboard behaviour.
        if (
            (activeElement === startDate ||
                activeElement === endDate) &&
            isOrderSearchCalendarOpen(activeElement)
        ) {
            return;
        }

        const forward =
            event.key === "Enter" ||
            event.key === "ArrowDown";

        const backward =
            event.key === "Escape" ||
            event.key === "ArrowUp";

        if (!forward && !backward) return;

        event.preventDefault();

        // Enter on a master code:
        // Complete lookup before moving focus.
        if (
            event.key === "Enter" &&
            masterCodeInputIds.has(activeElement.id)
        ) {

            const field = getOrderMasterField(activeElement);

            if (field) {

                const previousCode = activeElement.dataset.committedCode ?? "";

                const isValid = await lookupOrderMaster(field);

                if (!isValid) return;

                // Commit 荷主 / 傭車 and clear dependent locations if changed.
                if (
                    activeElement === shipperCode ||
                    activeElement === charteringCompanyCode
                ) {
                    commitShipperOrCharteringCompany(
                        activeElement,
                        previousCode
                    );
                }

                moveOrderSearchFocus(true);
            }

            return;
        }

        // Validate date type before leaving the field.
        if (
            event.key === "Enter" &&
            activeElement === dateTypeInput
        ) {
            if (!validateDateType()) return;
        }

        // Enter / Down = next control.
        if (forward) {
            moveOrderSearchFocus(true);
            return;
        }

        // Escape / Up = previous control.
        if (backward) {
            moveOrderSearchFocus(false);
        }
    });
 
    // =========================================
    // Initial Screen State
    // =========================================

    clearFields();
    clearResults();
    setMessage("");

    // Order Search - Japanese Era Input Guidance
    [startDate, endDate].forEach(function (input) {
        if (!input) return;

        input.addEventListener("focus", function () {
            setMessage(
                "明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]"
            );
        });

        input.addEventListener("blur", function () {
            setMessage("");
        });
    });

});