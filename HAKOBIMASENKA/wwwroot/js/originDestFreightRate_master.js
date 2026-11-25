



// ======================================================
//              PAGE INITIALIZATION
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    initializeTabs();

    initializeODFreightRateEvents();
});


function initializeOriginDestinationEvents() {


    // F12 - Exit.
    getField("btnExit")
        ?.addEventListener("click", exitODFreightRate);

}


function exitODFreightRate() {
    const button = getField("btnExit");

    const exitUrl = button?.dataset.exitUrl;

    if (exitUrl) {
        window.location.href = exitUrl;
    }
    else {
        history.back();
    }
}