/**
 * ========================================================
 * Grid columns like the legacy DataGridViewEx
 * ========================================================
 *
 * Legacy grids (HAKOBI.DataGridViewEx: AllowUserToOrderColumns = True, columns resizable,
 * row and header height fixed) let the user:
 *     - drag the right edge of a column header to change the column's width,
 *     - drag a column header onto another header to move the column there.
 * Nothing is remembered: the screen opens with the legacy layout again.
 *
 * Use: add data-grid-columns to the <table> (with a <thead>) and load this file:
 *
 *     <table class="history-table" data-grid-columns> … </table>
 *     <script src="~/js/grid_columns.js" asp-append-version="true"></script>
 *
 * Text that does not fit is cut at the cell's edge on one line, as in legacy (no wrapping, no spill-over).
 * Sorting is separate: a header click still reaches the screen's own sort (e.g. sortGrid, common_master.js).
 *
 * Rows the screen adds or re-renders later follow the moved order by themselves.
 * Style a cell by a class, not by its position (nth-child), as the position changes when a column moves.
 */
const GridColumns = (() => {

    // how close to a header's right edge the pointer has to be to resize (px)
    const EDGE = 5;

    // a column cannot get narrower than this (px)
    const MIN_WIDTH = 24;

    // how far the pointer has to move before a header is being dragged (px)
    const DRAG_START = 5;

    function headerCells(table) {
        return Array.from(table.tHead.rows[0].cells);
    }

    // the order of the columns now, as their original positions
    function columnOrder(table) {
        return headerCells(table).map(th => th.dataset.col);
    }

    // put a body row's cells in the header's order (each cell keeps its original position in data-col)
    function arrangeRow(table, row) {

        Array.from(row.cells).forEach((cell, index) => {
            if (cell.dataset.col === undefined) {
                cell.dataset.col = String(index);
            }
        });

        columnOrder(table).forEach(col => {
            const cell = Array.from(row.cells).find(item => item.dataset.col === col);

            if (cell) {
                row.appendChild(cell);
            }
        });
    }

    function arrangeRows(table) {
        Array.from(table.tBodies).forEach(body => {
            Array.from(body.rows).forEach(row => arrangeRow(table, row));
        });
    }

    // Before the first resize or move, every column keeps the width it has now, in pixels,
    // so a moved column keeps its width and resizing one column does not squeeze the others.
    function fixWidths(table) {

        if (table.dataset.widthsFixed === "1") {
            return true;
        }

        const widths = headerCells(table).map(th => th.getBoundingClientRect().width);

        // not shown yet (e.g. a closed tab)
        if (widths.some(width => width === 0)) {
            return false;
        }

        headerCells(table).forEach((th, index) => {
            th.style.boxSizing = "border-box";
            th.style.width = `${widths[index]}px`;
        });

        table.style.tableLayout = "fixed";
        table.style.minWidth = "0";
        setTableWidth(table);

        table.dataset.widthsFixed = "1";
        return true;
    }

    function setTableWidth(table) {
        const total = headerCells(table).reduce((sum, th) => sum + parseFloat(th.style.width || "0"), 0);

        table.style.width = `${total}px`;
    }

    // a click right after a resize or a move is not a click on the header (e.g. sorting)
    function swallowNextClick(table) {

        const swallow = event => {
            event.stopPropagation();
            event.preventDefault();
        };

        table.addEventListener("click", swallow, { capture: true, once: true });

        // nothing to swallow when no click follows
        setTimeout(() => table.removeEventListener("click", swallow, { capture: true }), 0);
    }

    function isNearRightEdge(th, clientX) {
        return clientX >= th.getBoundingClientRect().right - EDGE;
    }

    function attach(table) {

        if (!table.tHead?.rows.length || table.dataset.gridColumnsReady === "1") {
            return;
        }

        table.dataset.gridColumnsReady = "1";

        headerCells(table).forEach((th, index) => {
            th.dataset.col = String(index);
        });

        // rows rendered later by the screen
        Array.from(table.tBodies).forEach(body => {
            new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeName === "TR") {
                            arrangeRow(table, node);
                        }
                    });
                });
            }).observe(body, { childList: true });
        });

        // the resize pointer near a header's right edge
        table.tHead.addEventListener("mousemove", event => {
            const th = event.target.closest("th");

            if (th && !table.classList.contains("grid-columns-busy")) {
                th.style.cursor = isNearRightEdge(th, event.clientX) ? "col-resize" : "";
            }
        });

        table.tHead.addEventListener("mousedown", event => {

            const th = event.target.closest("th");

            if (!th || event.button !== 0 || !fixWidths(table)) {
                return;
            }

            if (isNearRightEdge(th, event.clientX)) {
                startResize(table, th, event);
            } else {
                startMove(table, th, event);
            }
        });
    }

    // drag a header's right edge: that column gets wider or narrower
    function startResize(table, th, downEvent) {

        const startX = downEvent.clientX;
        const startWidth = parseFloat(th.style.width);

        table.classList.add("grid-columns-busy");
        downEvent.preventDefault();

        const onMove = event => {
            th.style.width = `${Math.max(MIN_WIDTH, startWidth + event.clientX - startX)}px`;
            setTableWidth(table);
        };

        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            table.classList.remove("grid-columns-busy");

            // the click that ends a resize does not sort the column
            swallowNextClick(table);
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }

    // drag a header onto another one: the column moves there
    function startMove(table, th, downEvent) {

        const startX = downEvent.clientX;
        let dragging = false;
        let target = null;

        const markTarget = cell => {
            headerCells(table).forEach(item => item.classList.remove("grid-columns-drop-before", "grid-columns-drop-after"));

            target = cell && cell !== th ? cell : null;

            if (target) {
                const movingRight = headerCells(table).indexOf(target) > headerCells(table).indexOf(th);
                target.classList.add(movingRight ? "grid-columns-drop-after" : "grid-columns-drop-before");
            }
        };

        const onMove = event => {

            if (!dragging) {
                if (Math.abs(event.clientX - startX) < DRAG_START) {
                    return;
                }

                dragging = true;
                table.classList.add("grid-columns-busy");
                th.classList.add("grid-columns-moving");
            }

            const under = document.elementFromPoint(event.clientX, event.clientY)?.closest("th");

            markTarget(under && under.parentElement === th.parentElement ? under : null);
        };

        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);

            if (!dragging) {
                // a plain click: left to the screen (e.g. sorting)
                return;
            }

            swallowNextClick(table);
            table.classList.remove("grid-columns-busy");
            th.classList.remove("grid-columns-moving");

            if (target) {
                const movingRight = headerCells(table).indexOf(target) > headerCells(table).indexOf(th);

                target.parentElement.insertBefore(th, movingRight ? target.nextSibling : target);
                arrangeRows(table);
            }

            markTarget(null);
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }

    // the look while resizing / moving (kept here so a screen only adds data-grid-columns)
    function addStyles() {

        const style = document.createElement("style");

        style.textContent = `
            table[data-grid-columns] th,
            table[data-grid-columns] td { overflow: hidden; white-space: nowrap; text-overflow: clip; }
            table[data-grid-columns] thead th { user-select: none; }
            table.grid-columns-busy { cursor: default; }
            table[data-grid-columns] th.grid-columns-moving { opacity: 0.5; }
            table[data-grid-columns] th.grid-columns-drop-before { box-shadow: inset 3px 0 0 #0078d7; }
            table[data-grid-columns] th.grid-columns-drop-after { box-shadow: inset -3px 0 0 #0078d7; }
        `;

        document.head.appendChild(style);
    }

    document.addEventListener("DOMContentLoaded", () => {
        addStyles();
        document.querySelectorAll("table[data-grid-columns]" ).forEach(attach);
    });

    return { attach };
})();
