document.addEventListener("DOMContentLoaded", function () {
    // Initialize the Vehicle Search popup.
    const popup = document.getElementById("vehicleSearchPopup");
    const popupWindow = document.getElementById("vehicleSearchWindow");
    const btnF5 = document.getElementById("btnVehicleSearchExecute");
    if (!popup || !popupWindow) return;

    // Hide disabled function-key buttons in the footer.
    popup.querySelectorAll(".vehicle-search-footer button:disabled")
        .forEach(button => {
            if (button.id === "btnVehicleSearchF6" ||
                button.id === "btnVehicleSearchF9") return;
            button.hidden = true;
        });

    // Get search fields, results, messages, and action buttons.
    const vehicleNumber = document.getElementById("searchVehicleNumber");
    const maker = document.getElementById("searchVehicleMaker");
    const model = document.getElementById("searchVehicleModel");
    const loadMin = document.getElementById("loadMin");
    const loadMax = document.getElementById("loadMax");
    const resultsBody = document.getElementById("vehicleSearchResults");
    const resultCount = document.getElementById("vehicleSearchCount");
    const message = document.getElementById("vehicleSearchMessage");
    const btnSearch = document.getElementById("btnVehicleSearchExecute");
    const btnSelect = document.getElementById("btnVehicleSearchSelect");
    const btnCancel = document.getElementById("btnVehicleSearchCancel");
    const btnExit = document.getElementById("btnVehicleSearchExit");
    const btnRegister = document.getElementById("btnVehicleSearchRegister");

    // Store the selected vehicle and search results.
    let selectedVehicle = null;
    let searchResults = [];

    // Display a message.
    function setMessage(text) {
        if (message) message.textContent = text;
    }
    // Limit input by UTF-8 byte count.
    // Limit input by legacy Shift-JIS-style byte length.
    function limitBytes(value, maxBytes) {

        let result = "";
        let bytes = 0;

        for (const ch of value) {

            const c = ch.codePointAt(0);

            // ASCII and half-width Katakana = 1 byte.
            // Other characters = 2 bytes.
            const w =
                (c <= 0x7E || (c >= 0xFF61 && c <= 0xFF9F))
                    ? 1
                    : 2;

            if (bytes + w > maxBytes) break;

            result += ch;
            bytes += w;
        }

        return result;
    }
    // =========================================
    //Search Popup - Drag Window
    // =========================================
    // Apply legacy byte limits to Vehicle Search inputs.
    function setupByteLimit(input, maxBytes) {
        if (!input) return;

        input.addEventListener("input", function () {
            if (this.isComposing) return;

            this.value = limitBytes(this.value, maxBytes);
        });

        // Handle Japanese IME input.
        input.addEventListener("compositionend", function () {
            this.value = limitBytes(this.value, maxBytes);
        });
    }

    setupByteLimit(vehicleNumber, 20);
    setupByteLimit(maker, 20);
    setupByteLimit(model, 30);
    function initializevehicleNameSearchDrag() {

        const popup = document.getElementById("vehicleSearchWindow");
        const titlebar = popup?.querySelector(
            ".vehicle-search-titlebar"
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

    initializevehicleNameSearchDrag();

    // Get the selected vehicle category.
    function getCategory() {
        return document.getElementById("searchVehicleCategory")
            ?.value.trim() ?? "";
    }

    // 廃車日 IS NULL only: set by the caller on open (legacy SelMX = "9" in 新規)
    let activeOnly = false;

    // Open the popup and focus the vehicle number field.
    function openPopup() {
        // Clear all search conditions.
        vehicleNumber.value = "";
        maker.value = "";
        model.value = "";
        loadMin.value = "";
        loadMax.value = "";

        // Reset vehicle category.
        setVehicleCategory("");

        // Clear previous search results and selection.
        renderResults([]);

        // Reset sorting.
        sortColumn = null;
        sortAsc = true;

        // Open popup and focus vehicle number.
        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");
        setMessage("");

        navigationFields.forEach(field => {
            keptValues.set(field, "");
        });

        vehicleNumber.focus();
        vehicleNumber.select();
    }

    // Close the popup and return focus to F5.
    function closePopup() {
        popup.classList.remove("is-open");
        popup.setAttribute("aria-hidden", "true");
        selectedVehicle = null;
        btnF5?.focus();
    }

    // Display vehicle search results.
    function renderResults(items) {
        searchResults = Array.isArray(items) ? items : [];
        selectedVehicle = null;
        resultsBody.replaceChildren();
        resultCount.textContent = searchResults.length
            ? `件数：${searchResults.length.toLocaleString("en-US")}`
            : "件数:0";

        if (searchResults.length === 0) {
            return;
        }

        // Convert category codes into Japanese labels.
        const categoryLabels = {
            "0": "自社",
            "1": "傭車",
            "2": "契約"
        };

        // Create a row for each vehicle.
        searchResults.forEach(function (vehicle, index) {
            const row = document.createElement("tr");
            row.tabIndex = 0;

            // Format the registration date using the Japanese era calendar.
            const registrationDate = vehicle.registrationYear
                ? toWarekiSlash(vehicle.registrationYear)
                : "";

            // Prepare values in table column order.
            const values = [
                vehicle.vehicleCode ?? "",
                vehicle.vehicleNumber ?? "",
                vehicle.makerName ?? "",
                vehicle.retiredStatus ?? "",
                vehicle.model ?? "",
                registrationDate,
                vehicle.loadWeight == null
                    ? ""
                    : Number(vehicle.loadWeight).toLocaleString("ja-JP"),
                categoryLabels[String(vehicle.vehicleCategory)] ??
                vehicle.vehicleCategory ?? ""
            ];

            // Create table cells.
            values.forEach(function (value) {
                const cell = document.createElement("td");
                cell.textContent = String(value);
                row.appendChild(cell);
            });

            // Select a vehicle with a single click.
            row.addEventListener("click", function () {
                selectRow(row, index);
            });

            // Select and apply a vehicle with a double-click.
            row.addEventListener("dblclick", function () {
                selectRow(row, index);
                applySelectedVehicle();
            });

            // Support keyboard navigation and selection.
            row.addEventListener("keydown", function (e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    selectRow(row, index);
                    applySelectedVehicle();
                }

                if (e.key === "ArrowDown" && row.nextElementSibling) {
                    e.preventDefault();
                    row.nextElementSibling.focus();
                    row.nextElementSibling.click();
                }

                if (e.key === "ArrowUp" && row.previousElementSibling) {
                    e.preventDefault();
                    row.previousElementSibling.focus();
                    row.previousElementSibling.click();
                }
            }); 

            resultsBody.appendChild(row);
        });

        // Select and focus the first result.
        const firstRow = resultsBody.querySelector("tr");
        if (firstRow) {
            selectRow(firstRow, 0);
            firstRow.setAttribute("tabindex", "0");
            firstRow.focus();
        }
    }
    function setupLoadFormatting(input) {
        if (!input) return;

        input.addEventListener("focus", function () {
            this.value = this.value.replace(/,/g, "");
        });

        input.addEventListener("input", function () {
            this.value = this.value
                .replace(/[^0-9]/g, "")
                .slice(0, 5);
        });

        input.addEventListener("blur", function () {
            const value = this.value.replace(/,/g, "");

            if (value !== "") {
                this.value = Number(value).toLocaleString("en-US");
            }
        });
    }

    setupLoadFormatting(loadMin);
    setupLoadFormatting(loadMax);

    loadMax?.addEventListener("focus", function () {
        previousLoadMax = this.value;
    });
    function toWarekiSlash(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const parts = new Intl.DateTimeFormat(
            "ja-JP-u-ca-japanese",
            {
                //era: "narrow",
                era: "long",
                year: "2-digit",
                month: "2-digit",
                day: "2-digit"
            }
        ).formatToParts(date);

        const getPart = type =>
            parts.find(part => part.type === type)?.value ?? "";

        const era = getPart("era");
        const year = getPart("year");

        //return `${era}.${year}/${getPart("month")}/${getPart("day")}`;
        return `${era}${year}/${getPart("month")}/${getPart("day")}`;
    }


    // Update the selected result row.
    function selectRow(row, index) {
        resultsBody.querySelectorAll("tr").forEach(function (item) {
            item.classList.remove("is-selected");
        });
        row.classList.add("is-selected");
        selectedVehicle = searchResults[index];
        setMessage("");
    }

    // Search vehicles using the entered conditions.
    async function executeSearch() {
        const searchUrl = popupWindow.dataset.searchUrl;

        // Validate the search URL.
        if (!searchUrl) {
            setMessage("検索URLが設定されていません。");
            return;
        }

        // Read the search conditions.
        const number = vehicleNumber?.value.trim() ?? "";
        const makerValue = maker?.value.trim() ?? "";
        const modelValue = model?.value.trim() ?? "";
        const categoryValue = getCategory();

        const minValue = loadMin?.value.replace(/,/g, "").trim() ?? "";
        const maxValue = loadMax?.value.replace(/,/g, "").trim() ?? "";
 

        // Build search parameters from populated fields.
        const params = new URLSearchParams();
        if (number) params.set("vehicleNumber", number);
        if (makerValue) params.set("makerName", makerValue);
        if (modelValue) params.set("model", modelValue);
        if (categoryValue) params.set("vehicleCategory", categoryValue);
        if (minValue !== "") params.set("loadMin", minValue);
        if (maxValue !== "") params.set("loadMax", maxValue);
        if (activeOnly) params.set("activeOnly", "true");

        btnSearch.disabled = true;
        setMessage("検索中！！　暫くお待ち下さい");

        try {
            // Build the request URL.
            const queryString = params.toString();
            const url = queryString
                ? `${searchUrl}?${queryString}`
                : searchUrl;

            // Send the vehicle search request.
            const response = await fetch(url, {
                method: "GET",
                headers: { "Accept": "application/json" }
            });

            const data = await response.json();

            // Handle HTTP and application errors.
            if (!response.ok || data.success === false) {
                throw new Error(
                    data.message || `検索に失敗しました (HTTP ${response.status})`
                );
            }

            // Support array and object response formats.
            const items = Array.isArray(data)
                ? data
                : (data.items ?? data.results ?? []);

            renderResults(items);

            if (items.length === 0) {
                setMessage("");
                alert("対象データがありません");
                return;
            } else {
                setMessage("");

                // Focus the first search result.
                const firstRow = resultsBody.querySelector("tr");
                if (firstRow) {
                    selectRow(firstRow, 0);
                    firstRow.setAttribute("tabindex", "0");
                    firstRow.focus();
                }
            }
        } catch (error) {
            console.error("Vehicle Search Error:", error);
            renderResults([]);
            setMessage("車輌検索に失敗しました。");
        } finally {
            btnSearch.disabled = false;
        }
    }
    // Apply the selected vehicle and close the popup.
    function applySelectedVehicle() {
        if (!selectedVehicle) {
            //setMessage("車輌を選択してください。");
            return;
        }

        // Send the selected vehicle code to the master screen.
        document.dispatchEvent(
            new CustomEvent("vehicle-search-selected", {
                detail: {
                    /* vehicleCode: selectedVehicle.vehicleCode*/

                    vehicleCode: selectedVehicle.vehicleCode,
                    vehicleNumber: selectedVehicle.vehicleNumber
                }
            })
        );

        // Clear search fields.
        vehicleNumber.value = "";
        maker.value = "";
        model.value = "";
        loadMin.value = "";
        loadMax.value = "";

        // Reset the vehicle category.
        setVehicleCategory("");

        // Clear search results and messages.
        renderResults([]);
        resultCount.textContent = "件数:0";
        setMessage("");
        navigationFields.forEach(field => {
            keptValues.set(field, "");
        });
        // Reset selected vehicle and cached results.
        selectedVehicle = null;
        searchResults = [];

        // Close the search popup.
        closeVehicleSearchPopup();
    }

    // Open the popup when requested by vehicle_master.js.
    document.addEventListener("openVehicleSearchPopup", function (event) {
        activeOnly = event?.detail?.activeOnly === true;
        openPopup();
    });

    // F11: Clear search conditions and results.
    btnCancel?.addEventListener("click", function () {
        vehicleNumber.value = "";
        maker.value = "";
        model.value = "";
        loadMin.value = "";
        loadMax.value = "";

        // Reset the vehicle category.
        setVehicleCategory("");

        renderResults([]);
        resultCount.textContent = "件数:0";
        setMessage("");
        navigationFields.forEach(field => {
            keptValues.set(field, "");
        });
        // Focus and select the vehicle number field.
        vehicleNumber.focus();
        vehicleNumber.select();
    });

    // Configure sorting for the Vehicle Search results.
    let sortColumn = null;
    let sortAsc = true;

    // Add sorting to each sortable column header.
    document.querySelectorAll(
        ".vehicle-search-table thead th[data-sort]"
    ).forEach(header => {
        header.addEventListener("click", function () {
            const columnName = this.dataset.sort;
            const tbody = document.getElementById("vehicleSearchResults");

            if (!tbody) return;

            // Get rows containing all eight result columns.
            const rows = Array.from(tbody.querySelectorAll("tr"))
                .filter(row => row.children.length === 8);

            if (rows.length === 0) return;
             
            // Determine the next sort direction.
            // A new column starts with ascending order.
            // Clicking the same column toggles the direction.
            if (sortColumn === columnName) {
                sortAsc = !sortAsc;
            } else {
                sortColumn = columnName;
                sortAsc = true;
            }

            const nextDirection = sortAsc ? "asc" : "desc";

            // Determine the selected column index.
            const headers = Array.from(
                this.closest("table").querySelectorAll("thead th[data-sort]")
            );

            const columnIndex = headers.findIndex(
                item => item.dataset.sort === columnName
            );

            if (columnIndex < 0) return;

            // Specify columns that require numeric sorting.
            const numericColumns = ["loadWeight"];

            // Sort rows in the selected direction.
            rows.sort((a, b) => {
                const valueA =
                    a.children[columnIndex].textContent.trim();

                const valueB =
                    b.children[columnIndex].textContent.trim();

                let comparison;

                if (numericColumns.includes(columnName)) {
                    // Compare numeric values without thousands separators.
                    const numberA = Number(valueA.replace(/,/g, "")) || 0;
                    const numberB = Number(valueB.replace(/,/g, "")) || 0;
                    comparison = numberA - numberB;
                } else {
                    // Compare text using Japanese locale-aware sorting.
                    comparison = valueA.localeCompare(
                        valueB,
                        "ja",
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );
                }

                return nextDirection === "asc"
                    ? comparison
                    : -comparison;
            });

            // Reorder existing rows.
            rows.forEach(row => tbody.appendChild(row));

            // Restore focus to the selected row.
            const selectedRow = tbody.querySelector(
                "tr.is-selected, tr.selected"
            );

            if (selectedRow) {
                selectedRow.focus();
            }
        });
    });

    // F12: Clear search conditions and close the popup.
    btnExit?.addEventListener("click", function () {
        vehicleNumber.value = "";
        maker.value = "";
        model.value = "";
        loadMin.value = "";
        loadMax.value = "";

        // Reset the vehicle category.
        setVehicleCategory("");

        renderResults([]);
        resultCount.textContent = "件数:0";
        setMessage("");
        navigationFields.forEach(field => {
            keptValues.set(field, "");
        });
        closeVehicleSearchPopup();
    });
    btnSearch?.addEventListener("mousedown", function (event) {
        event.preventDefault();
    });
    // Connect search and selection buttons.
    btnSearch?.addEventListener("click", executeSearch);
    btnSelect?.addEventListener("click", applySelectedVehicle);

    //// Display a message when master registration is unavailable.
    //btnRegister?.addEventListener("click", function () {
    //    setMessage("マスタ登録機能は未接続です。");
    //});

    // Execute search when Enter is pressed in a search field.
    //popup.querySelectorAll(
    //    ".vehicle-search-conditions input"
    //).forEach(function (input) {
    //    input.addEventListener("keydown", function (event) {
    //        if (event.key === "Enter") {
    //            event.preventDefault();
    //            executeSearch();
    //        }
    //    });
    //});

    // Handle keyboard shortcuts while the popup is open.
    //document.addEventListener("keydown", function (event) {
    //    if (!popup.classList.contains("is-open")) return;

    //    if (event.key === "Escape" || event.key === "F11" || event.key === "F12") {
    //        event.preventDefault();
    //        closePopup();
    //    } else if (event.key === "F5") {
    //        event.preventDefault();
    //        executeSearch();
    //    } else if (event.key === "F1") {
    //        event.preventDefault();
    //        applySelectedVehicle();
    //    }
    //});

    // Log vehicle selection events.
    popup.addEventListener("vehicle-selected", function (event) {
        console.log("Selected vehicle:", event.detail);
    });
    // Get the vehicle category input and option buttons.
    const categoryInput = document.getElementById("searchVehicleCategory");
    let lastValidCategory = categoryInput?.value ?? "";
    // Define the Vehicle Search input navigation order.
    const navigationFields = [
        vehicleNumber,
        maker,
        model,
        categoryInput,
        loadMin,
        loadMax
    ];
    // Preserve typed values when focus moves to the next field.
    const keptValues = new Map(
        navigationFields.map(field => [field, field.value])
    );

    navigationFields.forEach((field, index) => {
        const nextField =
            navigationFields[(index + 1) % navigationFields.length];

        field.addEventListener("blur", function (event) {
            if (event.relatedTarget === nextField) {
                keptValues.set(field, field.value);
            } else {
                field.value = keptValues.get(field);
            }
        });
    });
    // Handle keyboard navigation and F5 search.
    popup.addEventListener("keydown", function (event) {

        // F5: Execute search.
        //if (event.key === "F5") {
        //    event.preventDefault();
        //    executeSearch();
        //    return;
        //}

        const currentIndex = navigationFields.indexOf(event.target);

        // Apply navigation only to the search input fields.
        if (currentIndex === -1) return;

        let nextIndex;

        if (event.key === "Enter" || event.key === "ArrowDown") {
            event.preventDefault();

            // Validate vehicle category when moving to load minimum.
            if (event.target === categoryInput) {
                const categoryValue = categoryInput.value.trim();

                if (!["", "0", "1", "2"].includes(categoryValue)) {
                    alert("車輌区分を正しく入力して下さい！！（0・1・2）");

                    setVehicleCategory(lastValidCategory);
                    categoryInput.focus();
                    return;
                }
            }

            // Validate load range when moving forward from load maximum.
            if (event.target === loadMax) {
                const minValue = loadMin.value.replace(/,/g, "").trim();
                const maxValue = loadMax.value.replace(/,/g, "").trim();

                if (
                    minValue !== "" &&
                    maxValue !== "" &&
                    Number(minValue) > Number(maxValue)
                ) {
                    alert("最大積載量を正しく入力して下さい！！");

                    loadMax.value = previousLoadMax;
                    loadMin.focus();
                    return;
                }
            }

            nextIndex = (currentIndex + 1) % navigationFields.length;
        }

        // Up / Escape: Move to the previous field.
        else if (event.key === "ArrowUp" || event.key === "Escape") {
            event.preventDefault();
            nextIndex = (currentIndex - 1 + navigationFields.length)
                % navigationFields.length;
        }
        else {
            return;
        }

        const nextField = navigationFields[nextIndex];

        nextField.focus();
        nextField.select();
    });

    const categoryButtons = document.querySelectorAll(
        ".vehicle-category-options button"
    );
    categoryButtons.forEach(button => {
        button.addEventListener("mousedown", function (event) {
            event.preventDefault();
        });
    });
    // Update the category input and active button.
    function setVehicleCategory(value) {
        categoryInput.value = value;
        categoryButtons.forEach(function (button) {
            button.classList.toggle(
                "active",
                button.dataset.value === value
            );
        });
    }

    // Select a category when its option button is clicked.
    categoryButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            setVehicleCategory(button.dataset.value);
            lastValidCategory = button.dataset.value;

            // Move focus to load minimum after selecting a category.
            loadMin.focus();
        });
    });

    // Allow only numeric input with a maximum of one character.
    // Validation is performed when moving forward from this field.
    categoryInput?.addEventListener("input", function () {
        this.value = this.value.replace(/[^0-9]/g, "").slice(0, 1);

        if (["", "0", "1", "2"].includes(this.value)) {
            lastValidCategory = this.value;
            setVehicleCategory(this.value);
        }
    });

    // Initialize shared window controls.
    function initializeWindowControls({
        windowElement,
        minimizeButton,
        maximizeButton,
        closeButton,
        onClose
    }) {
        // Minimize or restore the window.
        minimizeButton?.addEventListener("click", function () {
            windowElement.classList.toggle("is-minimized");
        });

        // Maximize or restore the window.
        maximizeButton?.addEventListener("click", function () {
            windowElement.classList.toggle("is-maximized");
            windowElement.classList.remove("is-minimized");
        });

        // Execute the close callback.
        closeButton?.addEventListener("click", function () {
            onClose?.();
        });
    }

    // Get Vehicle Master modal elements and controls.
    const vehicleMasterModal =
        document.getElementById("vehicleMasterModal");
    const vehicleMasterWindow =
        document.getElementById("vehicleMasterWindow");
    const vehicleMasterFrame =
        document.getElementById("vehicleMasterFrame");
    const btnVehicleMasterMinimize =
        document.getElementById("btnVehicleMasterMinimize");
    const btnVehicleMasterMaximize =
        document.getElementById("btnVehicleMasterMaximize");
    const btnVehicleMasterClose =
        document.getElementById("btnVehicleMasterClose");

    // F10: Open Vehicle Master in registration mode.
    btnRegister?.addEventListener("click", function () {
        if (!vehicleMasterModal || !vehicleMasterFrame) return;

        // Reset the modal window state.
        vehicleMasterWindow?.classList.remove(
            "is-minimized",
            "is-maximized"
        );

        // Load the Vehicle Master registration page.
        vehicleMasterFrame.src =
            "/VehicleMaster/Vehicle_master?popupMode=true";

        // Display the registration modal.
        vehicleMasterModal.style.display = "flex";
    });

    // Attach window controls to the Vehicle Master modal.
    initializeWindowControls({
        windowElement: vehicleMasterWindow,
        minimizeButton: btnVehicleMasterMinimize,
        maximizeButton: btnVehicleMasterMaximize,
        closeButton: btnVehicleMasterClose,

        onClose: function () {
            // Hide the modal and unload its iframe.
            vehicleMasterModal.style.display = "none";
            vehicleMasterFrame.src = "about:blank";

            // Reset the modal window state.
            vehicleMasterWindow.classList.remove(
                "is-minimized",
                "is-maximized"
            );
        }
    });

    // Close the modal when the iframe sends a close request.
    window.addEventListener("message", function (event) {
        if (event.origin !== window.location.origin) return;

        if (event.data?.action === "closeVehicleMasterModal") {
            btnVehicleMasterClose?.click();
        }
    });

    // Connect Vehicle Search window controls.
    document
        .getElementById("btnVehicleSearchMinimize")
        ?.addEventListener("click", minimizeVehicleSearchPopup);

    document
        .getElementById("btnVehicleSearchMaximize")
        ?.addEventListener("click", maximizeVehicleSearchPopup);

    document
        .getElementById("btnVehicleSearchClose")
        ?.addEventListener("click", closeVehicleSearchPopup);

    // Track the popup window state.
    let isVehicleSearchMaximized = false;
    let isVehicleSearchMinimized = false;

    // Close the popup and reset its dimensions.
    function closeVehicleSearchPopup() {
        const popup = document.getElementById("vehicleSearchPopup");

        if (popup) {
            popup.classList.remove("is-open");
            popup.setAttribute("aria-hidden", "true");
        }

        const popupWindow = document.getElementById("vehicleSearchWindow");

        if (popupWindow) {
            popupWindow.classList.remove("maximized", "minimized");
            popupWindow.style.height = "";
            popupWindow.style.width = "";
        }

        isVehicleSearchMaximized = false;
        isVehicleSearchMinimized = false;
    }

    // Maximize or restore the Vehicle Search popup.
    function maximizeVehicleSearchPopup() {
        const popupWindow = document.getElementById("vehicleSearchWindow");
        if (!popupWindow) return;

        if (!isVehicleSearchMaximized) {
            popupWindow.classList.add("maximized");
            popupWindow.classList.remove("minimized");
            popupWindow.style.width = "100vw";
            popupWindow.style.height = "100vh";
            isVehicleSearchMaximized = true;
            isVehicleSearchMinimized = false;
        } else {
            popupWindow.classList.remove("maximized");
            popupWindow.style.width = "";
            popupWindow.style.height = "";
            isVehicleSearchMaximized = false;
        }
    }

    // Minimize or restore the Vehicle Search popup.
    function minimizeVehicleSearchPopup() {
        const popupWindow = document.getElementById("vehicleSearchWindow");
        if (!popupWindow) return;

        if (!isVehicleSearchMinimized) {
            popupWindow.classList.remove("maximized");
            popupWindow.classList.add("minimized");
            popupWindow.style.height = "100px";
            isVehicleSearchMinimized = true;
            isVehicleSearchMaximized = false;
        } else {
            popupWindow.classList.remove("minimized");
            popupWindow.style.height = "";
            isVehicleSearchMinimized = false;
        }
    }
});