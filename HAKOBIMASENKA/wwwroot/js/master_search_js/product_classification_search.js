
document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById(
        "productClassificationSearchPopup"
    );

    const win = document.getElementById(
        "productClassificationSearchWindow"
    );

    if (!popup || !win) return;

    // Hide disabled function-key buttons (legacy ButtonVisible).
    popup.querySelectorAll(".product-classification-search-footer button:disabled")
        .forEach(button => {
            button.hidden = true;
        });

    const categoryName = document.getElementById(
        "searchProductclassificationName"
    );

    // Restrict 名称 input to the legacy 16-byte limit.
    categoryName.addEventListener("input", function () {
        this.value = limitBytes(this.value, 16);
    });

    const resultsBody = document.getElementById(
        "productClassificationSearchResults"
    );

    const resultCount = document.getElementById(
        "productClassificationSearchCount"
    );

    const message = document.getElementById(
        "productClassificationSearchMessage"
    );

    const btnSearch = document.getElementById(
        "btnProductClassificationSearchExecute"
    );

    const btnSelect = document.getElementById(
        "btnProductClassificationSearchSelect"
    );

    const btnCancel = document.getElementById(
        "btnProductClassificationSearchCancel"
    );

    const btnExit = document.getElementById(
        "btnProductClassificationSearchExit"
    );

    const btnMinimize = document.getElementById(
        "btnProductClassificationSearchMinimize"
    );

    const btnMaximize = document.getElementById(
        "btnProductClassificationSearchMaximize"
    );

    const btnClose = document.getElementById(
        "btnProductClassificationSearchClose"
    );

    let selectedCategory = null;
    let isMinimized = false;
    let isMaximized = false;

    let classificationPopupSource = null;

    let sortColumn = null;
    let sortAsc = true;

    // Display a message.
    function setMessage(text) {
        message.textContent = text;
    }


    // =========================================
    //Search Popup - Drag Window
    // =========================================

    function initializeproductclassificationSearchDrag() {

        const popup = document.getElementById("productClassificationSearchWindow");
        const titlebar = popup?.querySelector(
            ".product-classification-search-titlebar"
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

    initializeproductclassificationSearchDrag();

    // Open the Product Classification Search popup.
    //function openPopup() {
    //    popup.classList.add("is-open");
    //    popup.setAttribute("aria-hidden", "false");
    //    setMessage("");
    //    categoryName.focus();
    //}
    // Open the Product Classification Search popup.
    function openPopup() {
        popup.classList.add("is-open");
        popup.setAttribute("aria-hidden", "false");

        // Clear previous search condition.
        clearFields();

        // Clear previous results and reset count.
        renderResults([]);

        // Reset sorting directions.
        sortColumn = null;
        sortAsc = true;

        // Clear previous messages.
        setMessage("");

        // Focus the classification name field.
        categoryName.focus();
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
        selectedCategory = null;

        document.dispatchEvent(
            new CustomEvent("product-classification-search-closed", {
                detail: {
                    source: classificationPopupSource
                }
            })
        );

        classificationPopupSource = null;
    }

    // Clear the search condition.
    function clearFields() {
        categoryName.value = "";
    }

    // Select a classification row.
    function selectRow(row, category) {
        resultsBody.querySelectorAll("tr").forEach(item => {
            item.classList.remove("is-selected");
        });

        row.classList.add("is-selected");
        selectedCategory = category;
        setMessage("");
    }

    // Render search results.
    function renderResults(items) {
        selectedCategory = null;
        resultsBody.replaceChildren();

        resultCount.textContent = items.length
            ? `件数：${items.length.toLocaleString("en-US")}`
            : "件数:0";

        items.forEach(category => {
            const row = document.createElement("tr");

            const values = [
                category.code ?? "",
                category.productCategoryName ?? ""
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = String(value);
                row.appendChild(cell);
            });

            row.tabIndex = 0;

            // Select a classification when the row is clicked.
            row.addEventListener("click", function () {
                selectRow(row, category);
            });

            // Select a classification when the row is double-clicked.
            row.addEventListener("dblclick", function () {
                selectRow(row, category);
                applySelectedCategory();
            });

            // Select a classification by pressing Enter on the row.
            // Handle keyboard navigation and selection.
            row.addEventListener("keydown", function (event) {
                if (event.key === "ArrowDown" && row.nextElementSibling) {
                    event.preventDefault();
                    row.nextElementSibling.focus();
                    row.nextElementSibling.click();
                }

                if (event.key === "ArrowUp" && row.previousElementSibling) {
                    event.preventDefault();
                    row.previousElementSibling.focus();
                    row.previousElementSibling.click();
                }

                if (event.key === "Enter") {
                    event.preventDefault();
                    selectRow(row, category);
                    applySelectedCategory();
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

    // Execute the classification search.
    async function executeSearch() {
        const searchUrl = win.dataset.searchUrl;
        const params = new URLSearchParams();

        if (categoryName.value.trim()) {
            params.set(
                "productCategoryName",
                categoryName.value.trim()
            );
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
                    data.message || "品名区分検索に失敗しました。"
                );
            }

            const items = Array.isArray(data)
                ? data
                : (data.items ?? data.results ?? []);

            renderResults(items);
 

            if (items.length === 0) {

                // Notify the user when no vehicles match the search conditions.
                alert("対象データがありません");
                setMessage("");
                categoryName.focus();
            } else {
                setMessage("");
                resultsBody.querySelector("tr")?.focus();
            }
        } catch (error) {
            console.error(
                "Product Classification Search Error:",
                error
            );

            renderResults([]);
            setMessage("品名区分検索に失敗しました。");
        } finally {
            btnSearch.disabled = false;
        }
    }

    // Apply the selected classification and notify the calling screen.
    function applySelectedCategory() {
        if (!selectedCategory) {
            return;
        }

        //document.dispatchEvent(
        //    new CustomEvent("product-classification-search-selected", {
        //        detail: {
        //            code: selectedCategory.code,
        //            productCategoryName:
        //                selectedCategory.productCategoryName
        //        }
        //    })
        //);
        // Notify only the calling screen.
        document.dispatchEvent(
            new CustomEvent("product-classification-search-selected", {
                detail: {
                    source: classificationPopupSource,
                    code: selectedCategory.code,
                    productCategoryName:
                        selectedCategory.productCategoryName
                }
            })
        );

        closePopup();
    }

    // Cancel the search and clear its condition.
    function cancelSearch() {
        clearFields();
        renderResults([]);
        setMessage("");
        categoryName.focus();
        categoryName.select();
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
    btnSelect.addEventListener("click", applySelectedCategory);
    btnCancel.addEventListener("click", cancelSearch);

    btnExit.addEventListener("click", function () {
        clearFields();
        renderResults([]);
        closePopup();
    });

    btnClose.addEventListener("click", closePopup);
    btnMinimize.addEventListener("click", minimizePopup);
    btnMaximize.addEventListener("click", maximizePopup);

    //// Open the popup from the calling screen.
    //document.addEventListener(
    //    "openProductClassificationSearchPopup",
    //    openPopup
    //);

    //// Open Product Classification Search popup.
    //document.addEventListener(
    //    "openProductClassificationSearchPopup",
    //    function () {
    //        console.log("Product Classification Search event received.");

    //        openPopup();

    //        console.log(
    //            "Popup opened:",
    //            popup.classList.contains("is-open")
    //        );
    //    }
    //);  
        // =========================================
        // Open Product Classification Search Popup
        // =========================================

        document.addEventListener(
            "openProductClassificationSearchPopup",
            function (event) {

                classificationPopupSource =
                    event.detail?.source || null;

                console.log(
                    "Classification popup caller:",
                    classificationPopupSource
                );

                openPopup();
            }
        );
    // Search when Enter is pressed in the condition field.
    categoryName.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
        }
    });

    //// Handle function keys while the popup is open.
    //document.addEventListener("keydown", function (event) {
    //    if (!popup.classList.contains("is-open")) return;

    //    if (event.key === "F1") {
    //        event.preventDefault();
    //        applySelectedCategory();
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
        ".product-classification-search-table th[data-sort]"
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

    // for dummy master registration , need to remove once master screen done

    //document.getElementById("btnProductClassificationSearchRegister")
    //    ?.addEventListener("click", function () {
    //        window.parent.postMessage(
    //            { action: "openDummyMasterRegistration" },
    //            window.location.origin
    //        );
    //    });

    // F10: Open Product Category Master
    document.getElementById("btnProductClassificationSearchRegister")
        ?.addEventListener("click", function () {

            if (!categoryMasterModal || !categoryMasterFrame) return;

            categoryMasterWindow.classList.remove(
                "is-minimized",
                "is-maximized"
            );

            categoryMasterFrame.src =
                "/ProductCategoryMaster/Product_category_master?mode=search";

            categoryMasterModal.style.display = "flex";
        });

    // Close Product Category Master modal
    window.addEventListener("message", function (event) {

        if (event.origin !== window.location.origin) return;

        if (event.data?.action === "closeProductCategoryMaster") {

            const modal = document.getElementById("productCategoryMasterModal");
            const frame = document.getElementById("productCategoryMasterFrame");

            if (modal) modal.style.display = "none";
            if (frame) frame.src = "about:blank";

            categoryName.focus();
        }
    });
    // ============================================
    // Product Category Master Modal Window Controls
    // ============================================

    const categoryMasterModal =
        document.getElementById("productCategoryMasterModal");

    const categoryMasterWindow =
        document.getElementById("productCategoryMasterWindow");

    const categoryMasterFrame =
        document.getElementById("productCategoryMasterFrame");

    const categoryMinimize =
        document.getElementById("btnProductCategoryMasterMinimize");

    const categoryMaximize =
        document.getElementById("btnProductCategoryMasterMaximize");

    const categoryClose =
        document.getElementById("btnProductCategoryMasterClose");

    // Minimize
    categoryMinimize?.addEventListener("click", function (event) {
        event.preventDefault();

        categoryMasterWindow.classList.remove("is-maximized");
        categoryMasterWindow.classList.toggle("is-minimized");
    });

    // Maximize / Restore
    categoryMaximize?.addEventListener("click", function (event) {
        event.preventDefault();

        categoryMasterWindow.classList.remove("is-minimized");
        categoryMasterWindow.classList.toggle("is-maximized");
    });

    // Close
    categoryClose?.addEventListener("click", function (event) {
        event.preventDefault();

        categoryMasterModal.style.display = "none";

        categoryMasterWindow.classList.remove(
            "is-minimized",
            "is-maximized"
        );

        categoryMasterFrame.src = "about:blank";

        categoryName.focus();
    });


});

function limitBytes(value, maxBytes) {
    let result = "";
    let byteCount = 0;

    for (const char of value) {
        // ASCII and half-width kana: 1 byte.
        // Other characters: 2 bytes.
        const bytes = /^[\x00-\x7F\uFF61-\uFF9F]$/.test(char) ? 1 : 2;

        if (byteCount + bytes > maxBytes) {
            break;
        }

        result += char;
        byteCount += bytes;
    }

    return result;
}
