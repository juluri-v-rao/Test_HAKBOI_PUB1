// Newly Added Popup Common JS
// start

document.addEventListener("DOMContentLoaded", function () {

	const btnList = document.getElementById("btnList");

	if (btnList) {
		btnList.addEventListener("click", function () {

			const popup = document.getElementById("printPopup");

			if (popup) {
				popup.style.display = "flex";
			}
		});
	}

});