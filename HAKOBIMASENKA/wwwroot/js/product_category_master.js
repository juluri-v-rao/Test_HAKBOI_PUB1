/**
 * =========================================
 * Screen: Product Category Master
 *
 * Navigation:
 *     Main Menu
 *         -> Basic Master
 *         -> Product Category Master
 *
 * Migrated From: FrmM_Mast1.vb (品名区分)
 *
 * Functions:
 *              - Enter Navigation / Kept Values
 *              - GetByCode
 *              - Save
 *              - Delete
 *              - Copy
 *              - Cancel
 *              - Exit
 *
 * The footer buttons are clicked; the keyboard's F1-F12 are not used on this screen for now.
 * =========================================
 */

//Flag to indicate if the user is in edit mode (legacy Sink_Flg = False)
let isEditMode = false;

//Flag to indicate if the user is in copy mode (legacy Copy_Flg)
let isCopyMode = false;

//cancel/exit warning message flag (legacy Chg_Flg)
let hasChanges = false;

//Store the currently editing control, to put the cursor back after a cancelled F11 / F12
let editingControl = null;

// The field just committed with Enter / Tab / ↓; its focusout must not put the old value back
let committedField = null;

// True while a function key button is being clicked: the field keeps what was typed (legacy F-keys take no focus)
let footerPressed = false;

// =========================================
//      Kept values (legacy .Tag)
// =========================================
// Each box keeps its last accepted value in dataset.accepted. Landing on the box's next control
// (Enter, Tab, ↓, a click, or ↑ where that is the next control) checks and keeps the value; landing anywhere
// else puts the kept value back (legacy LostFocus only asks which control got the focus; Err_Exit sets .Text = .Tag).
// So ↑ from ﾃﾞｼﾞﾀｺｺｰﾄﾞ (to the tab) and, with the tab hidden, ↑ from 区分名 (to the code) keep the value.

function getField(id) {
    return document.getElementById(id);
}

// the デジタコ tab is shown only with the デジタコ licence (legacy SSActiveTabs1.Visible = DIGI_Chk)
function isDigitalTabShown() {
    const tab = getField("tab-btn");

    // hidden with visibility (the panel keeps its space), so the box is still there
    return !!tab && getComputedStyle(tab).visibility !== "hidden";
}

// Enter order (legacy SelectNextControl):
// 区分コード → 区分名 → tab → デジタココード → tab …   (tab hidden: 区分名 → 区分コード)
function nextControl(field) {

    switch (field.id) {
        case "pcCode":
            return getField("pcName");
        case "pcName":
            return isDigitalTabShown() ? getField("tab-btn") : getField("pcCode");
        case "tab-btn":
            return getField("digitalCode");
        case "digitalCode":
            return getField("tab-btn");
    }

    return null;
}

// ↑ / Esc order; the code is never left backwards (legacy KeyDown: TxtCode → i_EnCh = False)
function previousControl(field) {

    switch (field.id) {
        case "pcName":
            return getField("pcCode");
        case "tab-btn":
            return getField("pcName");
        case "digitalCode":
            return getField("tab-btn");
    }

    return null;
}

function isTrackedField(field) {
    return ["pcCode", "pcName", "digitalCode"].includes(field?.id);
}

function focusAndSelect(field) {
    field?.focus();
    field?.select?.();
}

// put the kept value back
function restoreKeptValue(field) {

    if (field.dataset.accepted !== undefined) {
        field.value = field.dataset.accepted;
    }
}

// the field's value becomes the kept one; a different value is a change (legacy: .Tag <> .Text → Chg_Flg)
function acceptValue(field) {

    if (field.id !== "pcCode" && field.value !== (field.dataset.accepted ?? "")) {
        hasChanges = true;
    }

    field.dataset.accepted = field.value;
}

// The legacy LostFocus check of a field moving forward; false = refused (the kept value is back, stay on the field).
async function commitField(field) {

    if (field.id === "pcCode") {
        return await commitCode(field);
    }

    acceptValue(field);
    return true;
}

// TxtCode_LostFocus
async function commitCode(codeBox) {

    // 修正: the code cannot be changed
    if (codeBox.readOnly) {
        return true;
    }

    const code = zeroPad(codeBox.value.trim(), 4);

    // empty: the last accepted code comes back and the cursor stays (legacy Err_Exit)
    if (code === "") {
        restoreKeptValue(codeBox);
        return false;
    }

    codeBox.value = code;

    if (code !== codeBox.dataset.accepted) {

        if (isCopyMode) {

            // after F2 the copied values stay; the code only has to be free (legacy Data_Chk)
            const response = await fetch(`/ProductCategoryMaster/Exists?code=${code}`);
            const result = await response.json();

            if (result.exists) {
                alert(`指定したコード『${code}』は存在します！！`);
                restoreKeptValue(codeBox);
                return false;
            }

        } else if (!(await getByCode(code))) {

            // a new code: legacy Dsp_Data starts with Dsp_Clr, so 区分名 / デジタココード are emptied
            clearProductCategoryFields();
            hasChanges = false;
        }
    }

    codeBox.dataset.accepted = code;
    return true;
}

// =========================================
//              Key Navigation
// =========================================

document.addEventListener("keydown", async function (event) {

    const current = document.activeElement;

    // grid: ↑ / ↓ move the selection, Enter opens the row (legacy MSFlxGrd)
    if (current?.classList.contains("list-grid-row")) {
        onGridKey(event, current);
        return;
    }

    if (!isTrackedField(current) && current?.id !== "tab-btn") {
        return;
    }

    // legacy KeyDown: Enter / ↓ forward, Esc / ↑ back; Tab moves forward like Enter.
    // Shift+Tab is left to the browser: leaving that way puts the kept value back (focusout below).
    const forward = event.key === "Enter" || event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey);
    const backward = event.key === "ArrowUp" || event.key === "Escape";

    if (!forward && !backward) {
        return;
    }

    event.preventDefault();

    if (backward) {
        // the field's focusout decides: kept when this is also its next control (see Kept values), otherwise put back
        focusAndSelect(previousControl(current));
        return;
    }

    if (current.id === "tab-btn") {
        focusAndSelect(nextControl(current));
        return;
    }

    if (!(await commitField(current))) {
        focusAndSelect(current);
        return;
    }

    // the user clicked somewhere else while the code was looked up
    if (document.activeElement !== current) {
        return;
    }

    committedField = current;
    focusAndSelect(nextControl(current));
});

// ↑ / ↓ move the grid selection, Enter opens the selected row
function onGridKey(event, row) {

    if (event.key === "Enter") {
        event.preventDefault();
        openSelectedRow(row);
        return;
    }

    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
        return;
    }

    event.preventDefault();

    const next = event.key === "ArrowDown" ? row.nextElementSibling : row.previousElementSibling;

    if (next?.classList.contains("list-grid-row")) {
        selectGridRow(next);
    }
}

// A function key button keeps what was typed in the field (legacy F-keys take no focus).
document.addEventListener("mousedown", event => {
    if (event.target.closest?.(".function-footer")) {
        // the cursor stays in the field (the click still runs the button)
        event.preventDefault();
        footerPressed = true;
        setTimeout(() => footerPressed = false);
    }
}, true);

// Legacy LostFocus: moving into the next control commits the field; leaving it any other way
// (mouse, a grid row, Shift+Tab) puts the kept value back.
document.addEventListener("focusout", event => {

    const field = event.target;

    if (!isTrackedField(field)) {
        return;
    }

    if (field === committedField) {
        committedField = null;
        return;
    }

    if (footerPressed || field.readOnly) {
        return;
    }

    if (event.relatedTarget && event.relatedTarget === nextControl(field)) {

        commitField(field).then(ok => {
            if (!ok) {
                // e.g. an empty code + a click on 区分名: back to the code (legacy TxtCode.Focus())
                focusAndSelect(field);
            }
        });

        return;
    }

    restoreKeptValue(field);
});

document.addEventListener("focusin", event => {
    if (isTrackedField(event.target)) {
        editingControl = event.target;
    }
});

// =========================================
//              Initial Screen
// =========================================

document.addEventListener("DOMContentLoaded", function() {

    //RegisterButton
    getField("btnRegister")?.addEventListener("click", saveProductCategory);

    //DeleteButton
    getField("btnDelete")?.addEventListener("click", deleteProductCategory);

    //CancelButton
    getField("btnBack")?.addEventListener("click", cancelProductCategory);

    //CopyButton
    getField("btnCopy")?.addEventListener("click", copyProductCategory);

    //ExitButton
    getField("btnExit")?.addEventListener("click", exitProductCategory);

    //Code(Auto)
    const codeTextbox = getField("pcCode");
    restrictNumericInput(codeTextbox, 4);

    // デジタココード: digits only, 15 (legacy Format "9", MaxLength 15)
    restrictNumericInput(getField("digitalCode"), 15);

    // 区分名 within 16 bytes (data-maxbytes)
    document.querySelectorAll(".jis-validation")
        .forEach(control => {

            control.addEventListener("input", function () {

                const maxBytes = Number(this.dataset.maxbytes);

                while (getShiftJisLength(this.value) > maxBytes) {
                    this.value = this.value.slice(0, -1);
                }
            });
        });

    // what the server rendered is the kept value (legacy Set_Code → TxtCode.Tag; Dsp_Clr → "")
    ["pcCode", "pcName", "digitalCode"].forEach(id => {
        getField(id).dataset.accepted = getField(id).value;
    });

    setEditMode(false);

    //GridRowClick/DoubleClick
    document.querySelectorAll(".list-grid-row")
        .forEach(row => {

            row.addEventListener("click", () => selectGridRow(row));

            row.addEventListener("dblclick", () => openSelectedRow(row));
        });

    // function to sort the grid based on the column name/type and direction (ascending/descending)
    document.querySelectorAll(".table-list th[data-sort]")
        .forEach(header => {

            header.addEventListener("click", function() {
                sortGrid(this.dataset.sort);
            });
        });

    // Select first grid row by default
    document.querySelector(".list-grid-row")?.classList.add("selected");

    focusAndSelect(codeTextbox);
});

// =========================================
//              F1 Save / Update
// =========================================

async function saveProductCategory() {

    // the code as typed, also without Enter: a footer button takes no focus, so legacy
    // Input_Chk / Data_Repl use TxtCode.Text (the server zero-pads it; blank → 品名区分を入力してください)
    const codeBox = getField("pcCode");

    const model = {

        コード: codeBox.value,

        名称: getField("pcName").value,

        デジタココード: getField("digitalCode").value,

        IsNewRecord: !isEditMode
    };

    try {

        // 入力端末 is set by the server (appsettings Terminal:ClientNo, legacy E_CODE)
        const response =
            await fetch(
                "/ProductCategoryMaster/Save",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "RequestVerificationToken": getAntiForgeryToken()
                    },

                    body: JSON.stringify(model)
                });

        // a check message comes as JSON (400); a server error page does not, and throws here
        const result = await response.json();

        if (!response.ok) {

            alert(result.message);

            if (result.message === "品名区分を入力してください") {
                focusAndSelect(codeBox);
            } else if (result.message === "品名区分名を入力してください") {
                focusAndSelect(getField("pcName"));
            }

            return;
        }

        // legacy Dsp_Clr + Set_Code + Dsp_List + TxtCode.Focus
        hasChanges = false;
        location.reload();

    } catch {
        // legacy: Data_Repl shows the error; the cursor stays where it was
        alert("登録中に異常が発生しました！！");
    }
}

// =========================================
//                 F2 Copy
// =========================================

// The values stay; the screen becomes 新規 with the next free code (legacy Fkey 2: Set_Code, Chg_Flg = False).
async function copyProductCategory() {

    const pcCode = getField("pcCode");

    const response = await fetch("/ProductCategoryMaster/NextCode");

    const result = await response.json();

    // at the code limit legacy Set_Code leaves the code blank
    const code = result.code ?? "";

    pcCode.value = code;
    pcCode.dataset.accepted = code;

    // the copy can be given another code (applyColorCoding only changes the colour)
    pcCode.readOnly = false;
    applyColorCoding(pcCode, false);

    hasChanges = false;

    setEditMode(false);

    isCopyMode = true;

    focusAndSelect(pcCode);
}

// =========================================
//                F4 Delete
// =========================================

async function deleteProductCategory() {

    const code = getField("pcCode").value;
    const name = getField("pcName");

    try {

        // Del_Chk comes before the question (legacy order)
        const checkResponse = await fetch(`/ProductCategoryMaster/CheckDelete?code=${encodeURIComponent(code)}`);

        if (!checkResponse.ok) throw new Error();

        const check = await checkResponse.json();

        if (!check.success) {

            alert(check.message);

            return;
        }

        if (!confirm("削除してもよいですか？")) {
            focusAndSelect(name);
            return;
        }

        const response =
            await fetch(`/ProductCategoryMaster/Delete?code=${encodeURIComponent(code)}`,
                {
                    method: "POST",

                    headers: {
                        "RequestVerificationToken":
                            getAntiForgeryToken()
                    }
                });

        // a refusal comes as JSON (400); a server error page does not, and throws here
        const result = await response.json();

        if (!response.ok) {

            alert(result.message);

            focusAndSelect(name);

            return;
        }

        location.reload();

    } catch {
        // legacy: Data_Del shows the error, then 区分名 gets the cursor
        alert("削除中に異常が発生しました！！");
        focusAndSelect(name);
    }

}

// F9 リスト (legacy FrmP_Select) is not in this phase: the button is disabled in the view.

// =========================================
//         F11 Cancel with warning/popup
// =========================================

// legacy Fkey 11: Dsp_Clr + Set_Code + Dsp_List (the list is read again) + TxtCode.Focus
async function cancelProductCategory() {

    if (hasChanges) {

        if (!confirm("内容が変更されております。よろしいですか？")) {
            focusAndSelect(editingControl);
            return;
        }
    }

    hasChanges = false;
    location.reload();
}

// =========================================
//         F12 Exit with warning/popup
// =========================================

function exitProductCategory(event) {

    event.preventDefault();

    if (hasChanges) {

        // legacy FormClosing message (half-width space and ?)
        if (!confirm("変更されていますが、よろしいですか ?")) {
            focusAndSelect(editingControl);
            return;
        }
    }

    const btnExit = getField("btnExit");

    // opened from a search (legacy SYORID2 = "検索"): closing goes back to the screen of that search
    //if (btnExit.dataset.fromSearch === "true" && window.history.length > 1) {
    //    window.history.back();
    //    return;
    //}

    // Opened from Product Classification Search Popup
    if (btnExit.dataset.fromSearch === "true") {

        if (window.parent !== window) {
            window.parent.postMessage(
                { action: "closeProductCategoryMaster" },
                window.location.origin
            );
            return;
        }

        // Fallback when opened as a standalone page
        if (window.history.length > 1) {
            window.history.back();
            return;
        }
    }

    const exitUrl = btnExit.dataset.exitUrl;

    if (exitUrl) {
        window.location.href = exitUrl;
    }
}

// =========================================
//          Display Data/load by code
// =========================================

// legacy Dsp_Data: shows the record and goes to 修正; false when the code is not registered
async function getByCode(code) {

    const response = await fetch(`/ProductCategoryMaster/GetByCode?code=${encodeURIComponent(code)}`);

    if (!response.ok) {
        return false;
    }

    const data = await response.json();

    const pcCode = getField("pcCode");

    pcCode.value = data.コード;
    pcCode.readOnly = true;

    applyColorCoding(pcCode, true);

    getField("pcName").value = data.名称 ?? "";
    getField("digitalCode").value = data.デジタココード ?? "";

    ["pcCode", "pcName", "digitalCode"].forEach(id => {
        getField(id).dataset.accepted = getField(id).value;
    });

    hasChanges = false;
    isCopyMode = false;

    setEditMode(true);

    return true;
}

// =========================================
//                  Mode
// =========================================

function setEditMode(isEdit) {

    const modeLabel = getField("mode-lbl");

    if (!modeLabel)
        return;

    modeLabel.textContent = isEdit ? "修　正" : "新　規";

    getField("btnDelete").disabled = !isEdit;

    getField("btnCopy").disabled = !isEdit;

    isEditMode = isEdit;
}

// =========================================
//              Clear Fields
// =========================================

// legacy Dsp_Clr: 区分名 and デジタココード empty, with empty kept values
function clearProductCategoryFields() {

    ["pcName", "digitalCode"].forEach(id => {
        getField(id).value = "";
        getField(id).dataset.accepted = "";
    });
}

// =========================================
//              Grid
// =========================================

function selectGridRow(row) {

    document
        .querySelectorAll(".list-grid-row")
        .forEach(r => r.classList.remove("selected"));

    row.classList.add("selected");
    row.focus();
}

// legacy OpenData: the row's record is shown and the cursor goes to 区分名
async function openSelectedRow(row) {

    if (await getByCode(row.dataset.code)) {
        focusAndSelect(getField("pcName"));
    }
}
