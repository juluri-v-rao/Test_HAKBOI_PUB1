let currentRow = 1;

function updateRowDisplay() {
    document.getElementById("routeRowNumber").textContent = currentRow;
}

document.addEventListener("DOMContentLoaded", () => {

    const btnUp = document.querySelector(".scroll-up");
    const btnDown = document.querySelector(".scroll-down");

    btnDown.addEventListener("click", () => {
        currentRow++;
        updateRowDisplay();
    });

    btnUp.addEventListener("click", () => {
        if (currentRow > 1) {
            currentRow--;
            updateRowDisplay();
        }
    });

});

//When connection to sql is to be done
// currentRow++;

// loadRouteRow(currentRow);

// function loadRouteRow(rowNo) {

//     // get data from SQL

//     document.getElementById("routeRowNumber").textContent = rowNo;

//     // fill controls
// }