// =====================================
// Below code is used for validation of date formate
//
// Japanes Date Format
// YYYY年MM月DD日
// =====================================

document.querySelectorAll(".date-input").forEach(function (input) {

    input.addEventListener("input", function () {

        // Keep numbers only
        let value = this.value.replace(/\D/g, "");

        // Maximum 8 digits: YYYYMMDD
        value = value.substring(0, 8);

        // YYYY
        if (value.length <= 4) {

            this.value = value;

        }
        // YYYY年MM
        else if (value.length <= 6) {

            this.value =
                value.substring(0, 4) +
                "年" +
                value.substring(4, 6);

        }
        // YYYY年MM月DD
        else {

            this.value =
                value.substring(0, 4) +
                "年" +
                value.substring(4, 6) +
                "月" +
                value.substring(6, 8);

            // Add 日 only after all 8 digits are entered
            if (value.length === 8) {
                this.value += "日";
            }
        }

    });

});

// Below code is used for validation of Nuber 0,1,2, in text box

function validateNumericOption(input, allowedValues, message) {

    // Numbers only
    input.value = input.value.replace(/[^0-9]/g, "");

    // Validate allowed values
    if (
        input.value !== "" &&
        !allowedValues.includes(input.value)
    ) {
        alert(message);
        // Set default value to 0
        input.value = "0";

        // Focus the textbox
        input.focus();

        // Select the 0
        input.select();

    }
}

// ===============================
//      Anti-Forgery Token
// ===============================
function getAntiForgeryToken() {

    return document.querySelector(
        'input[name="__RequestVerificationToken"]'
    )?.value;
}

// =========================================
//    Code Input Restriction_numbers Only
// =========================================
function restrictNumericInput(element, maxLength) {

    element.addEventListener("keydown", function(event) {

        const allowedKeys = [
            "Backspace",
            "Delete",
            "Tab",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Enter"
        ];

        if (allowedKeys.includes(event.key))
            return;

        //value entered check
        if (!/^\d$/.test(event.key)) {
            event.preventDefault();
        }

    });

    element.addEventListener("input", function() {

        this.value =
            this.value
                .replace(/\D/g, "")
                .substring(0, maxLength);

    });

}

// ========================================================
//  giving zeros to/before numeric code in most screens
//
//  Utility // ___5 ---> 0005
// ========================================================
function zeroPad(value, digits) {

    if (!value) {
        return "";
    }

    return value.padStart(digits, "0");
}

// =========================================
//            JIS Validation
// =========================================
function getShiftJisLength(text) {

    let length = 0;

    for (const ch of text) {

        if (ch.charCodeAt(0) <= 0xFF) {

            length += 1;

        } else {

            length += 2;
        }
    }

    return length;
}

// =========================================================================================================================================================================================================
//     function to sort the grid based on the column name/type and direction (ascending/descending) can be put in helper class or common js file for reusability across multiple screens
//     Also includes column resizing and column sorting(manual drag/order)
// =========================================================================================================================================================================================================

// The grid's sorted column and direction, as legacy GridSearch: a new column starts ascending,
// the same column again turns the direction round (only the last clicked column is remembered).
let gridSortColumn = null;
let gridSortAscending = true;

function sortGrid(columnName) {

    // a row's cell of a column: by its original position (data-col, set when the columns can be moved,
    // grid_columns.js), otherwise by its position
    const cellOf = (row, column) =>
        row.querySelector(`:scope > [data-col="${column}"]`) ?? row.children[column];

    const tbody =
        document.querySelector(".table-body");

    const rows =
        Array.from(
            tbody.querySelectorAll("tr")
        );

    gridSortAscending =
        gridSortColumn === columnName
            ? !gridSortAscending
            : true;

    gridSortColumn = columnName;

    const nextDirection =
        gridSortAscending
            ? "asc"
            : "desc";

    rows.sort((a, b) => {

        let valueA = "";
        let valueB = "";

        switch (columnName) {

            case "numeric":

                valueA =
                    cellOf(a, 0).textContent.trim();

                valueB =
                    cellOf(b, 0).textContent.trim();

                return nextDirection === "asc"
                    ? Number(valueA) - Number(valueB)
                    : Number(valueB) - Number(valueA);

            case "text":

                valueA =
                    cellOf(a, 1).textContent.trim();

                valueB =
                    cellOf(b, 1).textContent.trim();

                return nextDirection === "asc"
                    ? valueA.localeCompare(
                        valueB,
                        "ja"
                    )
                    : valueB.localeCompare(
                        valueA,
                        "ja"
                    );

            default:
                return 0;
        }

    });

    rows.forEach(row => {

        tbody.appendChild(row);

    });
}

// ===============================
//     function to swich Tabs
// ===============================
function initializeTabs() {
	
	const tabButtons = document.querySelectorAll(".tab-button");
	const tabContent = document.querySelectorAll(".tab-content");

	tabButtons.forEach((button) => {
		button.addEventListener("click", () => {
			const targetId = button.dataset.tab;

			tabButtons.forEach(tab =>
				tab.classList.remove("active")
			);

			tabContent.forEach(content =>
				content.classList.remove("active")
			);

			button.classList.add("active");

            document.getElementById(targetId).classList.add("active");

            if (targetId === "billingHistory") {
                loadHistory("billing");
            } else if (targetId === "accountsReceivableHistory") {
                loadHistory("receivable");
            }
		});

	});
}
// =================================================
//      function to change button to radioButton
// =================================================
function optionButton(btn) {

    //Current button group
    const group = btn.closest(".option-button-group");

    //Remove active from bittons of THIS  row only
    group.querySelectorAll(".select-option-btn").forEach(button => {
        button.classList.remove("active");
    });

    //Highlight selected button
    btn.classList.add("active");

    //Input inside this row
    const input = group.querySelector("input[type='text']");

    //Get value before':'
    const text = btn.textContent.trim();
    const value = text.split("：")[0];

    //Set value to input
    if (input) {
        input.value = value;
    }

    // Move focus to next field
    const nextInput = focusNextField(input);
    if (nextInput) {
        nextInput.focus();
        nextInput.select();
    }
}

//=================================================================================
//  function used in radiobutton to set next field focus after user selection
//=================================================================================
function focusNextField(currentInput) {

    const inputs = Array.from(
        document.querySelectorAll(".radBtnInpt, #discount-rate, #quantityDecimalPlaces, #weightDecimalPlaces, #unitPriceDecimalPlaces")
    );

    const currentIndex = inputs.indexOf(currentInput);

    return currentIndex >= 0 && currentIndex < inputs.length - 1 ? inputs[currentIndex + 1] : null;

}

//===============================================================
//  function to remove zeros from required code/number inputs
//===============================================================
function removeZeros(value) {

    if (!value)
        return "";

    const result =
        value.toString().replace(/^0+/, "");

    return result || "0";
}

//======================================================
//              MESSAGE DISPLAY
//======================================================
// Sets the message text in the message label element.
function setMessage(message) {

    const label = document.getElementById("message-label");
    label.textContent = ""
    label.textContent = label.textContent.split("：")[0] + "" + message;
}

//======================================================
//       File Selector Functionality(Text File)
//======================================================

// file selector dialog box event for only text file <---------------------------------?
document.querySelectorAll(".btnBrowse").forEach(btn => {                            // |
                                                                                    // |
    btn.addEventListener("click", function () {                                     // |
                                                                                    // |
        const container = this.parentElement;                                       // |
        const fileInput = container.querySelector(".fileSelector");                 // |
                                                                                    // |
        // a database "..." has no .fileSelector (its own handler is below)        // |
        fileInput?.click();                                                         // |
    });                                                                             // |
                                                                                    // |
});                                                                                 // |
                                                                                    // |
// after file selector dialog box event, display name in this textbox,event <----------¿
document.querySelectorAll(".fileSelector").forEach(fileInput => {

    fileInput.addEventListener("change", function () {

        const container = this.parentElement;
        const textBox = container.querySelector(".textFileName");

        if (this.files.length > 0) {

            // this below code is used for displaying file name with file extension
            textBox.value = this.files[0].name;

            // this below code is used for displaying file name without file extension
            // const fileName = this.files[0].name;
            // const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));
            // textBox.value = nameWithoutExtension;
        }
    });

});

//======================================================
//    File Selector Functionality(MDB/AccessDB File)
//======================================================

// file selector dialog box event for only database file <-----------------------------?
document.querySelectorAll(".btnBrowse").forEach(btn => {                            // |
                                                                                    // |
    btn.addEventListener("click", function () {                                     // |
                                                                                    // |
        const container = this.parentElement;                                       // |
        const fileInput = container.querySelector(".dbFileSelector");               // |
                                                                                    // |
        // a text file "..." has no .dbFileSelector (its own handler is above)     // |
        fileInput?.click();                                                         // |
    });                                                                             // |
                                                                                    // |
});                                                                                 // |
                                                                                    // |
// after file selector dialog box event, display name in this textbox,event <----------¿
document.querySelectorAll(".dbFileSelector").forEach(fileInput => {

    fileInput.addEventListener("change", function () {

        const container = this.parentElement;
        const textBox = container.querySelector(".dbFileName");

        if (this.files.length > 0) {

            // this below code is used for displaying file name with file extension
            textBox.value = this.files[0].name;

            // this below code is used for displaying file name without file extension
            // const fileName = this.files[0].name;
            // const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));
            // textBox.value = nameWithoutExtension;
        }
    });

});

//======================================================
//    Decimal format loader ---> ***.** / 000.00
//======================================================
function formatAllDecimals() {
    document.querySelectorAll(".decimal-input")
        .forEach(input => {
                                                              
            // Remove formatting while editing      <--------------------------------------------------?
            input.addEventListener("focus", function () {                                           // |  this below code is used to remove commas from decimal input while user is editing the value
                this.value = this.value.replace(/,/g, "");                                          // |
            });                                                                                     // | 
                                                                                                    // |
            // Restrict input while typing                                                             |
            input.addEventListener("input", function () {                                           // |
                                                                                                    // +-----------+
                const intDigits = parseInt(this.dataset.intDigits || 9);                                        // |
                const decDigits = parseInt(this.dataset.decDigits || 2);                                        // |
                const allowNegative = (input.dataset.allowNegative ?? "false").toLowerCase() === "true";        // |
                let value = this.value;                                                                         // |
                                                                                                                // |
                // Allow digits, decimal point and negative sign                                                // |
                value = allowNegative                                                                           // |
                    ? value.replace(/[^0-9.-]/g, "")                                                            // |
                    : value.replace(/[^0-9.]/g, ""), "";                                                        // |
                                                                                                                // |
                // if negatives not allowed, explicitly strip all '-'                                              |
                if (!allowNegative) {                                                                           // |
                    value = value.replace(/-/g, "");                                                            // |
                }                                                                                               // |
                                                                                                                // |
                // Negative sign only at beginning                                                                 |
                if (allowNegative) {                                                                            // |
                    value = (value.startsWith("-") ? "-" : "") +                                                // |
                        value.replace(/-/g, "").replace(/^-/, "");                                              // |
                }                                                                                               // |
                                                                                                                // |
                // Only one decimal point                                                                          |
                const parts = value.split(".");                                                                 // |
                                                                                                                // |
                if (parts.length > 2) {                                                                         // |
                    value = parts[0] + "." + parts.slice(1).join("");                                           // |
                }                                                                                               // |
                                                                                                                // |
                const isNegative = value.startsWith("-");                                                       // |
                value = isNegative ? value.substring(1) : value;                                                // |
                                                                                                                // |
                let split = value.replace("-", "").split(".");                                                  // |
                                                                                                                // |
               // Integer portion                                                                                  |
                if (split[0].length > intDigits) {                                                              // |
                    split[0] = split[0].substring(0, intDigits);                                                // |
                }                                                                                               // |
                                                                                                                // |
                // Decimal portion                                                                              // |
                if (split[1] !== undefined) {                                                                   // |
                    split[1] = split[1].substring(0, decDigits);                                                // |
                }                                                                                   // +-----------¿        
                                                                                                    // |
                value = split.join(".");                                                            // |
                                                                                                    // |
                if (isNegative) {                                                                   // |
                    value = "-" + value;                                                            // |
                }                                                                                   // |
                                                                                                    // |
                this.value = value;                                     // +---------------------------¿
            });                                                         // |
                                                                        // |
            // Normalize and format on blur                                |
            input.addEventListener("blur", function () {                // |
                normalizeDecimalInput(this);                            // |
            });                                                         // |
        });                                                             // | initial formatting of decimal inputs, after page load and user edit
}                                                                       // |
                                                                        // |
// function to format decimals(max value 100)                   + ---------¿
// function formatDecimalInput(inputElement) {                  |
//     let value = parseFloat(inputElement.value);              |
//                                                              |
//     if (!isNaN(value)) {                                     |
//         // Enforce max limit                                 |
//         if (value > 100) {                                   | the below code can be used to set custom max limit for decimal inputs
//             value = 100;                                     |
//         }                                                    |
//         // Format to 2 decimal places                        |
//         inputElement.value = value.toFixed(2);               |
//     }                                                        |
// }                                                            |
//                                                              ↓
//==============================================================================================================================
//    Decimal format loader ---> ***.** / 000.00 -> X           ↓ ✓
//
//    Developer can reuse this function in any screen, --
//                      -- by adding data attributes to the input element(HTML)
//
//    example: <input type="text" class="decimal-input" data-int-digits="2" data-dec-digits="2" data-max-value="100">
//    data-int-digits="2" --> for integer part(before decimal point)
//    data - dec - digits="2"  -- > for decimal part(after decimal point))
//    data-max-value="100" --> for max value limit to be set on input, if not provided, no limit will be set/or default
//
//==============================================================================================================================

function normalizeDecimalInput(input) {

    const intDigits = parseInt(input.dataset.intDigits || 9);
    const decDigits = parseInt(input.dataset.decDigits || 2);

    let value = parseFloat(
        input.value.replace(/,/g, "")
    );

    if (isNaN(value)) {
        input.value = "";
        return;
    }

    // Derived max from int/dec digits
    let maxValue = Number(
        `${'9'.repeat(intDigits)}${decDigits > 0
            ? '.' + '9'.repeat(decDigits)
            : ''
        }`
    );

    // Explicit max overrides derived max
    if (input.dataset.maxValue) {

        maxValue = parseFloat(
            input.dataset.maxValue.replace(/,/g, '')
        );

        const allowNegative =
            input.dataset.allowNegative?.toLowerCase() === "true";

        if (allowNegative) {

            if (value > maxValue) {
                value = maxValue;
            }

            if (value < -maxValue) {
                value = -maxValue;
            }

        } else {

            //value = Math.min(value, maxValue);
            value = Math.max(0.00, Math.min(value, maxValue));
        }
    }

    // Apply color based on sign
    input.style.color = value < 0
        ? "red"
        : "";

    input.value = value.toLocaleString("en-US", {
        minimumFractionDigits: decDigits,
        maximumFractionDigits: decDigits
    });
}

//===============================================================================================================
//    Color Coding and control editability for readonly/writeonly fields, true for readonly, false for writeable
//    function applyColorCoding(input control, true) becomes readonly, false becomes writeable
//===============================================================================================================
function applyColorCoding(input, isReadonly) {
    input.classList.remove(isReadonly ? "code-editable" : "code-readonly");
    input.classList.add(isReadonly ? "code-readonly" : "code-editable");
    input.isReadonly = isReadonly;
}

//======================================================
//          ControlInput_MESSAGE DISPLAY
//======================================================

// Displays a message indicating the valid input for date format.
function showDateDayMessage() {
    const DateDay = "明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]";
    setMessage(DateDay);
}

// Displays a message indicating the valid input for end of the month_date.
function showDateEndMessage() {
    const DateEnd = "末締めは『31』を入力";
    setMessage(DateEnd);
}

// Displays a message indicating the valid input range for tax rate, etc.
// Example:
// Input range [ 0.00～100.00 ]
function showRangeMessage() {
    const minValue = "0.00";
    const maxValue = "100.00";

    setMessage(`入力可能範囲 [ ${minValue}～${maxValue} ]`);
}

function showClearMessage() {
    const clear = "";
    setMessage(clear);
}

//not implemented yet, but can be used in future for displaying message for decimal input range
function showNAMessage() {
    setMessage(" まだ実装されていません。");
}

//===========================================================================
//  COMMON FUNCTIONALITIES FOR SHIPPER AND ORIGIN DESTINATION MASTER SCREENS
//===========================================================================

//======================================================
//  Function to convert full-width characters to half-width
//======================================================
function toHalfWidth(value) {
    let result = String(value ?? "");
    // Convert Hiragana to Katakana.
    result = result.replace(
        /[\u3041-\u3096]/g,
        ch => String.fromCharCode(ch.charCodeAt(0) + 0x60)
    );
    // Convert full-width English, numbers, and other compatible
    // characters to half-width.
    result = result.normalize("NFKC");
    // Convert full-width Katakana to half-width Katakana.
    const kanaMap = {
        "。「": "｡｢",
        "。": "｡",
        "「": "｢",
        "」": "｣",
        "、": "､",
        "・": "･",
        "ヲ": "ｦ",
        "ァ": "ｧ", "ィ": "ｨ", "ゥ": "ｩ",
        "ェ": "ｪ", "ォ": "ｫ",
        "ャ": "ｬ", "ュ": "ｭ", "ョ": "ｮ",
        "ッ": "ｯ", "ー": "ｰ",
        "ア": "ｱ", "イ": "ｲ", "ウ": "ｳ",
        "エ": "ｴ", "オ": "ｵ",
        "カ": "ｶ", "キ": "ｷ", "ク": "ｸ",
        "ケ": "ｹ", "コ": "ｺ",
        "サ": "ｻ", "シ": "ｼ", "ス": "ｽ",
        "セ": "ｾ", "ソ": "ｿ",
        "タ": "ﾀ", "チ": "ﾁ", "ツ": "ﾂ",
        "テ": "ﾃ", "ト": "ﾄ",
        "ナ": "ﾅ", "ニ": "ﾆ", "ヌ": "ﾇ",
        "ネ": "ﾈ", "ノ": "ﾉ",
        "ハ": "ﾊ", "ヒ": "ﾋ", "フ": "ﾌ",
        "ヘ": "ﾍ", "ホ": "ﾎ",
        "マ": "ﾏ", "ミ": "ﾐ", "ム": "ﾑ",
        "メ": "ﾒ", "モ": "ﾓ",
        "ヤ": "ﾔ", "ユ": "ﾕ", "ヨ": "ﾖ",
        "ラ": "ﾗ", "リ": "ﾘ", "ル": "ﾙ",
        "レ": "ﾚ", "ロ": "ﾛ",
        "ワ": "ﾜ", "ン": "ﾝ",
        "ガ": "ｶﾞ", "ギ": "ｷﾞ", "グ": "ｸﾞ",
        "ゲ": "ｹﾞ", "ゴ": "ｺﾞ",
        "ザ": "ｻﾞ", "ジ": "ｼﾞ", "ズ": "ｽﾞ",
        "ゼ": "ｾﾞ", "ゾ": "ｿﾞ",
        "ダ": "ﾀﾞ", "ヂ": "ﾁﾞ", "ヅ": "ﾂﾞ",
        "デ": "ﾃﾞ", "ド": "ﾄﾞ",
        "バ": "ﾊﾞ", "ビ": "ﾋﾞ", "ブ": "ﾌﾞ",
        "ベ": "ﾍﾞ", "ボ": "ﾎﾞ",
        "パ": "ﾊﾟ", "ピ": "ﾋﾟ", "プ": "ﾌﾟ",
        "ペ": "ﾍﾟ", "ポ": "ﾎﾟ"
    };
    return result.replace(
        /[。「」、・ヲァィゥェォャュョッーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ]/g,
        ch => kanaMap[ch] || ch
    );
}
//======================================================
//  Function to normalize numeric code input
//======================================================
function normalizeCode(value, length) {
    const halfWidth = String(value ?? "").replace(
        /[０-９]/g,
        function (ch) {
            return String.fromCharCode(
                ch.charCodeAt(0) - 0xFEE0
            );
        }
    );
    const digits = halfWidth.replace(/[^0-9]/g, "");
    if (digits === "") {
        return "";
    }
    if (digits.length > length) {
        return "";
    }
    return digits.padStart(length, "0");
}
//======================================================
//  Function to limit text input based on half-width character units
//======================================================
function attachTextLimit(id, maxUnits, convertToHalfWidth = false) {
    const field = getField(id);
    if (!field) return;
    field.addEventListener("input", function () {
        let value = this.value;
        if (convertToHalfWidth) {
            value = toHalfWidth(value);
        }
        this.value = limitHalfWidthUnits(value, maxUnits);
    });
    // Apply the same restriction to values loaded from the database.
    if (field.value) {
        field.value = limitHalfWidthUnits(
            convertToHalfWidth ? toHalfWidth(field.value) : field.value,
            maxUnits
        );
    }
}
// Restrict numeric-only fields.
function attachDigitLimit(id, maxDigits, padLength = 0) {
    const field = getField(id);
    if (!field) return;
    field.addEventListener("input", function () {
        const digits = toHalfWidth(this.value).replace(/\D/g, "");
        this.value = digits.substring(0, maxDigits);
    });
    // Pad when leaving the field.
    field.addEventListener("blur", function () {
        let digits = toHalfWidth(this.value).replace(/\D/g, "");
        digits = digits.substring(0, maxDigits);
        if (digits !== "" && padLength > 0) {
            digits = digits.padStart(padLength, "0");
        }
        this.value = digits;
    });
    // Pad before existing Enter/Tab handlers perform lookups.
    field.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === "Tab") {
            let digits = toHalfWidth(this.value).replace(/\D/g, "");
            digits = digits.substring(0, maxDigits);
            if (digits !== "" && padLength > 0) {
                this.value = digits.padStart(padLength, "0");
            } else {
                this.value = digits;
            }
        }
    }, true);
}
// Postal code: seven digits displayed as 111-1111.
function initializePostalCode() {
    const field = getField("zipCode");
    if (!field) return;
    function formatPostal(value) {
        const digits = toHalfWidth(value).replace(/\D/g, "").substring(0, 7);
        if (digits.length <= 3) {
            return digits;
        }
        return digits.substring(0, 3) + "-" + digits.substring(3);
    }
    field.addEventListener("input", function () {
        this.value = formatPostal(this.value);
    });
    field.addEventListener("blur", function () {
        this.value = formatPostal(this.value);
    });
    // Format a postal code loaded from the database.
    if (field.value) {
        field.value = formatPostal(field.value);
    }
}
