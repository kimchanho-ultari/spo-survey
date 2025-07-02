let tree;
let selectedUsers = [];

let mobileEndDate = null;
let mobileStartDate = new Date();
let participantsListMobile = [];

let checkType = true;
let val = "";

$(function () {
	init();
	initEvent();

	// 수정
	if (surveyCode) {
		codeCheck();
	// 신규 등록
	} else {
		initVoteBox();
	}

	// 투표 추가하기 버튼
	$(document).on("click", "#add-vote", function () {
		const $newBox = createVoteBox();
		$(".vote-box-list").append($newBox);
	});

	// 탭 클릭 시 텍스트/날짜 전환
	$(document).on("click", ".vote-type-tabs .tab", function () {
		const $tab = $(this);
		const $box = $tab.closest(".vote-box");
		const type = $tab.data("type");

		$box.find(".tab").removeClass("active");
		$tab.addClass("active");

		const $options = $box.find(".vote-options");

		// 해당 vote-box 안에서만 이미지 숨기거나 표시
		const $imgs = $options.find(".option-inputs img");
		if (type === "date") {
			$imgs.hide();
		} else {
			$imgs.show();
		}

		$options.find(".option-input").each(function () {
			const $input = $(this);
			const isDescriptive = $input.hasClass("descriptive");

			if (!isDescriptive) {
				const newInput = $(`<input type="${type === "text" ? "text" : "date"}" class="option-input" placeholder="항목 입력" />`);
				$input.replaceWith(newInput);
			}
		});
	});

	// + 항목 추가 버튼
	$(document).on("click", ".add-option", function () {
		const $box = $(this).closest(".vote-box");
		const $options = $box.find(".vote-options");
		const type = $box.find(".tab.active").data("type");
		const input = `
						<div class="option-inputs">
						<input type="${type === "text" ? "text" : "date"}" placeholder="항목 입력" class="option-input" />
						</div>
					`;
		$options.append(input);

		// 해당 박스 안에서만 이미지 조절
		const $imgs = $options.find(".option-inputs img");
		if (type === "date") {
			$imgs.hide();
		} else {
			$imgs.show();
		}
	});

	// - 항목 삭제 버튼
	$(document).on("click", ".del-option", function () {
		const $box = $(this).closest(".vote-box"); 						// 현재 투표 박스
		const $options = $box.find(".vote-options .option-inputs"); 	// 모든 항목들

		if ($options.length > 1) {
			$options.last().remove(); 									// 마지막 항목만 삭제
		} else {
			showAlert({
				message: "항목은 최소 1개 이상 있어야 합니다."
			})
			return;
		}
	});

	// + 서술형 항목 추가 버튼
	$(document).on("click", ".add-descriptive-option", function () {
		const $box = $(this).closest(".vote-box");
		const $options = $box.find(".vote-options");

		if ($options.find(".descriptive").length > 0) {
			showAlert({
				message: "서술형 항목은 문항당 1개만 추가 가능합니다."
			})
			return;
		}

		const descriptiveInput = `
		<div class="option-inputs">
		  <input type="text" value="기타의견" class="option-input descriptive" readonly />
		</div>`;

		$options.append(descriptiveInput);
	});

	// 투표 박스 삭제 버튼
	$(document).on("click", ".close", function () {
		const $box = $(this).closest(".vote-box");
		const Boxes = document.getElementsByClassName("vote-box");
		const totalBoxes = Boxes.length;

		if (totalBoxes <= 1) {
			showAlert({
				message: "투표는 최소 1개 이상 있어야 합니다."
			})
			return;
		}

		$box.remove();
	});

	// 종료 알림 여부 기본값 세팅
	$('.note').each(function () {
		$(this).data('endAlarm', 'Y');
	})

	$(document).on("click", ".note", function () {
		const preVal = $(this).data('endAlarm') || 'Y';
		const $note = $(this);
		const optionsHTML =
			`
			<label><input type="radio" name="endAlarm" value="Y" ${preVal === 'Y' ? 'checked' : ''}> 알림 받음</label><br>
			<label><input type="radio" name="endAlarm" value="N" ${preVal === 'N' ? 'checked' : ''}> 알림 받지 않음</label>
		`

		showPopup({
			title: "투표 종료 전 알림",
			message: "종료 30분 전에 알림을 보내드립니다.",
			optionsHTML: optionsHTML,
			onConfirm: () => {
				val = $("input[name='endAlarm']:checked").val();
				$note.text(val === "Y" ? "투표 종료 전 알림 받음" : "투표 종료 전 알림 안 받음");
				$note.data("endAlarm", val);
			}
		});
	});

	$(document).on("click", ".date2", function () {
		showDateTimePicker({
			title: "투표 종료시간 설정",
			defaultDate: new Date(),
			onConfirm: (dt) => {
				const formatted = dt.toLocaleString("ko-KR", {
					year: "numeric", month: "2-digit", day: "2-digit",
					weekday: "short", hour: "2-digit", minute: "2-digit"
				});
				$(".date2 span").text(formatted);
			}
		});
	});

	$(document).on("click", ".logo", function () {
		showPopup({
			title: "작성 취소",
			message: "작성을 취소하면 입력된 내용이 저장되지 않습니다. 취소하시겠습니까?",
			optionsHTML: ``,
			onConfirm: () => {
				window.location.href = "/survey/";
			}
		});
	});

	$(document).on("click", ".add-receiver", function () {
		$(".add-page").hide();
		$("#contact-select-container").show();
		deptList();
	})

	$(document).on('click', '.date2', function () {
		console.log('delegated date2 clicked');
		showDateTimePicker({
			title: '투표 종료시간 선택',
			defaultDate: mobileEndDate || new Date(),
			onConfirm: dt => {
				mobileEndDate = dt;
				$('.date2 span').text(formatDateTime(dt));
			}
		});
	});
});

function codeCheck() {
	checkType = false;
	const data = sessionStorage.getItem('list');

	if (data) {
		const { survey, questionList, participantsList } = JSON.parse(data);
		console.log(survey);
		console.log(questionList);
		console.log(participantsList);

		// 헤더
		$('.mobile-header-center > span').text('수정');
		$('.mobile-header-right > span').text('확인');

		// 기존의 필드값
		$('#surveyTitle').val(survey.surveyTitle);
		$('#surveyContents').val(survey.surveyContents);
		$('#isOpen').prop('checked', survey.isOpen === 'N');

		// 투표박스 추가하기 버튼 삭제하고 공간주기 
		$('#add-vote').css('display', 'none');
		$('.vote-date').css('margin-top', '20px');

		// 참여자
		selectedUsers = participantsList;
		renderRecipientChips();

		// 날짜
		mobileStartDate = new Date(survey.startDatetime);
		mobileEndDate = new Date(survey.endDatetime);
		$('.date2 span').text(formatDateTime(mobileEndDate));

		// 질문 박스
		$('.vote-box-list').empty();
		questionList.forEach(q => {
			const $box = $(createVoteBox());
			$box.data('question-code', q.questionCode);
			$box.find('.vote-title').val(q.questionContents);
			$box.find('input[id^="multi"]').prop('checked', q.isMulti === 'Y');
			$box.find('input[id^="anon"]').prop('checked', q.isAnonymous === 'Y');

			const $opts = $box.find('.vote-options').empty();
			q.itemList.forEach(item => {
				const cls = item.itemType === 'DESC' ? 'descriptive' : '';
				$opts.append(`
								<div class="option-inputs">
									<input type="text"
										value="${item.itemContents}"
										class="option-input ${cls}" />
								</div>
							`);
			});
			$('.vote-box-list').append($box);

			// 수정 가능한 컬럼 제외 전부 비활성화 처리
			$('.vote-box-list input[type="text"]').prop('readonly', true);
			$('.vote-box-list input[type="checkbox"], .vote-box-list input[type="radio"]').prop('disabled', true);
			$('.section input[type="checkbox"]').prop('disabled', true);
			$('.vote-box-list button').prop('disabled', true);

			$(document).off('click', '.vote-box-list button');
			$(document).off('change', '.vote-box-list input[type="checkbox"], .vote-box-list input[type="radio"]');

			// 중복 방지
			sessionStorage.removeItem('list');
		})
	}
}

// 투표 박스
function initVoteBox() {
	checkType = true;
	const $initialBox = createVoteBox();
	$(".vote-box-list").html($initialBox);
}

function createVoteBox() {
	const timestamp = Date.now();

	return `
	  <div class="vote-box" id="question_area_mobile">
		<div class="box-header">
		  <div class="vote-type-tabs">
			<button class="tab active" data-type="text">텍스트</button>
			<button class="tab" data-type="date">날짜</button>
		  </div>
		  <img class="close" src="/images/survey/ic_survey_delete.svg" alt="닫기" />
		</div>
		<div class="vote-inputs vote-input">
		  <input type="text" class="vote-title" placeholder="투표 제목" />
  
		  <div class="vote-options vote-input">
			<div class="option-inputs">
			  <input type="text" placeholder="항목 입력" class="option-input" />
			</div>
			<div class="option-inputs">
			  <input type="text" placeholder="항목 입력" class="option-input" />
			</div>
			<div class="option-inputs">
			  <input type="text" placeholder="항목 입력" class="option-input" />
			</div>
		  </div>
  
		  <button class="add-option">+ 항목 추가</button>
		  <button class="del-option">- 항목 삭제</button>
		  <button class="add-descriptive-option">+ 서술형 항목 추가 (문항당 1개만 가능)</button>
  
		  <div class="vote-settings">
			<div>
			  <input type="checkbox" id="multi-${timestamp}" class="select chk-hidden" />
			  <label for="multi-${timestamp}" class="select-label">복수 선택</label>
			</div>
			<div>
			  <input type="checkbox" id="anon-${timestamp}" class="select chk-hidden" />
			  <label for="anon-${timestamp}" class="select-label">익명 투표</label>
			</div>
		  </div>
		</div>
	  </div>
	`;
}

// 참여자 검색 
function searchListMobile() {
	$.ajax({
		url: '/organization/memberByKeyword',
		contentType: 'application/json; charset=UTF-8',
		type: 'POST',
		dataType: 'json',
		data: JSON.stringify({ keyword: $('#btnSearch-user').val() }),
		success: function (data) {
			createFromUser(data)
		}
	})
}

// 참여자
function createFromUser(userList) {
	const $overlay = $("#contact-select-container");
	const $popup = $("#contact-popup").empty();

	// ────────── 상단 영역(검색창 + 선택 박스) ──────────
	let html = `
	  <div class="mobile-header">
		<div class="mobile-header-left">
		  <span class="logo-user" id="btnClosePopup"><img src="/images/survey/ic_title_back_w.svg" alt="이전" /></span>
		</div>
		<div class="mobile-header-center">
		  <input id="btnSearch-user" type="text" class="mobile-search-user" placeholder="검색" />
		</div>
		<div class="mobile-header-right">
		  <span class="menu-icon-user" onclick="searchListMobile();">검색</span>
		</div>
	  </div>
  
	  <div class="selected-list"></div>
	`;

	// ────────── 사용자 목록 ──────────
	html += `<div class="user-list">`;
	userList.forEach(u => {
		html += `
		<div class="user-item" data-id="${u.userId}">
		  <div class="avatar"></div>
		  <div class="info">
			<div class="dept">${u.deptName || ''}</div>
			<div class="div">
			  <span class="name">${u.userName}</span>
			  <span class="sub">${u.posName || ''}</span>
			</div>
		  </div>
		  <input type="checkbox" class="checkbox">
		</div>
	  `;
	});
	html += `</div>`;

	$popup.append(html);
	$popup.off();

	// 이미 추가되어 있는 참여자들 체크
	selectedUsers.forEach(selected => {
		const id = selected.key;
		$popup.find(`.user-item[data-id="${id}"] .checkbox`).prop('checked', true);
	});

	/* 체크박스 change */
	$popup.on('change', '.checkbox', function () {
		const $item = $(this).closest('.user-item');
		const userId = $item.data('id');
		const userDept = $item.find('.dept').text();
		const userNm = $item.find('.name').text();


		if (this.checked) {
			if (!selectedUsers.find(u => u.id === userId)) {
				selectedUsers.push({ key: userId, title: userNm, deptName: userDept, posName: "" });
			}
		} else {
			selectedUsers = selectedUsers.filter(u => u.key !== userId);
		}
		updateSelectedList();
	});

	$popup.on('click', '.selected-list .remove', function () {
		// 전체 삭제
		if ($(this).hasClass('remove-all')) {
			selectedUsers = [];
			$popup.find('.checkbox').prop('checked', false);
		} else {
			const id = $(this).closest('.chip').data('id');
			selectedUsers = selectedUsers.filter(u => u.key !== id);
			// 체크박스도 해제
			$popup.find(`.user-item[data-id="${id}"] .checkbox`).prop('checked', false);
		}
		updateSelectedList();
	});

	$popup.on('click', '#btnClosePopup', function () {
		$('#contact-select-container').hide();
		$('.add-page').show();
		renderRecipientChips();					// 참여자 목록에 추가
	});

	// 글쓰기에서 x 버튼
	$(document).on('click', '#recipient-chips .remove', function () {
		if ($(this).hasClass('remove-all')) {
			selectedUsers = [];
			$('.checkbox').prop('checked', false);
		} else {
			const id = $(this).parent().data('id');
			selectedUsers = selectedUsers.filter(u => u.key !== id);
			$('.user-item[data-id="' + id + '"] .checkbox').prop('checked', false);
		}
		renderRecipientChips();					// 글쓰기 화면에 그대로 추가
		updateSelectedList();
	});

	updateSelectedList();
}

// 글쓰기 화면에서 
function renderRecipientChips() {
	const $box = $('#recipient-chips');
	$box.empty();

	let html = `
				<div class="chip all" id="chip">${selectedUsers.length}명
					<span class="remove remove-all" id="remove">x</span>
				</div>
				`;

	selectedUsers.forEach(u => {
		html += `
				<div class="chip lenChip" id="chip" data-id="${u.key}">
					${u.title}
					<span class="remove" id="remove">x</span>
				</div>
				`;
	});
	$box.html(html);

	if (selectedUsers.length === 0) {
		$('.receiver-placeholder').show();
		$('.all').hide();
	} else {
		$('.receiver-placeholder').hide();
		$('.all').show();
	}
}

// 참여자 화면에서
function updateSelectedList() {
	const $box = $('.selected-list');

	let html = `
		<div class="chip all" id="chip">${selectedUsers.length}명  
		  <span class="remove remove-all" id="remove">×</span>
		</div>
	`;

	selectedUsers.forEach(u => {
		html += `
		<div class="chip lenChip" id="chip" data-id="${u.key}">
		  ${u.title}
		  <span class="remove" id="remove">×</span>
		</div>
	  `;
	});
	$box.html(html);
}

// 조직도
function deptList() {
	const allMembers = [];
	let pendingCount = 0;

	$.ajax({
		type: 'POST',
		url: '/organization/deptListByPid',
		dataType: 'json',
		contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		data: { key: 0 },
		success: function (data) {
			if (data.length === 0) return;

			pendingCount = data.length;

			data.forEach(function (item) {
				memberList(item.key, function (members) {
					allMembers.push(...members);
					pendingCount--;

					if (pendingCount === 0) {
						createFromUser(allMembers);
					}
				});
			});
		},
		error: function () {
		}
	});
}

// 멤버
function memberList(key, callback) {
	const data = { deptId: key };

	$.ajax({
		type: 'POST',
		url: '/organization/memberByDeptId',
		dataType: 'json',
		contentType: 'application/json; charset=UTF-8',
		data: JSON.stringify(data),
		success: function (data) {
			callback(data || []);
		},
		error: function (xhr) {
			callback([]);
		}
	});
}

function formatDateTime(d) {
	const pad = n => String(n).padStart(2, '0');
	return [
		d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())
	].join('-') + ' ' + [
		pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())
	].join(':');
}

function getMobileSurveyData() {
	const list = [];

	$('.vote-box').each(function () {
		const $box = $(this);
		const questionType = 'regist';

		let questionCode = $box.data('question-code');
		if (!questionCode) {
			questionCode = crypto.randomUUID();
			$box.data('question-code', questionCode);
		}

		const questionContents = $box.find('.vote-title').val().trim();
		if (!questionContents) return;

		const isMulti = $box.find('input[id^="multi"]').is(':checked') ? 'Y' : 'N';
		const isAnonymous = $box.find('input[id^="anon"]').is(':checked') ? 'Y' : 'N';

		const questionItem = [];
		let num = 0;

		$box.find('.option-input').each(function () {
			const $opt = $(this);
			const text = $opt.val().trim();
			if (!text) return;

			let itemCode = $opt.data('item-code');
			if (!itemCode) {
				itemCode = crypto.randomUUID();
				$opt.data('item-code', itemCode);
			}

			const itemType = text === "기타의견" ? 'DESC' : 'CHOICE';

			questionItem.push({
				itemCode,
				itemContents: text,
				itemType,
				num: ++num,
				type: questionType
			});
		});

		if (!questionItem.length) return;

		list.push({
			questionType,
			questionCode,
			questionContents,
			isMulti,
			isAnonymous,
			questionItem
		});
	});
	return list;
}

// 투표 등록
function addVote() {
	const surveyTitle = $('#surveyTitle').val().trim();
	const surveyContents = $('#surveyContents').val().trim();
	const isOpen = $('#isOpen').is(':checked') ? 'N' : 'Y';
	const endAlarm = val;

	if (!selectedUsers.length) {
		showAlert({ message: '참여자를 추가해 주세요.' });
		return;
	}

	const questionList = getMobileSurveyData();
	if (!questionList.length) {
		showAlert({ message: '최소 하나 이상의 투표 문항을 작성해 주세요.' });
		return;
	}

	if (!mobileEndDate) {
		showAlert({ message: '투표 종료시간을 선택해 주세요.' });
		return;
	}

	if ($('.note').text() == "투표 종료 알림 여부") {
		showAlert({ message: '투표 종료 알림 여부를 선택해 주세요.' });
		return;
	}

	const startDatetime = mobileStartDate
		? formatDateTime(mobileStartDate)
		: formatDateTime(new Date());
	const endDatetime = formatDateTime(mobileEndDate);

	const payload = {
		surveyTitle,
		surveyContents,
		startDatetime,
		endDatetime,
		questionList,
		participantsList: selectedUsers,
		isOpen,
		endAlarm
	};

	if (checkType === false) {
		payload.surveyCode = params.get('surveyCode');
	}

	$.ajax({
		url: checkType === true ? '/survey/registSurvey' : '/survey/saveSurvey',
		type: 'POST',
		contentType: 'application/json; charset=UTF-8',
		dataType: 'json',
		data: JSON.stringify(payload),
		success(data) {
			if (data.code === "ok") {
				showPopup({
					title: '투표 등록',
					message: '투표를 등록하시겠습니까?',
					onConfirm: () => {
						location.href = '/survey/';
					}
				})
			}
		},
		error(err) {
			console.error('등록 실패:', err);
			showAlert({ message: '등록 중 오류가 발생했습니다.' });
		}
	});
}

// =============================================================================================================================== mobile

function init() {
	initDatepicker();
	initTimepicker();
	initSurvey();

	var treeObj = orgTreeObj();
	initTree(treeObj);

	$('#member_list').chkbox();
	$('#participants_list').chkbox();
}
function initEvent() {
	$('#btnAddSurvey').on('click', appendSurvey);
	$('#btnRegistSurvey').on('click', registSurvey);
	$('#btnParticipants').on('click', participants);
	$('#btnAppendParticipantsList').on('click', validateAppendDataToParticipantsList);
	$('#btnRemoveParticipantsList').on('click', removeParticipantsList);
	$('#btnSearchParticipantsList').on('click', searchParticipantsList);
	$('#searchKeyword').on('keyup', function () {
		chkEnter(searchParticipantsList);
	});
	//$('li.gnb').on('click', moveTab);
}
function initTree(obj) {
	var opt = obj.opt;
	var handler = obj.handler;
	tree = new Tree(opt, handler);
	tree.bind();

	tree.reload();
}
function orgTreeObj() {
	var opt = {};
	opt.topId = '0';
	opt.target = 'tree';
	opt.grpTopUri = '/organization/deptListByPid';

	var handler = {
		_onClick: function (node, event) {
			$('#searchKeyword').val('');
			prevAct = 'tree';

			memberByDeptId(node.data.key);
		},
		_onCreate: function (node, span) {
			if (node.data.key == opt.topId) {
				obj = node;
				node.activate(true);
				node.expand(true);
			}
		},
		_appendAjax: function (node) {
			node.appendAjax({
				type: 'post',
				url: '/organization/deptListByPid',
				dataType: 'json',
				data: { key: node.data.key },
				debugLazyDelay: 750
			});
		}
	};

	var obj = {};
	obj.opt = opt;
	obj.handler = handler;

	return obj;
}
function commonGroupTreeObj() {
	var opt = {};
	opt.topId = '0';
	opt.target = 'tree';
	opt.grpTopUri = '/commongroup/groupListByPid';

	var handler = {
		_onClick: function (node, event) {
			$('#keyword').val('');
			prevAct = 'tree';
			commonMemberByGroupCode(node.data.key);
		},
		_onCreate: function (node, span) {

		},
		_appendAjax: function (node) {
			node.appendAjax({
				type: 'post',
				url: '/commongroup/groupListByPid',
				dataType: 'json',
				data: { key: node.data.key },
				debugLazyDelay: 750
			});
		}
	};

	var obj = {};
	obj.opt = opt;
	obj.handler = handler;

	return obj;
}
function deptGroupTreeObj() {
	var opt = {};
	opt.topId = '0';
	opt.target = 'tree';
	opt.grpTopUri = '/agencygroup/groupListForSystem';

	var handler = {
		_onClick: function (node, event) {
			$('#keyword').val('');
			prevAct = 'tree';
			agencyMemberByGroupCode(node.data.key);
		},
		_onCreate: function (node, span) {

		},
		_appendAjax: function (node) {
			node.appendAjax({
				type: 'post',
				url: '/agencygroup/groupListForSystem',
				dataType: 'json',
				data: { key: node.data.key },
				debugLazyDelay: 750
			});
		}
	};

	var obj = {};
	obj.opt = opt;
	obj.handler = handler;

	return obj;
}
function initSurvey() {
	$('#question_area').survey();
	$('#question_area').appendSurvey();
}
function appendSurvey() {
	$('#question_area').appendSurvey();
}
function initDatepicker() {
	$.datepicker.setDefaults({
		regional: ['ko'],
		nextText: '다음달',
		prevText: '이전달',
		currentText: '오늘',
		changeYear: true,
		changeMonth: true,
		monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
		monthNamesShort: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
		dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
		dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
		dateFormat: 'yy-mm-dd',
		closeText: '닫기',
		showOtherMonths: true,
		showOn: "button",
		buttonImageOnly: true,
		buttonImage: "/images/icon_calendar.png"
	});

	var sDate = $('#sDate').datepicker({
		minDate: '0d'
	}).on('change', function () {
		$('#eDate').datepicker('option', 'minDate', getDate(this));
	});
	var eDate = $('#eDate').datepicker({
		minDate: '0d'
	}).on('change', function () {
		sDate.datepicker('option', 'maxDate', getDate(this));
	});

	var today = new Date();
	$("#sDate").val($.datepicker.formatDate($.datepicker.ATOM, today));
}
function getDate(obj) {
	var dateFormat = 'yy-mm-dd';

	var date;

	try {
		date = $.datepicker.parseDate(dateFormat, obj.value);
	} catch (e) {
		date = null;
	}
	return date;
}
function initTimepicker() {
	makeHour('sHour');
	makeHour('eHour');
	makeMinute('sMinute');
	makeMinute('eMinute');

	var date = new Date();
	var hour = date.getHours();

	if (hour <= 9) {
		hour = '9';
	} else if (hour >= 18) {
		hour = '18';
	}

	$('#sHour').val(hour);
}
function datetime(type) {
	var date = $('#' + type + 'Date').val();
	var hour = $('#' + type + 'Hour').val();
	var minute = $('#' + type + 'Minute').val();

	var datetime = '';
	if (date != '') {
		datetime = date + ' ' + hour + ':' + minute + ':00';
	}

	return datetime;
}
function registSurvey() {
	var questionList = $('#question_area').surveyData();

	if (validate(questionList)) {
		var title = $('#survey_title').val();
		var contents = $('#survey_contents').val();
		var isOpen = $('input[name=isOpen]:checked').val();
		var endAlarm = $('input[name=endAlarm]:checked').val();

		var startDatetime = datetime('s');
		var endDatetime = datetime('e');

		var obj = {};
		var data = {};
		data.surveyTitle = title;
		data.surveyContents = contents;
		data.startDatetime = startDatetime;
		data.endDatetime = endDatetime;
		data.questionList = questionList;
		data.participantsList = participantsList;
		data.isOpen = isOpen;
		data.endAlarm = endAlarm;

		obj.url = '/survey/registSurvey';
		obj.data = data;
		obj.contentType = 'json';

		console.log(obj);
		ajaxCall(obj, registSurveyHandler);
	} else {
		console.log('There is not enough information.');
	}
}
function registSurveyHandler(data) {
	location.href = '/survey/';
}
function validate(list) {
	var val = true;
	var len_survey = list.length;
	var len_participants = participantsList.length;

	var title = $('#survey_title').val();
	var eDate = $('#eDate').val();
	var eHour = $('#eHour').val();

	if (title == '') {
		alert('제목을 입력하세요.');
		val = false;
	} else if (len_survey == 0) {
		alert('설문을 작성해 주세요.');
		val = false;
	} else if (len_participants == 0) {
		alert('참여자를 추가해 주세요.');
		val = false;
	} else if (eDate == '' || eHour == '') {
		alert('마감일시를 지정해주세요.');
		val = false;
	}

	return val;
}
function participants() {
	console.log('participants');
	$('#participants_form').dialog({
		modal: true,
		width: 900,
		buttons: {
			'확인': setParticipants,
			'취소': function () { $(this).dialog('close'); }
		}
	});

	tree.reload();

	var body = $('#member_list tbody');
	body.empty();

	appendParticipantsList(participantsList);

	setCount('member_list', 'memberCnt');
}

// 참여자 목록
function setParticipants() {
	console.log('setParticipants');
	var list = $('#participants_list').getItemList();

	console.log(participantsList);

	var len = list.length;
	var participants_title = [];

	if (len == 0) {
		alert('참여자는 1명 이상이어야 등록 가능합니다.');

	} else {
		if (len > 5) {
			var title = list[0].title;
			title += '외 ' + (len - 1) + '명';

			participants_title.push(title);
		} else {
			list.forEach(function (item) {
				var title = item.title;

				participants_title.push(title);
			});
		}
		participantsList = list;

		$('#participants_title').text(participants_title);

		$('#participants_form').dialog('close');
	}
}
function memberByDeptId(key) {
	var obj = {};
	var data = {};
	data.deptId = key;

	obj.url = '/organization/memberByDeptId';
	obj.data = data;
	obj.contentType = 'json';

	console.log('[memberByDeptId] ' + JSON.stringify(obj));
	ajaxCall(obj, appendMemberList);
}
function agencyMemberByGroupCode(key) {
	var obj = {};
	var data = {};
	data.key = key;

	obj.url = '/agencygroup/memberByGroupCode';
	obj.data = data;
	obj.contentType = 'json';

	console.log(JSON.stringify(obj));
	ajaxCall(obj, appendMemberList);
}
function commonMemberByGroupCode(key) {
	var obj = {};
	var data = {};
	data.key = key;

	obj.url = '/commongroup/memberByGroupCode';
	obj.data = data;
	obj.contentType = 'json';

	console.log(JSON.stringify(obj));
	ajaxCall(obj, appendMemberList);
}
function appendMemberList(list) {
	var body = $('#member_list tbody');
	body.empty();
	list.forEach(function (item) {
		var key = item.userId;
		var title = item.userName;
		var deptName = item.deptName;
		var posName = item.posName;
		posName = nvl(posName, '');

		var $tr = $('<tr>');
		var $td_checkbox = $('<td>');

		var $td_title = $('<td>').text(title);
		var $td_deptname = $('<td>').text(deptName);
		var $td_posname = $('<td>').text(posName);

		var $checkbox = $('<input type="checkbox">')
			.addClass('chkItem')
			.data('key', key)
			.data('title', title)
			.data('deptName', deptName)
			.data('posName', posName);

		$td_checkbox.append($checkbox);
		$tr.append($td_checkbox).append($td_title).append($td_deptname).append($td_posname);
		body.append($tr);
	});

	resetChkItems('member_list');

	setCount('member_list', 'memberCnt');
}
function isChecked(key) {
	var isChecked = $('#' + key).isChecked();
	return isChecked;
}
function getChkItemList(key) {
	var list = $('#' + key).getChkItemList();
	return list;
}
function getItemList(key) {
	var list = $('#' + key).getItemList();
	return list;
}
function resetChkItems(key) {
	$('#' + key).reset();
}
function validateAppendDataToParticipantsList() {
	var isChk = isChecked('member_list');

	if (isChk) {
		var memberList = getChkItemList('member_list');
		var participantsList = getItemList('participants_list');
		var tmp = $.merge(participantsList, memberList);
		var list = removeDuplicates(tmp, 'key');
		appendParticipantsList(list);
	} else {
		alert('추가할 사용자를 선택해주세요.');
	}
}
function removeDuplicates(originArray, prop) {
	var newArray = [];
	var lookupObj = {};

	for (var i in originArray) {
		var key = originArray[i].key;
		lookupObj[originArray[i][prop]] = originArray[i];
	}

	for (i in lookupObj) {
		newArray.push(lookupObj[i]);
	}
	return newArray;
}
function appendParticipantsList(list) {
	console.log(list);
	var body = $('#participants_list tbody');
	body.empty();
	list.forEach(function (item) {
		if (typeof item == 'object') {
			var key = item.key;
			var title = item.title;
			var deptName = item.deptName;
			var posName = item.posName;

			var $tr = $('<tr>');
			var $td_checkbox = $('<td>');

			var $td_title = $('<td>').text(title);
			var $td_deptname = $('<td>').text(deptName);
			var $td_posname = $('<td>').text(posName);

			var $checkbox = $('<input type="checkbox">')
				.addClass('chkItem')
				.data('key', key)
				.data('title', title)
				.data('deptName', deptName)
				.data('posName', posName);

			$td_checkbox.append($checkbox);
			$tr.append($td_checkbox).append($td_title).append($td_deptname).append($td_posname);
			body.append($tr);
		}
	});

	resetChkItems('participants_list');
	resetChkItems('member_list');

	setCount('participants_list', 'participantsCnt');
}
function removeParticipantsList() {
	if (isChecked('participants_list')) {
		$('.chkItem:checked').each(function () {
			$(this).parent().parent().remove();
		});

		resetChkItems('participants_list');
		resetChkItems('member_list');
	} else {
		alert('삭제할 주소록을 체크해주세요.');
	}

	setCount('participants_list', 'participantsCnt');
}
function setCount(key, target) {
	var list = $('#' + key).getItemList();
	var len = list.length;
	$('#' + target).text(len);
}
function searchParticipantsList() {
	var tab = $('li.active');
	var type = tab.data('type');
	var uri = '/organization/memberByKeyword';

	var keyword = $('#searchKeyword').val();

	if (keyword == '') {
		alert('검색어를 입력하세요.');
	} else {
		var obj = {};
		var data = {};
		data.keyword = keyword;

		obj.url = uri;
		obj.data = data;
		obj.contentType = 'json';

		console.log('[searchParticipantsList] ' + JSON.stringify(obj));
		ajaxCall(obj, appendMemberList);
	}
}
function moveTab() {
	var type = $(this).data('type');

	var tab = $('li.gnb');
	tab.each(function () {
		var item = $(this);
		var itemType = item.data('type');

		item.removeClass('active');

		if (type == itemType) {
			item.addClass('active');
		}
	});

	var treeObj;
	if (type == 'organization') {
		treeObj = orgTreeObj();
	} else if (type == 'dept_group') {
		treeObj = deptGroupTreeObj();
	} else {
		treeObj = commonGroupTreeObj();
	}

	initTree(treeObj);

	$('#member_list tbody').empty();
	$('#searchKeyword').val('');
}