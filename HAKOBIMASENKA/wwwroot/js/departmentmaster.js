// DEPARTMENT MASTER

document.addEventListener("DOMContentLoaded", async function () {
    const departmentCode = document.getElementById("departmentCode");
    if (!departmentCode) return;

    try {
        const response = await fetch("/DepartmentMaster/NextCode");
        const result = await response.json();

        if (result.success) {
            departmentCode.value = result.departmentCode;
            departmentCode.readOnly = false;
            departmentCode.classList.remove("department-code-selected");
            departmentCode.focus();
            departmentCode.select();
        } else {
            // 01～99 are already used
            departmentCode.value = "";
        }
    } catch (error) {
        console.error("Next Department Code Error:", error);
    }
});

// Department List - Double Click
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".table-body tr").forEach(row => {
        row.addEventListener("dblclick", function () {
            document.querySelectorAll(".table-body tr").forEach(item => item.classList.remove("selected"));
            row.classList.add("selected");

            const code = row.dataset.code;
            const name = row.dataset.name;

            // Department Code
            const departmentCode = document.getElementById("departmentCode");
            if (departmentCode) {
                departmentCode.value = code;
                departmentCode.readOnly = true;
                departmentCode.classList.add("department-code-selected");
            }

            // Department Name
            const departmentName = document.getElementById("departmentName");
            if (departmentName) {
                departmentName.value = name;
                departmentName.classList.add("department-name-selected");
                departmentName.select();
            }

            // Change New → Update
            const btnNew = document.getElementById("btnNew");
            if (btnNew) btnNew.textContent = "修 正";

            // Enable F2 / F4
            const btnCopy = document.getElementById("btnCopy");
            const btnDelete = document.getElementById("btnDelete");
            if (btnCopy) btnCopy.disabled = false;
            if (btnDelete) btnDelete.disabled = false;
        });
    });
});

// F2 - Copy
const btnCopy = document.getElementById("btnCopy");

if (btnCopy) {
    btnCopy.addEventListener("click", async function () {
        const departmentName = document.getElementById("departmentName");
        if (!departmentName) return;

        const copyName = departmentName.value;

        try {
            const response = await fetch("/DepartmentMaster/NextCode");
            const result = await response.json();

            if (!result.success) {
                alert("部門コードを取得できませんでした。");
                return;
            }

            // Set new Department Code
            const departmentCode = document.getElementById("departmentCode");
            if (departmentCode) {
                departmentCode.value = result.departmentCode;
                departmentCode.readOnly = false;
                departmentCode.classList.remove("department-code-selected");
                departmentCode.focus();
                departmentCode.select();
            }

            // Keep copied Department Name
            departmentName.value = copyName;
            departmentName.classList.remove("department-name-selected");

            // New mode
            const btnNew = document.getElementById("btnNew");
            if (btnNew) btnNew.textContent = "新 規";

            // Disable F2 / F4
            btnCopy.disabled = true;
            const btnDelete = document.getElementById("btnDelete");
            if (btnDelete) btnDelete.disabled = true;
        } catch (error) {
            console.error("Department Copy Error:", error);
        }
    });
}

// Department Code - Search Existing Code
const departmentCodeInput = document.getElementById("departmentCode");

if (departmentCodeInput) {
    function searchDepartmentCode() {
        const enteredCode = departmentCodeInput.value.trim();
        if (!enteredCode) return;

        // Pad Department Code to 2 digits
        const paddedCode = enteredCode.padStart(2, "0");
        departmentCodeInput.value = paddedCode;

        const rows = document.querySelectorAll(".table-body tr");
        const foundRow = [...rows].find(row => row.dataset.code === paddedCode);
        if (!foundRow) return;

        // Select row
        rows.forEach(row => row.classList.remove("selected"));
        foundRow.classList.add("selected");

        // Get row data
        const departmentName = foundRow.dataset.name;

        // Department Code
        departmentCodeInput.readOnly = true;
        departmentCodeInput.classList.add("department-code-selected");

        // Department Name
        const departmentNameInput = document.getElementById("departmentName");
        if (departmentNameInput) {
            departmentNameInput.value = departmentName;
            departmentNameInput.classList.add("department-name-selected");
            departmentNameInput.select();
        }

        // Change New → Update
        const btnNew = document.getElementById("btnNew");
        if (btnNew) btnNew.textContent = "修 正";

        // Enable F2 / F4
        const btnCopy = document.getElementById("btnCopy");
        const btnDelete = document.getElementById("btnDelete");
        if (btnCopy) btnCopy.disabled = false;
        if (btnDelete) btnDelete.disabled = false;

        // Scroll selected row
        foundRow.scrollIntoView({ behavior: "auto", block: "nearest" });
    }

    // Search on blur
    departmentCodeInput.addEventListener("blur", searchDepartmentCode);

    // Search on Enter
    departmentCodeInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            searchDepartmentCode();
        }
    });
}

// F11 - Clear Fields
document.getElementById("btnClear")?.addEventListener("click", async function () {
    // Clear Department Name
    const departmentName = document.getElementById("departmentName");
    if (departmentName) {
        departmentName.value = "";
        departmentName.classList.remove("department-name-selected");
        departmentName.blur();
    }

    // Get MAX Department Code + 1
    try {
        const response = await fetch("/DepartmentMaster/NextCode");
        const result = await response.json();
        const departmentCode = document.getElementById("departmentCode");

        if (!result.success) {
            // 01～99 are already used
            if (departmentCode) {
                departmentCode.value = "";
                departmentCode.readOnly = false;
                departmentCode.classList.remove("department-code-selected");
            }
        } else if (departmentCode) {
            departmentCode.value = result.departmentCode;
            departmentCode.readOnly = false;
            departmentCode.classList.remove("department-code-selected");
            departmentCode.focus();
            departmentCode.select();
        }
    } catch (error) {
        console.error("Next Department Code Error:", error);
        return;
    }

    // Change Update → New
    const btnNew = document.getElementById("btnNew");
    if (btnNew) btnNew.textContent = "新 規";

    // Select first row
    const rows = document.querySelectorAll(".table-body tr");
    rows.forEach(row => row.classList.remove("selected"));

    if (rows.length > 0) {
        rows[0].classList.add("selected");

        // Keep first row below frozen header
        const listPanel = document.querySelector(".list-panel");
        const header = listPanel?.querySelector("thead");
        if (listPanel && header) listPanel.scrollTop = rows[0].offsetTop - header.offsetHeight;
    }

    // Disable F2 / F4
    const btnCopy = document.getElementById("btnCopy");
    const btnDelete = document.getElementById("btnDelete");
    if (btnCopy) btnCopy.disabled = true;
    if (btnDelete) btnDelete.disabled = true;
});

// F4 - Delete
const btnDelete = document.getElementById("btnDelete");

if (btnDelete) {
    btnDelete.addEventListener("click", async function () {
        const selectedRow = document.querySelector(".table-body tr.selected");

        if (!selectedRow) {
            alert("削除するデータを選択してください。");
            return;
        }

        const departmentCode = selectedRow.dataset.code;

        try {
            // Confirm deletion
            if (!confirm("削除してもよいですか?")) return;

            // Actual delete
            const deleteResponse = await fetch("/DepartmentMaster/Delete", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `departmentCode=${encodeURIComponent(departmentCode)}`
            });

            const deleteResult = await deleteResponse.json();

            // Delete result
            if (deleteResult.success) {
                window.location.href = "/DepartmentMaster/Department_Master";
            } else {
                alert(deleteResult.message || "削除できませんでした。");
            }
        } catch (error) {
            console.error("Department Delete Error:", error);
            alert("削除処理中にエラーが発生しました。");
        }
    });
}

// F1 - Register / Update
const btnRegister = document.getElementById("btnRegister");

if (btnRegister) {
    btnRegister.addEventListener("click", async function () {
        const departmentCodeInput = document.getElementById("departmentCode");
        const departmentNameInput = document.getElementById("departmentName");
        const departmentCode = departmentCodeInput?.value.trim() || "";
        const departmentName = departmentNameInput?.value.trim() || "";

        // Validation
        if (!departmentCode) {
            alert("部門コードを入力してください");
            departmentCodeInput?.focus();
            return;
        }

        if (!departmentName) {
            alert("部門名を入力してください");
            departmentNameInput?.focus();
            return;
        }

        // Save
        try {
            const response = await fetch("/DepartmentMaster/Save", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `departmentCode=${encodeURIComponent(departmentCode)}&departmentName=${encodeURIComponent(departmentName)}`
            });

            const result = await response.json();

            if (!result.success) {
                alert(result.message || "登録できませんでした。");
                return;
            }

            // Register success
            //alert("登録しました。");
            window.location.reload();
        } catch (error) {
            console.error("Department Save Error:", error);
            alert("登録処理中にエラーが発生しました。");
        }
    });
}