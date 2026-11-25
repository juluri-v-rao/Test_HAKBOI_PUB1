document.addEventListener("DOMContentLoaded", async function () {

    console.log("PRODUCT MASTER JS STARTED");

    // =========================================
    // 1. Get HTML Elements
    // =========================================

    const productCode = document.getElementById("originCode");
    const productName = document.getElementById("originName");

    const furigana = document.getElementById("furigana");
    const abbreviation = document.getElementById("abbreviation");

    // =========================================
    // 品名 / 略称 - Byte Length Validation
    // =========================================

    productName.addEventListener("input", function () {
        this.value = limitBytes(this.value, 30);
    });

    abbreviation.addEventListener("input", function () {
        this.value = limitBytes(this.value, 16);
    });

    const productCategoryCode =
        document.getElementById("productCategory-code");

    const productCategoryName =
        document.getElementById("productCategory-name");

    const transportCategoryCode =
        document.getElementById("transPerformCategory-code");

    const transportCategoryName =
        document.getElementById("transPerformCategory-name");

    // Screen label 単位重量 maps to database column 単価.
    const unitPrice = document.getElementById("unitweight");

    const capacity = document.getElementById("capacity");
    // 手当掛率
    const salary = document.getElementById("salary");

    const digitacoCode = document.getElementById("didgitaco");

    const btnRegister = document.getElementById("btnRegister");
    const btnCopy = document.getElementById("btnCopy");
    const btnDelete = document.getElementById("btnDelete");
    const btnPrevious = document.getElementById("btnPrevious");
    const btnNext = document.getElementById("btnNext");
    const btnCancel = document.getElementById("btnCancel");
    const btnExit = document.getElementById("btnExit");
    const btnMasterSearch = document.getElementById("btnMasterSearch");

    const screenStatus = document.querySelector(".lbl-new");
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    // =========================================
    // 2. State
    // =========================================

    let isExistingRecord = false;
    let isCopyMode = false;
    let isProcessing = false;
    let originalData = null;
    let isChanged = false;
    let lastLookedUpProductCode = "";

    let isAbbreviationManuallyEdited = false;
    let isAbbreviationAutoFilled = false; 

    let isCodeLookupInProgress = false; 

    let isProductSelectedFromF5 = false;

    let productSearchReturnFocus = null;
    let lastFocusedProductField = null;
    let lastKeptProductCode = "";
    // =========================================
    // 3. Common Functions
    // =========================================

    // =========================================
    // Last Kept Field Values
    // =========================================

    const lastKeptFieldValues = new WeakMap();

    function rememberFieldValue(input) {

        if (!input || !input.id) return;

        const snapshot = {
            value: input.value
        };

        // Keep the corresponding category name also.
        if (input === productCategoryCode) {
            snapshot.name = productCategoryName.value;
        }

        if (input === transportCategoryCode) {
            snapshot.name = transportCategoryName.value;
        }

        lastKeptFieldValues.set(input, snapshot);
    }
    // =========================================
    // Expected Next Control
    // =========================================

    function isNextControl(input, relatedTarget) {

        if (!input || !relatedTarget) return false;

        const activeTabButton =
            document.querySelector(".tab-button.active");

        const nextControlMap = new Map([

            [productCode, productName],

            [productName, activeTabButton],

            [furigana, abbreviation],

            [abbreviation, productCategoryCode],

            [productCategoryCode, transportCategoryCode],

            [transportCategoryCode, unitPrice],

            [unitPrice, capacity],

            [capacity, activeTabButton],

            [digitacoCode,
                document.querySelector(
                    '.tab-button[data-tab="digitacoSetting"]'
                )
            ],

            [salary,
                document.querySelector(
                    '.tab-button[data-tab="salarySetting"]'
                )
            ]

        ]);

        return nextControlMap.get(input) === relatedTarget;
    }

    // =========================================
    // Restore Value When Leaving Other Controls
    // =========================================

    function restoreLastKeptFieldValue(input) {

        if (!input) return;

        const snapshot = lastKeptFieldValues.get(input);

        if (!snapshot) return;

        input.value = snapshot.value;

        // Restore category name together with category code.
        if (input === productCategoryCode) {
            productCategoryName.value = snapshot.name;
        }

        if (input === transportCategoryCode) {
            transportCategoryName.value = snapshot.name;
        }
    }
    function showMessage(message, color = "") {

        const messageLabel = document.getElementById("message-label");

        if (!messageLabel) return;

        messageLabel.textContent = message;
        messageLabel.style.color = color;
    }

    function showScreenStatus(status) {

        if (screenStatus) {
            screenStatus.textContent = status;
        }
    }

    function setButtonState() {

        if (btnCopy) {
            btnCopy.disabled = !isExistingRecord;
        }

        if (btnDelete) {
            btnDelete.disabled = !isExistingRecord;
        }
    }

    function switchTab(tabId) {

        tabButtons.forEach(function (button) {

            const isActive = button.dataset.tab === tabId;

            button.classList.toggle("active", isActive);
            button.setAttribute("tabindex", isActive ? "0" : "-1");
        });

        tabContents.forEach(function (content) {

            content.classList.toggle(
                "active",
                content.id === tabId
            );
        });
    }
    function limitBytes(value, maxBytes) {
        let output = "";
        let bytes = 0;

        for (const character of value) {
            const code = character.codePointAt(0);
            const width =
                (code <= 0x7E || (code >= 0xFF61 && code <= 0xFF9F))
                    ? 1
                    : 2;

            if (bytes + width > maxBytes) break;

            output += character;
            bytes += width;
        }

        return output;
    }
    // Only the active tab header participates in normal Tab navigation.
    const initialActiveTab = document.querySelector(
        ".tab-button.active:not([hidden])"
    );

    tabButtons.forEach(function (button) {
        button.setAttribute(
            "tabindex",
            button === initialActiveTab ? "0" : "-1"
        );
    });
    // =========================================
    // Optional Tab Visibility
    // =========================================

    const digiChk = document.getElementById("productTabNavigation")
        ?.dataset.digiChk;

    const kyuyoChk = document.getElementById("productTabNavigation")
        ?.dataset.kyuyoChk;

    // デジタコ tab
    document.querySelector('.tab-button[data-tab="digitacoSetting"]').hidden =
        digiChk !== "1";

    document.getElementById("digitacoSetting").hidden =
        digiChk !== "1";

    // 給与 tab
    document.querySelector('.tab-button[data-tab="salarySetting"]').hidden =
        kyuyoChk !== "1";

    document.getElementById("salarySetting").hidden =
        kyuyoChk !== "1";

    //function initializeOptionalTabs() {

    //    const navigation = document.getElementById("productTabNavigation");

    //    if (!navigation) return;

    //    const digiChk = navigation.dataset.digiChk === "1";
    //    const kyuyoChk = navigation.dataset.kyuyoChk === "1";

    //    const optionalTabs = [
    //        {
    //            tabId: "digitacoSetting",
    //            enabled: digiChk
    //        },
    //        {
    //            tabId: "salarySetting",
    //            enabled: kyuyoChk
    //        }
    //    ];

    //    optionalTabs.forEach(function (tab) {

    //        const tabButton = document.querySelector(
    //            `.tab-button[data-tab="${tab.tabId}"]`
    //        );

    //        const tabContent = document.getElementById(tab.tabId);

    //        if (tabButton) {
    //            tabButton.hidden = !tab.enabled;
    //        }

    //        if (tabContent) {
    //            tabContent.hidden = !tab.enabled;
    //            tabContent.classList.remove("active");
    //        }
    //    });
    //}

    // =========================================
    // Common Keyboard Navigation
    // =========================================

    function getNavigationDirection(event) {

        const forward =
            event.key === "Enter" ||
            event.key === "ArrowDown" ||
            (event.key === "Tab" && !event.shiftKey);

        const backward =
            event.key === "ArrowUp" ||
            event.key === "Escape" ||
            (event.key === "Tab" && event.shiftKey);

        return { forward, backward };
    }


    function parseFormattedNumber(value) {

        if (!value || !value.trim()) {
            return null;
        }

        const number = Number(value.replace(/,/g, ""));

        return Number.isFinite(number) ? number : null;
    }

    function getCurrentData() {

        return {
            productCode: productCode?.value.trim() || "",
            productName: productName?.value ?? "",
            furigana: furigana?.value ?? "",
            abbreviation: abbreviation?.value ?? "",

            productCategoryCode:
                productCategoryCode?.value.trim() || "",

            transportCategoryCode:
                transportCategoryCode?.value.trim() || "",

            unitPrice: parseFormattedNumber(unitPrice?.value),
            capacity: parseFormattedNumber(capacity?.value),

            allowanceRate: parseFormattedNumber(salary?.value),

            digitacoCode: digitacoCode?.value ?? ""
        };
    }



    // =========================================
    // Legacy Blank-and-Hold Behaviour
    // Applies to 新規 and 修正 modes
    // =========================================

    let lastKeptProductName = "";
    let lastKeptFurigana = "";

    // Remember the last non-empty text values.
    productName.addEventListener("input", function () {

        if (this.value.trim() !== "") {
            lastKeptProductName = this.value;
        }

    });

    furigana.addEventListener("input", function () {

        if (this.value.trim() !== "") {
            lastKeptFurigana = this.value;
        }

    });

    // Capture the current non-empty values after loading
    // an existing record or initializing a copied record.
    function rememberLastKeptTextValues() {

        lastKeptProductName =
            productName.value.trim() !== ""
                ? productName.value
                : "";

        lastKeptFurigana =
            furigana.value.trim() !== ""
                ? furigana.value
                : "";
    }

    // Get the last kept value for supported fields.
    function getLastKeptFieldValue(input) {

        if (!input) return null;

        switch (input.id) {

            //case "originName":
            //    return lastKeptProductName || null;

            //case "furigana":
            //    return lastKeptFurigana || null;

            case "originName":
            case "furigana":
                return lastKeptFieldValues.get(input)?.value ?? null;

            case "productCategory-code":
                return previousProductCategory.code || null;

            case "transPerformCategory-code":
                return previousTransportCategory.code || null;

            default:
                return null;
        }
    }

    // Restore only the four legacy blank-and-hold fields.
    function restoreClearedField(input) {

        if (!input) return false;

        const restorableFields = [
            "originName",
            "furigana",
            "productCategory-code",
            "transPerformCategory-code"
        ];

        if (!restorableFields.includes(input.id)) {
            return false;
        }

        if (typeof input.value !== "string") {
            return false;
        }

        if (input.value.trim() !== "") {
            return false;
        }

        const lastKeptValue = getLastKeptFieldValue(input);

        // No previous value: leave the field unchanged.
        if (lastKeptValue === null) {
            return false;
        }

        input.value = lastKeptValue;

        // Restore the corresponding category name as well.
        if (input.id === "productCategory-code") {

            productCategoryName.value =
                previousProductCategory.name;

        }

        if (input.id === "transPerformCategory-code") {

            transportCategoryName.value =
                previousTransportCategory.name;

        }

        return true;
    }

    // Restore a cleared field when focus moves away.
    //document.addEventListener("focusout", function (event) {

    //    restoreClearedField(event.target);

    //}, true);

    // =========================================
    // Legacy Focus Exit Behaviour
    // =========================================

    document.addEventListener("focusin", function (event) {

        const input = event.target;

        if (
            input instanceof HTMLElement &&
            input.matches("input, textarea, select")
        ) {

            lastFocusedProductField = input;

            // Capture the last accepted value before editing.
            rememberFieldValue(input);
        }

    }, true);


    document.addEventListener("focusout", function (event) {

        const input = event.target;

        if (!input) return;

        const nextControl = event.relatedTarget;

        // Case 1: Focus moves to the expected next control.
        if (isNextControl(input, nextControl)) {

            // Keep the accepted value for 品名 and フリガナ.
            if (
                input === productName ||
                input === furigana
            ) {
                rememberFieldValue(input);
            }

            // Set Chg_Flg only for this forward movement.
            markFieldChanged(input);

            return;
        }

        // Case 2: Mouse click, backward movement,
        // another field, button, or any other exit.
        // Restore the last accepted value.
        restoreLastKeptFieldValue(input);

    }, true);

    // Prevent Enter / Tab from moving away when a cleared
    // field has a previous value that must be restored.
    document.addEventListener("keydown", function (event) {

        if (
            event.key !== "Enter" &&
            event.key !== "Tab"
        ) {
            return;
        }

        if (event.isComposing) return;

        const restored = restoreClearedField(event.target);

        if (restored) {

            event.preventDefault();
            event.stopImmediatePropagation();

        }

    }, true);


    // =========================================
    // Change Detection - Legacy Chg_Flg
    // =========================================

    function markFieldChanged(input) {

        if (!originalData || !input) return;

        const fieldMap = {
            originCode: "productCode",
            originName: "productName",
            furigana: "furigana",
            abbreviation: "abbreviation",
            "productCategory-code": "productCategoryCode",
            "transPerformCategory-code": "transportCategoryCode",
            unitweight: "unitPrice",
            capacity: "capacity",
            salary: "allowanceRate",
            didgitaco: "digitacoCode"
        };

        const fieldName = fieldMap[input.id];

        if (!fieldName) return;

        const currentValue = getCurrentData()[fieldName];
        const originalValue = originalData[fieldName];

        if (currentValue !== originalValue) {
            isChanged = true;
        }
    }

    function hasDataChanged() {
        return isChanged;
    }

    function confirmDataChange() {

        if (!isChanged) {
            return true;
        }

        return confirm("内容が変更されております。よろしいですか？");
    }

    // =========================================
    // Master Code Normalization
    // =========================================

    function normalizeMasterCode(value) {

        const code = value.trim();

        if (code === "") {
            return "";
        }

        if (!/^\d+$/.test(code) || code.length > 4) {
            return null;
        }

        return zeroPad(code, 4);
    }


    // =========================================
    // Previous Valid Values
    // =========================================

    let previousProductCategory = {
        code: "",
        name: ""
    };

    let previousTransportCategory = {
        code: "",
        name: ""
    };

    // =========================================
    // 品名 → フリガナ / 略称 Auto Fill
    // =========================================
    // =========================================
    // Convert Japanese Kana to Half-width Katakana
    // Preserve English when committed through IME.
    // =========================================


    function toHalfWidthFurigana(value, preserveEnglish = false) {

        const filteredText = Array.from((value || "").normalize("NFC"))
            .map(function (character) {

                const code = character.codePointAt(0);

                // Hiragana → Katakana
                if (code >= 0x3041 && code <= 0x3096) {
                    character = String.fromCodePoint(code + 0x60);
                }

                // Keep Japanese Katakana.
                if (/^[ァ-ヶー]$/.test(character)) {
                    return character;
                }

                // Preserve English only when requested.
                if (
                    preserveEnglish &&
                    /^[a-zA-Z0-9]$/.test(character)
                ) {
                    return character;
                }

                return "";
            })
            .join("");

        // Convert the filtered text to half-width Katakana.
        return convertFuriganaInputToHalfWidth(filteredText);
    }


    function convertFuriganaInputToHalfWidth(value) {

        const halfWidthChars =
            "｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝﾞﾟ";

        const map = new Map();

        for (const half of Array.from(halfWidthChars)) {
            map.set(half.normalize("NFKC"), half);
        }

        // Map voiced and semi-voiced Katakana.
        for (const half of Array.from(halfWidthChars)) {
            if (half === "ﾞ" || half === "ﾟ") continue;

            for (const mark of ["ﾞ", "ﾟ"]) {
                map.set(
                    (half + mark).normalize("NFKC"),
                    half + mark
                );
            }
        }

        const text = (value || "").normalize("NFC");
        let result = "";

        for (const character of Array.from(text)) {

            const code = character.codePointAt(0);

            const katakana =
                code >= 0x3041 && code <= 0x3096
                    ? String.fromCodePoint(code + 0x60)
                    : character;

            result += map.get(katakana) || katakana;
        }

        return result;
    }

    // Keep only ASCII and half-width Katakana characters.
    function filterHalfWidthFurigana(value) {
        return Array.from(value || "")
            .filter(function (character) {
                const code = character.codePointAt(0);

                return (
                    code <= 0x7E ||
                    (code >= 0xFF61 && code <= 0xFF9F)
                );
            })
            .join("");
    }

    furigana.addEventListener("input", function () {
        const converted = toHalfWidth(
            convertFuriganaInputToHalfWidth(this.value)
        );

        this.value = limitBytes(
            filterHalfWidthFurigana(converted),
            30
        );
    });

    furigana.addEventListener("compositionend", function () {
        const converted = toHalfWidth(
            convertFuriganaInputToHalfWidth(this.value)
        );

        this.value = limitBytes(
            filterHalfWidthFurigana(converted),
            30
        );
    });



    // Generate 略称 using the legacy 16-unit limit.
    function getAbbreviation(name) {

        let result = "";
        let totalUnits = 0;

        for (const character of name) {

            const c = character.codePointAt(0);

            const characterUnits =
                (c <= 0x7E || (c >= 0xFF61 && c <= 0xFF9F)) ? 1 : 2;

            if (totalUnits + characterUnits > 16) {
                break;
            }

            result += character;
            totalUnits += characterUnits;
        }

        return result;
    }


    // =========================================
    // 品名 → フリガナ Continuous Append
    // =========================================

    function updateFuriganaFromProductName() {

        if (!isFuriganaAutoFillEnabled) {
            return;
        }

        const currentName = productName.value;
        const previousName = lastProductNameForFurigana;

        // Only append characters added at the end.
        if (currentName.startsWith(previousName)) {

            const addedText = currentName.substring(
                previousName.length
            );

            if (addedText !== "") {
                furigana.value += toHalfWidthFurigana(addedText);
            }
        }

        // Remember the latest 品名.
        // Deleting 品名 will not clear フリガナ.
        lastProductNameForFurigana = currentName;
    }


    // =========================================
    // 品名 → フリガナ
    // Capture IME reading before conversion
    // =========================================

    let lastReading = "";

    productName.addEventListener("compositionstart", function () {

        lastReading = "";
    });

    productName.addEventListener("compositionupdate", function (event) {

        const reading = event.data || "";

        // Capture kana while the IME composition is active,
        // before it is converted into kanji.
        if (/^[\u3041-\u3096\u30A1-\u30FAー]+$/.test(reading)) {

            lastReading = reading;
        }
    });

    productName.addEventListener("compositionend", function (event) {

        const reading = lastReading || event.data || "";

        if (reading) {

            const convertedReading = toHalfWidthFurigana(
                reading,
                true
            );

            furigana.value = limitBytes(
                furigana.value + convertedReading,
                30
            );
        }

        lastReading = "";
    });


    //// =========================================
    //// フリガナ - Restore when empty
    //// =========================================

    //furigana.addEventListener("blur", function () {

    //    if (furigana.value.trim() === "") {

    //        // Restore previously generated value.
    //        if (generatedFuriganaValue !== "") {
    //            furigana.value = generatedFuriganaValue;
    //        }
    //        // If no generated value exists, convert 品名.
    //        else if (productName.value.trim() !== "") {

    //            generatedFuriganaValue =
    //                toHalfWidthFurigana(productName.value);

    //            furigana.value = generatedFuriganaValue;
    //        }
    //    }
    //});


    // =========================================
    // 品名 - Forward → Active Tab Header
    // =========================================

    productName.addEventListener("keydown", function (event) {

        const { forward } = getNavigationDirection(event);

        if (!forward || event.isComposing) return;

        event.preventDefault();

        if (productName.value.trim() === "") {

            restoreClearedField(productName);

            productName.focus();
            return;
        }

        //isFuriganaAutoFillEnabled = true;

        //if (furigana.value.trim() === "") {

        //    generatedFuriganaValue =
        //        toHalfWidthFurigana(productName.value);

        //    furigana.value = generatedFuriganaValue;
        //}

        //lastProductNameForFurigana = productName.value;

        focusActiveTabButton();
    });



    // =========================================
    // フリガナ - Forward → 略称
    // =========================================

    furigana.addEventListener("keydown", function (event) {

        const { forward } = getNavigationDirection(event);

        if (!forward || event.isComposing) return;

        // Do not allow forward navigation when フリガナ is blank.
        if (furigana.value.trim() === "") {

            event.preventDefault();

            // Restore the last kept value (Finding #6).
            restoreClearedField(furigana);

            // Keep focus on フリガナ.
            furigana.focus();
            furigana.select();

            return;
        }

        event.preventDefault();

        // Move to 略称 without automatically filling it.
        abbreviation.focus();
        abbreviation.select();
    });



    // =========================================
    // 略称 - Forward → 品名区分
    // =========================================

    abbreviation.addEventListener("keydown", function (event) {

        const { forward } = getNavigationDirection(event);

        if (!forward || event.isComposing) return;

        event.preventDefault();

        if (abbreviation.value.trim() === "") {
            abbreviation.value = productName.value;
            isAbbreviationAutoFilled = true;
        }

        productCategoryCode.focus();
        productCategoryCode.select();
    });


    //// 品名 - Enter key
    //productName.addEventListener("keydown", function (event) {

    //    if (event.key !== "Enter") {
    //        return;
    //    }

    //    event.preventDefault();

    //    if (abbreviation.value.trim() === "") {

    //        abbreviation.value = getAbbreviation(
    //            productName.value
    //        );
    //    }

    //    furigana.focus();
    //    furigana.select();
    //});


    // 品名 - Fill 略称 only when moving forward to a tab header.
    productName.addEventListener("blur", function (event) {

        if (
            event.relatedTarget?.classList.contains("tab-button") &&
            abbreviation.value.trim() === ""
        ) {

            abbreviation.value = getAbbreviation(
                productName.value
            ).trim();

            isAbbreviationAutoFilled = true;
        }
    });


    // 略称 - Fill from 品名 only when moving forward to 品名区分.
    abbreviation.addEventListener("blur", function (event) {

        if (
            event.relatedTarget === productCategoryCode &&
            abbreviation.value.trim() === ""
        ) {

            abbreviation.value = productName.value;
        }
    });


    // =========================================
    // 品名区分マスタ Lookup
    // =========================================

    async function lookupProductCategory() {

        const enteredCode = productCategoryCode.value.trim();

        // Blank code is not accepted.
        // Restore the previous valid value and keep focus here.
        if (enteredCode === "") {

            restoreProductCategory();

            return false;
        }

        const formattedCode = normalizeMasterCode(enteredCode);

        if (formattedCode === null) {

            alert("品名区分コードは4桁以内の数字で入力してください");

            restoreProductCategory();

            return false;
        }

        // Same valid code: no need to search again.
        if (formattedCode === previousProductCategory.code) {

            productCategoryCode.value = previousProductCategory.code;
            productCategoryName.value = previousProductCategory.name;

            return true;
        }

        try {

            const result = await fetchJson(
                "/ProductMaster/GetProductCategoryName?code=" +
                encodeURIComponent(formattedCode)
            );

            if (!result.found || !result.item) {

                alert(
                    "指定した品名区分『" +
                    formattedCode +
                    "』は未登録です！！"
                );

                restoreProductCategory();

                return false;
            }

            // ProductMasterDto property names:
            const name =
                result.item.productCategoryName ??
                result.item.ProductCategoryName ??
                "";

            const returnedCode =
                result.item.productCategoryCode ??
                result.item.ProductCategoryCode ??
                formattedCode;

            //if (!name) {

            //    alert("品名区分の名称を取得できませんでした。");

            //    restoreProductCategory();

            //    return false;
            //}

            productCategoryCode.value = returnedCode;
            productCategoryName.value = name;

            previousProductCategory = {
                code: returnedCode,
                name: name
            };

            return true;

        } catch (error) {

            console.error("Product Category Lookup Error:", error);

            alert(error.message);

            restoreProductCategory();

            return false;
        }
    }


    // =========================================
    // Restore Previous 品名区分
    // =========================================

    function restoreProductCategory() {

        productCategoryCode.value = previousProductCategory.code;
        productCategoryName.value = previousProductCategory.name;

        productCategoryCode.focus();
        productCategoryCode.select();
    }


    // =========================================
    // 輸送実績区分マスタ Lookup
    // =========================================

    async function lookupTransportCategory() {

        const enteredCode = transportCategoryCode.value.trim();

        // Blank code is not accepted.
        // Restore the previous valid value and keep focus here.
        if (enteredCode === "") {

            restoreTransportCategory();

            return false;
        }

        const formattedCode = normalizeMasterCode(enteredCode);

        if (formattedCode === null) {

            alert("輸送実績区分コードは4桁以内の数字で入力してください");

            restoreTransportCategory();

            return false;
        }

        // Same valid code: no need to search again.
        if (formattedCode === previousTransportCategory.code) {

            transportCategoryCode.value = previousTransportCategory.code;
            transportCategoryName.value = previousTransportCategory.name;

            return true;
        }

        try {

            const result = await fetchJson(
                "/ProductMaster/GetTransportResultCategoryName?code=" +
                encodeURIComponent(formattedCode)
            );

            if (!result.found || !result.item) {

                alert(
                    "指定した輸送実績『" +
                    formattedCode +
                    "』は未登録です！！"
                );

                restoreTransportCategory();

                return false;
            }

            // ProductMasterDto property names:
            const name =
                result.item.transportCategoryName ??
                result.item.TransportCategoryName ??
                "";

            const returnedCode =
                result.item.transportCategoryCode ??
                result.item.TransportCategoryCode ??
                formattedCode;

            //if (!name) {

            //    alert("輸送実績区分の名称を取得できませんでした。");

            //    restoreTransportCategory();

            //    return false;
            //}

            transportCategoryCode.value = returnedCode;
            transportCategoryName.value = name;

            previousTransportCategory = {
                code: returnedCode,
                name: name
            };

            return true;

        } catch (error) {

            console.error("Transport Category Lookup Error:", error);

            alert(error.message);

            restoreTransportCategory();

            return false;
        }
    }


    // =========================================
    // Restore Previous 輸送実績区分
    // =========================================

    function restoreTransportCategory() {

        transportCategoryCode.value = previousTransportCategory.code;
        transportCategoryName.value = previousTransportCategory.name;

        transportCategoryCode.focus();
        transportCategoryCode.select();
    }


    // =========================================
    // 品名区分 - Forward → 輸送実績区分
    // =========================================

    productCategoryCode.addEventListener("keydown", async function (event) {

        const { forward } = getNavigationDirection(event);

        if (!forward) return;

        event.preventDefault();

        // Tab moves without forcing lookup.
        if (event.key !== "Tab") {

            const success = await lookupProductCategory();

            if (!success) return;
        }

        transportCategoryCode.focus();
    });


    productCategoryCode.addEventListener("blur", async function (event) {

        // Lookup only when moving forward to 輸送実績区分.
        if (event.relatedTarget === transportCategoryCode) {

            await lookupProductCategory();

        } else {

            // Restore the previous valid value without an alert.
            productCategoryCode.value = previousProductCategory.code;
            productCategoryName.value = previousProductCategory.name;
        }
    });


    // =========================================
    // 輸送実績区分 - Forward → 単位重量
    // =========================================

    transportCategoryCode.addEventListener("keydown", async function (event) {

        const { forward } = getNavigationDirection(event);

        if (!forward) return;

        event.preventDefault();

        // Tab moves without forcing lookup.
        if (event.key !== "Tab") {

            const success = await lookupTransportCategory();

            if (!success) return;
        }

        unitPrice.focus();
    });

    transportCategoryCode.addEventListener("blur", async function (event) {

        // Lookup only when moving forward to 単位重量.
        if (event.relatedTarget === unitPrice) {

            await lookupTransportCategory();

        } else {

            // Restore the previous valid value without an alert.
            transportCategoryCode.value = previousTransportCategory.code;
            transportCategoryName.value = previousTransportCategory.name;
        }
    });

    // =========================================
    // 4. Fetch Helper
    // =========================================

    async function fetchJson(url, options = {}) {

        const response = await fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {})
            }
        });

        let result;

        try {
            result = await response.json();
        } catch {
            throw new Error(
                `サーバー応答を読み取れません。HTTP Status: ${response.status}`
            );
        }

        if (!response.ok || result.success === false) {

            throw new Error(
                result.message || "サーバー処理に失敗しました"
            );
        }

        return result;
    }

    // =========================================
    // Load Category Names for Existing Product
    // =========================================

    async function loadProductCategoryNames(product) {

        // 品名区分
        const productCode = product.productCategoryCode || "";

        if (productCode) {

            try {

                const code = zeroPad(productCode, 4);

                const result = await fetchJson(
                    "/ProductMaster/GetProductCategoryName?code=" +
                    encodeURIComponent(code)
                );

                if (result.found && result.item) {

                    productCategoryCode.value =
                        result.item.productCategoryCode ||
                        result.item.ProductCategoryCode ||
                        code;

                    productCategoryName.value =
                        result.item.productCategoryName ||
                        result.item.ProductCategoryName ||
                        "";

                } else {

                    productCategoryName.value = "";
                }

            } catch (error) {

                console.error("品名区分 Name Load Error:", error);

                productCategoryName.value = "";
            }

        } else {

            productCategoryName.value = "";
        }


        // 輸送実績区分
        const transportCode = product.transportCategoryCode || "";

        if (transportCode) {

            try {

                const code = zeroPad(transportCode, 4);

                const result = await fetchJson(
                    "/ProductMaster/GetTransportResultCategoryName?code=" +
                    encodeURIComponent(code)
                );

                if (result.found && result.item) {

                    transportCategoryCode.value =
                        result.item.transportCategoryCode ||
                        result.item.TransportCategoryCode ||
                        code;

                    transportCategoryName.value =
                        result.item.transportCategoryName ||
                        result.item.TransportCategoryName ||
                        "";

                } else {

                    transportCategoryName.value = "";
                }

            } catch (error) {

                console.error("輸送実績区分 Name Load Error:", error);

                transportCategoryName.value = "";
            }

        } else {

            transportCategoryName.value = "";
        }

        // Update previous valid values.
        previousProductCategory = {
            code: productCategoryCode.value,
            name: productCategoryName.value
        };

        previousTransportCategory = {
            code: transportCategoryCode.value,
            name: transportCategoryName.value
        };
    }

    // =========================================
    // 5. Get MAX Product Code + 1
    // =========================================

    async function getNextProductCode() {

        try {

            const result = await fetchJson(
                "/ProductMaster/NextCode"
            );

            productCode.value = result.productCode || "";

            if (productCode.value.trim() !== "") {
                lastKeptProductCode = productCode.value;
            }

            return true;

        } catch (error) {

            console.error("Next Product Code Error:", error);

            alert(error.message);

            productCode.value = "";

            return false;
        }
    }


    async function generateNextCodeIfEmpty() {

        if (productCode.value.trim() !== "") {
            return true;
        }

        const success = await getNextProductCode();

        if (success && originalData && !isExistingRecord) {
            originalData.productCode = productCode.value;
        }

        return success;
    }


    // =========================================
    // 6. Format Unit Price
    //    123456.00 -> 123,456.00
    // =========================================

    function formatUnitPrice(value) {

        if (value === null || value === undefined || value === "") {
            return "";
        }

        const number = Number(String(value).replace(/,/g, ""));

        if (!Number.isFinite(number)) {
            return "";
        }

        return number.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // =========================================
    // 7. Format Capacity
    //    1234567 -> 1,234,567
    // =========================================

    function formatCapacity(value) {

        if (value === null || value === undefined || value === "") {
            return "";
        }

        const number = Number(String(value).replace(/,/g, ""));

        if (!Number.isFinite(number)) {
            return "";
        }

        return Math.trunc(number).toLocaleString("en-US");
    }

    // =========================================
    // 8. Unit Price Input
    //    123456.00 -> 123,456.00
    // =========================================


    function initializeUnitPrice() {

        if (!unitPrice) return;

        unitPrice.addEventListener("input", function () {

            const oldValue = this.value;
            const oldCursor = this.selectionStart;

            // Count numeric digits before the cursor.
            const digitsBeforeCursor =
                oldValue.substring(0, oldCursor).replace(/[^0-9]/g, "").length;

            let value = oldValue.replace(/,/g, "");
            value = value.replace(/[^0-9.]/g, "");

            // Allow only one decimal point.
            const decimalIndex = value.indexOf(".");

            if (decimalIndex !== -1) {
                value =
                    value.substring(0, decimalIndex + 1) +
                    value.substring(decimalIndex + 1).replace(/\./g, "");
            }

            let parts = value.split(".");

            // Maximum 6 integer digits.
            parts[0] = parts[0].substring(0, 6);

            // Maximum 2 decimal digits.
            if (parts.length === 2) {
                parts[1] = parts[1].substring(0, 2);
            }

            //// Automatically append .00.
            //if (parts.length === 1 && parts[0] !== "") {
            //    parts.push("00");
            //}

            // Add commas.
            const integerPart = parts[0].replace(
                /\B(?=(\d{3})+(?!\d))/g,
                ","
            );

            const formattedValue =
                integerPart +
                (parts.length > 1 ? "." + parts[1] : "");

            this.value = formattedValue;

            // Restore cursor position.
            if (decimalIndex === -1) {

                this.setSelectionRange(
                    integerPart.length,
                    integerPart.length
                );

            } else {

                let position = 0;
                let digitCount = 0;

                while (
                    position < formattedValue.length &&
                    digitCount < digitsBeforeCursor
                ) {
                    if (/[0-9]/.test(formattedValue[position])) {
                        digitCount++;
                    }
                    position++;
                }

                this.setSelectionRange(position, position);
            }
        });

        // Format when leaving the field.
        unitPrice.addEventListener("blur", function () {

            const value = this.value.trim();

            if (!value) {
                this.value = "";
                return;
            }

            const number = Number(value.replace(/,/g, ""));

            if (
                !Number.isFinite(number) ||
                number < 0 ||
                number > 999999.99
            ) {
                showMessage(
                    "入力可能範囲 [ 0.00～999,999.99 ]",
                    "blue"
                );
                return;
            }

            showMessage("");

            this.value = formatUnitPrice(number);
        });

        // Enter moves to Capacity.
        unitPrice.addEventListener("keydown", function (event) {

            const { forward } = getNavigationDirection(event);

            if (!forward) return;

            event.preventDefault();
            capacity.focus();
        });
    }

    // =========================================
    // 10. 手当掛率 Input
    //    Format: ##0.00
    //    Range: 0.00 - 100.00
    // =========================================


    function initializeSalary() {

        if (!salary) return;

        // Select only the integer part when the field receives focus.
        salary.addEventListener("focus", function () {
            const decimalIndex = this.value.indexOf(".");

            if (decimalIndex >= 0) {
                this.setSelectionRange(0, decimalIndex);
            }
        });

        salary.addEventListener("input", function () {

            const rawValue = this.value;
            const cursorPosition = this.selectionStart ?? rawValue.length;

            if (rawValue === "") return;

            const decimalIndex = rawValue.indexOf(".");
            const integerText = decimalIndex < 0
                ? rawValue
                : rawValue.substring(0, decimalIndex);

            const decimalText = decimalIndex < 0
                ? ""
                : rawValue.substring(decimalIndex + 1);

            const integerDigits = integerText.replace(/\D/g, "").substring(0, 3);
            const decimalDigits = decimalText.replace(/\D/g, "").substring(0, 2);

            const integerValue = integerDigits === ""
                ? "0"
                : String(Number(integerDigits));

            const numericValue = Number(
                integerValue + "." + (decimalDigits || "0")
            );

            const cursorIsInDecimals =
                decimalIndex >= 0 && cursorPosition > decimalIndex;

            const decimalDigitsBeforeCursor = cursorIsInDecimals
                ? rawValue
                    .substring(decimalIndex + 1, cursorPosition)
                    .replace(/\D/g, "").length
                : 0;

            if (numericValue > 100) {
                this.value = "100.00";

                const clampedCursor = cursorIsInDecimals
                    ? 4 + Math.min(decimalDigitsBeforeCursor, 2)
                    : 3;

                this.setSelectionRange(clampedCursor, clampedCursor);
                return;
            }

            this.value =
                integerValue + "." + decimalDigits.padEnd(2, "0");

            const formattedCursor = cursorIsInDecimals
                ? integerValue.length + 1 +
                Math.min(decimalDigitsBeforeCursor, 2)
                : Math.min(
                    rawValue
                        .substring(0, cursorPosition)
                        .replace(/\D/g, "").length,
                    integerValue.length
                );

            this.setSelectionRange(formattedCursor, formattedCursor);
        });

        salary.addEventListener("blur", function () {

            const value = this.value.trim();

            if (!value) {
                this.value = "";
                return;
            }

            let number = Number(value);

            if (!Number.isFinite(number) || number < 0) {
                number = 0;
            }

            if (number > 100) {
                number = 100;
            }

            showMessage("");

            this.value = number.toFixed(2);
        });

        salary.addEventListener("keydown", function (event) {

            // Handle decimal point.
            if (event.key === "." || event.key === "Decimal") {
                event.preventDefault();

                if (!this.value) {
                    this.value = "0.00";
                }

                const decimalIndex = this.value.indexOf(".");
                const position = decimalIndex < 0
                    ? this.value.length
                    : decimalIndex + 1;

                this.setSelectionRange(position, position);
                return;
            }

            const { forward } = getNavigationDirection(event);

            if (!forward) return;

            event.preventDefault();
            focusActiveTabButton();
        });
    }

     
    // =========================================
    // 9. Capacity   Input
    //    1234567 -> 2,123,456
    // =========================================
    function initializeCapacity() {

        if (!capacity) return;

        capacity.addEventListener("focus", function () {

            this.value = this.value.replace(/,/g, "");
        });

        capacity.addEventListener("input", function () {

            const oldValue = this.value;
            const oldCursor = this.selectionStart;

            // Count digits before cursor.
            const digitsBeforeCursor =
                oldValue.substring(0, oldCursor).replace(/[^0-9]/g, "").length;

            // Allow numeric characters only.
            let value = oldValue.replace(/[^0-9]/g, "");

            // Maximum seven digits.
            value = value.substring(0, 7);

            // Add comma separators.
            const formattedValue = value.replace(
                /\B(?=(\d{3})+(?!\d))/g,
                ","
            );

            this.value = formattedValue;

            // Restore cursor position.
            let position = 0;
            let digitCount = 0;

            while (
                position < formattedValue.length &&
                digitCount < digitsBeforeCursor
            ) {
                if (/[0-9]/.test(formattedValue[position])) {
                    digitCount++;
                }

                position++;
            }

            this.setSelectionRange(position, position);
        });

        capacity.addEventListener("blur", function () {

            const value = this.value.trim();

            if (!value) {
                this.value = "";
                return;
            }

            const number = Number(value.replace(/,/g, ""));

            if (
                !Number.isInteger(number) ||
                number < 0 ||
                number > 9999999
            ) {

                showMessage(
                    "入力可能範囲 [ 0～9,999,999 ]",
                    "blue"
                );

                return;
            }

            showMessage("");

            this.value = formatCapacity(number);
        });

        capacity.addEventListener("keydown", function (event) {

            const { forward } = getNavigationDirection(event);

            if (!forward) return;

            event.preventDefault();
            focusActiveTabButton();
        });
    }

    // =========================================
    // デジタココード - Enter → Tab Header
    // =========================================

    digitacoCode?.addEventListener("keydown", function (event) {

        const { forward } = getNavigationDirection(event);

        if (!forward) return;

        event.preventDefault();
        focusActiveTabButton();
    });

    // =========================================
    // 手当掛率 - Enter → Tab Header
    // =========================================

    //salary?.addEventListener("keydown", function (event) {

    //    if (event.key === "Enter") {
    //        event.preventDefault();
    //        focusActiveTabButton();
    //    }
    //});


    // =========================================
    // 10. Numeric-only Master Code Inputs
    // =========================================

    function initializeNumericFields() {

        const numericFields = [
            productCategoryCode,
            transportCategoryCode,
            digitacoCode
        ];

        numericFields.forEach(function (input) {

            if (!input) return;

            input.setAttribute("inputmode", "numeric");

            input.addEventListener("input", function () {

                this.value = this.value.replace(/[^0-9]/g, "");
            });
        });
    }

    // =========================================
    // 11. Clear Product Fields
    // =========================================

    function clearProductFields() {

        productName.value = "";
        furigana.value = "";
        abbreviation.value = "";

        productCategoryCode.value = "";
        productCategoryName.value = "";

        transportCategoryCode.value = "";
        transportCategoryName.value = "";

        unitPrice.value = "";
        capacity.value = "";
        salary.value = "100.00";
        digitacoCode.value = "";
        previousProductCategory = {
            code: "",
            name: ""
        };

        previousTransportCategory = {
            code: "",
            name: ""
        };
        //lastKeptProductName = "";
        //lastKeptFurigana = "";


        // Refresh the snapshot after clearing all fields.
        rememberFieldValue(document.activeElement);
    }

    // =========================================
    // 12. Load Existing Product Data
    // =========================================

    async function fillProductFields(product) {

        if (!product) return;

        productCode.value = product.productCode || "";
        lastKeptProductCode = productCode.value;
        productCode.classList.remove("new-record");
        productCode.classList.add("existing-record");
        productCode.classList.add("unit-code-selected");

        productCode.readOnly = true;

        productName.value = product.productName || "";

        furigana.value = product.furigana || "";
        abbreviation.value = product.abbreviation || "";

        productCategoryCode.value =
            product.productCategoryCode || "";

        transportCategoryCode.value =
            product.transportCategoryCode || "";

        unitPrice.value = formatUnitPrice(product.unitPrice);

        capacity.value = formatCapacity(product.capacity);

        // Load saved 手当掛率.
        salary.value = Number(
            product.allowanceRate ??
            product.AllowanceRate ??
            100
        ).toFixed(2);

        digitacoCode.value = product.digitacoCode || "";

        // Fetch both category names from their master tables.
        await loadProductCategoryNames(product);

        isExistingRecord = true;
        isCopyMode = false;

        showScreenStatus("修　正");

        setButtonState();

        originalData = getCurrentData();
        isChanged = false;

        //rememberLastKeptTextValues();

        // Refresh the snapshot after loading the new record.
        rememberFieldValue(document.activeElement);

        //showMessage("データを読み込みました。");
    }

    // =========================================
    // 13. Get Product by Code
    // =========================================

    async function loadProductByCode(code) {

        if (!code) {
            return false;
        }

        try {

            const result = await fetchJson(
                "/ProductMaster/GetByCode?productCode=" +
                encodeURIComponent(code)
            );

            if (!result.found || !result.item) {
                return false;
            }

            await fillProductFields(result.item);

            return true;

        } catch (error) {

            console.error("Product Load Error:", error);

            alert(error.message);

            return false;
        }
    }

    // =========================================
    // 14. New Product Mode
    // =========================================

    async function initializeNewProduct() {

        clearProductFields();
        isChanged = false;
        productCode.classList.remove("existing-record");
        productCode.classList.remove("unit-code-selected");
        productCode.classList.add("new-record");

        productCode.readOnly = false;
        productCode.value = "";

        isExistingRecord = false;
        isCopyMode = false;
        lastLookedUpProductCode = "";

        // Reset auto-fill restrictions only for F11 / new initialization.
        isAbbreviationManuallyEdited = false;
        isAbbreviationAutoFilled = false; 

        showScreenStatus("新　規");

        setButtonState();

        const success = await getNextProductCode();

        if (!success) {
            originalData = getCurrentData();
            return false;
        }

        // Capture baseline AFTER generating MAX + 1.
        originalData = getCurrentData();

        productCode.focus();
        productCode.select();

        return true;
    }

    // =========================================
    // 15. F1: Register / Update
    // =========================================

    async function saveProduct() {

        if (isProcessing) return;

        const product = getCurrentData();

        if (!product.productCode) {

            alert("品名コードを入力してください");

            productCode.focus();

            return;
        }

        if (product.productCode === "0000000000") {
            alert("品名コード：0000000000 は手入力用コードなのでマスタ登録はできません");
            productCode.focus();
            return;
        }

        //if (!/^\d{1,10}$/.test(product.productCode)) {

        //    alert("品名コードを正しく入力してください。");

        //    productCode.focus();

        //    return;
        //}

        if (!product.productName) {

            alert("品名を入力してください");

            productName.focus();

            return;
        }
        if (!product.furigana) {

            alert("フリガナを入力してください");
            switchTab("basicSetting");
            furigana.focus();

            return;
        }

        if (!product.abbreviation) {
            alert("略称を入力してください");
            switchTab("basicSetting");
            abbreviation.focus();
            return;
        }

        if (!product.productCategoryCode) {

            alert("品名区分を入力してください");
            switchTab("basicSetting");
            productCategoryCode.focus();

            return;
        } 

        if (!product.transportCategoryCode) {

            alert("輸送実績区分を入力してください");
            switchTab("basicSetting");
            transportCategoryCode.focus();

            return;
        } 

        //if (unitPrice.value.trim() && product.unitPrice === null) {

        //    alert("単価を正しく入力してください。");
        //    switchTab("basicSetting");
        //    unitPrice.focus();

        //    return;
        //}

        //if (capacity.value.trim() && product.capacity === null) {

        //    alert("容量を正しく入力してください。");

        //    capacity.focus();

        //    return;
        //}
        //if (salary.value.trim() && product.allowanceRate === null) {

        //    alert("手当掛率を正しく入力してください。");

        //    salary.focus();

        //    return;
        //}


        //if (
        //    product.allowanceRate !== null &&
        //    (
        //        product.allowanceRate < 0 ||
        //        product.allowanceRate > 100
        //    )
        //) {
        //    alert("手当掛率は0.00～100.00の範囲で入力してください。");
        //    switchTab("salarySetting");
        //    salary.focus();
        //    return;
        //}


        //if (
        //    product.unitPrice !== null &&
        //    (
        //        product.unitPrice < 0 ||
        //        product.unitPrice > 999999.99
        //    )
        //) {

        //    showMessage(
        //        "入力可能範囲 [ 0.00～999,999.99 ]",
        //        "blue"
        //    );

        //    unitPrice.focus();

        //    return;
        //}

        //if (
        //    product.capacity !== null &&
        //    (
        //        !Number.isInteger(product.capacity) ||
        //        product.capacity < 0 ||
        //        product.capacity > 9999999
        //    )
        //) {

        //    showMessage(
        //        "入力可能範囲 [ 0～9,999,999 ]",
        //        "blue"
        //    );

        //    capacity.focus();

        //    return;
        //}

        product.productCode =
            product.productCode.padStart(10, "0");

        try {

            isProcessing = true;

            if (btnRegister) {
                btnRegister.disabled = true;
            }

            const result = await fetchJson(
                "/ProductMaster/Save",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(product)
                }
            );

            //alert(result.message || "登録しました。");

            // Reload the screen.
            // Initial load will generate MAX + 1 Product Code.
            window.location.reload();

            return;

        } catch (error) {

            console.error("Product Save Error:", error);

            alert(error.message);

        } finally {

            isProcessing = false;

            if (btnRegister) {
                btnRegister.disabled = false;
            }
        }
    }

    // =========================================
    // 16. F2: Copy Existing Product
    // =========================================

    async function copyProduct() {

        if (!isExistingRecord || isProcessing) return;

        const copiedData = getCurrentData();

        try {

            isProcessing = true;

            const result = await fetchJson(
                "/ProductMaster/NextCode"
            );

            // Copy the existing product fields.
            await fillProductFields(copiedData);

            // Assign the new Product Code.
            productCode.value = result.productCode || "";

            // A copied record is a new record.
            productCode.classList.remove("existing-record");
            productCode.classList.remove("unit-code-selected");
            productCode.classList.add("new-record");

            productCode.readOnly = false;

            isExistingRecord = false;
            isCopyMode = true;

            isAbbreviationManuallyEdited = false;
            isAbbreviationAutoFilled = false;

            showScreenStatus("新　規");

            setButtonState();

            // Capture the copied data with its new code.
            originalData = getCurrentData();
            isChanged = false;
            productCode.focus();
            productCode.select();

            //showMessage("コピーしました。");

        } catch (error) {

            console.error("Product Copy Error:", error);

            alert(error.message);

        } finally {

            isProcessing = false;
        }
    }

    // =========================================
    // 17. F4: Permanent Delete
    // =========================================

    async function deleteProduct() {

        if (!isExistingRecord || isProcessing) return;

        const code = productCode.value.trim();

        if (!code) return;

        try {

            isProcessing = true;

            // Step 1: Check whether the product is used in other tables.
            const validation = await fetchJson(
                "/ProductMaster/CheckDelete?productCode=" +
                encodeURIComponent(code)
            );

            // Step 2: If referenced, show the error and stay on current record.
            if (!validation.canDelete) {

                alert(validation.message);

                // Keep the current Product Code and focus on 品名.
                productName.focus();
                productName.select();

                return;
            }

            // Step 3: Ask for confirmation only if validation passes.
            if (!confirm("削除してもよいですか？")) {

                productName.focus();
                productName.select();

                return;
            }

            // Step 4: Delete the record.
            const result = await fetchJson(
                "/ProductMaster/Delete",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },
                    body:
                        "productCode=" +
                        encodeURIComponent(code)
                }
            );

            //alert(result.message || "削除しました。");

            // Initialize only after successful deletion.
            await initializeNewProduct();

            switchTab("basicSetting");

        } catch (error) {

            console.error("Product Delete Error:", error);

            alert(error.message);

            // Keep the current record and focus on 品名.
            productName.focus();
            productName.select();

        } finally {

            isProcessing = false;
        }
    }

    // =========================================
    // 18. F7: Previous Product
    // =========================================

    async function loadPreviousProduct() {

        if (isProcessing) return;

        // Confirm changes before searching for the previous product.
        if (!confirmDataChange()) return;

        const code = productCode.value.trim();

        try {

            isProcessing = true;

            const result = await fetchJson(
                "/ProductMaster/Previous?productCode=" +
                encodeURIComponent(code)
            );

            if (!result.found || !result.item) {

                alert("これより前のデータはありません！！");

                productName.focus();
                productName.select();

                return;
            }

            await fillProductFields(result.item);

            switchTab("basicSetting");

            productName.focus();
            productName.select();

        } catch (error) {

            console.error("Previous Product Error:", error);
            alert(error.message);

        } finally {

            isProcessing = false;
        }
    }


    // =========================================
    // 19. F8: Next Product
    // =========================================


    async function loadNextProduct() {

        if (isProcessing) return;

        if (!confirmDataChange()) return;

        const code = productCode.value.trim();

        try {

            isProcessing = true;

            const result = await fetchJson(
                "/ProductMaster/Next?productCode=" +
                encodeURIComponent(code)
            );

            if (!result.found || !result.item) {

                alert("これより次のデータは有りません！！");
                originName.focus();
                return;
            }

            await fillProductFields(result.item);

            switchTab("basicSetting");

            productName.focus();
            productName.select();

        } catch (error) {

            console.error("Next Product Error:", error);
            alert(error.message);

        } finally {

            isProcessing = false;
        }
    }


    // =========================================
    // 20. F11: Clear
    // =========================================

    async function clearProduct() {

        if (isProcessing) return;

        if (!confirmDataChange()) {
            return;
        }

        await initializeNewProduct();

        switchTab("basicSetting");
    }

    // =========================================
    // 21. F12: Exit to Main Menu
    // =========================================

    //function exitProductMaster() {

    //    if (!confirmDataChange()) {
    //        return;
    //    }

    //    const exitUrl = btnExit?.dataset.exitUrl;

    //    if (exitUrl) {
    //        window.location.href = exitUrl;
    //    }
    //}

    // =========================================
    // Tab Header Keyboard Navigation
    // =========================================

    function focusActiveTabButton() {
        document.querySelector(".tab-button.active")?.focus();
    }


    // =========================================
    // Tab Header Keyboard Navigation
    // =========================================

    tabButtons.forEach(function (button) {

        button.addEventListener("keydown", function (event) {

            const { forward } = getNavigationDirection(event);

            if (forward) {

                event.preventDefault();

                const firstInputByTab = {
                    basicSetting: furigana,
                    digitacoSetting: digitacoCode,
                    salarySetting: salary
                };

                firstInputByTab[this.dataset.tab]?.focus();

                return;
            }

            // Left / Right Arrow switches visible tabs.
            if (
                event.key === "ArrowLeft" ||
                event.key === "ArrowRight"
            ) {

                event.preventDefault();

                const visibleTabs = Array.from(tabButtons).filter(
                    tab => !tab.hidden
                );

                const currentIndex = visibleTabs.indexOf(this);

                const direction =
                    event.key === "ArrowRight" ? 1 : -1;

                const nextIndex =
                    (currentIndex + direction + visibleTabs.length) %
                    visibleTabs.length;

                const nextTab = visibleTabs[nextIndex];

                if (nextTab) {
                    switchTab(nextTab.dataset.tab);
                    nextTab.focus();
                }
            }
        });
    });

    // =========================================
    // Previous Control Navigation
    // ArrowUp / Escape / Shift+Tab
    // =========================================

    document.addEventListener("keydown", function (event) {

        const { backward } = getNavigationDirection(event);

        if (!backward || event.isComposing) return;

        const current = event.target;

        const previousControlMap = new Map([

            [productName, productCode],

            [furigana,
                document.querySelector(
                    '.tab-button[data-tab="basicSetting"]'
                )
            ],

            [abbreviation, furigana],

            [productCategoryCode, abbreviation],

            [transportCategoryCode, productCategoryCode],

            [unitPrice, transportCategoryCode],

            [capacity, unitPrice],

            [digitacoCode,
                document.querySelector(
                    '.tab-button[data-tab="digitacoSetting"]'
                )
            ],

            [salary,
                document.querySelector(
                    '.tab-button[data-tab="salarySetting"]'
                )
            ]
        ]);

        // 品名コード stays on the same field.
        if (current === productCode) {

            event.preventDefault();
            productCode.focus();

            return;
        }

        let previousControl = null;

        // From a tab header, return to 品名.
        const currentTabButton = current.closest?.(".tab-button");

        if (currentTabButton) {
            previousControl = productName;
        } else {
            previousControl = previousControlMap.get(current);
        }

        if (!previousControl) return;

        event.preventDefault();

        previousControl.focus();

        if (
            previousControl instanceof HTMLInputElement &&
            !previousControl.readOnly
        ) {
            previousControl.select();
        }
    });

    //// Generate フリガナ when 基本設定 tab header receives focus.
    //tabButtons.forEach(function (button) {

    //    button.addEventListener("focus", function () {

    //        if (this.dataset.tab !== "basicSetting") {
    //            return;
    //        }

    //        isFuriganaAutoFillEnabled = true;

    //        generatedFuriganaValue =
    //            toHalfWidthFurigana(productName.value);

    //        furigana.value = generatedFuriganaValue;

    //        lastProductNameForFurigana = productName.value;
    //    });
    //});

    // =========================================
    // 22. Tab Navigation
    // =========================================

    tabButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const tabId = this.dataset.tab;

            if (!tabId) return;

            switchTab(tabId);
        });
    });

    // =========================================
    // 23. Function Button Events
    // =========================================

    btnRegister?.addEventListener("click", saveProduct);

    btnCopy?.addEventListener("click", copyProduct);

    btnDelete?.addEventListener("click", deleteProduct);

    btnPrevious?.addEventListener("click", loadPreviousProduct);

    btnNext?.addEventListener("click", loadNextProduct);

    btnCancel?.addEventListener("click", clearProduct);

    /*btnExit?.addEventListener("click", exitProductMaster);*/

    // Keep the current input focused when clicking function buttons.
    document.querySelectorAll(".function-footer button")
        .forEach(function (button) {

            button.addEventListener("mousedown", function (event) {
                event.preventDefault();
            });

        });


    async function handleProductCodeLookup() {

        // Prevent Enter and Blur from executing the lookup simultaneously.
        if (isCodeLookupInProgress) {
            return false;
        }

        const code = productCode.value.trim();

        if (!code) {
            return false;
        }

        if (!/^\d{1,10}$/.test(code)) {

            showMessage(
                "品名コードは1～10桁の数字で入力してください",
                "blue"
            );

            return false;
        }

        const formattedCode = code.padStart(10, "0");

        productCode.value = formattedCode;

        // Do not repeat a completed lookup.
        if (
            lastLookedUpProductCode === formattedCode &&
            (isExistingRecord || isCopyMode)
        ) {
            return true;
        }

        isCodeLookupInProgress = true;

        try {

            // =========================================
            // F2 COPY MODE
            // =========================================
            if (isCopyMode) {

                const result = await fetchJson(
                    "/ProductMaster/GetByCode?productCode=" +
                    encodeURIComponent(formattedCode)
                );

                // Entered code already exists.
                if (result.found && result.item) {

                    alert(
                        "指定したコード『" +
                        formattedCode +
                        "』は存在します！！"
                    );

                    // After clicking OK, get the next MAX + 1 code.
                    const nextResult = await fetchJson(
                        "/ProductMaster/NextCode"
                    );

                    const nextCode = nextResult.productCode || "";

                    if (!nextCode) {
                        alert("次の品名コードを取得できません");
                        productCode.focus();
                        return false;
                    }

                    // Replace only the code.
                    // Keep all copied product details unchanged.
                    productCode.value = nextCode;

                    productCode.classList.remove("existing-record");
                    productCode.classList.remove("unit-code-selected");
                    productCode.classList.add("new-record");

                    productCode.readOnly = false;

                    isExistingRecord = false;
                    isCopyMode = true;

                    // Remember the generated code.
                    lastLookedUpProductCode = nextCode;

                    // Update original data with the new code.
                    originalData = getCurrentData();

                    setButtonState();

                    productCode.focus();
                    productCode.select();

                    return false;
                }

                // Entered code does not exist.
                // Keep the copied product details.
                lastLookedUpProductCode = formattedCode;

                isExistingRecord = false;
                productCode.readOnly = false;

                productCode.classList.remove("existing-record");
                productCode.classList.remove("unit-code-selected");
                productCode.classList.add("new-record");

                showScreenStatus("新　規");
                setButtonState();

                originalData = getCurrentData();

                return true;
            }

            // =========================================
            // NORMAL MODE
            // =========================================

            if (lastLookedUpProductCode === formattedCode && isExistingRecord) {
                return true;
            }

            clearProductFields();

            isExistingRecord = false;
            isCopyMode = false;

            productCode.readOnly = false;

            productCode.classList.remove("existing-record");
            productCode.classList.remove("unit-code-selected");
            productCode.classList.add("new-record");

            showScreenStatus("新　規");
            setButtonState();


            const found = await loadProductByCode(formattedCode);

            if (!found) {

                // The entered code does not exist.
                // Keep the entered code and continue in 新規 mode.
                lastLookedUpProductCode = formattedCode;

                isExistingRecord = false;
                isCopyMode = false;

                productCode.value = formattedCode;
                productCode.readOnly = false;

                productCode.classList.remove("existing-record");
                productCode.classList.remove("unit-code-selected");
                productCode.classList.add("new-record");

                showScreenStatus("新　規");
                setButtonState();

                // Capture the cleared screen and entered code as baseline.
                originalData = getCurrentData();

                return true;
            }

            lastLookedUpProductCode = formattedCode;

            return true;


        } catch (error) {

            console.error("Product Code Lookup Error:", error);

            alert(error.message);

            productCode.focus();
            productCode.select();

            return false;

        } finally {

            isCodeLookupInProgress = false;
        }
    }

    productCode.addEventListener("keydown", async function (event) {

        // Enter key
        if (event.key === "Enter" || event.key === "ArrowDown") {
            event.preventDefault();

            const code = productCode.value.trim();

            if (!code) {

                // Restore the last kept Product Code.
                productCode.value = lastKeptProductCode;

                // Keep focus on 品名コード.
                productCode.focus();
                productCode.select();

                return;
            }

            // New registration: generated MAX + 1 code.
            if (
                !isExistingRecord &&
                originalData &&
                code === originalData.productCode
            ) {
                productName.focus();
                productName.select();
                return;
            }

            const found = await handleProductCodeLookup();

            if (found) {
                productName.focus();
                productName.select();
            }

            return;
        }

        // Tab key: lookup before moving to 品名.
        if (event.key === "Tab" && !event.shiftKey) {
            event.preventDefault();

            const code = productCode.value.trim();

            if (!code) {

                // Restore the last kept Product Code.
                productCode.value = lastKeptProductCode;

                // Do not move to 品名.
                productCode.focus();
                productCode.select();

                return;
            }

            // New registration: generated MAX + 1 code.
            if (
                !isExistingRecord &&
                originalData &&
                code === originalData.productCode
            ) {
                productName.focus();
                productName.select();
                return;
            }

            const found = await handleProductCodeLookup();

            if (found) {
                productName.focus();
                productName.select();
            }
        }
    });

    // Handle focus leaving 品名コード

    productCode.addEventListener("blur", function () {

        setTimeout(async function () {

            const activeElement = document.activeElement;
            const code = productCode.value.trim();

            // Focus moves to 品名.
            if (activeElement === productName) {

                if (!code) {

                    productCode.value = lastKeptProductCode;
                    productCode.focus();
                    productCode.select();

                    return;
                }

                // Skip lookup for the generated MAX + 1 code.
                if (
                    !isExistingRecord &&
                    originalData &&
                    code === originalData.productCode
                ) {
                    return;
                }

                await handleProductCodeLookup();
                return;
            }

            // Focus moves to another input field. 
            if (
                activeElement &&
                activeElement.matches("input, select, textarea")
            ) {
                if (!code) {
                    productCode.value = lastKeptProductCode;
                }
            }

        }, 0);
    });



    // Reset lookup tracking whenever the code is edited.
    productCode.addEventListener("input", function () {

        lastLookedUpProductCode = "";

    });

    // =========================================
    // 27. Initialize Input Events
    // =========================================

    initializeUnitPrice();

    initializeCapacity();
    initializeSalary();

    initializeNumericFields();
 

    // =========================================
    // F6: Master Search Button
    // =========================================

    // Initially disable F6.
    if (btnMasterSearch) {
        btnMasterSearch.disabled = true;
    }

    // Enable F6 when either master code field receives focus.
    [productCategoryCode, transportCategoryCode].forEach(function (input) {

        if (!input) {
            return;
        }

        input.addEventListener("focus", function () {

            if (btnMasterSearch) {
                btnMasterSearch.disabled = false;
            }

        });

        input.addEventListener("blur", function () {

            // Check the next focused element before disabling F6.
            setTimeout(function () {

                if (
                    btnMasterSearch &&
                    document.activeElement !== productCategoryCode &&
                    document.activeElement !== transportCategoryCode
                ) {
                    btnMasterSearch.disabled = true;
                }

            }, 0);

        });

    });

    // =========================================
    // Open Master Search Popup
    // =========================================

    function openMasterSearchPopup() {

        if (!btnMasterSearch || btnMasterSearch.disabled) {
            return;
        }

        // Open Product Classification Search popup.
        if (document.activeElement === productCategoryCode) {

            console.log("Opening Product Classification Search.");

            document.dispatchEvent(
                new CustomEvent("openProductClassificationSearchPopup", {
                    detail: {
                        source: "productMaster"
                    }
                })
            );

        }

        // Open Transportation Record Search popup.
        else if (document.activeElement === transportCategoryCode) {

            console.log("Opening Transportation Record Search.");

            document.dispatchEvent(
                new CustomEvent("openTransportationRecordSearchPopup", {
                    detail: {
                        source: "productMaster"
                    }
                })
            );

        }
    }

   
    // =========================================
    // F6 Button Click
    // =========================================

    // Prevent focus from moving to the F6 button.
    btnMasterSearch?.addEventListener("mousedown", function (event) {

        event.preventDefault();

    });

    // Open the appropriate popup when F6 button is clicked.
    btnMasterSearch?.addEventListener("click", function () {

        openMasterSearchPopup();

    });


    //// =========================================
    //// F6 Keyboard Shortcut
    //// =========================================

    //document.addEventListener("keydown", function (event) {

    //    if (
    //        event.key === "F6" &&
    //        btnMasterSearch &&
    //        !btnMasterSearch.disabled
    //    ) {

    //        event.preventDefault();

    //        openMasterSearchPopup();

    //    }

    //});


    // =========================================
    // Receive Selected Product Classification
    // =========================================

    let isProductCategorySelectedFromPopup = false;

    // Receive selected classification data.
    document.addEventListener(
        "product-classification-search-selected",
        function (event) {

            const selectedCategory = event.detail;

            if (selectedCategory?.source !== "productMaster") {
                return;
            }

            // Get selected classification code.
            const code = normalizeMasterCode(
                String(selectedCategory.code || "")
            );

            if (!code) {
                return;
            }

            // Set 品名区分コード.
            productCategoryCode.value = code;

            // Set 品名区分名称.
            productCategoryName.value =
                selectedCategory.productCategoryName || "";

            // Update previous valid category values.
            previousProductCategory = {
                code: code,
                name: productCategoryName.value
            };

            // Mark selection completed.
            isProductCategorySelectedFromPopup = true;

        }
    );


    // =========================================
    // Product Classification Popup Close
    // =========================================

    document.addEventListener(
        "product-classification-search-closed",
        function (event) {

            if (event.detail?.source !== "productMaster") {
                return;
            }

            if (isProductCategorySelectedFromPopup) {

                isProductCategorySelectedFromPopup = false;
                transportCategoryCode.focus();

            } else {

                productCategoryCode.focus();
            }
        }
    );


    // =========================================
    // Receive Selected Transportation Record
    // =========================================

    let isTransportRecordSelectedFromPopup = false;

    // Receive selected transportation record data.
    document.addEventListener(
        "transportation-record-search-selected",
        function (event) {

            const selectedRecord = event.detail;

            // Process only Product Master selections.
            if (selectedRecord?.source !== "productMaster") {
                return;
            }

            // Get selected transportation record code.
            const code = normalizeMasterCode(
                String(selectedRecord.code || "")
            );

            if (!code) {
                return;
            }

            // Set 輸送実績区分コード.
            transportCategoryCode.value = code;

            // Set 輸送実績区分名称.
            transportCategoryName.value =
                selectedRecord.transportationRecordName || "";

            // Update previous valid transportation record values.
            previousTransportCategory = {
                code: code,
                name: transportCategoryName.value
            };

            // Mark selection completed.
            isTransportRecordSelectedFromPopup = true;

        }
    );


    // =========================================
    // Transportation Record Popup Close
    // =========================================

    document.addEventListener(
        "transportation-record-search-closed",
        function (event) {

            if (event.detail?.source !== "productMaster") {
                return;
            }

            if (isTransportRecordSelectedFromPopup) {

                isTransportRecordSelectedFromPopup = false;
                unitPrice.focus();

            } else {

                transportCategoryCode.focus();
            }
        }
    );


    console.log("F6 Master Search Events Registered.");

    // =========================================
    // F5: Product Name Search
    // =========================================

    // Use the actual existing F5 button ID.
    const btnProductSearch =
        document.getElementById("btnSearch");

    // Open Product Name Search popup.
    function openProductNameSearch() {

        if (isProcessing) {
            return;
        }

        // Remember the field that had focus before opening the popup.
        productSearchReturnFocus =
            lastFocusedProductField || document.activeElement;

        isProductSelectedFromF5 = false;

        document.dispatchEvent(
            new CustomEvent("openProductNameSearchPopup")
        );
    }

    // F5 button click.
    btnProductSearch?.addEventListener("click", function () {

        openProductNameSearch();

    });

    //// F5 keyboard shortcut.
    //document.addEventListener("keydown", function (event) {

    //    if (event.key !== "F5") {
    //        return;
    //    }

    //    event.preventDefault();

    //    // Avoid opening the search popup repeatedly.
    //    const popup =
    //        document.getElementById("productNameSearchPopup");

    //    if (popup?.classList.contains("is-open")) {
    //        return;
    //    }

    //    openProductNameSearch();

    //});

    // =========================================
    // Receive Selected Product Name F5
    // =========================================

    document.addEventListener(
        "product-name-search-selected",
        async function (event) {

            const selectedProduct = event.detail;

            if (!selectedProduct || !selectedProduct.code) {
                return;
            }

            isProductSelectedFromF5 = true;

            const selectedCode = String(selectedProduct.code).trim();

            // Load the selected Product Master data.
            const success = await loadProductByCode(selectedCode);

            // Restore focus only after the selected data has loaded.
            if (success && productSearchReturnFocus) {

                setTimeout(function () {

                    productSearchReturnFocus.focus();

                }, 0);

            }

        }
    );

    // =========================================
    // F5: Restore Focus When Search Is Cancelled
    // =========================================

    document.addEventListener(
        "product-name-search-closed",
        function () {

            // When a product is selected, do not move focus to 品名コード.
            if (isProductSelectedFromF5) {
                return;
            }

            // When the popup is cancelled, focus 品名コード.
            setTimeout(function () {

                productCode.focus();
                productCode.select();

                productSearchReturnFocus = null;

            }, 0);

        }
    );

    // =========================================
    // Disable F1-F12 Keyboard Actions
    // All function keys are button-only.
    // =========================================

    document.addEventListener("keydown", function (event) {

        if (/^F([1-9]|1[0-2])$/.test(event.key)) {

            // Prevent keyboard shortcuts and browser default actions.
            event.preventDefault();

        }

    });

    // =========================================
    // 28. Initial Screen Setup
    // =========================================

    switchTab("basicSetting");

    setButtonState();  

    await initializeNewProduct();

    console.log("PRODUCT MASTER JS INITIALIZATION COMPLETE");

    // Check whether Product Master is running inside a modal.
    const urlParams = new URLSearchParams(window.location.search);
    const isPopupMode = urlParams.get("popupMode") === "true";

    // =========================================
    // F12: Exit Product Master
    // =========================================

    function exitProductMaster() {

        // Check whether any data has changed.
        // Use the legacy F12 confirmation message.
        if (
            hasDataChanged() &&
            !confirm("変更されていますが、よろしいですか ?")
        ) {
            return;
        }

        // Popup Mode: Close the parent modal.
        if (isPopupMode) {

            window.parent.postMessage(
                { action: "closeProductMasterModal" },
                window.location.origin
            );

        } else {

            // Normal Mode: Navigate to Main Menu.
            window.location.href =
                btnExit?.dataset.exitUrl || "/MainMenu/Main_menu";
        }
    } 

    btnExit?.addEventListener("click", exitProductMaster);

    // Disable F5, F9 and F10 in popup mode.
    // Disable F5, F9 and F10 in popup mode.
    if (isPopupMode) {

        const btnF5 = document.getElementById("btnSearch");
        const btnF9 = document.getElementById("btnList");
        const btnF10 = document.querySelector(
            ".function-footer button:nth-child(10)"
        );

        if (btnF5) {
            btnF5.disabled = true;
            btnF5.textContent = "F5:　　";
        }

        if (btnF9) {
            btnF9.disabled = true;
            btnF9.textContent = "F9:　　";
        }

        if (btnF10) {
            btnF10.disabled = true;
            btnF10.textContent = "F10:　　";
        }
    }

    // Message Handling: Display Input Range Guidance
        const messageText = document.getElementById("message-label");

        // Display a message when an input receives focus and clear it on blur
        function setInputMessage(inputIds, message) {
            if (!messageText) return;

            if (!Array.isArray(inputIds)) {
                inputIds = [inputIds];
            }

            inputIds.forEach(function (inputId) {
                const input = document.getElementById(inputId);

                if (!input) return;

                input.addEventListener("focus", function () {
                    messageText.textContent = message;
                });

                input.addEventListener("blur", function () {
                    messageText.textContent = "";
                });
            });
        } 
    // =========================================
    // Input Range Messages
    // =========================================

    setInputMessage(
        "unitweight",
        "入力可能範囲[ 0.00～999,999.99 ]"
    );

    setInputMessage(
        "capacity",
        "入力可能範囲[ 0～9,999,999 ]"
    );

    setInputMessage(
        "salary",
        "入力可能範囲[ 0.00～100.00 ]"
    );
    //initializeOptionalTabs();
});