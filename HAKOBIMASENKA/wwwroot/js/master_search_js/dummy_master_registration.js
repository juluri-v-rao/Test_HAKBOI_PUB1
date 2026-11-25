
document.addEventListener("DOMContentLoaded", function () {

    const dummyMasterModal =
        document.getElementById("dummyMasterModal");

    const btnCloseDummyMaster =
        document.getElementById("btnCloseDummyMaster");

    // Close the dummy screen.
    btnCloseDummyMaster?.addEventListener("click", function () {

        if (dummyMasterModal) {
            dummyMasterModal.style.display = "none";
        }

    });

    // Receive the request to open the dummy registration screen.
    window.addEventListener("message", function (event) {

        if (event.origin !== window.location.origin) {
            return;
        }

        if (event.data?.action === "openDummyMasterRegistration") {

            if (!dummyMasterModal) {
                return;
            }

            // Move the modal directly under body.
            document.body.appendChild(dummyMasterModal);

            // Display it above the search popup.
            dummyMasterModal.style.position = "fixed";
            dummyMasterModal.style.inset = "0";
            dummyMasterModal.style.zIndex = "2147483647";
            dummyMasterModal.style.display = "flex";

        }

    });

});
