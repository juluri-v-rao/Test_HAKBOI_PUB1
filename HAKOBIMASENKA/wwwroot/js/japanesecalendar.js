// JAPANESE CALENDAR - COMMON JS Supports: 1. 初年度 2. 登録年月日 3. 車検日 初年度: 令和 08年10月 登録年月日: 令和 08年10月07日 車検日: 令和 08年10月07日 Holiday: /Holiday.xml

// 1. COMMON HOLIDAY DATA
let japaneseCalendarHolidays = {};

//
let activeInput = null;

// DATE KEY
function getDateKey(year, month, day) {
    return year + "-" + String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
}

// ADD HOLIDAY
function addJapaneseHoliday(date, name) {
    const key = getDateKey(date.getFullYear(), date.getMonth(), date.getDate());
    japaneseCalendarHolidays[key] = { name: name || "" };
}

// MONTH NAMES
const japaneseCalendarMonthNames = [
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
];

// XML MONTH
const japaneseCalendarMonthMap = {
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
};

// XML WEEKDAY
const japaneseCalendarWeekdayMap = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
};

// XML OCCURRENCE
const japaneseCalendarOrdinalMap = {
    First: 1, Second: 2, Third: 3, Fourth: 4, Fifth: 5
};

// LOAD HOLIDAY.XML
async function loadJapaneseHolidayXml() {
    try {
        const response = await fetch("/Holiday.xml", { cache: "no-cache" });
        if (!response.ok) {
            throw new Error("Holiday.xml could not be loaded. HTTP Status: " + response.status);
        }
        // Holiday.xml is UTF-16
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let encoding = "utf-16le";
        // UTF-16 Big Endian BOM
        if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
            encoding = "utf-16be";
        }
        // UTF-16 Little Endian BOM
        if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
            encoding = "utf-16le";
        }
        const decoder = new TextDecoder(encoding);
        const xmlText = decoder.decode(buffer);
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "application/xml");
        const parserError = xml.getElementsByTagName("parsererror");
        if (parserError.length > 0) {
            throw new Error("Holiday.xml parsing failed.");
        }
        japaneseCalendarHolidays = {};

        // FIXED HOLIDAYS
        const holidayNodes = xml.getElementsByTagName("Holiday");
        for (let i = 0; i < holidayNodes.length; i++) {
            const node = holidayNodes[i];
            const name = node.getAttribute("Name") || "";
            const startDateText = node.getAttribute("StartDate");
            if (!startDateText) {
                continue;
            }
            const startDate = new Date(startDateText);
            if (isNaN(startDate.getTime())) {
                continue;
            }
            const month = startDate.getMonth();
            const day = startDate.getDate();
            const startYear = startDate.getFullYear();
            // Repeat annual holidays
            for (let year = startYear; year <= 2099; year++) {
                addJapaneseHoliday(new Date(year, month, day), name);
            }
        }

        // DAY OF WEEK HOLIDAYS
        const dayOfWeekNodes = xml.getElementsByTagName("DayOfWeekHoliday");
        for (let i = 0; i < dayOfWeekNodes.length; i++) {
            const node = dayOfWeekNodes[i];
            const name = node.getAttribute("Name") || "";
            const monthName = node.getAttribute("Month");
            const dayOfWeekName = node.getAttribute("DayOfWeek");
            const occurrenceName = node.getAttribute("DayOfWeekInMonth");
            if (!monthName || !dayOfWeekName || !occurrenceName) {
                continue;
            }
            const month = japaneseCalendarMonthMap[monthName];
            const targetDay = japaneseCalendarWeekdayMap[dayOfWeekName];
            const occurrence = japaneseCalendarOrdinalMap[occurrenceName];
            if (month === undefined || targetDay === undefined || occurrence === undefined) {
                continue;
            }
            for (let year = 2004; year <= 2099; year++) {
                const firstDate = new Date(year, month, 1);
                const firstDay = firstDate.getDay();
                let day = 1 + ((targetDay - firstDay + 7) % 7);
                day += (occurrence - 1) * 7;
                const lastDay = new Date(year, month + 1, 0).getDate();
                if (day <= lastDay) {
                    addJapaneseHoliday(new Date(year, month, day), name);
                }
            }
        }

        // FORCE HOLIDAYS
        const forceHolidayNodes = xml.getElementsByTagName("ForceHoliday");
        for (let i = 0; i < forceHolidayNodes.length; i++) {
            const node = forceHolidayNodes[i];
            const name = node.getAttribute("Name") || "";
            const startDateText = node.getAttribute("StartDate");
            if (!startDateText) {
                continue;
            }
            const date = new Date(startDateText);
            if (isNaN(date.getTime())) {
                continue;
            }
            addJapaneseHoliday(date, name);
        }

        // SUBSTITUTE HOLIDAY Sunday → Next Day
        const sundayNodes = xml.getElementsByTagName("Sunday");
        let sundayOverride = null;
        if (sundayNodes.length > 0) {
            sundayOverride = sundayNodes[0].getAttribute("Override");
        }
        if (sundayOverride === "NextDay") {
            const existingDates = Object.keys(japaneseCalendarHolidays);
            existingDates.forEach(function (key) {
                const parts = key.split("-");
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const date = new Date(year, month, day);
                if (date.getDay() === 0) {
                    const nextDate = new Date(date);
                    nextDate.setDate(nextDate.getDate() + 1);
                    const nextKey = getDateKey(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
                    if (!japaneseCalendarHolidays[nextKey]) {
                        japaneseCalendarHolidays[nextKey] = { name: "振替休日" };
                    }
                }
            });
        }
        console.log("Holiday.xml loaded successfully.");
        console.log("2026-10-12 =", japaneseCalendarHolidays["2026-10-12"]);
        console.log("Total holidays =", Object.keys(japaneseCalendarHolidays).length);
    } catch (error) {
        console.error("Holiday XML Error:", error);
        japaneseCalendarHolidays = {};
    }
}

// 2. JAPANESE ERA
function getJapaneseEra(year, month) {
    // 令和
    if (year > 2019 || (year === 2019 && month >= 5)) {
        return { name: "令和", year: year - 2018 };
    }
    // 平成
    if (year > 1989 || (year === 1989 && month >= 1)) {
        return { name: "平成", year: year - 1988 };
    }
    // 昭和
    if (year > 1926 || (year === 1926 && month >= 12)) {
        return { name: "昭和", year: year - 1925 };
    }
    // 大正
    if (year > 1912 || (year === 1912 && month >= 7)) {
        return { name: "大正", year: year - 1911 };
    }
    // 明治
    if (year >= 1868) {
        return { name: "明治", year: year - 1867 };
    }
    return null;
}

// DISPLAY VALUE
function updateJapaneseCalendarDisplay(year, month, day, inputElement) {
    if (!inputElement) return;
    let displayValue = "";
    if (inputElement.dataset.noEra === "true") {
        displayValue = year + "年" + String(month).padStart(2, "0") + "月";
    } else {
        const era = getJapaneseEra(year, month);
        if (era) {
            displayValue = era.name + " " + String(era.year).padStart(2, "0") + "年" + String(month).padStart(2, "0") + "月";
        } else {
            displayValue = year + "年" + String(month).padStart(2, "0") + "月";
        }
    }
    if (inputElement.dataset.showDay === "true" && day !== null && day !== undefined) {
        displayValue += String(day).padStart(2, "0") + "日";
    }
    inputElement.value = displayValue;
}

// CLOSE ALL JAPANESE CALENDARS
function closeAllJapaneseCalendars() {
    document.querySelectorAll(".japanese-calendar").forEach(function (calendar) {
        calendar.style.display = "none";
    });
}

// 4. CALENDAR INITIALIZATION
document.addEventListener("DOMContentLoaded", async function () {
    await loadJapaneseHolidayXml();
    const calendarElements = document.querySelectorAll(".japanese-calendar");
    if (!calendarElements || calendarElements.length === 0) {
        return;
    }
    calendarElements.forEach(function (calendar) {
        initializeJapaneseCalendar(calendar);
    });
});

// 5. INITIALIZE ONE CALENDAR
function initializeJapaneseCalendar(calendar) {

    function getCurrentInput() {
        return activeInput;
    }

    const calendarTitle = calendar.querySelector(".calendar-title");
    const calendarDays = calendar.querySelector(".calendar-days");
    const calendarPrev = calendar.querySelector(".calendar-prev");
    const calendarNext = calendar.querySelector(".calendar-next");

    if (!calendarTitle ||
        !calendarDays ||
        !calendarPrev ||
        !calendarNext) {
        return;
    }

    // VARIABLES
    let currentYear;
    let currentMonth;

    // RENDER CALENDAR
    function renderCalendar() {

        calendarDays.innerHTML = "";

        // TITLE
        // legacy GcDate drop-down header: 2026年9月
        calendarTitle.textContent = currentYear + "年" + (currentMonth + 1) + "月";

        // FIRST DAY
        const firstDate = new Date(currentYear, currentMonth, 1);

        const firstDay = firstDate.getDay();

        // DAYS IN CURRENT MONTH
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // DAYS IN PREVIOUS MONTH
        const daysInPreviousMonth = new Date(currentYear, currentMonth, 0).getDate();

        // SELECTED DATE
        // const currentInput = getCurrentInput();
        const currentInput = activeInput;

        const selectedValue = currentInput?.dataset.actualValue || "";

        // 42 CELLS
        for (let index = 0; index < 42; index++) {
            let displayDay;
            let cellYear = currentYear;
            let cellMonth = currentMonth;
            let isOtherMonth = false;
            // PREVIOUS MONTH
            if (index < firstDay) {
                displayDay = daysInPreviousMonth - firstDay + index + 1;
                cellMonth = currentMonth - 1;
                if (cellMonth < 0) {
                    cellMonth = 11;
                    cellYear--;
                }
                isOtherMonth = true;
            }
            // CURRENT MONTH
            else if (index < firstDay + daysInMonth) {
                displayDay = index - firstDay + 1;
            }
            // NEXT MONTH
            else {
                displayDay = index - (firstDay + daysInMonth) + 1;
                cellMonth = currentMonth + 1;
                if (cellMonth > 11) {
                    cellMonth = 0;
                    cellYear++;
                }
                isOtherMonth = true;
            }
            // CREATE CELL
            const cell = document.createElement("div");
            cell.className = "calendar-day";
            // CREATE DATE
            const date = new Date(cellYear, cellMonth, displayDay);
            const dayOfWeek = date.getDay();
            // WEEKEND
            if (dayOfWeek === 0) {
                cell.classList.add("sunday");
            }
            if (dayOfWeek === 6) {
                cell.classList.add("saturday");
            }
            // OTHER MONTH
            if (isOtherMonth) {
                cell.classList.add("other-month");
            }
            // DATE KEY
            const dateKey = getDateKey(cellYear, cellMonth, displayDay);
            // HOLIDAY
            const holiday = japaneseCalendarHolidays[dateKey];
            if (holiday && !isOtherMonth) {
                cell.classList.add("holiday");
                cell.title = holiday.name || "";
            }
            // SELECTED DATE
            if (selectedValue && selectedValue === dateKey) {
                cell.classList.add("selected");
            }
            // DAY NUMBER
            cell.textContent = displayDay;
            // DATE CLICK
            cell.addEventListener("click", function (event) {
                event.stopPropagation();
                // SELECTED DATE
                const selectedDate = new Date(cellYear, cellMonth, displayDay);
                const selectedYear = selectedDate.getFullYear();
                const selectedMonth = selectedDate.getMonth();
                const selectedDay = selectedDate.getDate();

                // DISPLAY
                // updateJapaneseCalendarDisplay(selectedYear, selectedMonth + 1, selectedDay, inputElement);
                if (activeInput) {

                    activeInput.dataset.actualValue =
                        getDateKey(selectedYear, selectedMonth, selectedDay);

                    updateJapaneseCalendarDisplay(
                        selectedYear,
                        selectedMonth + 1,
                        selectedDay,
                        activeInput
                    );
                }

                // Validate Date Range - Vehicle Master Tab 4 Search
                  if (activeInput && activeInput.id === "endDate" && typeof window.validateDateRange === "function") {
                    window.validateDateRange();
                }
                 
                // MOVE TO SELECTED MONTH
                currentYear = selectedYear;
                currentMonth = selectedMonth;
                // RENDER AGAIN
                renderCalendar();
                // CLOSE
                calendar.style.display = "none";
            });
            calendarDays.appendChild(cell);
        }
    }

    // OPEN CALENDAR
    function openCalendar() {

        const currentInput = activeInput;

        const selectedValue = currentInput?.dataset.actualValue || "";

        if (selectedValue) {
            const parts = selectedValue.split("-");
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            if (!isNaN(year) && !isNaN(month)) {
                currentYear = year;
                currentMonth = month - 1;
            }
        } else {
            const today = new Date();
            currentYear = today.getFullYear();
            currentMonth = today.getMonth();
        }
        renderCalendar();
        calendar.style.display = "block";
    }

    // CLOSE CALENDAR
    function closeCalendar() {
        calendar.style.display = "none";
    }

    // PREVIOUS MONTH
    calendarPrev.addEventListener("click", function (event) {
        event.stopPropagation();
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    // NEXT MONTH
    calendarNext.addEventListener("click", function (event) {
        event.stopPropagation();
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    // MOUSE WHEEL
    calendar.addEventListener("wheel", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.deltaY > 0) {
            // Wheel Down → Next Month
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
        } else if (event.deltaY < 0) {
            // Wheel Up → Previous Month
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
        }
        renderCalendar();
    }, { passive: false });

    // CALENDAR CLICK
    calendar.addEventListener("click", function (event) {
        event.stopPropagation();
    });

    document.addEventListener("click", function (event) {

    if (activeInput && !activeInput.contains(event.target) && !calendar.contains(event.target)) {
            calendar.style.display = "none";
        }

    });

    // ESCAPE KEY
    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {
            calendar.style.display = "none";
        }
        if (event.key === "Delete") {

            const activeElement = document.activeElement;

            // activeElement.classList.contains("first-year-display")
            if (activeElement && activeElement.classList.contains("jp-calendar-input")) {

                if (activeElement && activeElement.classList.contains("jp-calendar-input")) {

                    activeElement.value = "";

                    delete activeElement.dataset.actualValue;
                }

            }
        }
    });

    // new click handler
    document.querySelectorAll(".jp-calendar-input")
    .forEach(input => {

        input.addEventListener("keydown", function (event) {

            if(event.key !==" ")
            return;

            event.stopPropagation();

            activeInput = this;

            closeAllJapaneseCalendars();

                const rect = this.getBoundingClientRect();

                calendar.style.left = (rect.left + window.scrollX) + "px";

                calendar.style.top = (rect.bottom + window.scrollY) + "px";

            openCalendar();

        });

    });
}