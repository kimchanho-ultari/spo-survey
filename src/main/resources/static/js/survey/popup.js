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

/**
 * 달력 + 시간 선택 팝업
 * @param {{ title: string, defaultDate?: Date, onConfirm: (Date)=>void, onCancel?: ()=>void }} cfg
 */
function showDateTimePicker({ title, defaultDate = new Date(), onConfirm, onCancel }) {
	// 팝업 안에 input 생성
	showPopup({
		title,
		message: "",
		optionsHTML: `<input type="text" id="datetime-picker" style="width:100%; padding:8px; box-sizing:border-box;" />`,
		onConfirm: () => {
			// flatpickr 인스턴스에서 Date 객체 꺼내기
			const inst = document.querySelector("#datetime-picker")._flatpickr;
			const dt = inst.selectedDates[0] || defaultDate;
			onConfirm(dt);
		},
		onCancel
	});

	// 팝업이 렌더링된 직후 flatpickr 초기화
	setTimeout(() => {
		flatpickr("#datetime-picker", {
			enableTime: true,
			dateFormat: "Y-m-d H:i",
			defaultDate
		}).open();
	}, 0);
}
