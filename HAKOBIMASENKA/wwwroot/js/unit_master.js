// UNIT MASTER
document.addEventListener("DOMContentLoaded", async function () {
 

    // Get Elements
    const unitCode = document.getElementById("unitCode");
    const unitName = document.getElementById("unitName");
    const calculationType = document.getElementById("calculationType");
    const btnNew = document.getElementById("btnNew");
    const btnCopy = document.getElementById("btnCopy");
    const btnDelete = document.getElementById("btnDelete");
    const btnRegister = document.getElementById("btnRegister");
    const btnClear = document.getElementById("btnClear");
    const rows = document.querySelectorAll(".table-body tr");

    // State
    let committedUnitName = "";
    let committedCalculationType = "";
    let isCopyMode = false;
    let isProcessingUnitCode = false;
    let hasCommittedNewValue = false;
    let editingControl = null;
    let lastEditedField = null;
    let originalValue = "";
    let originalAutoUnitCode = "";
    let keptUnitCode = "";
    let hasInvalidCalculationTypeInput = false;

    const tabBtn = document.querySelector(
        ".tab-button[data-tab='basicSetting']"
    );

    // Fetch With Timeout
    async function fetchWithTimeout(url, options = {}, timeout = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(function () {
            controller.abort();
        }, timeout);

        try {
            return await fetch(url, {
                ...options,
                signal: controller.signal
            });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    // Select First Row on Page Load
    if (rows.length > 0) {
        rows.forEach(function (row) {
            row.classList.remove("selected");
        });

        rows[0].classList.add("selected");

        const listPanel = document.querySelector(".list-panel");
        const header = listPanel?.querySelector("thead");

        if (listPanel && header) {
            listPanel.scrollTop = rows[0].offsetTop - header.offsetHeight;
        }
    }

    // Get Next Unit Code
    async function getNextUnitCode() {
        //console.log("Getting next Unit Code...");

        try {
            const response = await fetchWithTimeout("/UnitMaster/NextCode");

            if (!response.ok) {
                throw new Error("HTTP Error: " + response.status);
            }

            const result = await response.json();

            if (!result.success) {
                if (unitCode) {
                    unitCode.value = "";
                    keptUnitCode = "";
                    unitCode.readOnly = false;
                    unitCode.classList.remove("unit-code-selected");
                }

                return false;
            }

            if (unitCode) {
                unitCode.value = result.unitCode;
                keptUnitCode = result.unitCode;
                unitCode.readOnly = false;
                unitCode.classList.remove("unit-code-selected");
                originalAutoUnitCode = result.unitCode;
            }

            return true;
        } catch (error) {
            console.error("Next Unit Code Error:", error);

            if (error.name === "AbortError") {
                console.error("NextCode request timed out.");
            }

            if (unitCode) {
                unitCode.value = "";
                keptUnitCode = "";
                unitCode.readOnly = false;
                unitCode.classList.remove("unit-code-selected");
            }

            return false;
        }
    }
     
    // Initial Page Setup
    const nextCodeSuccess = await getNextUnitCode();

    if (unitCode) {
        unitCode.focus();

        if (nextCodeSuccess) {
            unitCode.select();
        } else {
            unitCode.setSelectionRange(
                unitCode.value.length,
                unitCode.value.length
            );
        }
    }
     
    // Unit List - Double Click
    rows.forEach(function (row) {
        row.addEventListener("dblclick", function () {
            //console.log("Double clicked Unit:", row.dataset.code);

            rows.forEach(function (item) {
                item.classList.remove("selected");
            });

            row.classList.add("selected");
            hasCommittedNewValue = false;
            const code = row.dataset.code || "";
            const name = row.dataset.name || "";
            const calcType = row.dataset.calculationType || "";

            if (unitCode) {
                unitCode.value = code;
                keptUnitCode = code;
                unitCode.readOnly = true;
                unitCode.classList.add("unit-code-selected");
            }

            if (unitName) {
                unitName.value = name;
                unitName.classList.add("unit-name-selected");
                committedUnitName = name;
            }

            if (calculationType) {
                calculationType.value = calcType;
                committedCalculationType = calcType;
            }

            isCopyMode = false;

            if (btnNew) btnNew.textContent = "修　正";
            if (btnCopy) btnCopy.disabled = false;
            if (btnDelete) btnDelete.disabled = false;

            // Focus and Select Unit Name After Loading the Record
            unitName?.focus();
            unitName?.select();
        });
    });

    if (unitName) {
        // Unit Name: Maximum 4 bytes (2 full-width or 4 half-width characters)
        unitName.addEventListener("input", function () {
            let out = "";
            let n = 0;

            for (const ch of this.value) {
                const c = ch.codePointAt(0);
                const w = (c <= 0x7E || (c >= 0xFF61 && c <= 0xFF9F)) ? 1 : 2;

                if (n + w > 4) break;

                out += ch;
                n += w;
            }

            this.value = out;
            lastEditedField = unitName;
        });

        unitName.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === "ArrowDown") {
                e.preventDefault();
                tabBtn?.focus();
            }

            if (e.key === "ArrowUp" || e.key === "Escape") {
                e.preventDefault();
                unitCode?.focus();
            }
        });
    }

    // Enter Key: Load Selected Row
    rows.forEach(function (row) {
        row.setAttribute("tabindex", "0");

        row.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();

                row.dispatchEvent(
                    new MouseEvent("dblclick", { bubbles: true })
                );
            }
        });
    });
 

    // Calculation Type: Track Changes and Validate Enter, Tab, and Blur
    if (calculationType) {
        calculationType.addEventListener("input", function () {
            lastEditedField = calculationType;

            const value = this.value.trim();

            hasInvalidCalculationTypeInput =
                value !== "" && !["1", "2", "3", "4"].includes(value);
        });

        calculationType.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === "ArrowDown") {
                e.preventDefault();

                const v = calculationType.value;

                if (v === "") return;

                if (!["1", "2", "3", "4"].includes(v)) {
                    calculationType.value = committedCalculationType;
                    hasInvalidCalculationTypeInput = false;
                    return;
                }

                hasInvalidCalculationTypeInput = false;
                tabBtn?.focus();
            }

            if (e.key === "ArrowUp" || e.key === "Escape") {
                e.preventDefault();
                unitName?.focus();
            }
        });
    }

    if (tabBtn) {
        tabBtn.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === "ArrowDown") {
                e.preventDefault();
                calculationType?.focus();
            }

            if (e.key === "ArrowUp" || e.key === "Escape") {
                e.preventDefault();
                unitName?.focus();
            }
        });
    }

    [
        [unitName, () => committedUnitName, v => committedUnitName = v],
        [calculationType, () => committedCalculationType, v => committedCalculationType = v]
    ].forEach(([f, get, set]) => {
        if (!f) return;

        f.addEventListener("blur", e => {
            if (e.relatedTarget === tabBtn) {
                if (f.value !== get()) {
                    hasCommittedNewValue = true;
                }

                set(f.value);
            } else if (!e.relatedTarget?.closest?.(".function-footer")) {
                f.value = get();
                
                hasInvalidCalculationTypeInput = false;
            }
        });
    });
    // Track the Currently Focused Input
    document.addEventListener("focusin", function (event) {
        if (event.target.matches("#unitCode, #unitName, #calculationType")) {
            editingControl = event.target;
            lastEditedField = event.target;
            originalValue = event.target.value;
        }
    }); 
    function focusLastEditedField() {
        const field = lastEditedField || editingControl || unitName || unitCode;

        if (field) {
            requestAnimationFrame(function () {
                field.focus();

                if (typeof field.select === "function") {
                    field.select();
                }
            });
        }
    }

     

    // Grid Header Sorting
    const sortUnitCode = document.getElementById("sortUnitCode");
    const sortUnitName = document.getElementById("sortUnitName");

    let unitCodeAscending = true;
    let unitNameAscending = true;

    function sortUnitGrid(sortBy) {
        const tbody = document.querySelector(".table-body");
        if (!tbody) return;

        const selectedRow = tbody.querySelector("tr.selected");
        const currentRows = Array.from(tbody.querySelectorAll("tr"));

        let ascending;

        if (sortBy === "code") {
            ascending = unitCodeAscending;
            unitCodeAscending = !unitCodeAscending;
        } else {
            ascending = unitNameAscending;
            unitNameAscending = !unitNameAscending;
        }

        currentRows.sort(function (a, b) {
            const valueA = sortBy === "code"
                ? a.dataset.code || ""
                : a.dataset.name || "";

            const valueB = sortBy === "code"
                ? b.dataset.code || ""
                : b.dataset.name || "";

            const comparison = valueA.localeCompare(valueB, undefined, {
                numeric: true,
                sensitivity: "base"
            });

            return ascending ? comparison : -comparison;
        });

        currentRows.forEach(function (row) {
            tbody.appendChild(row);
            row.classList.remove("selected");
        });

        if (selectedRow) {
            selectedRow.classList.add("selected");
        }
    }

    // Single Click: Sort by Unit Code
    if (sortUnitCode) {
        sortUnitCode.addEventListener("click", function () {
            sortUnitGrid("code");
        });
    }

    // Single Click: Sort by Unit Name
    if (sortUnitName) {
        sortUnitName.addEventListener("click", function () {
            sortUnitGrid("name");
        });
    }

    // Unit List: Single Click to Select a Row
    rows.forEach(function (row) {
        row.addEventListener("click", function () {
            // Remove the Blue Selection from All Rows
            rows.forEach(function (item) {
                item.classList.remove("selected");
            });

            // Highlight the Clicked Row in Blue
            row.classList.add("selected");
        });
    });
      

    // Process Unit Code on Enter or Tab
    async function processUnitCode(trigger) {
        if (!unitCode || isProcessingUnitCode) return;

        isProcessingUnitCode = true;

        try {
            const code = unitCode.value.trim();

            if (!code) {
                unitCode.value = keptUnitCode;
                unitCode.focus();
                unitCode.select();
                return;
            }

            const foundRow = Array.from(
                document.querySelectorAll(".table-body tr")
            ).find(function (row) {
                return (row.dataset.code || "").trim() === code;
            });

            // Copy Mode: Reject Existing Codes
            if (isCopyMode && foundRow) {
                alert(`指定したコード『${code}』は存在します！！`);

                const success = await getNextUnitCode();
                if (!success) unitCode.value = "";

                unitCode.focus();
                unitCode.select();
                return;
            }

            // Normal Mode: Load an Existing Record on Enter
            if (!isCopyMode && trigger === "Enter" && foundRow) {
                foundRow.dispatchEvent(
                    new MouseEvent("dblclick", { bubbles: true })
                );
                return;
            }

            // New Code: Accept the Code and Move Focus to Unit Name
            if (trigger === "Enter" && unitName) {
                if (!isCopyMode &&
                    btnNew?.textContent.trim() === "新　規" &&
                    code !== keptUnitCode) {

                    // Keep the newly accepted code
                    keptUnitCode = code;

                    // Clear previous Unit Name and Calculation Type
                    unitName.value = "";
                    calculationType.value = "";

                    committedUnitName = "";
                    committedCalculationType = "";

                    unitName.classList.remove("unit-name-selected");
                    hasCommittedNewValue = false;
                }

                unitName.focus();
            }
        } finally {
            isProcessingUnitCode = false;
        }
    } 
    // Unit Code: Process Only When Focus Moves to Unit Name
    // Unit Code: Validate on Enter, Tab, or Mouse Focus Change
    if (unitCode) {

        // Handle Enter and ArrowDown
        unitCode.addEventListener("keydown", function (e) {
            if (e.key !== "Enter" && e.key !== "ArrowDown") return;

            e.preventDefault();

            if (!unitCode.value.trim()) {
                unitCode.value = keptUnitCode;
                unitCode.focus();
                unitCode.select();
                return;
            }

            unitName.focus();
        });

        // Existing Blur Handler
        unitCode.addEventListener("blur", function (event) {
            if (event.relatedTarget === unitName) {
                processUnitCode("Enter");
            }
            else if (
                !unitCode.readOnly &&
                btnNew?.textContent.trim() === "新　規" &&
                !event.relatedTarget?.closest?.(".function-footer")
            ) {
                unitCode.value = keptUnitCode;
            }
        });
    }

 
     
    // Function Key Handlers: F1, F2, F4, F11, F12
     
    // F1: Register / Update
    if (btnRegister) {
        btnRegister.addEventListener("click", async function () {
         

            // Check whether invalid calculation type input was entered.
            if (hasInvalidCalculationTypeInput) {
                alert("計算区分を正しく入力してください！！");

                hasInvalidCalculationTypeInput = false;

                calculationType.focus();
                calculationType.select();
                return;
            }

            const code = unitCode?.value.trim() || "";
            const name = unitName?.value ?? "";
            const calc = calculationType?.value.trim() || "";
 

            // Validate Unit Code.
            if (!code) {
                alert("単位コードを入力してください");
                unitCode?.focus();
                return;
            }

            if (code === "0") {
                alert(
                    "単位コード：0 は手入力用コードなのでマスタ登録はできません"
                );
                unitCode?.focus();
                return;
            }

            // Validate Unit Name.
            if (!name) {
                alert("単位名を入力してください");
                unitName?.focus();
                return;
            }

            // Validate Calculation Type.
            if (!calc) {
                alert("計算区分を入力してください！！");
                calculationType?.focus();
                return;
            }

            if (!["1", "2", "3", "4"].includes(calc)) {
                alert("計算区分を正しく入力してください！！");

                hasInvalidCalculationTypeInput = false;

                calculationType?.focus();
                calculationType?.select();
                return;
            }

            try {
                const response = await fetch("/UnitMaster/Save", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body:
                        `unitCode=${encodeURIComponent(code)}` +
                        `&unitName=${encodeURIComponent(name)}` +
                        `&calculationType=${encodeURIComponent(calc)}`
                });

                const result = await response.json();

                if (!result.success) {
                    alert(result.message || "登録できませんでした。");
                    return;
                }

             
                window.location.reload();

            } catch (error) {
                console.error("Unit Save Error:", error);
                alert("登録処理中にエラーが発生しました。\n" + error.message);
            }
        });
    }

    // F2: Copy
    if (btnCopy) {
        let copyUnitName = "";
        let copyCalculationType = "";

        btnCopy.addEventListener("mousedown", function () {
            copyUnitName = committedUnitName;
            copyCalculationType = committedCalculationType;
        });

        btnCopy.addEventListener("click", async function () {
            if (!unitName || !calculationType) return;

            try {
                // Enable Copy Mode Before Checking the Next Code
                isCopyMode = true;

                const success = await getNextUnitCode();

                // Handle the Case Where No Next Code Is Available
                if (!success && unitCode) {
                    unitCode.value = "";
                    unitCode.readOnly = false;
                    unitCode.classList.remove("unit-code-selected");
                }

                // Restore the Copied Values
                unitName.value = copyUnitName;
                calculationType.value = copyCalculationType;
                unitName.classList.remove("unit-name-selected");

                committedUnitName = copyUnitName;
                committedCalculationType = copyCalculationType;
                hasCommittedNewValue = false;
                if (unitCode) {
                    unitCode.readOnly = false;
                    unitCode.classList.remove("unit-code-selected");
                }

                if (btnNew) btnNew.textContent = "新　規";

                btnCopy.disabled = true;
                if (btnDelete) btnDelete.disabled = true;

                if (unitCode) {
                    unitCode.focus();
                    unitCode.select();
                }

                // Existing Behavior Retained When All Codes Are Occupied
                if (!success) {
                    // Existing behavior retained.
                }
            } catch (error) {
                console.error("Unit Copy Error:", error);
            }
        });
    }
     
    // F4: Delete
    if (btnDelete) {
        btnDelete.addEventListener("click", async function () {

            // Get the unit currently displayed on screen.
            const code = unitCode.value.trim();

            if (!code) {
                return;
            }

            try {
                // Step 1: Check whether the unit is referenced by other tables.
                const checkResponse = await fetch("/UnitMaster/DeleteCheck", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: `unitCode=${encodeURIComponent(code)}`
                });

                if (!checkResponse.ok) {
                    throw new Error(
                        "DeleteCheck HTTP Error: " + checkResponse.status
                    );
                }

                const chk = await checkResponse.json();

                // Stop deletion when the unit is in use.
                if (!chk.success) {
                    alert(chk.message || "この単位は使用中のため削除できません。");
                    unitName?.focus();
                    return;
                }

                // Step 2: Ask for deletion confirmation.
                if (!confirm("削除してもよいですか？")) {
                    unitName?.focus();
                    return;
                }

                // Step 3: Execute deletion.
                const response = await fetch("/UnitMaster/Delete", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: `unitCode=${encodeURIComponent(code)}`
                });

                if (!response.ok) {
                    throw new Error("Delete HTTP Error: " + response.status);
                }

                const result = await response.json();

                if (result.success) {
                    window.location.href = "/UnitMaster/Unit_Master";
                } else {
                    alert(result.message || "削除できませんでした。");
                    unitName?.focus();
                }

            } catch (error) {
                console.error("Unit Delete Error:", error);
                alert("削除処理中にエラーが発生しました。");
                unitName?.focus();
            }
        });
    }

    // F11: Clear
    if (btnClear) {
        btnClear.addEventListener("click", async function () {
            
            if (hasCommittedNewValue) {
                if (!confirm("内容が変更されております。よろしいですか？")) {
                    focusLastEditedField();
                    return;
                }
            }

            if (unitName) {
                unitName.value = "";
                unitName.classList.remove("unit-name-selected");
                committedUnitName = "";
            }

            if (calculationType) {
                calculationType.value = "";
                committedCalculationType = "";
            }

            hasCommittedNewValue = false;
            isCopyMode = false;

            const success = await getNextUnitCode();

            if (unitCode) {
                unitCode.readOnly = false;
                unitCode.classList.remove("unit-code-selected");
                unitCode.focus();

                if (success) {
                    unitCode.select();
                }
            }

            if (btnNew) btnNew.textContent = "新　規";

            rows.forEach(function (row) {
                row.classList.remove("selected");
            });

            if (rows.length > 0) {
                rows[0].classList.add("selected");

                const listPanel = document.querySelector(".list-panel");
                const header = listPanel?.querySelector("thead");

                if (listPanel && header) {
                    listPanel.scrollTop =
                        rows[0].offsetTop - header.offsetHeight;
                }
            }

            if (btnCopy) btnCopy.disabled = true;
            if (btnDelete) btnDelete.disabled = true;
             
        });
    }


    // F12: Exit / Close Popup
    const btnExit = document.getElementById("btnExit_F12");
    const params = new URLSearchParams(window.location.search);
    const isPopupMode = params.get("popupMode") === "true";

    if (btnExit) {
        btnExit.addEventListener("click", function (event) {

            // Check for Unsaved Changes in Both Normal and Popup Modes
            if (hasCommittedNewValue) {
                const confirmed = confirm("変更されていますが、よろしいですか ?");

                if (!confirmed) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    focusLastEditedField();
                    return;
                }
            }

            // Popup Mode: Close Unit Master Modal
            if (isPopupMode) {
                event.preventDefault();
                event.stopImmediatePropagation();

                if (window.parent !== window) {
                    window.parent.postMessage(
                        { action: "closeUnitMasterModal" },
                        window.location.origin
                    );
                }

                return;
            }

            // Normal Mode: Return to Main Menu
            event.preventDefault();

            const exitUrl = btnExit.dataset.exitUrl;

            if (exitUrl) {
                window.location.href = exitUrl;
            }

        }, true);
    }
     
});