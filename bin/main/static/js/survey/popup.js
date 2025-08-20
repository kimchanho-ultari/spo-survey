// 팝업
function showPopup({ title, message, optionsHTML = "", onConfirm, onCancel }) {
	const $popup = $("#common-popup");

	$popup.html(`
	  <div class="popup-content">
		<div class="popup-title">${title}</div>
		<div class="popup-message">${message}</div>
		<div class="popup-options">${optionsHTML}</div>
		<div class="popup-buttons">
		  <button class="popup-cancel">취소</button>
		  <span class="line-span">|</span>
		  <button class="popup-confirm">확인</button>
		</div>
	  </div>
	`).removeClass("hidden");

	$popup.find(".popup-cancel").on("click", () => {
		if (onCancel) onCancel();
		$popup.addClass("hidden").empty();
	});

	$popup.find(".popup-confirm").on("click", () => {
		if (onConfirm) onConfirm();
		$popup.addClass("hidden").empty();
	});
}

// alert
function showAlert({ message, onConfirm }) {
	const $popup = $("#common-popup");

	$popup.html(`
	  <div class="popup-content">
		<div class="popup-message">${message}</div>
		<div class="popup-buttons">
		  <button class="popup-confirm">확인</button>
		</div>
	  </div>
	`).removeClass("hidden");

	$popup.find(".popup-confirm").on("click", () => {
		if (onConfirm) onConfirm();
		$popup.addClass("hidden").empty();
	});
}
