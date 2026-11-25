// Load MAX Area Code + 1 when page opens
document.addEventListener("DOMContentLoaded", async function () {
    const areaCode = document.getElementById("areaCode");
    if (!areaCode) return;

    try {
        const response = await fetch("/AreaMaster/NextCode");
        const result = await response.json();

        if (result.success) {
            areaCode.value = result.areaCode;
            areaCode.readOnly = false;
            areaCode.classList.remove("area-code-selected");
            areaCode.focus();
            areaCode.select();
        } else {
            console.error("Failed to get next Area Code.");
        }
    } catch (error) {
        console.error("Next Area Code Error:", error);
    }
});

// Area List - Double Click & F2 Copy
document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll(".table-body tr").forEach(row => {
        row.addEventListener("dblclick", function () {

            document.querySelectorAll(".table-body tr")
                .forEach(item => item.classList.remove("selected"));

            row.classList.add("selected");

            const code = row.dataset.code;
            const name = row.dataset.name;
            const digitalCode = row.dataset.digitalCode;

            const areaCode = document.getElementById("areaCode");
            if (areaCode) {
                areaCode.value = code;
                areaCode.readOnly = true;
                areaCode.classList.add("area-code-selected");
            }

            const areaName = document.getElementById("areaName");
            if (areaName) {
                areaName.value = name;
                areaName.classList.add("area-name-selected");
                areaName.select();
            }

            const digitalCodeInput = document.getElementById("digitalCode");
            if (digitalCodeInput) {
                digitalCodeInput.value = digitalCode || "";
                digitalCodeInput.classList.remove("field-editing");
                digitalCodeInput.blur();
            }

            const btnNew = document.getElementById("btnNew");
            if (btnNew) btnNew.textContent = "修 正";

            const btnCopy = document.getElementById("btnCopy");
            if (btnCopy) btnCopy.disabled = false;

            const btnDelete = document.getElementById("btnDelete");
            if (btnDelete) btnDelete.disabled = false;
        });
    });

    // F2 - Copy
    const btnCopy = document.getElementById("btnCopy");

    if (btnCopy) {
        btnCopy.addEventListener("click", async function () {

            const areaName = document.getElementById("areaName");
            if (!areaName) return;

            const copyName = areaName.value;

            try {
                const response = await fetch("/AreaMaster/NextCode");
                const result = await response.json();

                if (!result.success) {
                    alert("エリアコードを取得できませんでした。");
                    return;
                }

                const areaCode = document.getElementById("areaCode");

                if (areaCode) {
                    areaCode.value = result.areaCode;
                    areaCode.readOnly = false;
                    areaCode.classList.remove("area-code-selected");
                    areaCode.focus();
                    areaCode.select();
                }

                areaName.value = copyName;
                areaName.classList.remove("area-name-selected");

                const btnNew = document.getElementById("btnNew");
                if (btnNew) btnNew.textContent = "新 規";

                btnCopy.disabled = true;

                const btnDelete = document.getElementById("btnDelete");
                if (btnDelete) btnDelete.disabled = true;

            } catch (error) {
                console.error("Copy Error:", error);
            }
        });
    }
});

// Area Code - Search Existing Code
const areaCodeInput = document.getElementById("areaCode");

if (areaCodeInput) {

    function searchAreaCode() {
        const enteredCode = areaCodeInput.value.trim();
        if (!enteredCode) return;

        const paddedCode = enteredCode.padStart(4, "0");
        areaCodeInput.value = paddedCode;

        const rows = document.querySelectorAll(".table-body tr");
        const foundRow = [...rows].find(row => row.dataset.code === paddedCode);

        if (!foundRow) return;

        rows.forEach(row => row.classList.remove("selected"));
        foundRow.classList.add("selected");

        const areaName = foundRow.dataset.name;
        const digitalCode = foundRow.dataset.digitalCode;

        areaCodeInput.readOnly = true;
        areaCodeInput.classList.add("area-code-selected");

        const areaNameInput = document.getElementById("areaName");
        if (areaNameInput) {
            areaNameInput.value = areaName;
            areaNameInput.classList.add("area-name-selected");
            areaNameInput.select();
        }

        const digitalCodeInput = document.getElementById("digitalCode");
        if (digitalCodeInput) digitalCodeInput.value = digitalCode || "";

        const btnNew = document.getElementById("btnNew");
        if (btnNew) btnNew.textContent = "修 正";

        const btnCopy = document.getElementById("btnCopy");
        if (btnCopy) btnCopy.disabled = false;

        const btnDelete = document.getElementById("btnDelete");
        if (btnDelete) btnDelete.disabled = false;

        foundRow.scrollIntoView({ behavior: "auto", block: "nearest" });
    }
        
    areaCodeInput.addEventListener("blur", searchAreaCode);

    // Search on Enter
    areaCodeInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            searchAreaCode();
        }
    });
}

// F11 - Clear Fields
document.getElementById("btnClear")?.addEventListener("click", async function () {

    const areaName = document.getElementById("areaName");
    if (areaName) {
        areaName.value = "";
        areaName.classList.remove("area-name-selected");
        areaName.blur();
    }

    const digitalCode = document.getElementById("digitalCode");
    if (digitalCode) {
        digitalCode.value = "";
        digitalCode.classList.remove("field-editing");
        digitalCode.blur();
    }

    // Get MAX Area Code + 1 from DB
    try {
        const response = await fetch("/AreaMaster/NextCode");
        const result = await response.json();

        if (!result.success) {
            alert("エリアコードを取得できませんでした。");
            return;
        }

        const areaCode = document.getElementById("areaCode");
        if (areaCode) {
            areaCode.value = result.areaCode;
            areaCode.readOnly = false;
            areaCode.classList.remove("area-code-selected");
            areaCode.focus();
            areaCode.select();
        }
    } catch (error) {
        console.error("Next Area Code Error:", error);
        return;
    }

    // Change 修 正 → 新規
    const btnNew = document.getElementById("btnNew");
    if (btnNew) btnNew.textContent = "新 規";

    // Select first row
    const rows = document.querySelectorAll(".table-body tr");

    rows.forEach(row => row.classList.remove("selected"));

    if (rows.length > 0) {
        rows[0].classList.add("selected");
        const listPanel =
            document.querySelector(".list-panel");
        const header =
            listPanel?.querySelector("thead");
        if (listPanel && header) {
            listPanel.scrollTop =
                rows[0].offsetTop - header.offsetHeight;
        }
    }
    //Button Disable
    const btnCopy = document.getElementById("btnCopy");
    if (btnCopy) btnCopy.disabled = true;

    const btnDelete = document.getElementById("btnDelete");
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

        const areaCode = selectedRow.dataset.code;

        //if (!confirm(`コード ${areaCode} を削除しますか？`)) return;

        try {
            const response = await fetch("/AreaMaster/Delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: `areaCode=${encodeURIComponent(areaCode)}`
            });

            const result = await response.json();

            if (result.success) {

                const confirmed =confirm("削除してもよいですか?");

                if (confirmed) {
                    window.location.href = "/AreaMaster/Area_Master";
                }

            } else {
                alert("削除できませんでした。");
            }

        } catch (error) {
            console.error("Delete Error:", error);
            alert("削除処理中にエラーが発生しました。");
        }
    });
}

// F1 - Register / Update
const btnRegister = document.getElementById("btnRegister");

if (btnRegister) {
    btnRegister.addEventListener("click", async function () {

        const areaCodeInput = document.getElementById("areaCode");
        const areaNameInput = document.getElementById("areaName");
        const digitalCodeInput = document.getElementById("digitalCode");

        const areaCode = areaCodeInput?.value.trim() || "";
        const areaName = areaNameInput?.value.trim() || "";
        const digitalCode = digitalCodeInput?.value.trim() || "";

        const response = await fetch("/AreaMaster/NextCode");
        const result = await response.json();
        // Validation
        if (!areaCode) {
            alert("エリアコードを入力してください。");
            areaCodeInput?.focus();
            const areaCode = document.getElementById("areaCode");
            if (areaCode) {
                areaCode.value = result.areaCode;
                areaCode.readOnly = false;
                areaCode.classList.remove("area-code-selected");
                areaCode.focus();
                areaCode.select();
            }
            return;
        }

        if (!areaName) {
            alert("エリア名を入力してください。");
            areaNameInput?.focus();
            return;
        }

        try {
            const response = await fetch("/AreaMaster/Save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: `areaCode=${encodeURIComponent(areaCode)}&areaName=${encodeURIComponent(areaName)}&digitalCode=${encodeURIComponent(digitalCode)}`
            });

            const result = await response.json();

            if (result.success) {
                alert("登録しました。");
                window.location.href = "/AreaMaster/Area_Master";
            } else {
                alert(result.message || "登録できませんでした。");
            }

        } catch (error) {
            console.error("Save Error:", error);
            alert("登録処理中にエラーが発生しました。");
        }
    });
}

 