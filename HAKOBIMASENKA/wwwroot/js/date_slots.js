/**
 * ========================================================
 * Date boxes typed slot by slot (legacy GrapeCity GcDate)
 * ========================================================
 *
 * The box always has the shape of its format. Each key fills the next slot and jumps over the fixed characters;
 * a key that does not fit the slot is ignored. Backspace clears the slot before the cursor, Delete the one at it.
 * Space is left to the calendar (japanesecalendar.js opens it on a .jp-calendar-input).
 *
 * Formats (legacy Format strings):
 *     "gee/MM/dd"          R08/11/16           受注入力 積日 / 卸日 (和暦)
 *     "yy/MM/dd"           26/11/16            受注入力 積日 / 卸日 (西暦; 00-49 → 20xx, 50-99 → 19xx)
 *     "yyyy年MM月dd日"      2026年11月16日       西暦
 *     "ggg ee年MM月dd日"    令和 08年11月16日    和暦
 *     "yyyy年MM月度"        2026年11月度         月度 (no day: the 1st)
 *     "ggg ee年MM月度"      令和 08年11月度
 *
 * The era slot takes a letter M T S H R or the digit of the legacy hint
 *     明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]
 *
 * Use:
 *     DateSlots.attach(input, "ggg ee年MM月dd日");   once per box
 *     DateSlots.show(input, "2026-11-16");           put a date in the box ("" or null: empty)
 *     DateSlots.read(input)                          → { empty, date }  date "yyyy-MM-dd", or null when
 *                                                      part-filled or not a real date (e.g. R01/01/01 is H31)
 *     DateSlots.setFormat(input, "yyyy年MM月dd日")   和暦 / 西暦 switch, keeps the date
 *     DateSlots.isEra()                              管理マスタ 01 和西暦 = 1 (legacy DINPUT_Chk), set on <body> by _Layout
 *     DateSlots.ERA_HINT                             the legacy DINPUT_Mess shown on focus when isEra()
 *
 * Range checks, the change flag and what happens when the box is left stay with each screen.
 */
const DateSlots = (() => {

    // newest first; first day of each era as .NET JapaneseCalendar (legacy GcDate)
    const ERAS = [
        { name: "令和", letter: "R", key: "4", start: "2019-05-01", base: 2018 },
        { name: "平成", letter: "H", key: "3", start: "1989-01-08", base: 1988 },
        { name: "昭和", letter: "S", key: "2", start: "1926-12-25", base: 1925 },
        { name: "大正", letter: "T", key: "1", start: "1912-07-30", base: 1911 },
        { name: "明治", letter: "M", key: "0", start: "1868-01-01", base: 1867 }
    ];

    // legacy DINPUT_Mess (FrmMain): the message shown in a date box when 和暦 input is on
    const ERA_HINT = "明治=[0､M] 大正=[1､T] 昭和=[2､S] 平成=[3､H] 令和=[4､R]";

    // legacy DINPUT_Chk = 管理マスタ 01 和西暦 (0: 西暦, 1: 和暦), written on <body data-date-era> by _Layout.cshtml
    function isEra() {
        return document.body?.dataset.dateEra === "1";
    }

    // a two-digit year (yy) as the legacy GcDate reads it with the Windows default range 1950-2049
    function fullYear(yy) {
        return yy <= 49 ? 2000 + yy : 1900 + yy;
    }

    // a letter, the hint digit, or the era name → the era
    function eraOf(text) {
        const value = String(text ?? "").toUpperCase();
        return ERAS.find(era => era.letter === value || era.key === value || era.name === value) ?? null;
    }

    // =========================================
    //              Format → slots
    // =========================================

    // the parts of a format: era / digit run / fixed text, each with its position in the box
    function partsOf(format) {

        const parts = [];
        let i = 0;

        const take = (token, part) => {
            if (format.startsWith(token, i)) {
                parts.push(part);
                i += token.length;
                return true;
            }
            return false;
        };

        while (i < format.length) {
            take("ggg", { type: "era", length: 2 }) ||          // 令和
            take("g", { type: "era", length: 1 }) ||            // R
            take("yyyy", { type: "digit", unit: "y", length: 4 }) ||
            take("yy", { type: "digit", unit: "Y", length: 2 }) ||
            take("ee", { type: "digit", unit: "e", length: 2 }) ||
            take("MM", { type: "digit", unit: "M", length: 2 }) ||
            take("dd", { type: "digit", unit: "d", length: 2 }) ||
            (parts.push({ type: "text", text: format[i], length: 1 }), i++);
        }

        let at = 0;

        for (const part of parts) {
            part.at = at;
            at += part.length;
        }

        return parts;
    }

    // the places a key can go: the era (one slot, 1 or 2 characters wide) and each digit
    function slotsOf(format) {

        const slots = [];

        for (const part of partsOf(format)) {
            if (part.type === "era") {
                slots.push({ at: part.at, length: part.length, era: true });
            } else if (part.type === "digit") {
                for (let n = 0; n < part.length; n++) {
                    slots.push({ at: part.at + n, length: 1, era: false });
                }
            }
        }

        return slots;
    }

    // the empty box: ___/__/__ , ____年__月__日 , __ __年__月__日
    function mask(format) {
        return partsOf(format).map(part => part.type === "text" ? part.text : "_".repeat(part.length)).join("");
    }

    function hasDay(format) {
        return format.includes("dd");
    }

    // true when the text has the shape of the format (slots filled or "_")
    function inShape(text, format) {

        if (typeof text !== "string" || text.length !== mask(format).length) {
            return false;
        }

        return partsOf(format).every(part => {

            const piece = text.substr(part.at, part.length);

            if (part.type === "text") {
                return piece === part.text;
            }

            if (part.type === "digit") {
                return /^[\d_]+$/.test(piece);
            }

            return piece === "_".repeat(part.length) ||
                ERAS.some(era => (part.length === 2 ? era.name : era.letter) === piece);
        });
    }

    // =========================================
    //              Date ↔ text
    // =========================================

    // "yyyy-MM-dd" (a time after it is ignored) → the box text; "" when there is no date
    function format(date, fmt) {

        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(date ?? ""));

        if (!match) {
            return "";
        }

        const iso = `${match[1]}-${match[2]}-${match[3]}`;
        const era = ERAS.find(item => iso >= item.start) ?? null;
        const parts = partsOf(fmt);

        if (!era && parts.some(part => part.type === "era")) {
            return "";
        }

        return parts.map(part => {
            switch (part.type) {
                case "era":
                    return part.length === 2 ? era.name : era.letter;
                case "text":
                    return part.text;
            }
            switch (part.unit) {
                case "y": return match[1];
                case "Y": return match[1].substring(2);
                case "e": return String(Number(match[1]) - era.base).padStart(2, "0");
                case "M": return match[2];
                case "d": return match[3];
            }
            return "";
        }).join("");
    }

    function validDate(year, month, day) {

        const date = new Date(year, month - 1, day);

        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
            return null;
        }

        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    // A date typed or pasted in any common way → "yyyy-MM-dd", or null.
    //   2026年11月16日 / 20261116 / 2026-11-16 / 2026/11/16 / 26/11/16 / 令和 08年11月16日 / R08/11/16 / R081116 / 4081116
    //   (without the day: 2026年11月 / 202611 / R0811 / 40811 → the 1st)
    // Full-width input is read as half-width (legacy date boxes take no IME input).
    function parseLoose(text, monthOnly) {

        text = String(text ?? "").normalize("NFKC").trim().replace(/度$/, "");

        let year, month, day, match;

        // the day is optional only for a month box
        const dayOf = typed => typed === undefined ? (monthOnly ? 1 : undefined) : Number(typed);

        // era typed straight into the slots: R081116 / 4081116 (month: R0811 / 40811)
        const compactEra = monthOnly
            ? /^([MTSHR]|[0-4])(\d{2})(\d{2})$/i
            : /^([MTSHR]|[0-4])(\d{2})(\d{2})(\d{2})$/i;

        if ((match = text.match(compactEra))) {

            if (Number(match[2]) < 1) return null;

            [year, month, day] = [eraOf(match[1]).base + Number(match[2]), Number(match[3]), dayOf(match[4])];

        } else if ((match = text.match(/^(\d{4})[-/年]?(\d{1,2})(?:[-/月]?(\d{1,2})日?)?月?$/)) && (text.length > 6 || monthOnly)) {

            [year, month, day] = [Number(match[1]), Number(match[2]), dayOf(match[3])];

        } else if ((match = text.match(/^(\d{2})[/.-](\d{1,2})[/.-](\d{1,2})$/))) {

            // 26/11/16 (受注入力 rows in 西暦)
            [year, month, day] = [fullYear(Number(match[1])), Number(match[2]), Number(match[3])];

        } else if ((match = text.match(/^(令和|平成|昭和|大正|明治|[RHSTM])\s*(\d{1,2})\s*[年/.-]\s*(\d{1,2})\s*月?(?:\s*[/.-]?\s*(\d{1,2})\s*日?)?$/i))) {

            if (Number(match[2]) < 1) return null;

            [year, month, day] = [eraOf(match[1]).base + Number(match[2]), Number(match[3]), dayOf(match[4])];

        } else {
            return null;
        }

        if (day === undefined) {
            return null;
        }

        return validDate(year, month, day);
    }

    // =========================================
    //              The box
    // =========================================

    function formatOf(input) {
        return input.dataset.dateFormat;
    }

    // { empty, date }: empty box; or the date in it ("yyyy-MM-dd"), null when part-filled or not a real date
    function read(input) {

        const fmt = formatOf(input);
        const text = input.value;

        if (text === "" || text === mask(fmt)) {
            return { empty: true, date: null };
        }

        // set another way (e.g. a whole date typed by IME): read it loosely
        if (!inShape(text, fmt)) {
            return { empty: false, date: parseLoose(text, !hasDay(fmt)) };
        }

        if (text.includes("_")) {
            return { empty: false, date: null };
        }

        const values = { d: 1 };
        let era = null;

        for (const part of partsOf(fmt)) {
            const piece = text.substr(part.at, part.length);

            if (part.type === "era") {
                era = eraOf(piece);
            } else if (part.type === "digit") {
                values[part.unit] = Number(piece);
            }
        }

        const year = values.y ?? (values.Y !== undefined ? fullYear(values.Y)
            : era && values.e >= 1 ? era.base + values.e : NaN);
        const date = validDate(year, values.M, values.d);

        // the era has to be the one of the date (R01/01/01 is H31/01/01)
        return { empty: false, date: date && format(date, fmt) === text ? date : null };
    }

    // put a date in the box ("" / null: empty)
    function show(input, date) {
        input.value = format(date, formatOf(input));
        input.dataset.shownText = input.value;
    }

    // a key typed in: fills the slot at the cursor, then the cursor goes to the next slot
    function typeKey(input, key) {

        const fmt = formatOf(input);
        const text = inShape(input.value, fmt) ? input.value : mask(fmt);
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? start;
        const slots = slotsOf(fmt);
        const slot = slots.find(item => item.at + item.length > start);

        if (!slot) {
            return;
        }

        let fill = null;

        if (slot.era) {
            const era = eraOf(key);
            fill = era ? (slot.length === 2 ? era.name : era.letter) : null;
        } else if (/^\d$/.test(key)) {
            fill = key;
        }

        // any other key is ignored, as legacy does
        if (!fill) {
            return;
        }

        const chars = cleared(text, fmt, start, end).split("");

        chars.splice(slot.at, slot.length, ...fill.split(""));
        input.value = chars.join("");

        const next = slots.find(item => item.at > slot.at)?.at ?? input.value.length;

        input.setSelectionRange(next, next);
        input.dataset.shownText = input.value;
    }

    // Backspace: the slot before the cursor; Delete: the slot at the cursor; with a selection: the selected slots
    function clearKey(input, isBackspace) {

        const fmt = formatOf(input);
        const text = inShape(input.value, fmt) ? input.value : mask(fmt);
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? start;
        const slots = slotsOf(fmt);

        if (end > start) {
            input.value = cleared(text, fmt, start, end);
            input.setSelectionRange(start, start);
            input.dataset.shownText = input.value;
            return;
        }

        const slot = isBackspace
            ? slots.filter(item => item.at < start).pop()
            : slots.find(item => item.at + item.length > start);

        if (!slot) {
            return;
        }

        input.value = cleared(text, fmt, slot.at, slot.at + 1);

        const caret = isBackspace ? slot.at : start;

        input.setSelectionRange(caret, caret);
        input.dataset.shownText = input.value;
    }

    // the text with every slot touching start..end put back to "_"
    function cleared(text, fmt, start, end) {

        const chars = text.split("");

        slotsOf(fmt)
            .filter(slot => slot.at < end && slot.at + slot.length > start)
            .forEach(slot => chars.splice(slot.at, slot.length, ..."_".repeat(slot.length).split("")));

        return chars.join("");
    }

    function setFormat(input, fmt) {

        const date = input.dataset.dateFormat ? read(input).date : null;

        input.dataset.dateFormat = fmt;
        input.placeholder = mask(fmt);
        input.maxLength = mask(fmt).length;

        show(input, date);
    }

    function attach(input, fmt) {

        if (!input) {
            return;
        }

        input.autocomplete = "off";
        setFormat(input, fmt);

        // an empty box shows the slots while it has focus; the whole box is selected
        input.addEventListener("focus", () => {
            if (input.value === "") {
                input.value = mask(formatOf(input));
            }
            input.dataset.shownText = input.value;
            input.setSelectionRange(0, input.value.length);
        });

        input.addEventListener("blur", () => {
            if (input.value === mask(formatOf(input))) {
                input.value = "";
            }
        });

        input.addEventListener("keydown", event => {

            if (input.readOnly || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) {
                return;
            }

            if (event.key === "Backspace" || event.key === "Delete") {
                event.preventDefault();

                // japanesecalendar.js empties a whole .jp-calendar-input on Delete: here Delete clears one slot
                event.stopPropagation();

                clearKey(input, event.key === "Backspace");
                return;
            }

            // Enter, Tab, arrows and function keys keep working
            if (event.key.length !== 1) {
                return;
            }

            // Space opens the calendar (its own handler); it is not typed
            event.preventDefault();

            if (event.key !== " ") {
                typeKey(input, event.key);
            }
        });

        // a pasted date is taken whole when it is a date
        input.addEventListener("paste", event => {

            if (input.readOnly) {
                return;
            }

            event.preventDefault();

            const date = parseLoose(event.clipboardData?.getData("text"), !hasDay(formatOf(input)));

            if (date) {
                show(input, date);
            }
        });

        // anything else that changes the text (IME, drag and drop, autofill): keep the shape
        input.addEventListener("input", () => {

            const fmt = formatOf(input);

            if (input.value === "" || inShape(input.value, fmt)) {
                return;
            }

            const date = parseLoose(input.value, !hasDay(fmt));

            input.value = date ? format(date, fmt) : (input.dataset.shownText ?? "");
            input.dataset.shownText = input.value;
        });
    }

    return { attach, show, read, setFormat, format, parseLoose, mask, inShape, isEra, ERA_HINT };
})();
