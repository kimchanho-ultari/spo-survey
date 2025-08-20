let tmpParticipants = [];
let emotionIcons = {};
let totalReactions = '';
let questionCode = "";
let replyNum = '';

$(function () {
	init();
	initEvent();
	mobileInit();
});

function mobileInit() {
	replyList();						// 댓글
	emotion();							// 감정표현
	getRemainingHours();				// 남은 투표 시간 계산
	bindVoteButton(survey);				// 투표종료 버튼
	surveyQuestionListMobile();			// 기타의견 라디오 선택 시 활성화

	// 투표 여부, 종료 여부에 따른 진행바
	if (isDone === "Y" || status === "Y") surveyDoneMobile();

	// questionCode 값
	surveyQuestionList.forEach(item => {
		let code = item.questionCode
		questionCode = code;
	});

	// 체크박스 전체선택
	$(document).on('change', '.select-all', function () {
		const questionCode = this.id.replace('allCheck_', '');

		const $card = $(this).closest('.question-card');
		const $options = $card.find("input[name='" + questionCode + "']");

		$options.prop('checked', this.checked);
	});

	// 수정
	$(document).on('click', '#vote-update', function () {
		const payload = {
			survey: survey,
			questionList: surveyQuestionList,
			participantsList: participantsList
		};
		sessionStorage.setItem('list', JSON.stringify(payload));
		location.href = '/survey/regist?surveyCode=' + encodeURIComponent(survey.surveyCode);
	})

	// 삭제
	$('#vote-delete').on('click', removeSurveyMobile);

	// 더보기 팝업
	$('#moreBtn').on('click', function () {
		$('.popupArea').css('display', 'block');
	})

	// 댓글 등록
	$(document).on('click', '.btn-comment-submit', function () {
		replySave();
	})

	// 감정표현 추가 팝업
	$(document).on('click', '.btn-add-reaction > img', function () {
		emotionUploadModal();
	})

	// 감정표현 리스트 팝업
	$(document).on('click', '#reaction-btn > span', function () {
		emotionListModal()
	})

	// 감정표현 아이콘
	for (let i = 0; i < 12; i++) {
		emotionIcons[i] = `/images/survey/ic_chat_recattion_small_${i}.svg`;
	}

	$(document).mouseup(function (e) {
		var LayerPopup1 = $(".popupArea");
		var LayerPopup2 = $(".emotionAdd");
		var LayerPopup3 = $(".emotion-user");

		var pcLayerPopup1 = $(".emotionAdd-pc");
		var pcLayerPopup2 = $(".emotion-user-pc");
		var pcLayerPopup3 = $(".item-user-pc");

		if (LayerPopup1.has(e.target).length === 0) {
			$(".popupArea").css("display", "none");
		}

		if (LayerPopup2.has(e.target).length === 0) {
			$(".emotionAdd").css("display", "none");
		}

		if (LayerPopup3.has(e.target).length === 0) {
			$(".emotion-user").css("display", "none");
		}

		if (pcLayerPopup1.has(e.target).length === 0) {
			$(".emotionAdd-pc").css("display", "none");
		}

		if (pcLayerPopup2.has(e.target).length === 0) {
			$(".emotion-user-pc").css("display", "none");
		}

		if (pcLayerPopup3.has(e.target).length === 0) {
			$(".item-user-pc").css("display", "none");
		}
	});
}

// 투표할때 값 확인
function validateSurveySelectMobile() {
	var result = true;

	var questionList = $('.mobile-questions');
	questionList.each(function () {
		var question = $('.mobile-questions');
		var len_checked = question.find('.option-item > label > input:checked').length;

		if (len_checked == 0) {
			showAlert({
				message: '선택하지 않은 설문 항목이 있습니다.'
			});
			result = false;
			return false;
		} else {
			var $items = question.find('.option-item > label > input:checked');
			$items.each(function () {
				var $item = $(this);
				var itemCode = $item.val();
				var itemType = $item.data('itemType');
				if (itemType == 'DESC') {
					var desc = $('#desc_' + itemCode).val();
					if (desc == '') {
						showAlert({
							message: '서술형 항목에 내용을 입력해 주세요.'
						});
						result = false;
						return false;
					}
				}
			});
		}
	});
	return result;
}

// 투표
function surveySubmitMobile() {
	if (validateSurveySelectMobile()) {
		var itemList = [];
		var descList = [];

		var obj = {};
		var data = {};
		data.surveyCode = surveyCode;
		data.itemList = itemList;
		data.descList = descList;

		obj.url = '/survey/submitSurvey';
		obj.data = data;
		obj.contentType = 'json';

		var $items = $('.option-item > label > input:checked');
		$items.each(function () {
			var $item = $(this);
			var questionCode = $item.attr('name');
			var itemCode = $item.val();
			var itemType = $('#desc_' + itemCode).length > 0 ? 'DESC' : 'CHOICE';


			var itemObj = {
				questionCode: questionCode,
				itemCode: itemCode,
				itemType: itemType
			};
			itemList.push(itemObj);

			var $option = $item.closest('.option-item');
			var descText = ($option.find('#desc_' + itemCode).val() || '').trim();

			if (descText) {
				descList.push({
					questionCode: questionCode,
					itemCode: itemCode,
					desc: descText
				});
			}
		});
		ajaxCall(obj, submitSurveyHandlerMobile);
	}
}

function submitSurveyHandlerMobile(data) {
	var code = data.code;

	if (code == 'fail') {
		showAlert({
			message: '적용에 실패하였습니다. 잠시후 다시 시도해주세요.'
		});
		return
	} else {
		location.reload();
	}
}

function surveyQuestionListMobile() {
	surveyQuestionList.forEach(q => {
		const code = q.itemCode;
		const $radio = $(`#radio_${code}`);
		const $desc = $(`#desc_${code}`);
		$desc.prop('disabled', !$radio.is(':checked'));
	})

	$('.mobile-questions').on('change', 'input[id^=radio_]', function () {
		const code = this.id.split('-')[1];
		const $desc = $(`#desc_${code}`);
		$desc.prop('disabled', !this.checked);

	})
}

// 투표하기 이후 진행바
function surveyDoneMobile() {
	const totalParticipants = survey.memberList.length;
	let $newVoteNum = '';

	surveyQuestionList.forEach(question => {
		const list = question.itemList;
		console.log(list);

		const qCode = question.questionCode;
		const $card = $(`.question-card:has(input[name='${qCode}'])`);
		const $lis = $card.find('.option-item');

		const countMap = surveyItemAggregate.reduce((map, x) => {
			map[x.key] = x.val;
			return map;
		}, {});

		const myChoices = surveyResult
			.filter(r => r.questionCode === qCode)
			.map(r => r.itemCode);

		$lis.each((_, li) => {
			const $li = $(li);
			const $input = $li.find('input');
			const code = $input.val();
			const cnt = countMap[code] || 0;
			const pct = Math.round(cnt / totalParticipants * 100);
			const isMine = myChoices.includes(code);

			$input.prop({ checked: isMine, disabled: true });

			$li.find('.progress, .vote-num').remove();

			const $progress = $('<div>').addClass('progress')
				.append(
					$('<div>')
						.addClass('bar-base')
						.css('width', `${pct}%`)
				);
			if (isMine) {
				$progress.append(
					$('<div>')
						.addClass('bar-mine')
						.css('width', `${pct}%`)
				);
			}

			// 현재 code에 해당하는 item 
			const matched = list.find(item => item.itemCode === code) || {};
			const itemType = matched.itemType || question.itemType;
			const itemLabel = matched.label || $li.find('label span').text();

			$newVoteNum = $('<span>')
				.addClass('vote-num')
				.text(`${cnt}명`)
				.data({
					itemCode: code,
					surveyCode: surveyCode,
					itemType: itemType,
					isAnonymous: question.isAnonymous,
					isMulti: question.isMulti
				})
				.on('click', function () {
					const d = $(this).data();

					surveyItemResultMemberMobile(
						d.itemCode,
						d.surveyCode,
						d.itemType,
						d.isAnonymous,
						d.isMulti
					)
				});

			const $label = $li.find('label');
			const $detachedSpan = $label.find('span').detach();
			$label.remove();

			const $spanWrapper = $('<div>')
				.addClass('span-wrapper')
				.append($('<span>').text(itemLabel))
				.append($newVoteNum);

			$li.empty()
				.append($spanWrapper)
				.append($progress);

			$progress.prepend($input);
		});
		$card.find('.card-footer').hide();
	});

	$('.user-btn-submit').prop('disabled', true);
	$('.progress > input').css('display', 'none');

	// 진행중 | 참여자 | 비공개 투표일 경우 
	if (
		survey.status === "N" &&
		survey.isWriter === "N" &&
		survey.isOpen === "N"
	) {
		$('.option-item .progress, .option-item .vote-num').remove();
	}
}

function bindOtherDescPopup(data) {
	const list = data.list || [];

	let $modal = $('#otherTextModal');
	if (!$modal.length) {
		$modal = $(`
					<div id="otherTextModal" class="modal-overlay">
						<div class="modal-box">
						<button class="close-btn">&times;</button>
						<h3>기타의견</h3>
						<ul class="other-list"></ul>
						</div>
					</div>
				`).appendTo('body');
		$modal.find('.close-btn').on('click', () => $modal.hide());
	}

	const $ul = $modal.find('.other-list').empty();

	$ul.addClass('vote-modal-list')
		.empty();

	if (list.length) {
		// 익명 X
		if (data.req.isAnonymous === 'N') {
			list.forEach(r => {
				$ul.append(
					$('<li>').addClass('vote-modal-item').append(
						// 사용자명
						$('<span>')
							.addClass('vote-modal-username')
							.text(r.userName || ''),
						// 의견
						$('<span>')
							.addClass('vote-modal-comment')
							.text(r.desc || '')
					)
				);
			});
			// 익명 O
		} else {
			list.forEach(r => {
				$ul.append(
					$('<li>').addClass('vote-modal-item').append(
						// 의견
						$('<span>')
							.addClass('vote-modal-comment')
							.text(r.desc || '')
					)
				);
			});
		}
	} else {
		$ul.append(
			$('<li>').text('투표된 기타의견이 없습니다.')
		);
	}
	$modal.css('display', 'flex');
}

// 참여자 리스트
function surveyItemResultMemberMobile(itemCode, surveyCode, itemType, isAnonymous, isMulti) {
	const obj = {
		url: '/survey/surveyItemResultMember',
		data: { surveyCode, itemCode, itemType, isAnonymous },
		contentType: 'json'
	};

	ajaxCall(obj, function (data) {
		surveyItemResultMemberHandlerMobile(data, itemType);
	});
}

function surveyItemResultMemberHandlerMobile(data, itemType) {
	var code = data.code;

	if (code == 'fail') {
		showAlert({
			message: '적용에 실패하였습니다. 잠시후 다시 시도해 주세요.'
		})
	} else {
		if (itemType === 'DESC') {
			bindOtherDescPopup(data);
		} else {
			// 익명이 아닐때만
			if (data.req.isAnonymous === "N") {
				bindsubmitPopup(data);
			}
		}
	}
}

function bindsubmitPopup(data) {
	const list = data.list || [];

	let $modal = $('#participantModal');
	if (!$modal.length) {
		$modal = $(`
					<div id="participantModal" class="modal-overlay">
						<div class="modal-box">
							<button class="close-btn">&times;</button>
							<h3>참여자 리스트</h3>
							<ul class="other-list"></ul>
						</div>
					</div>
				`).appendTo('body');
		$modal.find('.close-btn').on('click', () => $modal.hide());
	}
	const $ul = $modal.find('.other-list').empty();

	if (list.length) {
		list.forEach(user => {
			$ul.append(
				$('<li>').text(user.userName || '')
			);
		});
	} else {
		$ul.append(
			$('<li>').text('투표한 참여자가 없습니다.')
		);
	}
	$modal.css('display', 'flex');
}

function removeSurveyMobile() {
	showPopup({
		title: "설문 삭제",
		message: "설문을 삭제하시겠습니까?",
		optionsHTML: ``,
		onConfirm: () => {
			var obj = {};
			var data = {};
			data.surveyCode = surveyCode;

			obj.url = '/survey/removeSurvey';
			obj.data = data;
			obj.contentType = 'json';

			console.log(JSON.stringify(obj));

			ajaxCall(obj, removeSurveyHandlerMobile);
		}
	});
}

function removeSurveyHandlerMobile(data) {
	var code = data.code;

	if (code == 'fail') {
		showAlert({
			message: "적용에 실패하였습니다. 잠시후 다시 시도해주세요."
		})
		return;
	} else {
		location.href = '/survey/'
	}
}

function bindVoteButton(survey) {
	let html = '';

	const data = survey;
	const userList = data.memberList || [];
	let userLen = [];

	// 투표 참여 인원
	userList.forEach(function (user) {
		if (user.isComplete == "Y") {
			userLen.push(user.key);
		}
	})

	// 참여자 X / 작성자 O
	if (data.isMember === "N") {
		html += `
			<div>
				<button class="user-btn-submit-dis" disabled>투표하기</button>
			</div>
			`
	} else {
		// 투표 마감
		if (data.status === "C") {
			html += `
				<div>
					<button class="user-btn-submit-dis" disabled>투표종료</button>
				</div>
				`
		} else {
			// 투표 전
			if (data.isDone === "N") {
				html += `
				<div>
					<button id="btnSubmitSurvey" class="user-btn-submit" onclick='surveySubmitMobile();'>투표하기</button>
				</div>
				`
				// 투표 후
			} else {
				html += `
				<div>
					<button class="user-btn-submit-dis" disabled>투표완료</button>
				</div>
				`
			}
		}
	}

	html += `
			<div class='participation-div'>
				<div class='participation'>
					<span id='participation-span'>${userLen.length}명 참여</span>
				</div>
				<div>
					<img src='/images/survey/btn_component_next_bk.svg' />
				</div>
			</div>

			`
	$('.mobile-actions').append(html);

	$(document).on('click', '#participation-span', function () {
		voteUserList(userList);
	})

	$(document).on('click', '#vote-list', function () {
		voteUserList(userList);
	})
}

function getRemainingHours() {
	let html = '';

	const endDatetime = survey.endDatetime;
	const end = new Date(endDatetime);
	const now = new Date();
	const diffMs = end - now;
	const times = Math.floor(diffMs / (1000 * 60 * 60));

	if (times <= 0) {
		html = `<p><img src="/images/survey/ic_survey_time2.svg" />이미 종료된 투표입니다.</p>`;
	} else if (times > 24) {
		const day = times / 24;
		const days = parseInt(day);

		html = `<p>
					<img src="/images/survey/ic_survey_time2.svg" />투표가&nbsp;<strong id="end-time">${days}일</strong>&nbsp;후에 종료됩니다.
				</p> `;
	} else {
		html = `<p>
					<img src="/images/survey/ic_survey_time2.svg" />투표가&nbsp;<strong id="end-time">${times}시간</strong>&nbsp;후에 종료됩니다.
				</p> `;
	}
	$('.mobile-notice').append(html);
}

function goBack(url) {
	if (url === 'detail') {
		location.href = '/survey/article/' + surveyCode;
	} else {
		location.href = '/survey/';
	}
}

// 통계 화면
function voteUserList(data) {
	const $container = $('.survey-list-mobile').empty();

	const headerHtml = `
						<div class="mobile-header">
						<div class="mobile-header-left">
							<span class="logo">
							<img src="/images/survey/ic_title_back_w.svg" alt="이전" onclick="goBack('main')" />
							</span>
						</div>
						<div class="mobile-header-center"><span>투표현황</span></div>
						<div class="mobile-header-right">
							<span class="menu-icon" onclick="goBack('detail')">상세 페이지</span>
						</div>
						</div>
						<div class="mobile-header vote-header">
						<div class="tabs">
							<button id="item" class="tab active">항목별</button>
							<button id="non" class="tab">미참여</button>
						</div>
						</div>
						<ul class="member-list"></ul>
					`;
	$container.append(headerHtml);

	$('.tab').on('click', function () {
		const $this = $(this);
		$('.tab').removeClass('active');
		$this.addClass('active');
	})

	$('#item').on('click', function () {
		getListByItem();
	})

	$('#non').on('click', function () {
		getListByNon(data);
	})

	$('#item').trigger('click');
};

// 통계 - 항목별
function getListByItem() {
	const $ul = $('.member-list');
	const list = surveyQuestionList;
	let num = 1;
	let html = '';

	list.forEach(question => {
		html += `
            <div class="vote-style">
                <div class="survey-question">
                    <div class="question-title">Q${num++}. ${question.questionContents}</div>
                    <div class="anonymous-type">
        `;

		html += `<div class="question-type">${question.isMulti === 'Y' ? '복수 선택 가능' : '복수 선택 불가능'}</div>`;
		if (question.isAnonymous === 'Y') {
			html += `<div class="question-type"> · 익명</div>`;
		}

		html += `</div>
            </div>
        <div class="vote-group-list">`;

		question.itemList.forEach(item => {
			const count = item.userList.length;

			// 익명 + 기타의견(DESC) 아닐 경우 명수만 표시
			if (question.isAnonymous === 'Y' && item.itemType !== 'DESC') {
				html += `
                    <div class="vote-group">
                        <div class="vote-group-title">
                            <span class="group-name">${item.itemContents}:</span>
                            <span class="group-count">${count}명</span>
                        </div>
                    </div>
                `;
			} else {
				html += `
                    <div class="vote-group">
                        <div class="vote-group-title">
                            <span class="group-name">${item.itemContents}:</span>
                            <span class="group-count">${count}명</span>
                        </div>
                        <ul class="vote-member-list">
                `;

				if (count === 0) {
					html += `
                        <li class="vote-member-item empty">
                            <div class="vote-team">투표한 멤버가 없습니다.</div>
                        </li>
                    `;
				} else {
					item.userList.forEach(userStr => {
						let user = null;
						try {
							user = JSON.parse(userStr);
						} catch (e) { }
						if (!user) return;

						let name = '익명';
						let dept = '';
						if (question.isAnonymous !== 'Y') {
							name = user.userName || user.userId;
							dept = user.deptName || '';
						}
						if (item.itemType === 'DESC') {
							html += `
                                <li class="vote-member-item">
                                    <img src="/images/survey/img_profile.png" alt="사용자 사진" />
                                    <div class="vote-setting">
                                        <div class="vote-name">${name}</div>
                                        <div class="vote-team">${dept}</div>
                                        <div class="vote-desc">${user.desc || ''}</div>
                                    </div>
                                </li>
                            `;
						} else {
							html += `
                                <li class="vote-member-item">
                                    <img src="/images/survey/img_profile.png" alt="사용자 사진" />
                                    <div class="vote-setting">
                                        <div class="vote-name">${name}</div>
                                        <div class="vote-team">${dept}</div>
                                    </div>
                                </li>
                            `;
						}
					});
				}
				html += `
                        </ul>
                    </div>
                `;
			}
		});

		html += `</div></div>`;
	});

	$ul.empty();
	$ul.append(html);
}

// 통계 - 미참여
function getListByNon(data) {
	const list = data || [];
	let html = '';
	const $ul = $('.member-list');

	// 미참여(N)인 인원만 필터링
	const nonParticipants = list.filter(item => item.isComplete === 'N');

	if (nonParticipants.length === 0) {
		// 미참여 인원 없음
		html = `
            <li class="member-item empty">
                <div class="info">미참여한 인원이 없습니다.</div>
            </li>
        `;
	} else {
		// 미참여 인원 목록 출력
		nonParticipants.forEach(item => {
			html += `
                <li class="member-item">
                    <div class="avatar item-non">
                        <img src="/images/survey/img_profile.png" alt="사용자 사진" />
                        <div class="info">
                            <div class="name">${item.title}</div>
                            <div class="dept">${item.deptName}</div>
                        </div>
                    </div>
                </li>
            `;
		});
	}

	$ul.empty();
	$ul.append(html);
}

// 댓글 & 감정표현
function replyList() {
	$('#inputText').val('');

	$.ajax({
		url: '/contentreply/list',
		type: 'POST',
		dataType: 'json',
		data: { contentId: surveyCode },
		success: function (data) {
			bindReplyList(data);
		},
		error: function (xhr, status, error) {
			console.error('댓글 불러오기 실패:', status, error);
		}
	});
}

function formatToKoreanDateTime(rawDateStr) {
	const safeStr = rawDateStr.replace("KST", "GMT+0900");
	const d = new Date(safeStr);

	if (isNaN(d)) {
		const ts = Date.parse(rawDateStr);
		if (!isNaN(ts)) d = new Date(ts);
	}

	const pad = n => String(n).padStart(2, "0");
	const YYYY = d.getFullYear();
	const MM = pad(d.getMonth() + 1);
	const DD = pad(d.getDate());
	const hh = pad(d.getHours());
	const mm = pad(d.getMinutes());

	return `${YYYY}.${MM}.${DD} / ${hh}:${mm}`;
}

function bindReplyList(data) {
	let html = '';

	const $reply = $('#reply-section');
	const list = data.list
	replyNum = data.list.length;

	list.forEach(reply => {
		const formatted = formatToKoreanDateTime(reply.registDate);
		html += `
				<div class="comment" id="${reply.replyId}">
				<img alt="사용자 사진" src="/images/survey/img_profile.png" style="margin-right: 10px;" />
				<div class="comment-content">
					<div class="comment-header">
					<span class="reply-author">
						<strong class='reply-name'>${reply.userName}</strong> / ${formatted}
					</span>
					${reply.myReply
				? `<div class="comment-actions replyDiv">
							<span class="action-btn" onclick="replyModify('${reply.replyId}')">수정&nbsp;|</span>
							<span class="action-btn" onclick="replyDelete('${reply.replyId}')">삭제</span>
						</div>`
				: ""}
					</div>

					<p class="comment-text" id="replyContent">${reply.reply}</p>
				</div>
				</div>
  			`;
	});
	$reply.html(html);
}

function replyModify(replyId) {
	let replyElement = document.querySelector(`[id="${replyId}"] #replyContent`);
	let buttonContainer = document.querySelector(`[id="${replyId}"] .replyDiv`);

	if (!replyElement || !buttonContainer) {
		console.error("수정할 댓글을 찾을 수 없습니다:", replyId);
		return;
	}

	replyCen = replyElement.innerText;

	let inputElement = document.createElement("textarea");
	inputElement.type = "text";
	inputElement.value = replyCen;
	inputElement.id = "setReplyContent";

	replyElement.replaceWith(inputElement);

	buttonContainer.innerHTML = `
    <button class='action-btn setBtn' type='button' onclick='replySave("${replyId}")'>저장 |</button>
    <button class='action-btn setBtn' type='button' onclick='replyCancel("${replyId}")'>취소</button>
`;
	inputElement.focus();
}

function replySave(replyId = null) {
	let replyText;

	if (replyId) {
		let inputElement = document.querySelector(`[id="${replyId}"] #setReplyContent`);

		if (!inputElement) {
			showAlert({
				message: '수정할 댓글을 찾을 수 없습니다.'
			})
			return;
		}

		replyText = inputElement.value;
	} else {
		replyText = $('#inputText').val();
	}

	if (!replyText) {
		showAlert({
			message: '댓글 내용을 입력하세요.'
		})
		return;
	}

	if (replyId) {
		let replyElement = document.createElement("p");

		replyElement.id = "replyContent";
		replyElement.style.fontSize = "14px";
		replyElement.style.margin = "5% 0";
		replyElement.innerText = replyText;

		document.querySelector(`[id="${replyId}"] #setReplyContent`).replaceWith(replyElement);

		let buttonContainer = document.querySelector(`[id="${replyId}"] .replyDiv`);
		if (buttonContainer) {
			buttonContainer.innerHTML = `
                <button class='action-btn setFont' type='button' name='replyModify' onclick='replyModify("${replyId}")'>수정 |</button>
                <button class='action-btn setFont' type='button' name='replyDelete' onclick='replyDelete("${replyId}")'>삭제</button>
            `;
		}

		const data = {
			contentId: surveyCode,
			reply: replyText.trim(),
			replyId: replyId
		}

		$.ajax({
			url: '/contentreply/upload',
			type: 'POST',
			contentType: "application/json; charset=UTF-8",
			data: JSON.stringify(data),
			success: function (data) {
				if (data === '0') {
					location.reload();
				}
			}
		})

	} else {
		const data = {
			contentId: surveyCode,
			reply: replyText.trim(),
		}

		$.ajax({
			url: '/contentreply/upload',
			type: 'POST',
			contentType: "application/json; charset=UTF-8",
			data: JSON.stringify(data),
			success: function (data) {
				if (data === '0') {
					location.reload();
				}
			}
		})
	}
}

function replyCancel(replyId) {
	let inputElement = document.getElementById("setReplyContent");
	let replyContainer = document.querySelector(`[id="${replyId}"] .replyDiv`);

	if (!inputElement || !replyContainer) {
		console.error("취소할 댓글을 찾을 수 없습니다:", replyId);
		return;
	}

	let originalReply = document.createElement("p");
	originalReply.id = "replyContent";
	originalReply.innerText = replyCen;

	inputElement.replaceWith(originalReply);

	replyContainer.innerHTML = `
        <span class="action-btn" onclick="replyModify('${replyId}')">수정&nbsp|</span>
        <span class="action-btn" onclick="replyDelete('${replyId}')">삭제</span>
    `;
}

function replyDelete(replyId) {
	$.ajax({
		url: "/contentreply/delete",
		beforeSend: function (xhr) {
		},
		contentType: "application/json",
		type: "POST",
		data: JSON.stringify({ replyId: replyId }),
		dataType: "json",
		success: function (data) {
			if (data == "0") {
				location.reload();
			}
		},
		error: function (error) {
			console.log(error);
		}
	});
}

function emotion() {
	$.ajax({
		url: '/contentreaction',
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		type: 'POST',
		dataType: 'json',
		data: { contentId: surveyCode },
		success: function (data) {
			// 총 카운트
			totalReactions = data[12].total;
			emotionList();
		}
	})
}

function emotionList() {
	$.ajax({
		url: '/contentreaction/total/list',
		contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		type: 'POST',
		dataType: 'json',
		data: { contentId: surveyCode },
		success: function (data) {
			bindEmotionList(data);
		}
	})
}

function bindEmotionList(data) {
	let html = '';
	let list = data;
	let emotionCount = {};
	let userReacted = false;

	list.forEach(item => {
		let emotionNum = item.reaction;
		emotionCount[emotionNum] = (emotionCount[emotionNum] || 0) + 1;

		if (item.userId === userId) {
			userReacted = true;
		}
	})

	// 공감 & 댓글 개수 표시 
	$('#emotion-total').text(totalReactions);
	$('#emotion-user').text(replyNum);

	if (userReacted) {
		let emotion = `<span class="emoList-reply cursorPointer emotion-cancle" onclick="emotionCancle()">공감 취소</span>`
		$('#txt-emotion-cancle').append(emotion);
	}

	if (totalReactions > 0) {
		Object.keys(emotionCount).forEach(emotion => {
			let iconSrc = emotionIcons[emotion]

			html += `
					<span class="emotion-img">
						<img src='${iconSrc}' />
						${emotionCount[emotion]}
					</span>
			`
		})
	} else {
		html += `<span class="emotion-addContent">가장 먼저 공감해 주세요.</span>`
	}
	$('#emotion-contents').append(html);
}

function emotionCancle() {
	$('.emotion-cancle').hide();

	let data = {
		userId: userId,
		reaction: 'remove',
		contentId: surveyCode
	}

	$.ajax({
		url: '/contentreaction/upload',
		type: 'POST',
		contentType: 'application/json',
		data: JSON.stringify(data),
		xhrFields: {
			withCredentials: true
		},
		success: function (data) {
			if (data === "TRUE") {
				location.reload();
			}
		}
	})
}

function emotionListModal() {
	$.ajax({
		url: '/contentreaction/total/list',
		contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		type: 'POST',
		dataType: 'json',
		data: { contentId: surveyCode },
		success: function (data) {
			bindEmotionListModal(data);
		}
	})
}

function bindEmotionListModal(data) {
	let list = data;

	let html = '';
	let total = list.length > 0 ? list.length : null;

	if (!document.querySelector('.emotion-user')) {
		let div = document.createElement("div");
		div.setAttribute("class", "emotion-user");
		document.querySelector('body').append(div);
	} else {
		$('.emotion-user').children().remove();
	}

	html = `
            <div class="user-popup">
                <div class="user-div">
                    <strong class="header-strong">공감한 유저</strong>
                </div>
                <div class="emotion-summary">
                    <button class="click active emotionAll">전체 ${total || 0}</button> `

	let reactionCount = {};
	let contentId = list.length > 0 ? list[0].contentId : null;

	list.forEach(item => {
		let reactionNum = item.reaction;
		reactionCount[reactionNum] = (reactionCount[reactionNum] || 0) + 1;
	});

	Object.keys(reactionCount).forEach(reactionNum => {
		html += `
                        <button class="click emotionButton" onclick="getListEmotionMenu(${reactionNum}, '${contentId}')">
                            <img src='${emotionIcons[reactionNum]}' />
                            <span>${reactionCount[reactionNum]}</span> 
                        </button>`;
	});

	html += `                
                </div>
            <div class="userList"></div> `

	$(".emotion-user").append(html);
	document.querySelector('.emotion-user').style.display = "block";

	bindtotalEmotionMenu(data);

	$('.emotionAll').on('click', function () {
		bindtotalEmotionMenu(data);
	})

	const buttons = document.querySelectorAll(".click");

	buttons.forEach(button => {
		button.addEventListener("click", function () {
			buttons.forEach(btn => btn.classList.remove("active"));
			this.classList.add("active");
		});
	});
}

function bindtotalEmotionMenu(data) {
	const list = data;
	let html = "";

	for (var i = 0; i < list.length; i++) {
		html += `
                <ul class="user-list">
                    <li class="emotion-user-item">
                        <div class="emotion-info">
                            <div class="emotion-info-div">
								<div class='userpic'>
									<img alt='사용자 사진' src='/images/survey/img_profile.png' />
								</div>
								<div>
                                	<div class='name'>${list[i].userName || ''}</div>
									<div class='dept'>${list[i].deptName || ''}</div>
								</div>
                            </div>
                                <span class="emotion-icon"><img src='${emotionIcons[list[i].reaction] || ''}'/></span>
                        </div>
                    </li>
                </ul>
            `;
	}

	$(".userList").children().remove();
	$(".userList").append(html);
}

function getListEmotionMenu(num, contentId) {
	$.ajax({
		url: "/contentreaction/" + num + "/list",
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		type: "POST",
		dataType: "json",
		data: { contentId: contentId },
		beforeSend: function (xhr) {
		},
		success: function (data) {
			bindListEmotionMenu(data);
		},
		error: function () {
		}
	});
}

function bindListEmotionMenu(data) {
	const list = data;
	let html = "";

	for (var i = 0; i < list.length; i++) {
		html += `
                <ul class="user-list">
                    <li class="emotion-user-item">
                        <div class="emotion-info">
                            <div class="emotion-info-div">
								<div class='userpic'>
									<img alt='사용자 사진' src='/images/survey/img_profile.png' />
								</div>
								<div>
                                	<div class='name'>${list[i].userName || ''}</div>
									<div class='dept'>${list[i].deptName || ''}</div>
								</div>
                            </div>
                            <span class="emotion-icon"><img src='${emotionIcons[list[i].reaction] || ''}'/></span>
                        </div>
                    </li>
                </ul>
            `;
	}

	$(".userList").children().remove();
	$(".userList").append(html);
}

function emotionUploadModal() {
	if (!document.querySelector('.emotionAdd')) {
		let div = document.createElement("div");
		div.setAttribute("class", "emotionAdd");
		document.querySelector('body').append(div);
	} else {
		$('.emotionAdd').children().remove();
	}

	let html = `
    <div class="reaction-modal" id="reactionModal">
        <div class="reaction-container">
            <div class="reaction-icons">`;

	for (let i = 0; i < 6; i++) {
		html += `<button class="reaction" data-index="${i}">
                    <img src="${emotionIcons[i]}" />
                 </button>`;
	}

	html += `        
            </div>
        </div>
    </div>`;

	$(".emotionAdd").append(html);
	$(".emotionAdd").show();

	$(".reaction-icons").on("click", ".reaction", function () {
		let index = $(this).data("index");
		emotionUpload(index);
	});

	function emotionUpload(reaction) {
		const data = {
			userId: userId,
			reaction: reaction,
			contentId: surveyCode
		}

		$.ajax({
			url: '/contentreaction/upload',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(data),
			xhrFields: {
				withCredentials: true
			},
			success: function (data) {
				if (data == "TRUE") {
					location.reload();
				}
			}
		})
	}
}

// ===================================================================================================== mobile

function init() {
	initDatepicker();		  // 달력
	initTime();				    // 시간
	initParticipants();		// 참여자 목록
	chkSubmitBtn();			  // 제출하기 버튼
	initSurvey();			    // 막대바, 인원
	replyListPc();			  // 댓글
	emotionPc();			    // 감정표현

	var treeObj = orgTreeObj();
	initTree(treeObj);

	$('#member_list').chkbox();
	$('#participants_list').chkbox();

	// 댓글 등록
	$(document).on('click', '.btn-comment-submit-pc', function () {
		replySavePc();
	})

	// 감정표현 추가 팝업
	$(document).on('click', '.btn-add-reaction-pc > img', function () {
		emotionUploadModalPc();
	})

	// 감정표현 추가
	$(document).on("click", ".reaction-pc", function () {
		let index = $(this).data("index");
		emotionUploadPc(index);
	});

	// 감정표현 리스트 팝업
	$(document).on('click', '#reaction-btn-pc > span', function () {
		emotionListModalPc()
	})

	// 통계 팝업
	$(document).on('click', '#btn-vote-list', function () {
		itemListModalPc();
	})

	// 엑셀 다운로드
	$(document).on('click', '#btnExcel', function () {
		getExcelDown();
	})
}

function initEvent() {
	$('#btnAddSurvey').on('click', appendSurvey);
	$('#btnSaveSurvey').on('click', modifySurvey);
	$('#btnRemoveSurvey').on('click', removeSurvey);
	$('#btnParticipants').on('click', participants);
	$('#btnParticipantsView').on('click', participantsView);
	$('#btnAppendParticipantsList').on('click', validateAppendDataToParticipantsList);
	$('#btnRemoveParticipantsList').on('click', removeParticipantsList);
	$('#btnSubmitSurvey').on('click', submitSurvey);

	$('#btnMemberByKeyword').on('click', memberByKeyword);
	$('#searchKeyword').on('keyup', function () {
		chkEnter(memberByKeyword);
	});

	$('.iconSurveyItemResultMember').on('click', surveyItemResultMember);
	$('#exportStatistics').on('click', exportStatistics);

	$('#btnNotiForm').on('click', notiForm);

	$('li.gnb').on('click', moveTab);
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
	console.log("movetab불림");
	var treeObj;
	if (type == 'organization') {
		console.log("organiztionBuddy불림");
		treeObj = orgTreeObj();
	} else if (type == 'dept_group') {
		treeObj = deptGroupTreeObj();
	} else if (type == 'buddy') {
		console.log("movetabBuddy불림");
		treeObj = buddyTreeObj(); // 내목록 트리로 전환
	} else {
		treeObj = commonGroupTreeObj();
	}

	initTree(treeObj);

	$('#member_list tbody').empty();
	$('#searchKeyword').val('');
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

function buddyTreeObj() {
	var opt = {};
	opt.topId = '0';
	opt.target = 'tree';
	opt.grpTopUri = '/organization/buddyListByPid'; // 새로 만들 API
	var handler = {
		_onClick: function(node, event) {
			$('#searchKeyword').val('');
			prevAct = 'tree';
			memberByBuddyId(node.data.key);
		},
		_onCreate: function(node, span) {
			console.log("📦 create");
			if (node.data.key == opt.topId) {
				obj = node;
				node.activate(true);
				node.expand(true);
			}
		},
		_appendAjax: function (node) {
			node.appendAjax({
				type: 'post',
				url: '/organization/buddyListByPid',
				dataType: 'json',
				data: { key: node.data.key },
				debugLazyDelay: 750
			});
		}
	}

	var obj = {};
	obj.opt = opt;
	obj.handler = handler;
	return obj;
}
function memberByBuddyId(key) {
	var obj = {};

	obj.url = '/organization/memberByBuddyId';
	obj.data = { key: key };
	obj.contentType = 'application/x-www-form-urlencoded; charset=UTF-8';

	console.log('[memberByBuddyId] ' + JSON.stringify(obj));
	ajaxCall(obj, appendMemberList);
}
function getExcelDown() {
	$.ajax({
		url: '/survey/export?surveyCode=' + surveyCode,
		type: 'POST',
		xhrFields: {
			responseType: 'blob'
		},
		success: function (blob, status, xhr) {
			const now = new Date();
			const pad = n => n.toString().padStart(2, '0');
			const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
			const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');

			a.href = url;
			a.download = `미니투표_${dateStr}_${timeStr}.xlsx`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);
		},
		error: function (xhr, status, error) {
			console.error("엑셀 다운로드 실패:", error);
		}
	});
}

// 통계 화면
function itemListModalPc() {
	let html = '';
	let num = 1;
	const list = surveyQuestionList;

	if (!document.querySelector('.item-user-pc')) {
		let div = document.createElement('div');
		div.setAttribute('class', 'item-user-pc');
		div.style.display = "none";  // 기본은 숨김
		document.querySelector('body').append(div);
	} else {
		$('.item-user-pc').children().remove();
	}

	html += `
        <div class="survey-modal-pc">
            <div class="survey-modal-div-pc">
                <div class="modal-tab-pc">
                    <button id="item-pc" class="tab-pc tab-on">항목별</button>
                    <button id="non-pc" class="tab-pc">미참여</button>
                </div>
    `;

	list.forEach(question => {
		html += `
            <div class="survey-modal-div2">
                <div class="modal-header-pc">
                    <span>Q${num++}. ${question.questionContents}</span>
                    <span class="question-meta-pc">${question.isMulti === 'Y' ? '복수 선택 가능' : '복수 선택 불가능'}</span>
                    ${question.isAnonymous === 'Y' ? '<span class="question-meta-pc">익명</span>' : ''}
                </div>
                <div class="modal-content">
        `;

		question.itemList.forEach(item => {
			const count = item.userList.length;
			html += `
                <div class="survey-item-group-pc">
                    <div class="survey-item-header-pc">
                        <span class="survey-item-title-pc">${item.itemContents}: </span>
                        <span class="survey-item-count-pc">${count}명</span>
                    </div>
            `;

			if (question.isAnonymous !== 'Y' || item.itemType === 'DESC') {
				html += `<ul class="survey-user-list-pc">`;

				if (count === 0) {
					html += `<li><div class="vote-team-pc">투표한 멤버가 없습니다.</div></li>`;
				} else {
					item.userList.forEach(userStr => {
						const user = JSON.parse(userStr);
						const name = question.isAnonymous === 'Y' ? '익명' : user.userName || user.userId;
						const dept = question.isAnonymous === 'Y' ? '' : user.deptName || '';

						html += `
                            <li>
                                <img src="/images/survey/img_profile.png" class="user-profile-pc">
                                <div class="user-info-pc">
                                    <span class="user-name-pc">${name}</span>
                                    <span class="user-team-pc">${dept}</span>
                                    ${item.itemType === 'DESC' ? `<div class="vote-desc-pc">${user.desc || ''}</div>` : ''}
                                </div>
                            </li>
                        `;
					});
				}

				html += `</ul>`;
			}
			html += `</div>`;
		});

		html += `
                </div>
            </div>
        `;
	});

	html += `
                <div class="excel-down">
                    <button class="button button_gray2" id="btnExcel">엑셀 다운로드</button>
                </div>
            </div>
        </div>
    `;

	$(".item-user-pc").empty().append(html).css('display', 'block');

	$('.tab-pc').off('click').on('click', function () {
		$('.tab-pc').removeClass('.tab-on');
		$(this).addClass('.tab-on');

		if ($(this).attr('id') === 'item-pc') {
			itemListModalPc();
		} else {
			getListByNonPc();
		}
	});
}

function getListByNonPc() {
	const data = survey;
	const member = data.memberList || [];

	let html = '';
	let $ul = $(".item-user-pc");

	if (!document.querySelector('.item-user-pc')) {
		let div = document.createElement('div');
		div.setAttribute('class', 'item-user-pc');
		document.querySelector('body').append(div);
	} else {
		$('.item-user-pc').children().remove();
	}

	html += `
            <div class="survey-modal-pc">
                <div class="survey-modal-div-pc">
                    <div class="modal-tab-pc">
                        <button id="item-pc" class="tab-pc">항목별</button>
                        <button id="non-pc" class="tab-pc tab-on">미참여</button>
                    </div>
                    <div class="modal-content-pc">
                        <ul class="member-list-pc">
    `;

	const nonList = member.filter(item => item.isComplete === 'N');

	if (nonList.length === 0) {
		html += `
            <li class="member-item-pc empty">
                <div class="info">미참여한 인원이 없습니다.</div>
            </li>
        `;
	} else {
		nonList.forEach(item => {
			html += `
                <li class="member-item-pc">
                    <div class="avatar item-non-pc">
                        <img src="/images/survey/img_profile.png" alt="사용자 사진" />
                        <div class="info-pc">
                            <div class="name-pc">${item.title}</div>
                            <div class="dept-pc">${item.deptName}</div>
                        </div>
                    </div>
                </li>
            `;
		});
	}

	html += `
                    </ul>
                </div>
            </div>
        </div>
    `;

	$ul.empty();
	$ul.append(html);
	$ul.css('display', 'block');

	$('.tab-pc').off('click').on('click', function () {
		$('.tab-pc').removeClass('tab-on');
		$(this).addClass('tab-on');

		if (this.id === 'item-pc') {
			itemListModalPc();
		} else {
			getListByNonPc();
		}
	});
}

// [ PC 댓글 & 감정표현 ]
function replyListPc() {
	$('#inputText-pc').val('');

	$.ajax({
		url: '/contentreply/list',
		type: 'POST',
		dataType: 'json',
		data: { contentId: surveyCode },
		success: function (data) {
			bindReplyListPc(data);
		},
		error: function (xhr, status, error) {
			console.error('댓글 불러오기 실패:', status, error);
		}
	});
}

function bindReplyListPc(data) {
	let html = '';

	const $reply = $('#reply-section-pc');
	const list = data.list
	replyNum = data.list.length;

	list.forEach(reply => {
		const formatted = formatToKoreanDateTime(reply.registDate);
		html += `
				<div class="comment-pc" id="${reply.replyId}">
				<img alt="사용자 사진" src="/images/survey/img_profile.png" style="margin-right: 10px;" />
				<div class="comment-content-pc">
					<div class="comment-header-pc">
					<span class="reply-author-pc">
						<strong class='reply-name-pc'>${reply.userName}</strong> / ${formatted}
					</span>
					${reply.myReply
				? `<div class="comment-actions-pc replyDiv-pc">
							<span class="action-btn-pc" onclick="replyModifyPc('${reply.replyId}')">수정&nbsp;|</span>
							<span class="action-btn-pc" onclick="replyDelete('${reply.replyId}')">삭제</span>
						</div>`
				: ""}
					</div>

					<p class="comment-text-pc" id="replyContent-pc">${reply.reply}</p>
				</div>
				</div>
  			`;
	});
	$reply.html(html);
}

function replyModifyPc(replyId) {
	let replyElement = document.querySelector(`[id="${replyId}"] #replyContent-pc`);
	let buttonContainer = document.querySelector(`[id="${replyId}"] .replyDiv-pc`);

	if (!replyElement || !buttonContainer) {
		console.error("수정할 댓글을 찾을 수 없습니다:", replyId);
		return;
	}

	replyCen = replyElement.innerText;

	let inputElement = document.createElement("textarea");
	inputElement.type = "text";
	inputElement.value = replyCen;
	inputElement.id = "setReplyContent-pc";

	replyElement.replaceWith(inputElement);

	buttonContainer.innerHTML = `
    <button class='action-btn-pc setBtn-pc' type='button' onclick='replySavePc("${replyId}")'>저장 |</button>
    <button class='action-btn-pc setBtn-pc' type='button' onclick='replyCancelPc("${replyId}")'>취소</button>
`;
	inputElement.focus();
}

function replySavePc(replyId = null) {
	let replyText;

	if (replyId) {
		let inputElement = document.querySelector(`[id="${replyId}"] #setReplyContent-pc`);

		if (!inputElement) {
			showAlert({
				message: '수정할 댓글을 찾을 수 없습니다.'
			})
			return;
		}

		replyText = inputElement.value;
	} else {
		replyText = $('#inputText-pc').val();
	}

	if (!replyText) {
		showAlert({
			message: '댓글 내용을 입력하세요.'
		})
		return;
	}

	if (replyId) {
		let replyElement = document.createElement("p");

		replyElement.id = "replyContent-pc";
		replyElement.style.fontSize = "14px";
		replyElement.style.margin = "5% 0";
		replyElement.innerText = replyText;

		document.querySelector(`[id="${replyId}"] #setReplyContent-pc`).replaceWith(replyElement);

		let buttonContainer = document.querySelector(`[id="${replyId}"] .replyDiv-pc`);
		if (buttonContainer) {
			buttonContainer.innerHTML = `
                <button class='action-btn-pc setFont-pc' type='button' name='replyModify' onclick='replyModifyPc("${replyId}")'>수정 |</button>
                <button class='action-btn-pc setFont-pc' type='button' name='replyDelete' onclick='replyDelete("${replyId}")'>삭제</button>
            `;
		}

		const data = {
			contentId: surveyCode,
			reply: replyText.trim(),
			replyId: replyId
		}

		$.ajax({
			url: '/contentreply/upload',
			type: 'POST',
			contentType: "application/json; charset=UTF-8",
			data: JSON.stringify(data),
			success: function (data) {
				if (data === '0') {
					location.reload();
				}
			}
		})

	} else {
		const data = {
			contentId: surveyCode,
			reply: replyText.trim(),
		}

		$.ajax({
			url: '/contentreply/upload',
			type: 'POST',
			contentType: "application/json; charset=UTF-8",
			data: JSON.stringify(data),
			success: function (data) {
				if (data === '0') {
					location.reload();
				}
			}
		})
	}
}

function replyCancelPc(replyId) {
	let inputElement = document.getElementById("setReplyContent-pc");
	let replyContainer = document.querySelector(`[id="${replyId}"] .replyDiv-pc`);

	if (!inputElement || !replyContainer) {
		console.error("취소할 댓글을 찾을 수 없습니다:", replyId);
		return;
	}

	let originalReply = document.createElement("p");
	originalReply.id = "replyContent-pc";
	originalReply.innerText = replyCen;

	inputElement.replaceWith(originalReply);

	replyContainer.innerHTML = `
        <span class="action-btn-pc" onclick="replyModifyPc('${replyId}')">수정&nbsp|</span>
        <span class="action-btn-pc" onclick="replyDelete('${replyId}')">삭제</span>
    `;
}

function emotionPc() {
	$.ajax({
		url: '/contentreaction',
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		type: 'POST',
		dataType: 'json',
		data: { contentId: surveyCode },
		success: function (data) {
			// 총 카운트
			totalReactions = data[12].total;
			emotionListPc();
		}
	})
}

function emotionListPc() {
	$.ajax({
		url: '/contentreaction/total/list',
		contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		type: 'POST',
		dataType: 'json',
		data: { contentId: surveyCode },
		success: function (data) {
			bindEmotionListPc(data);
		}
	})
}

function bindEmotionListPc(data) {
	let html = '';
	let list = data;
	let emotionCount = {};
	let userReacted = false;

	list.forEach(item => {
		let emotionNum = item.reaction;
		emotionCount[emotionNum] = (emotionCount[emotionNum] || 0) + 1;

		if (item.userId === userId) {
			userReacted = true;
		}
	})

	// 공감 & 댓글 개수 표시 
	$('#emotion-total-pc').text(totalReactions);
	$('#emotion-user-pc').text(replyNum);

	if (userReacted) {
		let emotion = `<span class="emoList-reply-pc cursorPointer emotion-cancle-pc" onclick="emotionCanclePc()">공감 취소</span>`
		$('#txt-emotion-cancle-pc').append(emotion);
	}

	if (totalReactions > 0) {
		Object.keys(emotionCount).forEach(emotion => {
			let iconSrc = emotionIcons[emotion]

			html += `
					<span class="emotion-img-pc">
						<img src='${iconSrc}' />
						${emotionCount[emotion]}
					</span>
			`
		})
	} else {
		html += `<span class="emotion-addContent-pc">가장 먼저 공감해 주세요.</span>`
	}
	$('#emotion-contents-pc').append(html);
}

function emotionCanclePc() {
	$('.emotion-cancle-pc').hide();

	let data = {
		userId: userId,
		reaction: 'remove',
		contentId: surveyCode
	}

	$.ajax({
		url: '/contentreaction/upload',
		type: 'POST',
		contentType: 'application/json',
		data: JSON.stringify(data),
		xhrFields: {
			withCredentials: true
		},
		success: function (data) {
			if (data === "TRUE") {
				location.reload();
			}
		}
	})
}

function emotionListModalPc() {
	$.ajax({
		url: '/contentreaction/total/list',
		contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		type: 'POST',
		dataType: 'json',
		data: { contentId: surveyCode },
		success: function (data) {
			bindEmotionListModalPc(data);
		}
	})
}

function bindEmotionListModalPc(data) {
	let html = '';
	let list = data;
	let total = list.length > 0 ? list.length : null;

	if (!document.querySelector('.emotion-user-pc')) {
		let div = document.createElement("div");
		div.setAttribute("class", "emotion-user-pc");
		document.querySelector('body').append(div);
	} else {
		$('.emotion-user-pc').children().remove();
	}

	html = `
            <div class="user-popup-pc">
                <div class="user-div-pc">
                    <strong class="header-strong-pc">공감한 유저</strong>
                </div>
                <div class="emotion-summary-pc">
                    <button class="click-pc active-pc emotionAll-pc">전체 ${total || 0}</button> `

	let reactionCount = {};
	let contentId = list.length > 0 ? list[0].contentId : null;

	list.forEach(item => {
		let reactionNum = item.reaction;
		reactionCount[reactionNum] = (reactionCount[reactionNum] || 0) + 1;
	});

	Object.keys(reactionCount).forEach(reactionNum => {
		html += `
                        <button class="click-pc emotionButton-pc" onclick="getListEmotionMenuPc(${reactionNum}, '${contentId}')">
                            <img src='${emotionIcons[reactionNum]}' />
                            <span>${reactionCount[reactionNum]}</span> 
                        </button>`;
	});

	html += `                
                </div>
            <div class="userList-pc"></div> `

	$(".emotion-user-pc").append(html);
	document.querySelector('.emotion-user-pc').style.display = "block";

	bindtotalEmotionMenuPc(data);

	$(document).on('click', '.emotionAll-pc', function () {
		bindtotalEmotionMenuPc(data);
	})

	const buttons = document.querySelectorAll(".click-pc");

	buttons.forEach(button => {
		button.addEventListener("click", function () {
			buttons.forEach(btn => btn.classList.remove("active-pc"));
			this.classList.add("active-pc");
		});
	});
}

function bindtotalEmotionMenuPc(data) {
	const list = data;
	let html = "";

	for (var i = 0; i < list.length; i++) {
		html += `
                <ul class="user-list-pc">
                    <li class="emotion-user-item-pc">
                        <div class="emotion-info-pc">
                            <div class="emotion-info-div-pc">
								<div class='userpic-pc'>
									<img alt='사용자 사진' src='/images/survey/img_profile.png' />
								</div>
								<div>
                                	<div class='name-pc'>${list[i].userName || ''}</div>
									<div class='dept-pc'>${list[i].deptName || ''}</div>
								</div>
                            </div>
                                <span class="emotion-icon-pc"><img src='${emotionIcons[list[i].reaction] || ''}'/></span>
                        </div>
                    </li>
                </ul>
            `;
	}

	$(".userList-pc").children().remove();
	$(".userList-pc").append(html);
}

function getListEmotionMenuPc(num, contentId) {
	$.ajax({
		url: "/contentreaction/" + num + "/list",
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		type: "POST",
		dataType: "json",
		data: { contentId: contentId },
		beforeSend: function (xhr) {
		},
		success: function (data) {
			bindListEmotionMenuPc(data);
		},
		error: function () {
		}
	});
}

function bindListEmotionMenuPc(data) {
	const list = data;
	let html = "";

	for (var i = 0; i < list.length; i++) {
		html += `
                <ul class="user-list-pc">
                    <li class="emotion-user-item-pc">
                        <div class="emotion-info-pc">
                            <div class="emotion-info-div-pc">
								<div class='userpic-pc'>
									<img alt='사용자 사진' src='/images/survey/img_profile.png' />
								</div>
								<div>
                                	<div class='name-pc'>${list[i].userName || ''}</div>
									<div class='dept-pc'>${list[i].deptName || ''}</div>
								</div>
                            </div>
                            <span class="emotion-icon-pc"><img src='${emotionIcons[list[i].reaction] || ''}'/></span>
                        </div>
                    </li>
                </ul>
            `;
	}

	$(".userList-pc").children().remove();
	$(".userList-pc").append(html);
}

function emotionUploadModalPc() {
	if (!document.querySelector('.emotionAdd-pc')) {
		let div = document.createElement("div");
		div.setAttribute("class", "emotionAdd-pc");
		document.querySelector('body').append(div);
	} else {
		$('.emotionAdd-pc').children().remove();
	}

	let html = `
    <div class="reaction-modal-pc" id="reactionModal-pc">
        <div class="reaction-container-pc">
            <div class="reaction-icons-pc">`;

	for (let i = 0; i < 6; i++) {
		html += `<button class="reaction-pc" data-index="${i}">
                    <img src="${emotionIcons[i]}" />
                 </button>`;
	}

	html += `        
            </div>
        </div>
    </div>`;

	$(".emotionAdd-pc").append(html);
	$(".emotionAdd-pc").show();

	setTimeout(function () {
		var popup = $(".reaction-modal-pc");
		var button = $(".btn-add-reaction-pc");

		if (button.length === 0) {
			console.error("Error: .emotionModal element not found");
			return;
		}

		var buttonOffset = button.offset();

		popup.css({
			top: buttonOffset.top + 40,
			left: buttonOffset.left - 8,
			zIndex: 999,
			position: "absolute",
		});
	}, 100);
}

function emotionUploadPc(reaction) {
	const data = {
		userId: userId,
		reaction: reaction,
		contentId: surveyCode
	}

	$.ajax({
		url: '/contentreaction/upload',
		type: 'POST',
		contentType: 'application/json',
		data: JSON.stringify(data),
		xhrFields: {
			withCredentials: true
		},
		success: function (data) {
			if (data == "TRUE") {
				location.reload();
			}
		}
	})
}

function initTime() {
	makeHour('sHour');
	makeHour('eHour');
	makeMinute('sMinute');
	makeMinute('eMinute');

	var tmpSHour = sHour;
	var tmpEHour = eHour;

	$('#sHour').val(tmpSHour);
	$('#eHour').val(tmpEHour);
	$('#sMinute').val(sMinute);
	$('#eMinute').val(eMinute);

	$('#eHour').prop('disabled', false);
	$('#eMinute').prop('disabled', false);
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
		var date = new Date();
		var year = date.getFullYear();
		var month = date.getMonth();
		var day = date.getDate();
		var today = year + '-' + lpad((month + 1) + '', 2, '0') + '-' + lpad(day + '', 2, '0');
		var theDay = $(this).val();

		if (today == theDay) {
			var nextDate = new Date(year, month, day);
			nextDate.setDate(nextDate.getDate() + 1);
			console.log(date, nextDate);

			$('#eHour').prop('disabled', true);
			$('#eMinute').prop('disabled', true);
			$('#eHour').val('18');
			$('#eMinute').val('00');
		} else {
			initTime();
		}
	});
	//var today = new Date();
	//$("#sDate").val($.datepicker.formatDate($.datepicker.ATOM, today));
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
function initParticipants() {
	var len = participantsList.length;
	var participants_title = [];

	if (len > 5) {
		var title = participantsList[0].title;
		title += '외 ' + (len - 1) + '명';

		participants_title.push(title);
	} else {
		participantsList.forEach(function (item) {
			var title = item.title;

			participants_title.push(title);
		});
	}

	$('#participants_title').text(participants_title);

	participantsList.forEach(function (item) {
		tmpParticipants.push(item);
	});
}
function initTree(obj) {
	var opt = obj.opt;
	var handler = obj.handler;
	tree = new Tree(opt, handler);
	tree.bind();

	tree.reload();
}
function initSurvey() {
	$('input:radio[name="isOpen"]:radio').prop('checked', false);
	$('input:radio[name="isOpen"]:radio[value="' + isOpen + '"]').prop('checked', true);
	var len = surveyResult.length;

	if (isWriter == 'N') {						// 참여자
		if (isOpen == 'N') {					// 비공개일 경우
			$('.iconSurveyItemResultMember').hide();
			$('.chart').hide();
		} else if (isOpen == 'Y' && len == 0) {	// 공개이고 제출 전일 경우
			$('.iconSurveyItemResultMember').hide();
			$('.chart').hide();
		}
	}

	if (status == 'W') {
		$('#question_area').survey();
		$('#question_area').setQuestions(surveyQuestionList);
	} else {
		initSurveyResult();
	}

	initSurveyItemAggregate();
}
function appendSurvey() {
	$('#question_area').appendSurvey();
}
function chkSubmitBtn() {
	const now = new Date();
	const end = new Date(datetime('e'));


	// 제출 마감 시간 지난 경우
	if (end < now) {
		$('#btnSubmitSurvey')
		.removeClass('button_survey')
		.addClass('button_survey_disabled')
		.prop('disabled', true)
		.text('제출마감');
		return; // 여기서 함수 종료
	}

	//	userId 동일한지 확인
	// 다르면 버튼 비활성화
	if (!hasTmpParticipants(userId)) {
		$('#btnSubmitSurvey')
			.removeClass('button_survey')
			.addClass('button_survey_disabled')
			.prop('disabled', true);

		// 같으면 버튼 활성화 
	} else {
		$('#btnSubmitSurvey')
			.removeClass('button_survey_disabled')
			.addClass('button_survey')
			.prop('disabled', false);
	}
}
function initSurveyResult() {
	var len = surveyResult.length;
	if (len > 0) {
		$('#btnSubmitSurvey')
			.removeClass('button_survey')
			.addClass('button_survey_disabled')
			.text('제출완료')
			.prop('disabled', true);let tmpParticipants = [];
		let emotionIcons = {};
		let totalReactions = '';
		let questionCode = "";
		let replyNum = '';

		// $(function () {
		// 	init();
		// 	initEvent();
		// 	mobileInit();
		// });

		function mobileInit() {
			replyList();						// 댓글
			emotion();							// 감정표현
			getRemainingHours();				// 남은 투표 시간 계산
			bindVoteButton(survey);				// 투표종료 버튼
			surveyQuestionListMobile();			// 기타의견 라디오 선택 시 활성화

			// 투표 여부, 종료 여부에 따른 진행바
			if (isDone === "Y" || status === "Y") surveyDoneMobile();

			// questionCode 값
			surveyQuestionList.forEach(item => {
				let code = item.questionCode
				questionCode = code;
			});

			// 체크박스 전체선택
			$(document).on('change', '.select-all', function () {
				const questionCode = this.id.replace('allCheck_', '');

				const $card = $(this).closest('.question-card');
				const $options = $card.find("input[name='" + questionCode + "']");

				$options.prop('checked', this.checked);
			});

			// 수정
			$(document).on('click', '#vote-update', function () {
				const payload = {
					survey: survey,
					questionList: surveyQuestionList,
					participantsList: participantsList
				};
				sessionStorage.setItem('list', JSON.stringify(payload));
				location.href = '/survey/regist?surveyCode=' + encodeURIComponent(survey.surveyCode);
			})

			// 삭제
			$('#vote-delete').on('click', removeSurveyMobile);

			// 더보기 팝업
			$('#moreBtn').on('click', function () {
				$('.popupArea').css('display', 'block');
			})

			// 댓글 등록
			$(document).on('click', '.btn-comment-submit', function () {
				replySave();
			})

			// 감정표현 추가 팝업
			$(document).on('click', '.btn-add-reaction > img', function () {
				emotionUploadModal();
			})

			// 감정표현 리스트 팝업
			$(document).on('click', '#reaction-btn > span', function () {
				emotionListModal()
			})

			// 감정표현 아이콘
			for (let i = 0; i < 12; i++) {
				emotionIcons[i] = `/images/survey/ic_chat_recattion_small_${i}.svg`;
			}

			$(document).mouseup(function (e) {
				var LayerPopup1 = $(".popupArea");
				var LayerPopup2 = $(".emotionAdd");
				var LayerPopup3 = $(".emotion-user");

				var pcLayerPopup1 = $(".emotionAdd-pc");
				var pcLayerPopup2 = $(".emotion-user-pc");
				var pcLayerPopup3 = $(".item-user-pc");

				if (LayerPopup1.has(e.target).length === 0) {
					$(".popupArea").css("display", "none");
				}

				if (LayerPopup2.has(e.target).length === 0) {
					$(".emotionAdd").css("display", "none");
				}

				if (LayerPopup3.has(e.target).length === 0) {
					$(".emotion-user").css("display", "none");
				}

				if (pcLayerPopup1.has(e.target).length === 0) {
					$(".emotionAdd-pc").css("display", "none");
				}

				if (pcLayerPopup2.has(e.target).length === 0) {
					$(".emotion-user-pc").css("display", "none");
				}

				if (pcLayerPopup3.has(e.target).length === 0) {
					$(".item-user-pc").css("display", "none");
				}
			});
		}

// 투표할때 값 확인
		function validateSurveySelectMobile() {
			var result = true;

			var questionList = $('.mobile-questions');
			questionList.each(function () {
				var question = $('.mobile-questions');
				var len_checked = question.find('.option-item > label > input:checked').length;

				if (len_checked == 0) {
					showAlert({
						message: '선택하지 않은 설문 항목이 있습니다.'
					});
					result = false;
					return false;
				} else {
					var $items = question.find('.option-item > label > input:checked');
					$items.each(function () {
						var $item = $(this);
						var itemCode = $item.val();
						var itemType = $item.data('itemType');
						if (itemType == 'DESC') {
							var desc = $('#desc_' + itemCode).val();
							if (desc == '') {
								showAlert({
									message: '서술형 항목에 내용을 입력해 주세요.'
								});
								result = false;
								return false;
							}
						}
					});
				}
			});
			return result;
		}

// 투표
		function surveySubmitMobile() {
			if (validateSurveySelectMobile()) {
				var itemList = [];
				var descList = [];

				var obj = {};
				var data = {};
				data.surveyCode = surveyCode;
				data.itemList = itemList;
				data.descList = descList;

				obj.url = '/survey/submitSurvey';
				obj.data = data;
				obj.contentType = 'json';

				var $items = $('.option-item > label > input:checked');
				$items.each(function () {
					var $item = $(this);
					var questionCode = $item.attr('name');
					var itemCode = $item.val();
					var itemType = $('#desc_' + itemCode).length > 0 ? 'DESC' : 'CHOICE';


					var itemObj = {
						questionCode: questionCode,
						itemCode: itemCode,
						itemType: itemType
					};
					itemList.push(itemObj);

					var $option = $item.closest('.option-item');
					var descText = ($option.find('#desc_' + itemCode).val() || '').trim();

					if (descText) {
						descList.push({
							questionCode: questionCode,
							itemCode: itemCode,
							desc: descText
						});
					}
				});
				ajaxCall(obj, submitSurveyHandlerMobile);
			}
		}

		function submitSurveyHandlerMobile(data) {
			var code = data.code;

			if (code == 'fail') {
				showAlert({
					message: '적용에 실패하였습니다. 잠시후 다시 시도해주세요.'
				});
				return
			} else {
				location.reload();
			}
		}

		function surveyQuestionListMobile() {
			surveyQuestionList.forEach(q => {
				const code = q.itemCode;
				const $radio = $(`#radio_${code}`);
				const $desc = $(`#desc_${code}`);
				$desc.prop('disabled', !$radio.is(':checked'));
			})

			$('.mobile-questions').on('change', 'input[id^=radio_]', function () {
				const code = this.id.split('-')[1];
				const $desc = $(`#desc_${code}`);
				$desc.prop('disabled', !this.checked);

			})
		}

// 투표하기 이후 진행바
		function surveyDoneMobile() {
			const totalParticipants = survey.memberList.length;
			let $newVoteNum = '';

			surveyQuestionList.forEach(question => {
				const list = question.itemList;
				console.log(list);

				const qCode = question.questionCode;
				const $card = $(`.question-card:has(input[name='${qCode}'])`);
				const $lis = $card.find('.option-item');

				const countMap = surveyItemAggregate.reduce((map, x) => {
					map[x.key] = x.val;
					return map;
				}, {});

				const myChoices = surveyResult
				.filter(r => r.questionCode === qCode)
				.map(r => r.itemCode);

				$lis.each((_, li) => {
					const $li = $(li);
					const $input = $li.find('input');
					const code = $input.val();
					const cnt = countMap[code] || 0;
					const pct = Math.round(cnt / totalParticipants * 100);
					const isMine = myChoices.includes(code);

					$input.prop({ checked: isMine, disabled: true });

					$li.find('.progress, .vote-num').remove();

					const $progress = $('<div>').addClass('progress')
					.append(
							$('<div>')
							.addClass('bar-base')
							.css('width', `${pct}%`)
					);
					if (isMine) {
						$progress.append(
								$('<div>')
								.addClass('bar-mine')
								.css('width', `${pct}%`)
						);
					}

					// 현재 code에 해당하는 item
					const matched = list.find(item => item.itemCode === code) || {};
					const itemType = matched.itemType || question.itemType;
					const itemLabel = matched.label || $li.find('label span').text();

					$newVoteNum = $('<span>')
					.addClass('vote-num')
					.text(`${cnt}명`)
					.data({
						itemCode: code,
						surveyCode: surveyCode,
						itemType: itemType,
						isAnonymous: question.isAnonymous,
						isMulti: question.isMulti
					})
					.on('click', function () {
						const d = $(this).data();

						surveyItemResultMemberMobile(
								d.itemCode,
								d.surveyCode,
								d.itemType,
								d.isAnonymous,
								d.isMulti
						)
					});

					const $label = $li.find('label');
					const $detachedSpan = $label.find('span').detach();
					$label.remove();

					const $spanWrapper = $('<div>')
					.addClass('span-wrapper')
					.append($('<span>').text(itemLabel))
					.append($newVoteNum);

					$li.empty()
					.append($spanWrapper)
					.append($progress);

					$progress.prepend($input);
				});
				$card.find('.card-footer').hide();
			});

			$('.user-btn-submit').prop('disabled', true);
			$('.progress > input').css('display', 'none');

			// 진행중 | 참여자 | 비공개 투표일 경우
			if (
					survey.status === "N" &&
					survey.isWriter === "N" &&
					survey.isOpen === "N"
			) {
				$('.option-item .progress, .option-item .vote-num').remove();
			}
		}

		function bindOtherDescPopup(data) {
			const list = data.list || [];

			let $modal = $('#otherTextModal');
			if (!$modal.length) {
				$modal = $(`
					<div id="otherTextModal" class="modal-overlay">
						<div class="modal-box">
						<button class="close-btn">&times;</button>
						<h3>기타의견</h3>
						<ul class="other-list"></ul>
						</div>
					</div>
				`).appendTo('body');
				$modal.find('.close-btn').on('click', () => $modal.hide());
			}

			const $ul = $modal.find('.other-list').empty();

			$ul.addClass('vote-modal-list')
			.empty();

			if (list.length) {
				// 익명 X
				if (data.req.isAnonymous === 'N') {
					list.forEach(r => {
						$ul.append(
								$('<li>').addClass('vote-modal-item').append(
										// 사용자명
										$('<span>')
										.addClass('vote-modal-username')
										.text(r.userName || ''),
										// 의견
										$('<span>')
										.addClass('vote-modal-comment')
										.text(r.desc || '')
								)
						);
					});
					// 익명 O
				} else {
					list.forEach(r => {
						$ul.append(
								$('<li>').addClass('vote-modal-item').append(
										// 의견
										$('<span>')
										.addClass('vote-modal-comment')
										.text(r.desc || '')
								)
						);
					});
				}
			} else {
				$ul.append(
						$('<li>').text('투표된 기타의견이 없습니다.')
				);
			}
			$modal.css('display', 'flex');
		}

// 참여자 리스트
		function surveyItemResultMemberMobile(itemCode, surveyCode, itemType, isAnonymous, isMulti) {
			const obj = {
				url: '/survey/surveyItemResultMember',
				data: { surveyCode, itemCode, itemType, isAnonymous },
				contentType: 'json'
			};

			ajaxCall(obj, function (data) {
				surveyItemResultMemberHandlerMobile(data, itemType);
			});
		}

		function surveyItemResultMemberHandlerMobile(data, itemType) {
			var code = data.code;

			if (code == 'fail') {
				showAlert({
					message: '적용에 실패하였습니다. 잠시후 다시 시도해 주세요.'
				})
			} else {
				if (itemType === 'DESC') {
					bindOtherDescPopup(data);
				} else {
					// 익명이 아닐때만
					if (data.req.isAnonymous === "N") {
						bindsubmitPopup(data);
					}
				}
			}
		}

		function bindsubmitPopup(data) {
			const list = data.list || [];

			let $modal = $('#participantModal');
			if (!$modal.length) {
				$modal = $(`
					<div id="participantModal" class="modal-overlay">
						<div class="modal-box">
							<button class="close-btn">&times;</button>
							<h3>참여자 리스트</h3>
							<ul class="other-list"></ul>
						</div>
					</div>
				`).appendTo('body');
				$modal.find('.close-btn').on('click', () => $modal.hide());
			}
			const $ul = $modal.find('.other-list').empty();

			if (list.length) {
				list.forEach(user => {
					$ul.append(
							$('<li>').text(user.userName || '')
					);
				});
			} else {
				$ul.append(
						$('<li>').text('투표한 참여자가 없습니다.')
				);
			}
			$modal.css('display', 'flex');
		}

		function removeSurveyMobile() {
			showPopup({
				title: "설문 삭제",
				message: "설문을 삭제하시겠습니까?",
				optionsHTML: ``,
				onConfirm: () => {
					var obj = {};
					var data = {};
					data.surveyCode = surveyCode;

					obj.url = '/survey/removeSurvey';
					obj.data = data;
					obj.contentType = 'json';

					console.log(JSON.stringify(obj));

					ajaxCall(obj, removeSurveyHandlerMobile);
				}
			});
		}

		function removeSurveyHandlerMobile(data) {
			var code = data.code;

			if (code == 'fail') {
				showAlert({
					message: "적용에 실패하였습니다. 잠시후 다시 시도해주세요."
				})
				return;
			} else {
				location.href = '/survey/'
			}
		}

		function bindVoteButton(survey) {
			let html = '';

			const data = survey;
			const userList = data.memberList || [];
			let userLen = [];

			// 투표 참여 인원
			userList.forEach(function (user) {
				if (user.isComplete == "Y") {
					userLen.push(user.key);
				}
			})

			// 참여자 X / 작성자 O
			if (data.isMember === "N") {
				html += `
			<div>
				<button class="user-btn-submit-dis" disabled>투표하기</button>
			</div>
			`
			} else {
				// 투표 마감
				if (data.status === "C") {
					html += `
				<div>
					<button class="user-btn-submit-dis" disabled>투표종료</button>
				</div>
				`
				} else {
					// 투표 전
					if (data.isDone === "N") {
						html += `
				<div>
					<button id="btnSubmitSurvey" class="user-btn-submit" onclick='surveySubmitMobile();'>투표하기</button>
				</div>
				`
						// 투표 후
					} else {
						html += `
				<div>
					<button class="user-btn-submit-dis" disabled>투표완료</button>
				</div>
				`
					}
				}
			}

			html += `
			<div class='participation-div'>
				<div class='participation'>
					<span id='participation-span'>${userLen.length}명 참여</span>
				</div>
				<div>
					<img src='/images/survey/btn_component_next_bk.svg' />
				</div>
			</div>

			`
			$('.mobile-actions').append(html);

			$(document).on('click', '#participation-span', function () {
				voteUserList(userList);
			})

			$(document).on('click', '#vote-list', function () {
				voteUserList(userList);
			})
		}

		function getRemainingHours() {
			let html = '';

			const endDatetime = survey.endDatetime;
			const end = new Date(endDatetime);
			const now = new Date();
			const diffMs = end - now;
			const times = Math.floor(diffMs / (1000 * 60 * 60));

			if (times <= 0) {
				html = `<p><img src="/images/survey/ic_survey_time2.svg" />이미 종료된 투표입니다.</p>`;
			} else if (times > 24) {
				const day = times / 24;
				const days = parseInt(day);

				html = `<p>
					<img src="/images/survey/ic_survey_time2.svg" />투표가&nbsp;<strong id="end-time">${days}일</strong>&nbsp;후에 종료됩니다.
				</p> `;
			} else {
				html = `<p>
					<img src="/images/survey/ic_survey_time2.svg" />투표가&nbsp;<strong id="end-time">${times}시간</strong>&nbsp;후에 종료됩니다.
				</p> `;
			}
			$('.mobile-notice').append(html);
		}

		function goBack(url) {
			if (url === 'detail') {
				location.href = '/survey/article/' + surveyCode;
			} else {
				location.href = '/survey/';
			}
		}

// 통계 화면
		function voteUserList(data) {
			const $container = $('.survey-list-mobile').empty();

			const headerHtml = `
						<div class="mobile-header">
						<div class="mobile-header-left">
							<span class="logo">
							<img src="/images/survey/ic_title_back_w.svg" alt="이전" onclick="goBack('main')" />
							</span>
						</div>
						<div class="mobile-header-center"><span>투표현황</span></div>
						<div class="mobile-header-right">
							<span class="menu-icon" onclick="goBack('detail')">상세 페이지</span>
						</div>
						</div>
						<div class="mobile-header vote-header">
						<div class="tabs">
							<button id="item" class="tab active">항목별</button>
							<button id="non" class="tab">미참여</button>
						</div>
						</div>
						<ul class="member-list"></ul>
					`;
			$container.append(headerHtml);

			$('.tab').on('click', function () {
				const $this = $(this);
				$('.tab').removeClass('active');
				$this.addClass('active');
			})

			$('#item').on('click', function () {
				getListByItem();
			})

			$('#non').on('click', function () {
				getListByNon(data);
			})

			$('#item').trigger('click');
		};

// 통계 - 항목별
		function getListByItem() {
			const $ul = $('.member-list');
			const list = surveyQuestionList;
			let num = 1;
			let html = '';

			list.forEach(question => {
				html += `
            <div class="vote-style">
                <div class="survey-question">
                    <div class="question-title">Q${num++}. ${question.questionContents}</div>
                    <div class="anonymous-type">
        `;

				html += `<div class="question-type">${question.isMulti === 'Y' ? '복수 선택 가능' : '복수 선택 불가능'}</div>`;
				if (question.isAnonymous === 'Y') {
					html += `<div class="question-type"> · 익명</div>`;
				}

				html += `</div>
            </div>
        <div class="vote-group-list">`;

				question.itemList.forEach(item => {
					const count = item.userList.length;

					// 익명 + 기타의견(DESC) 아닐 경우 명수만 표시
					if (question.isAnonymous === 'Y' && item.itemType !== 'DESC') {
						html += `
                    <div class="vote-group">
                        <div class="vote-group-title">
                            <span class="group-name">${item.itemContents}:</span>
                            <span class="group-count">${count}명</span>
                        </div>
                    </div>
                `;
					} else {
						html += `
                    <div class="vote-group">
                        <div class="vote-group-title">
                            <span class="group-name">${item.itemContents}:</span>
                            <span class="group-count">${count}명</span>
                        </div>
                        <ul class="vote-member-list">
                `;

						if (count === 0) {
							html += `
                        <li class="vote-member-item empty">
                            <div class="vote-team">투표한 멤버가 없습니다.</div>
                        </li>
                    `;
						} else {
							item.userList.forEach(userStr => {
								let user = null;
								try {
									user = JSON.parse(userStr);
								} catch (e) { }
								if (!user) return;

								let name = '익명';
								let dept = '';
								if (question.isAnonymous !== 'Y') {
									name = user.userName || user.userId;
									dept = user.deptName || '';
								}
								if (item.itemType === 'DESC') {
									html += `
                                <li class="vote-member-item">
                                    <img src="/images/survey/img_profile.png" alt="사용자 사진" />
                                    <div class="vote-setting">
                                        <div class="vote-name">${name}</div>
                                        <div class="vote-team">${dept}</div>
                                        <div class="vote-desc">${user.desc || ''}</div>
                                    </div>
                                </li>
                            `;
								} else {
									html += `
                                <li class="vote-member-item">
                                    <img src="/images/survey/img_profile.png" alt="사용자 사진" />
                                    <div class="vote-setting">
                                        <div class="vote-name">${name}</div>
                                        <div class="vote-team">${dept}</div>
                                    </div>
                                </li>
                            `;
								}
							});
						}
						html += `
                        </ul>
                    </div>
                `;
					}
				});

				html += `</div></div>`;
			});

			$ul.empty();
			$ul.append(html);
		}

// 통계 - 미참여
		function getListByNon(data) {
			const list = data || [];
			let html = '';
			const $ul = $('.member-list');

			// 미참여(N)인 인원만 필터링
			const nonParticipants = list.filter(item => item.isComplete === 'N');

			if (nonParticipants.length === 0) {
				// 미참여 인원 없음
				html = `
            <li class="member-item empty">
                <div class="info">미참여한 인원이 없습니다.</div>
            </li>
        `;
			} else {
				// 미참여 인원 목록 출력
				nonParticipants.forEach(item => {
					html += `
                <li class="member-item">
                    <div class="avatar item-non">
                        <img src="/images/survey/img_profile.png" alt="사용자 사진" />
                        <div class="info">
                            <div class="name">${item.title}</div>
                            <div class="dept">${item.deptName}</div>
                        </div>
                    </div>
                </li>
            `;
				});
			}

			$ul.empty();
			$ul.append(html);
		}

// 댓글 & 감정표현
		function replyList() {
			$('#inputText').val('');

			$.ajax({
				url: '/contentreply/list',
				type: 'POST',
				dataType: 'json',
				data: { contentId: surveyCode },
				success: function (data) {
					bindReplyList(data);
				},
				error: function (xhr, status, error) {
					console.error('댓글 불러오기 실패:', status, error);
				}
			});
		}

		function formatToKoreanDateTime(rawDateStr) {
			const safeStr = rawDateStr.replace("KST", "GMT+0900");
			const d = new Date(safeStr);

			if (isNaN(d)) {
				const ts = Date.parse(rawDateStr);
				if (!isNaN(ts)) d = new Date(ts);
			}

			const pad = n => String(n).padStart(2, "0");
			const YYYY = d.getFullYear();
			const MM = pad(d.getMonth() + 1);
			const DD = pad(d.getDate());
			const hh = pad(d.getHours());
			const mm = pad(d.getMinutes());

			return `${YYYY}.${MM}.${DD} / ${hh}:${mm}`;
		}

		function bindReplyList(data) {
			let html = '';

			const $reply = $('#reply-section');
			const list = data.list
			replyNum = data.list.length;

			list.forEach(reply => {
				const formatted = formatToKoreanDateTime(reply.registDate);
				html += `
				<div class="comment" id="${reply.replyId}">
				<img alt="사용자 사진" src="/images/survey/img_profile.png" style="margin-right: 10px;" />
				<div class="comment-content">
					<div class="comment-header">
					<span class="reply-author">
						<strong class='reply-name'>${reply.userName}</strong> / ${formatted}
					</span>
					${reply.myReply
						? `<div class="comment-actions replyDiv">
							<span class="action-btn" onclick="replyModify('${reply.replyId}')">수정&nbsp;|</span>
							<span class="action-btn" onclick="replyDelete('${reply.replyId}')">삭제</span>
						</div>`
						: ""}
					</div>

					<p class="comment-text" id="replyContent">${reply.reply}</p>
				</div>
				</div>
  			`;
			});
			$reply.html(html);
		}

		function replyModify(replyId) {
			let replyElement = document.querySelector(`[id="${replyId}"] #replyContent`);
			let buttonContainer = document.querySelector(`[id="${replyId}"] .replyDiv`);

			if (!replyElement || !buttonContainer) {
				console.error("수정할 댓글을 찾을 수 없습니다:", replyId);
				return;
			}

			replyCen = replyElement.innerText;

			let inputElement = document.createElement("textarea");
			inputElement.type = "text";
			inputElement.value = replyCen;
			inputElement.id = "setReplyContent";

			replyElement.replaceWith(inputElement);

			buttonContainer.innerHTML = `
    <button class='action-btn setBtn' type='button' onclick='replySave("${replyId}")'>저장 |</button>
    <button class='action-btn setBtn' type='button' onclick='replyCancel("${replyId}")'>취소</button>
`;
			inputElement.focus();
		}

		function replySave(replyId = null) {
			let replyText;

			if (replyId) {
				let inputElement = document.querySelector(`[id="${replyId}"] #setReplyContent`);

				if (!inputElement) {
					showAlert({
						message: '수정할 댓글을 찾을 수 없습니다.'
					})
					return;
				}

				replyText = inputElement.value;
			} else {
				replyText = $('#inputText').val();
			}

			if (!replyText) {
				showAlert({
					message: '댓글 내용을 입력하세요.'
				})
				return;
			}

			if (replyId) {
				let replyElement = document.createElement("p");

				replyElement.id = "replyContent";
				replyElement.style.fontSize = "14px";
				replyElement.style.margin = "5% 0";
				replyElement.innerText = replyText;

				document.querySelector(`[id="${replyId}"] #setReplyContent`).replaceWith(replyElement);

				let buttonContainer = document.querySelector(`[id="${replyId}"] .replyDiv`);
				if (buttonContainer) {
					buttonContainer.innerHTML = `
                <button class='action-btn setFont' type='button' name='replyModify' onclick='replyModify("${replyId}")'>수정 |</button>
                <button class='action-btn setFont' type='button' name='replyDelete' onclick='replyDelete("${replyId}")'>삭제</button>
            `;
				}

				const data = {
					contentId: surveyCode,
					reply: replyText.trim(),
					replyId: replyId
				}

				$.ajax({
					url: '/contentreply/upload',
					type: 'POST',
					contentType: "application/json; charset=UTF-8",
					data: JSON.stringify(data),
					success: function (data) {
						if (data === '0') {
							location.reload();
						}
					}
				})

			} else {
				const data = {
					contentId: surveyCode,
					reply: replyText.trim(),
				}

				$.ajax({
					url: '/contentreply/upload',
					type: 'POST',
					contentType: "application/json; charset=UTF-8",
					data: JSON.stringify(data),
					success: function (data) {
						if (data === '0') {
							location.reload();
						}
					}
				})
			}
		}

		function replyCancel(replyId) {
			let inputElement = document.getElementById("setReplyContent");
			let replyContainer = document.querySelector(`[id="${replyId}"] .replyDiv`);

			if (!inputElement || !replyContainer) {
				console.error("취소할 댓글을 찾을 수 없습니다:", replyId);
				return;
			}

			let originalReply = document.createElement("p");
			originalReply.id = "replyContent";
			originalReply.innerText = replyCen;

			inputElement.replaceWith(originalReply);

			replyContainer.innerHTML = `
        <span class="action-btn" onclick="replyModify('${replyId}')">수정&nbsp|</span>
        <span class="action-btn" onclick="replyDelete('${replyId}')">삭제</span>
    `;
		}

		function replyDelete(replyId) {
			$.ajax({
				url: "/contentreply/delete",
				beforeSend: function (xhr) {
				},
				contentType: "application/json",
				type: "POST",
				data: JSON.stringify({ replyId: replyId }),
				dataType: "json",
				success: function (data) {
					if (data == "0") {
						location.reload();
					}
				},
				error: function (error) {
					console.log(error);
				}
			});
		}

		function emotion() {
			$.ajax({
				url: '/contentreaction',
				contentType: "application/x-www-form-urlencoded; charset=UTF-8",
				type: 'POST',
				dataType: 'json',
				data: { contentId: surveyCode },
				success: function (data) {
					// 총 카운트
					totalReactions = data[12].total;
					emotionList();
				}
			})
		}

		function emotionList() {
			$.ajax({
				url: '/contentreaction/total/list',
				contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
				type: 'POST',
				dataType: 'json',
				data: { contentId: surveyCode },
				success: function (data) {
					bindEmotionList(data);
				}
			})
		}

		function bindEmotionList(data) {
			let html = '';
			let list = data;
			let emotionCount = {};
			let userReacted = false;

			list.forEach(item => {
				let emotionNum = item.reaction;
				emotionCount[emotionNum] = (emotionCount[emotionNum] || 0) + 1;

				if (item.userId === userId) {
					userReacted = true;
				}
			})

			// 공감 & 댓글 개수 표시
			$('#emotion-total').text(totalReactions);
			$('#emotion-user').text(replyNum);

			if (userReacted) {
				let emotion = `<span class="emoList-reply cursorPointer emotion-cancle" onclick="emotionCancle()">공감 취소</span>`
				$('#txt-emotion-cancle').append(emotion);
			}

			if (totalReactions > 0) {
				Object.keys(emotionCount).forEach(emotion => {
					let iconSrc = emotionIcons[emotion]

					html += `
					<span class="emotion-img">
						<img src='${iconSrc}' />
						${emotionCount[emotion]}
					</span>
			`
				})
			} else {
				html += `<span class="emotion-addContent">가장 먼저 공감해 주세요.</span>`
			}
			$('#emotion-contents').append(html);
		}

		function emotionCancle() {
			$('.emotion-cancle').hide();

			let data = {
				userId: userId,
				reaction: 'remove',
				contentId: surveyCode
			}

			$.ajax({
				url: '/contentreaction/upload',
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(data),
				xhrFields: {
					withCredentials: true
				},
				success: function (data) {
					if (data === "TRUE") {
						location.reload();
					}
				}
			})
		}

		function emotionListModal() {
			$.ajax({
				url: '/contentreaction/total/list',
				contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
				type: 'POST',
				dataType: 'json',
				data: { contentId: surveyCode },
				success: function (data) {
					bindEmotionListModal(data);
				}
			})
		}

		function bindEmotionListModal(data) {
			let list = data;

			let html = '';
			let total = list.length > 0 ? list.length : null;

			if (!document.querySelector('.emotion-user')) {
				let div = document.createElement("div");
				div.setAttribute("class", "emotion-user");
				document.querySelector('body').append(div);
			} else {
				$('.emotion-user').children().remove();
			}

			html = `
            <div class="user-popup">
                <div class="user-div">
                    <strong class="header-strong">공감한 유저</strong>
                </div>
                <div class="emotion-summary">
                    <button class="click active emotionAll">전체 ${total || 0}</button> `

			let reactionCount = {};
			let contentId = list.length > 0 ? list[0].contentId : null;

			list.forEach(item => {
				let reactionNum = item.reaction;
				reactionCount[reactionNum] = (reactionCount[reactionNum] || 0) + 1;
			});

			Object.keys(reactionCount).forEach(reactionNum => {
				html += `
                        <button class="click emotionButton" onclick="getListEmotionMenu(${reactionNum}, '${contentId}')">
                            <img src='${emotionIcons[reactionNum]}' />
                            <span>${reactionCount[reactionNum]}</span> 
                        </button>`;
			});

			html += `                
                </div>
            <div class="userList"></div> `

			$(".emotion-user").append(html);
			document.querySelector('.emotion-user').style.display = "block";

			bindtotalEmotionMenu(data);

			$('.emotionAll').on('click', function () {
				bindtotalEmotionMenu(data);
			})

			const buttons = document.querySelectorAll(".click");

			buttons.forEach(button => {
				button.addEventListener("click", function () {
					buttons.forEach(btn => btn.classList.remove("active"));
					this.classList.add("active");
				});
			});
		}

		function bindtotalEmotionMenu(data) {
			const list = data;
			let html = "";

			for (var i = 0; i < list.length; i++) {
				html += `
                <ul class="user-list">
                    <li class="emotion-user-item">
                        <div class="emotion-info">
                            <div class="emotion-info-div">
								<div class='userpic'>
									<img alt='사용자 사진' src='/images/survey/img_profile.png' />
								</div>
								<div>
                                	<div class='name'>${list[i].userName || ''}</div>
									<div class='dept'>${list[i].deptName || ''}</div>
								</div>
                            </div>
                                <span class="emotion-icon"><img src='${emotionIcons[list[i].reaction] || ''}'/></span>
                        </div>
                    </li>
                </ul>
            `;
			}

			$(".userList").children().remove();
			$(".userList").append(html);
		}

		function getListEmotionMenu(num, contentId) {
			$.ajax({
				url: "/contentreaction/" + num + "/list",
				contentType: "application/x-www-form-urlencoded; charset=UTF-8",
				type: "POST",
				dataType: "json",
				data: { contentId: contentId },
				beforeSend: function (xhr) {
				},
				success: function (data) {
					bindListEmotionMenu(data);
				},
				error: function () {
				}
			});
		}

		function bindListEmotionMenu(data) {
			const list = data;
			let html = "";

			for (var i = 0; i < list.length; i++) {
				html += `
                <ul class="user-list">
                    <li class="emotion-user-item">
                        <div class="emotion-info">
                            <div class="emotion-info-div">
								<div class='userpic'>
									<img alt='사용자 사진' src='/images/survey/img_profile.png' />
								</div>
								<div>
                                	<div class='name'>${list[i].userName || ''}</div>
									<div class='dept'>${list[i].deptName || ''}</div>
								</div>
                            </div>
                            <span class="emotion-icon"><img src='${emotionIcons[list[i].reaction] || ''}'/></span>
                        </div>
                    </li>
                </ul>
            `;
			}

			$(".userList").children().remove();
			$(".userList").append(html);
		}

		function emotionUploadModal() {
			if (!document.querySelector('.emotionAdd')) {
				let div = document.createElement("div");
				div.setAttribute("class", "emotionAdd");
				document.querySelector('body').append(div);
			} else {
				$('.emotionAdd').children().remove();
			}

			let html = `
    <div class="reaction-modal" id="reactionModal">
        <div class="reaction-container">
            <div class="reaction-icons">`;

			for (let i = 0; i < 6; i++) {
				html += `<button class="reaction" data-index="${i}">
                    <img src="${emotionIcons[i]}" />
                 </button>`;
			}

			html += `        
            </div>
        </div>
    </div>`;

			$(".emotionAdd").append(html);
			$(".emotionAdd").show();

			$(".reaction-icons").on("click", ".reaction", function () {
				let index = $(this).data("index");
				emotionUpload(index);
			});

			function emotionUpload(reaction) {
				const data = {
					userId: userId,
					reaction: reaction,
					contentId: surveyCode
				}

				$.ajax({
					url: '/contentreaction/upload',
					type: 'POST',
					contentType: 'application/json',
					data: JSON.stringify(data),
					xhrFields: {
						withCredentials: true
					},
					success: function (data) {
						if (data == "TRUE") {
							location.reload();
						}
					}
				})
			}
		}

// ===================================================================================================== mobile

		function init() {
			initDatepicker();		  // 달력
			initTime();				    // 시간
			initParticipants();		// 참여자 목록
			initTree();				    // 참여자 트리
			chkSubmitBtn();			  // 제출하기 버튼
			initSurvey();			    // 막대바, 인원
			replyListPc();			  // 댓글
			emotionPc();			    // 감정표현

			$('#member_list').chkbox();
			$('#participants_list').chkbox();

			// 댓글 등록
			$(document).on('click', '.btn-comment-submit-pc', function () {
				replySavePc();
			})

			// 감정표현 추가 팝업
			$(document).on('click', '.btn-add-reaction-pc > img', function () {
				emotionUploadModalPc();
			})

			// 감정표현 추가
			$(document).on("click", ".reaction-pc", function () {
				let index = $(this).data("index");
				emotionUploadPc(index);
			});

			// 감정표현 리스트 팝업
			$(document).on('click', '#reaction-btn-pc > span', function () {
				emotionListModalPc()
			})

			// 통계 팝업
			$(document).on('click', '#btn-vote-list', function () {
				itemListModalPc();
			})

			// 엑셀 다운로드
			$(document).on('click', '#btnExcel', function () {
				getExcelDown();
			})
		}

		function initEvent() {
			$('#btnAddSurvey').on('click', appendSurvey);
			$('#btnSaveSurvey').on('click', modifySurvey);
			$('#btnRemoveSurvey').on('click', removeSurvey);
			$('#btnParticipants').on('click', participants);
			$('#btnParticipantsView').on('click', participantsView);
			$('#btnAppendParticipantsList').on('click', validateAppendDataToParticipantsList);
			$('#btnRemoveParticipantsList').on('click', removeParticipantsList);
			$('#btnSubmitSurvey').on('click', submitSurvey);

			$('#btnMemberByKeyword').on('click', memberByKeyword);
			$('#searchKeyword').on('keyup', function () {
				chkEnter(memberByKeyword);
			});

			$('.iconSurveyItemResultMember').on('click', surveyItemResultMember);
			$('#exportStatistics').on('click', exportStatistics);

			$('#btnNotiForm').on('click', notiForm);
		}

		function getExcelDown() {
			$.ajax({
				url: '/survey/export?surveyCode=' + surveyCode,
				type: 'POST',
				xhrFields: {
					responseType: 'blob'
				},
				success: function (blob, status, xhr) {
					const now = new Date();
					const pad = n => n.toString().padStart(2, '0');
					const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
					const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

					const url = window.URL.createObjectURL(blob);
					const a = document.createElement('a');

					a.href = url;
					a.download = `미니투표_${dateStr}_${timeStr}.xlsx`;
					document.body.appendChild(a);
					a.click();
					a.remove();
					window.URL.revokeObjectURL(url);
				},
				error: function (xhr, status, error) {
					console.error("엑셀 다운로드 실패:", error);
				}
			});
		}

// 통계 화면
		function itemListModalPc() {
			let html = '';
			let num = 1;
			const list = surveyQuestionList;

			if (!document.querySelector('.item-user-pc')) {
				let div = document.createElement('div');
				div.setAttribute('class', 'item-user-pc');
				div.style.display = "none";  // 기본은 숨김
				document.querySelector('body').append(div);
			} else {
				$('.item-user-pc').children().remove();
			}

			html += `
        <div class="survey-modal-pc">
            <div class="survey-modal-div-pc">
                <div class="modal-tab-pc">
                    <button id="item-pc" class="tab-pc tab-on">항목별</button>
                    <button id="non-pc" class="tab-pc">미참여</button>
                </div>
    `;

			list.forEach(question => {
				html += `
            <div class="survey-modal-div2">
                <div class="modal-header-pc">
                    <span>Q${num++}. ${question.questionContents}</span>
                    <span class="question-meta-pc">${question.isMulti === 'Y' ? '복수 선택 가능' : '복수 선택 불가능'}</span>
                    ${question.isAnonymous === 'Y' ? '<span class="question-meta-pc">익명</span>' : ''}
                </div>
                <div class="modal-content">
        `;

				question.itemList.forEach(item => {
					const count = item.userList.length;
					html += `
                <div class="survey-item-group-pc">
                    <div class="survey-item-header-pc">
                        <span class="survey-item-title-pc">${item.itemContents}: </span>
                        <span class="survey-item-count-pc">${count}명</span>
                    </div>
            `;

					if (question.isAnonymous !== 'Y' || item.itemType === 'DESC') {
						html += `<ul class="survey-user-list-pc">`;

						if (count === 0) {
							html += `<li><div class="vote-team-pc">투표한 멤버가 없습니다.</div></li>`;
						} else {
							item.userList.forEach(userStr => {
								const user = JSON.parse(userStr);
								const name = question.isAnonymous === 'Y' ? '익명' : user.userName || user.userId;
								const dept = question.isAnonymous === 'Y' ? '' : user.deptName || '';

								html += `
                            <li>
                                <img src="/images/survey/img_profile.png" class="user-profile-pc">
                                <div class="user-info-pc">
                                    <span class="user-name-pc">${name}</span>
                                    <span class="user-team-pc">${dept}</span>
                                    ${item.itemType === 'DESC' ? `<div class="vote-desc-pc">${user.desc || ''}</div>` : ''}
                                </div>
                            </li>
                        `;
							});
						}

						html += `</ul>`;
					}
					html += `</div>`;
				});

				html += `
                </div>
            </div>
        `;
			});

			html += `
                <div class="excel-down">
                    <button class="button button_gray2" id="btnExcel">엑셀 다운로드</button>
                </div>
            </div>
        </div>
    `;

			$(".item-user-pc").empty().append(html).css('display', 'block');

			$('.tab-pc').off('click').on('click', function () {
				$('.tab-pc').removeClass('.tab-on');
				$(this).addClass('.tab-on');

				if ($(this).attr('id') === 'item-pc') {
					itemListModalPc();
				} else {
					getListByNonPc();
				}
			});
		}

		function getListByNonPc() {
			const data = survey;
			const member = data.memberList || [];

			let html = '';
			let $ul = $(".item-user-pc");

			if (!document.querySelector('.item-user-pc')) {
				let div = document.createElement('div');
				div.setAttribute('class', 'item-user-pc');
				document.querySelector('body').append(div);
			} else {
				$('.item-user-pc').children().remove();
			}

			html += `
            <div class="survey-modal-pc">
                <div class="survey-modal-div-pc">
                    <div class="modal-tab-pc">
                        <button id="item-pc" class="tab-pc">항목별</button>
                        <button id="non-pc" class="tab-pc tab-on">미참여</button>
                    </div>
                    <div class="modal-content-pc">
                        <ul class="member-list-pc">
    `;

			const nonList = member.filter(item => item.isComplete === 'N');

			if (nonList.length === 0) {
				html += `
            <li class="member-item-pc empty">
                <div class="info">미참여한 인원이 없습니다.</div>
            </li>
        `;
			} else {
				nonList.forEach(item => {
					html += `
                <li class="member-item-pc">
                    <div class="avatar item-non-pc">
                        <img src="/images/survey/img_profile.png" alt="사용자 사진" />
                        <div class="info-pc">
                            <div class="name-pc">${item.title}</div>
                            <div class="dept-pc">${item.deptName}</div>
                        </div>
                    </div>
                </li>
            `;
				});
			}

			html += `
                    </ul>
                </div>
            </div>
        </div>
    `;

			$ul.empty();
			$ul.append(html);
			$ul.css('display', 'block');

			$('.tab-pc').off('click').on('click', function () {
				$('.tab-pc').removeClass('tab-on');
				$(this).addClass('tab-on');

				if (this.id === 'item-pc') {
					itemListModalPc();
				} else {
					getListByNonPc();
				}
			});
		}

// [ PC 댓글 & 감정표현 ]
		function replyListPc() {
			$('#inputText-pc').val('');

			$.ajax({
				url: '/contentreply/list',
				type: 'POST',
				dataType: 'json',
				data: { contentId: surveyCode },
				success: function (data) {
					bindReplyListPc(data);
				},
				error: function (xhr, status, error) {
					console.error('댓글 불러오기 실패:', status, error);
				}
			});
		}

		function bindReplyListPc(data) {
			let html = '';

			const $reply = $('#reply-section-pc');
			const list = data.list
			replyNum = data.list.length;

			list.forEach(reply => {
				const formatted = formatToKoreanDateTime(reply.registDate);
				html += `
				<div class="comment-pc" id="${reply.replyId}">
				<img alt="사용자 사진" src="/images/survey/img_profile.png" style="margin-right: 10px;" />
				<div class="comment-content-pc">
					<div class="comment-header-pc">
					<span class="reply-author-pc">
						<strong class='reply-name-pc'>${reply.userName}</strong> / ${formatted}
					</span>
					${reply.myReply
						? `<div class="comment-actions-pc replyDiv-pc">
							<span class="action-btn-pc" onclick="replyModifyPc('${reply.replyId}')">수정&nbsp;|</span>
							<span class="action-btn-pc" onclick="replyDelete('${reply.replyId}')">삭제</span>
						</div>`
						: ""}
					</div>

					<p class="comment-text-pc" id="replyContent-pc">${reply.reply}</p>
				</div>
				</div>
  			`;
			});
			$reply.html(html);
		}

		function replyModifyPc(replyId) {
			let replyElement = document.querySelector(`[id="${replyId}"] #replyContent-pc`);
			let buttonContainer = document.querySelector(`[id="${replyId}"] .replyDiv-pc`);

			if (!replyElement || !buttonContainer) {
				console.error("수정할 댓글을 찾을 수 없습니다:", replyId);
				return;
			}

			replyCen = replyElement.innerText;

			let inputElement = document.createElement("textarea");
			inputElement.type = "text";
			inputElement.value = replyCen;
			inputElement.id = "setReplyContent-pc";

			replyElement.replaceWith(inputElement);

			buttonContainer.innerHTML = `
    <button class='action-btn-pc setBtn-pc' type='button' onclick='replySavePc("${replyId}")'>저장 |</button>
    <button class='action-btn-pc setBtn-pc' type='button' onclick='replyCancelPc("${replyId}")'>취소</button>
`;
			inputElement.focus();
		}

		function replySavePc(replyId = null) {
			let replyText;

			if (replyId) {
				let inputElement = document.querySelector(`[id="${replyId}"] #setReplyContent-pc`);

				if (!inputElement) {
					showAlert({
						message: '수정할 댓글을 찾을 수 없습니다.'
					})
					return;
				}

				replyText = inputElement.value;
			} else {
				replyText = $('#inputText-pc').val();
			}

			if (!replyText) {
				showAlert({
					message: '댓글 내용을 입력하세요.'
				})
				return;
			}

			if (replyId) {
				let replyElement = document.createElement("p");

				replyElement.id = "replyContent-pc";
				replyElement.style.fontSize = "14px";
				replyElement.style.margin = "5% 0";
				replyElement.innerText = replyText;

				document.querySelector(`[id="${replyId}"] #setReplyContent-pc`).replaceWith(replyElement);

				let buttonContainer = document.querySelector(`[id="${replyId}"] .replyDiv-pc`);
				if (buttonContainer) {
					buttonContainer.innerHTML = `
                <button class='action-btn-pc setFont-pc' type='button' name='replyModify' onclick='replyModifyPc("${replyId}")'>수정 |</button>
                <button class='action-btn-pc setFont-pc' type='button' name='replyDelete' onclick='replyDelete("${replyId}")'>삭제</button>
            `;
				}

				const data = {
					contentId: surveyCode,
					reply: replyText.trim(),
					replyId: replyId
				}

				$.ajax({
					url: '/contentreply/upload',
					type: 'POST',
					contentType: "application/json; charset=UTF-8",
					data: JSON.stringify(data),
					success: function (data) {
						if (data === '0') {
							location.reload();
						}
					}
				})

			} else {
				const data = {
					contentId: surveyCode,
					reply: replyText.trim(),
				}

				$.ajax({
					url: '/contentreply/upload',
					type: 'POST',
					contentType: "application/json; charset=UTF-8",
					data: JSON.stringify(data),
					success: function (data) {
						if (data === '0') {
							location.reload();
						}
					}
				})
			}
		}

		function replyCancelPc(replyId) {
			let inputElement = document.getElementById("setReplyContent-pc");
			let replyContainer = document.querySelector(`[id="${replyId}"] .replyDiv-pc`);

			if (!inputElement || !replyContainer) {
				console.error("취소할 댓글을 찾을 수 없습니다:", replyId);
				return;
			}

			let originalReply = document.createElement("p");
			originalReply.id = "replyContent-pc";
			originalReply.innerText = replyCen;

			inputElement.replaceWith(originalReply);

			replyContainer.innerHTML = `
        <span class="action-btn-pc" onclick="replyModifyPc('${replyId}')">수정&nbsp|</span>
        <span class="action-btn-pc" onclick="replyDelete('${replyId}')">삭제</span>
    `;
		}

		function emotionPc() {
			$.ajax({
				url: '/contentreaction',
				contentType: "application/x-www-form-urlencoded; charset=UTF-8",
				type: 'POST',
				dataType: 'json',
				data: { contentId: surveyCode },
				success: function (data) {
					// 총 카운트
					totalReactions = data[12].total;
					emotionListPc();
				}
			})
		}

		function emotionListPc() {
			$.ajax({
				url: '/contentreaction/total/list',
				contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
				type: 'POST',
				dataType: 'json',
				data: { contentId: surveyCode },
				success: function (data) {
					bindEmotionListPc(data);
				}
			})
		}

		function bindEmotionListPc(data) {
			let html = '';
			let list = data;
			let emotionCount = {};
			let userReacted = false;

			list.forEach(item => {
				let emotionNum = item.reaction;
				emotionCount[emotionNum] = (emotionCount[emotionNum] || 0) + 1;

				if (item.userId === userId) {
					userReacted = true;
				}
			})

			// 공감 & 댓글 개수 표시
			$('#emotion-total-pc').text(totalReactions);
			$('#emotion-user-pc').text(replyNum);

			if (userReacted) {
				let emotion = `<span class="emoList-reply-pc cursorPointer emotion-cancle-pc" onclick="emotionCanclePc()">공감 취소</span>`
				$('#txt-emotion-cancle-pc').append(emotion);
			}

			if (totalReactions > 0) {
				Object.keys(emotionCount).forEach(emotion => {
					let iconSrc = emotionIcons[emotion]

					html += `
					<span class="emotion-img-pc">
						<img src='${iconSrc}' />
						${emotionCount[emotion]}
					</span>
			`
				})
			} else {
				html += `<span class="emotion-addContent-pc">가장 먼저 공감해 주세요.</span>`
			}
			$('#emotion-contents-pc').append(html);
		}

		function emotionCanclePc() {
			$('.emotion-cancle-pc').hide();

			let data = {
				userId: userId,
				reaction: 'remove',
				contentId: surveyCode
			}

			$.ajax({
				url: '/contentreaction/upload',
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(data),
				xhrFields: {
					withCredentials: true
				},
				success: function (data) {
					if (data === "TRUE") {
						location.reload();
					}
				}
			})
		}

		function emotionListModalPc() {
			$.ajax({
				url: '/contentreaction/total/list',
				contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
				type: 'POST',
				dataType: 'json',
				data: { contentId: surveyCode },
				success: function (data) {
					bindEmotionListModalPc(data);
				}
			})
		}

		function bindEmotionListModalPc(data) {
			let html = '';
			let list = data;
			let total = list.length > 0 ? list.length : null;

			if (!document.querySelector('.emotion-user-pc')) {
				let div = document.createElement("div");
				div.setAttribute("class", "emotion-user-pc");
				document.querySelector('body').append(div);
			} else {
				$('.emotion-user-pc').children().remove();
			}

			html = `
            <div class="user-popup-pc">
                <div class="user-div-pc">
                    <strong class="header-strong-pc">공감한 유저</strong>
                </div>
                <div class="emotion-summary-pc">
                    <button class="click-pc active-pc emotionAll-pc">전체 ${total || 0}</button> `

			let reactionCount = {};
			let contentId = list.length > 0 ? list[0].contentId : null;

			list.forEach(item => {
				let reactionNum = item.reaction;
				reactionCount[reactionNum] = (reactionCount[reactionNum] || 0) + 1;
			});

			Object.keys(reactionCount).forEach(reactionNum => {
				html += `
                        <button class="click-pc emotionButton-pc" onclick="getListEmotionMenuPc(${reactionNum}, '${contentId}')">
                            <img src='${emotionIcons[reactionNum]}' />
                            <span>${reactionCount[reactionNum]}</span> 
                        </button>`;
			});

			html += `                
                </div>
            <div class="userList-pc"></div> `

			$(".emotion-user-pc").append(html);
			document.querySelector('.emotion-user-pc').style.display = "block";

			bindtotalEmotionMenuPc(data);

			$(document).on('click', '.emotionAll-pc', function () {
				bindtotalEmotionMenuPc(data);
			})

			const buttons = document.querySelectorAll(".click-pc");

			buttons.forEach(button => {
				button.addEventListener("click", function () {
					buttons.forEach(btn => btn.classList.remove("active-pc"));
					this.classList.add("active-pc");
				});
			});
		}

		function bindtotalEmotionMenuPc(data) {
			const list = data;
			let html = "";

			for (var i = 0; i < list.length; i++) {
				html += `
                <ul class="user-list-pc">
                    <li class="emotion-user-item-pc">
                        <div class="emotion-info-pc">
                            <div class="emotion-info-div-pc">
								<div class='userpic-pc'>
									<img alt='사용자 사진' src='/images/survey/img_profile.png' />
								</div>
								<div>
                                	<div class='name-pc'>${list[i].userName || ''}</div>
									<div class='dept-pc'>${list[i].deptName || ''}</div>
								</div>
                            </div>
                                <span class="emotion-icon-pc"><img src='${emotionIcons[list[i].reaction] || ''}'/></span>
                        </div>
                    </li>
                </ul>
            `;
			}

			$(".userList-pc").children().remove();
			$(".userList-pc").append(html);
		}

		function getListEmotionMenuPc(num, contentId) {
			$.ajax({
				url: "/contentreaction/" + num + "/list",
				contentType: "application/x-www-form-urlencoded; charset=UTF-8",
				type: "POST",
				dataType: "json",
				data: { contentId: contentId },
				beforeSend: function (xhr) {
				},
				success: function (data) {
					bindListEmotionMenuPc(data);
				},
				error: function () {
				}
			});
		}

		function bindListEmotionMenuPc(data) {
			const list = data;
			let html = "";

			for (var i = 0; i < list.length; i++) {
				html += `
                <ul class="user-list-pc">
                    <li class="emotion-user-item-pc">
                        <div class="emotion-info-pc">
                            <div class="emotion-info-div-pc">
								<div class='userpic-pc'>
									<img alt='사용자 사진' src='/images/survey/img_profile.png' />
								</div>
								<div>
                                	<div class='name-pc'>${list[i].userName || ''}</div>
									<div class='dept-pc'>${list[i].deptName || ''}</div>
								</div>
                            </div>
                            <span class="emotion-icon-pc"><img src='${emotionIcons[list[i].reaction] || ''}'/></span>
                        </div>
                    </li>
                </ul>
            `;
			}

			$(".userList-pc").children().remove();
			$(".userList-pc").append(html);
		}

		function emotionUploadModalPc() {
			if (!document.querySelector('.emotionAdd-pc')) {
				let div = document.createElement("div");
				div.setAttribute("class", "emotionAdd-pc");
				document.querySelector('body').append(div);
			} else {
				$('.emotionAdd-pc').children().remove();
			}

			let html = `
    <div class="reaction-modal-pc" id="reactionModal-pc">
        <div class="reaction-container-pc">
            <div class="reaction-icons-pc">`;

			for (let i = 0; i < 6; i++) {
				html += `<button class="reaction-pc" data-index="${i}">
                    <img src="${emotionIcons[i]}" />
                 </button>`;
			}

			html += `        
            </div>
        </div>
    </div>`;

			$(".emotionAdd-pc").append(html);
			$(".emotionAdd-pc").show();

			setTimeout(function () {
				var popup = $(".reaction-modal-pc");
				var button = $(".btn-add-reaction-pc");

				if (button.length === 0) {
					console.error("Error: .emotionModal element not found");
					return;
				}

				var buttonOffset = button.offset();

				popup.css({
					top: buttonOffset.top + 40,
					left: buttonOffset.left - 8,
					zIndex: 999,
					position: "absolute",
				});
			}, 100);
		}

		function emotionUploadPc(reaction) {
			const data = {
				userId: userId,
				reaction: reaction,
				contentId: surveyCode
			}

			$.ajax({
				url: '/contentreaction/upload',
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(data),
				xhrFields: {
					withCredentials: true
				},
				success: function (data) {
					if (data == "TRUE") {
						location.reload();
					}
				}
			})
		}

		function initTime() {
			makeHour('sHour');
			makeHour('eHour');
			makeMinute('sMinute');
			makeMinute('eMinute');

			var tmpSHour = sHour;
			var tmpEHour = eHour;




			$('#sHour').val(tmpSHour);
			$('#eHour').val(tmpEHour);
			$('#sMinute').val(sMinute);
			$('#eMinute').val(eMinute);

			$('#eHour').prop('disabled', false);
			$('#eMinute').prop('disabled', false);
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
				var date = new Date();
				var year = date.getFullYear();
				var month = date.getMonth();
				var day = date.getDate();
				var today = year + '-' + lpad((month + 1) + '', 2, '0') + '-' + lpad(day + '', 2, '0');
				var theDay = $(this).val();

				if (today == theDay) {
					var nextDate = new Date(year, month, day);
					nextDate.setDate(nextDate.getDate() + 1);
					console.log(date, nextDate);

					$('#eHour').prop('disabled', true);
					$('#eMinute').prop('disabled', true);
					$('#eHour').val('18');
					$('#eMinute').val('00');
				} else {
					initTime();
				}
			});
			//var today = new Date();
			//$("#sDate").val($.datepicker.formatDate($.datepicker.ATOM, today));
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
		function initParticipants() {
			var len = participantsList.length;
			var participants_title = [];

			if (len > 5) {
				var title = participantsList[0].title;
				title += '외 ' + (len - 1) + '명';

				participants_title.push(title);
			} else {
				participantsList.forEach(function (item) {
					var title = item.title;

					participants_title.push(title);
				});
			}

			$('#participants_title').text(participants_title);

			participantsList.forEach(function (item) {
				tmpParticipants.push(item);
			});
		}
		function initTree() {
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

			tree = new Tree(opt, handler);
			tree.bind();
		}
		function initSurvey() {
			$('input:radio[name="isOpen"]:radio').prop('checked', false);
			$('input:radio[name="isOpen"]:radio[value="' + isOpen + '"]').prop('checked', true);
			var len = surveyResult.length;

			if (isWriter == 'N') {						// 참여자
				if (isOpen == 'N') {					// 비공개일 경우
					$('.iconSurveyItemResultMember').hide();
					$('.chart').hide();
				} else if (isOpen == 'Y' && len == 0) {	// 공개이고 제출 전일 경우
					$('.iconSurveyItemResultMember').hide();
					$('.chart').hide();
				}
			}

			if (status == 'W') {
				$('#question_area').survey();
				$('#question_area').setQuestions(surveyQuestionList);
			} else {
				initSurveyResult();
			}

			initSurveyItemAggregate();
		}
		function appendSurvey() {
			$('#question_area').appendSurvey();
		}
		function chkSubmitBtn() {
			const now = new Date();
			const end = new Date(datetime('e'));

			console.log(now);
			console.log(end);
			console.log(end<now);

			// 제출 마감 시간 지난 경우
			if (end < now) {
				$('#btnSubmitSurvey')
				.removeClass('button_survey')
				.addClass('button_survey_disabled')
				.prop('disabled', true)
				.text('제출마감');
				return; // 여기서 함수 종료
			}

			//	userId 동일한지 확인
			// 다르면 버튼 비활성화
			if (!hasTmpParticipants(userId)) {
				$('#btnSubmitSurvey')
				.removeClass('button_survey')
				.addClass('button_survey_disabled')
				.prop('disabled', true);

				// 같으면 버튼 활성화
			} else {
				$('#btnSubmitSurvey')
				.removeClass('button_survey_disabled')
				.addClass('button_survey')
				.prop('disabled', false);
			}
		}
		function initSurveyResult() {
			var len = surveyResult.length;
			if (len > 0) {
				$('#btnSubmitSurvey')
				.removeClass('button_survey')
				.addClass('button_survey_disabled')
				.text('제출완료')
				.prop('disabled', true);

				$('.item').prop('disabled', true);
				$('.desc').attr('readonly', true);
			} else if (status == 'C') {
				$('#btnSubmitSurvey')
				.removeClass('button_survey')
				.addClass('button_survey_disabled')
				.text('설문 종료')
				.prop('disabled', true);

				$('.item').prop('disabled', true);
				$('.desc').attr('readonly', true);
			}

			surveyResult.forEach(function (item) {
				var itemCode = item.itemCode;
				var itemType = item.itemType;
				var desc = item.desc;
				$('#' + itemCode).prop('checked', true);

				if (itemType == 'DESC') {
					console.log(desc);
					$('#desc_' + itemCode).val(desc);
				}
			});
		}
		function initSurveyItemAggregate() {
			var len_member = participantsList.length;
			surveyItemAggregate.forEach(function (item) {
				var key = item.key;
				var val = item.val;

				$('#aggregate_' + key).text(val);
				var td_selected = $('<td style="height:13px;background:#ff9494;border:1px solid #f08585">');
				var td_unselected = $('<td style="height:13px;background:#ddd;border:1px solid #ddd">');

				if (val == '0') {
					td_selected.width('100%');
					$('#chart_' + key).append(td_unselected);
				} else if (len_member == val) {
					td_selected.width('100%');
					$('#chart_' + key).append(td_selected);
				} else {
					var per_selected = Math.round((val / len_member) * 100);
					var per_unselected = 100 - per_selected;

					td_selected.width(per_selected + '%');
					td_unselected.width(per_unselected + '%');

					$('#chart_' + key).append(td_selected).append(td_unselected);
				}
			});
		}
		function surveyItemResultMember() {
			var surveyCode = $(this).data('surveyCode');
			var itemCode = $(this).data('itemCode');
			var itemType = $(this).data('itemType');
			var isMulti = $(this).data('isMulti');
			var isAnonymous = $(this).data('isAnonymous');

			console.log(surveyCode, itemCode, itemType, isMulti, isAnonymous);

			var obj = {};
			var data = {};
			data.surveyCode = surveyCode;
			data.itemCode = itemCode;
			data.itemType = itemType;
			data.isAnonymous = isAnonymous;

			obj.url = '/survey/surveyItemResultMember';
			obj.data = data;
			obj.contentType = 'json';

			ajaxCall(obj, surveyItemResultMemberHandler);
		}

		function surveyItemResultMemberHandler(data) {
			console.log(data);
			var code = data.code;
			if (code == 'fail') {
				alert('적용에 실패하였습니다. 잠시후 다시 시도해주세요.');
			} else {
				var memberList = data.list;
				var list = [];
				memberList.forEach(function (item) {
					console.log(item);
					var member = {};
					member.key = item.userId;
					member.title = item.userName;
					member.deptName = item.deptName;
					member.desc = item.desc;

					list.push(member);
				});

				var req = data.req;
				var itemType = req.itemType;
				var isAnonymous = req.isAnonymous;

				// 익명이 아니면서 기타의견
				if (isAnonymous == 'N' || itemType == 'DESC') {
					dialogParticipantsView();
					appendParticipantsListView(list, data.req);
				}
			}
		}
		function modifySurvey() {
			if (status == 'W') {
				registSurvey();
			} else {
				saveSurvey();
			}
		}
		function saveSurvey() {
			if (validateSaveSurvey()) {
				var title = $('#survey_title').val();
				var contents = $('#survey_contents').val();
				var isOpen = $('input[name=isOpen]:checked').val();

				var startDatetime = datetime('s');
				var endDatetime = datetime('e');

				var obj = {};
				var data = {};
				data.surveyTitle = title;
				data.surveyContents = contents;
				data.startDatetime = startDatetime;
				data.endDatetime = endDatetime;
				data.participantsList = tmpParticipants;
				data.isOpen = isOpen;

				data.type = 'save';
				data.surveyCode = surveyCode;

				obj.url = '/survey/saveSurvey';
				obj.data = data;
				obj.contentType = 'json';

				console.log(obj);
				ajaxCall(obj, saveSurveyHandler);
			} else {
				console.log('There is not enough information.');
			}
		}
		function registSurvey() {
			var questionList = $('#question_area').surveyData();
			if (validate(questionList)) {
				var title = $('#survey_title').val();
				var contents = $('#survey_contents').val();
				var isOpen = $('input[name=isOpen]:checked').val();

				var startDatetime = datetime('s');
				var endDatetime = datetime('e');

				var obj = {};
				var data = {};
				data.surveyTitle = title;
				data.surveyContents = contents;
				data.startDatetime = startDatetime;
				data.endDatetime = endDatetime;
				data.questionList = questionList;
				data.participantsList = tmpParticipants;
				data.isOpen = isOpen;

				data.type = 'save';
				data.surveyCode = surveyCode;

				obj.url = '/survey/registSurvey';
				obj.data = data;
				obj.contentType = 'json';

				console.log(obj);
				ajaxCall(obj, saveSurveyHandler);
			} else {
				console.log('There is not enough information.');
			}
		}
		function saveSurveyHandler(data) {
			var code = data.code;
			if (code == 'fail') {
				alert('적용에 실패하였습니다. 잠시후 다시 시도해주세요.');
			} else {
				alert('정상 처리되었습니다.');

				location.reload();
			}
		}
		function removeSurvey() {
			if (confirm('설문을 삭제하시겠습니까?')) {
				var obj = {};
				var data = {};
				data.surveyCode = surveyCode;

				obj.url = '/survey/removeSurvey';
				obj.data = data;
				obj.contentType = 'json';

				console.log(JSON.stringify(obj));

				ajaxCall(obj, removeSurveyHandler);
			}
		}
		function removeSurveyHandler(data) {
			var code = data.code;
			if (code == 'fail') {
				alert('적용에 실패하였습니다. 잠시후 다시 시도해주세요.');
			} else {
				alert('정상 처리되었습니다.');

				location.href = '/survey/'
			}
		}
		function validateSaveSurvey() {
			var val = true;
			var len_participants = tmpParticipants.length;

			var title = $('#survey_title').val();
			var eDate = $('#eDate').val();
			var eHour = $('#eHour').val();

			if (title == '') {
				alert('제목을 입력하세요.');
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
		function datetime(type) {
			var date = $('#' + type + 'Date').val();
			var hour = $('#' + type + 'Hour').val();
			var minute = $('#' + type + 'Minute').val();

			hour = (isEmpty(hour)) ? '09' : hour;
			minute = (isEmpty(minute)) ? '00' : minute;

			var datetime = '';
			if (date != '') {
				datetime = date + ' ' + hour + ':' + minute + ':00';
			}

			return datetime;
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
			$('#memberCnt').text('0');

			var body = $('#member_list tbody');
			body.empty();

			appendParticipantsList(tmpParticipants);
		}
		function participantsView() {
			dialogParticipantsView();
			appendParticipantsListView(tmpParticipants);
		}
		function dialogParticipantsView() {
			$('#participants_view').dialog({
				modal: true,
				width: 800,
				buttons: {
					'확인': function () { $(this).dialog('close'); }
				}
			});

			//appendParticipantsListView(list);
		}
		function setParticipants() {
			var list = $('#participants_list').getItemList();

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
				list.forEach(function (item, idx) {
					var key = item.key;

					if (!hasTmpParticipants(key)) {
						tmpParticipants.push(item);
					}
				});

				console.log(tmpParticipants);
				$('#participants_title').text(participants_title);

				$('#participants_form').dialog('close');
			}
		}
		function hasOriginParticipants(key) {
			var has = false;
			participantsList.forEach(function (item) {
				var tmp = item.key;
				if (tmp == key) {
					has = true;
				}
			});
			return has;
		}
		function hasTmpParticipants(key) {
			var has = false;
			tmpParticipants.forEach(function (item) {
				var tmp = item.key;
				if (tmp == key) {
					has = true;
				}
			});
			return has;
		}
		function appendParticipantsList(list) {
			var body = $('#participants_list tbody');
			body.empty();
			list.forEach(function (item) {
				if (typeof item == 'object') {
					var key = item.key;
					var title = item.title;
					var deptName = item.deptName;
					var posName = item.posName;
					var userId = item.userId;
					var parentOrg = item.parentOrg
					var initUser = item.initUser;

					var $tr = $('<tr>');
					var $td_checkbox = $('<td>');

					var $td_title = $('<td>').text(title);
					var $td_deptname = $('<td>').text(deptName);
					var $td_posname = $('<td>').text(posName);
					var $td_userId = $('<td>').text(userId);
					var $td_parentOrg = $('<td>').text(parentOrg);

					var $checkbox = $('<input type="checkbox">')
					.addClass('chkItem')
					.data('key', key)
					.data('userId', userId)
					.data('title', title)
					.data('parentOrg', parentOrg)
					.data('deptName', deptName)
					.data('posName', posName)
					.data('initUser', initUser)

					if ( initUser == 1) {
						$checkbox.prop('disabled', true);
					}
					$td_checkbox.append($checkbox);
					$tr.append($td_checkbox).append($td_userId).append($td_title).append($td_parentOrg).append($td_deptname).append($td_posname);
					body.append($tr);
				}
			});

			resetChkItems('participants_list');
			resetChkItems('member_list');

			setCount('participants_list', 'participantsCnt');
		}
		function appendParticipantsListView(list, data) {
			var $head = $('#member_list_view thead');
			var $body = $('#member_list_view tbody');
			$head.empty();
			$body.empty();

			var isAnonymous = 'N';
			var itemType = 'CHOICE';

			if (data) {
				console.log(data);
				itemType = data.itemType;
				isAnonymous = data.isAnonymous;
			} else {
				console.log('data is undefined');
			}

			$tr_head = $('<tr>');
			$head.append($tr_head);

			$th_title = $('<th>').text('이름');
			$th_deptname = $('<th>').text('부서');
			$th_desc = $('<th>').text('내용');
			$tr_head.append($th_title).append($th_deptname);

			if (itemType == 'DESC') {
				$tr_head.append($th_desc);
			}

			list.forEach(function (item) {
				if (typeof item == 'object') {
					var key = item.key;
					var title = item.title;
					var deptName = item.deptName;
					var desc = item.desc;

					if (isAnonymous == 'Y') {
						title = '-';
						deptName = '-'
					}

					var $tr = $('<tr>');

					var $td_title = $('<td>').text(title);
					var $td_deptname = $('<td>').text(deptName);

					$tr.append($td_title).append($td_deptname);

					if (itemType == 'DESC') {
						var $td_desc = $('<td class="td_desc">').text(desc);
						$tr.append($td_desc);
					}

					$body.append($tr);
				}
			});
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
		function memberByKeyword() {
			var keyword = $('#searchKeyword').val();

			if (keyword == '') {
				alert('검색어를 입력하세요.');
			} else {
				var obj = {};
				var data = {};
				data.keyword = keyword;

				obj.url = '/organization/memberByKeyword';
				obj.data = data;
				obj.contentType = 'json';

				console.log('[memberByKeyword] ' + JSON.stringify(obj));
				ajaxCall(obj, appendMemberList);
			}

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
				var userId = item.userId;
				var parentOrg = item.parentOrg

				var $tr = $('<tr>');
				var $td_checkbox = $('<td>');

				var $td_title = $('<td>').text(title);
				var $td_deptname = $('<td>').text(deptName);
				var $td_posname = $('<td>').text(posName);
				var $td_userId = $('<td>').text(userId);
				var $td_parentOrg = $('<td>').text(parentOrg);

				var $checkbox = $('<input type="checkbox">')
				.addClass('chkItem')
				.data('key', key)
				.data('userId', userId)
				.data('title', title)
				.data('parentOrg', parentOrg)
				.data('deptName', deptName)
				.data('posName', posName)

				$td_checkbox.append($checkbox);
				$tr.append($td_checkbox).append($td_userId).append($td_title).append($td_parentOrg).append($td_deptname).append($td_posname);
				body.append($tr);
			});

			resetChkItems('member_list');

			setCount('member_list', 'memberCnt');
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
		function removeParticipantsList() {
			if (isChecked('participants_list')) {
				$('.chkItem:checked').each(function () {
					var key = $(this).data('key');
					$(this).parent().parent().remove();

					// tmpParticipants 배열에서도 제거
					tmpParticipants = tmpParticipants.filter(function(item) {
						return item.key !== key;
					});

				});

				resetChkItems('participants_list');
				resetChkItems('member_list');
			} else {
				alert('삭제할 주소록을 체크해주세요.');
			}

			setCount('participants_list', 'participantsCnt');
		}
		function removeDuplicates(originArray, prop) {
			var newArray = [];
			var lookupObj = {};

			for (var i in originArray) {
				var key = originArray[i][prop];
				if (lookupObj.hasOwnProperty(key)) {
					continue;
				}
				lookupObj[key] = originArray[i];
			}

			for (i in lookupObj) {
				newArray.push(lookupObj[i]);
			}
			return newArray;
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
		function setCount(key, target) {
			var list = $('#' + key).getItemList();
			var len = list.length;
			$('#' + target).text(len);
		}
		function submitSurvey() {
			if (validateSurveySelect()) {
				var itemList = [];
				var descList = [];

				var obj = {};
				var data = {};
				data.surveyCode = surveyCode;
				data.itemList = itemList;
				data.descList = descList;

				obj.url = '/survey/submitSurvey';
				obj.data = data;
				obj.contentType = 'json';

				var $items = $('.item:checked');
				$items.each(function () {
					var $item = $(this);
					var questionCode = $item.attr('name');
					var itemCode = $item.val();
					var itemType = $item.data('itemType');

					var itemObj = {};
					itemObj.questionCode = questionCode;
					itemObj.itemCode = itemCode;
					itemList.push(itemObj);

					if (itemType == 'DESC') {
						var desc = {};
						desc.itemCode = itemCode;
						desc.questionCode = questionCode;
						desc.desc = $('#desc_' + itemCode).val();

						descList.push(desc);
					}
				});

				console.log(obj);
				ajaxCall(obj, submitSurveyHandler);
			}
		}
		function submitSurveyHandler(data) {
			var code = data.code;

			if (code == 'fail') {
				alert('적용에 실패하였습니다. 잠시후 다시 시도해주세요.');
			} else {
				alert('정상 처리되었습니다.');
				location.reload();
			}
		}
		function validateSurveySelect() {
			var result = true;

			var questionList = $('.question');
			questionList.each(function () {
				var question = $('.question');
				var len_checked = question.find('.item:checked').length;

				if (len_checked == 0) {
					alert('선택하지 않은 설문 항목이 있습니다.');
					result = false;
					return false;
				} else {
					var $items = question.find('.item:checked');
					$items.each(function () {
						var $item = $(this);
						var itemCode = $item.val();
						var itemType = $item.data('itemType');
						if (itemType == 'DESC') {
							var desc = $('#desc_' + itemCode).val();
							if (desc == '') {
								alert('서술형 항목에 내용을 입력해 주세요.');
								result = false;
								return false;
							}
						}
					});
				}
			});

			return result;
		}

		function exportDesc() {
			$('#exportDescForm').submit();
		}
		function notiForm() {
			$('#noti_contents').val('');
			$('#noti_form').dialog({
				modal: true,
				resizable: false,
				width: 416,
				buttons: {
					'확인': noti,
					'취소': function () { $(this).dialog('close'); }
				}
			});
		}
		function noti() {
			var contents = $('#noti_contents').val();
			var subject = $('#survey_title').val();
			var writer = $('#writer').text();
			contents = $.trim(contents);

			console.log(subject, contents, writer);
			if (contents) {
				contents = contents.replaceAll('\n', '<br>');
				var obj = {};
				var data = {};
				data.surveyCode = surveyCode;
				data.subject = subject;
				data.contents = contents;
				data.writer = writer;

				obj.url = '/survey/noti';
				obj.data = data;
				obj.contentType = 'json';
				console.log(data);
				ajaxCall(obj, notiHandler);
			} else {
				alert('알림 메시지를 입력하세요.');
			}
		}
		function notiHandler(data) {
			console.log(data);
			var code = data.code;
			var msg = '정상 처리되었습니다.';
			if (code != 'OK') {
				msg = '알림 서버와 연결에 실패하였습니다. 잠시 후 다시 시도해주세요.';
			}
			alert(msg);
			$('#noti_form').dialog('close');
		}
		function exportStatistics() {
			$('#exportResult').submit();
		}


		$('.item').prop('disabled', true);
		$('.desc').attr('readonly', true);
	} else if (status == 'C') {
		$('#btnSubmitSurvey')
			.removeClass('button_survey')
			.addClass('button_survey_disabled')
			.text('설문 종료')
			.prop('disabled', true);

		$('.item').prop('disabled', true);
		$('.desc').attr('readonly', true);
	}

	surveyResult.forEach(function (item) {
		var itemCode = item.itemCode;
		var itemType = item.itemType;
		var desc = item.desc;
		$('#' + itemCode).prop('checked', true);

		if (itemType == 'DESC') {
			console.log(desc);
			$('#desc_' + itemCode).val(desc);
		}
	});
}
function initSurveyItemAggregate() {
	var len_member = participantsList.length;
	surveyItemAggregate.forEach(function (item) {
		var key = item.key;
		var val = item.val;

		$('#aggregate_' + key).text(val);
		var td_selected = $('<td style="height:13px;background:#ff9494;border:1px solid #f08585">');
		var td_unselected = $('<td style="height:13px;background:#ddd;border:1px solid #ddd">');

		if (val == '0') {
			td_selected.width('100%');
			$('#chart_' + key).append(td_unselected);
		} else if (len_member == val) {
			td_selected.width('100%');
			$('#chart_' + key).append(td_selected);
		} else {
			var per_selected = Math.round((val / len_member) * 100);
			var per_unselected = 100 - per_selected;

			td_selected.width(per_selected + '%');
			td_unselected.width(per_unselected + '%');

			$('#chart_' + key).append(td_selected).append(td_unselected);
		}
	});
}
function surveyItemResultMember() {
	var surveyCode = $(this).data('surveyCode');
	var itemCode = $(this).data('itemCode');
	var itemType = $(this).data('itemType');
	var isMulti = $(this).data('isMulti');
	var isAnonymous = $(this).data('isAnonymous');

	console.log(surveyCode, itemCode, itemType, isMulti, isAnonymous);

	var obj = {};
	var data = {};
	data.surveyCode = surveyCode;
	data.itemCode = itemCode;
	data.itemType = itemType;
	data.isAnonymous = isAnonymous;

	obj.url = '/survey/surveyItemResultMember';
	obj.data = data;
	obj.contentType = 'json';

	ajaxCall(obj, surveyItemResultMemberHandler);
}

function surveyItemResultMemberHandler(data) {
	console.log(data);
	var code = data.code;
	if (code == 'fail') {
		alert('적용에 실패하였습니다. 잠시후 다시 시도해주세요.');
	} else {
		var memberList = data.list;
		var list = [];
		memberList.forEach(function (item) {
			console.log(item);
			var member = {};
			member.key = item.userId;
			member.title = item.userName;
			member.deptName = item.deptName;
			member.desc = item.desc;

			list.push(member);
		});

		var req = data.req;
		var itemType = req.itemType;
		var isAnonymous = req.isAnonymous;

		// 익명이 아니면서 기타의견
		if (isAnonymous == 'N' || itemType == 'DESC') {
			dialogParticipantsView();
			appendParticipantsListView(list, data.req);
		}
	}
}
function modifySurvey() {
	if (status == 'W') {
		registSurvey();
	} else {
		saveSurvey();
	}
}
function saveSurvey() {
	if (validateSaveSurvey()) {
		var title = $('#survey_title').val();
		var contents = $('#survey_contents').val();
		var isOpen = $('input[name=isOpen]:checked').val();

		var startDatetime = datetime('s');

		var endDate = $('#eDate').val();
		var endHour = $('#eHour').val() || '09';
		var endMinute = $('#eMinute').val() || '00';
		var endDatetime = endDate + ' '
				+ ('0' + parseInt(endHour, 10)).slice(-2) + ':'
				+ ('0' + parseInt(endMinute, 10)).slice(-2) + ':00';
		if (new Date(endDate) <= new Date()) {
			alert('마감일이 이미 지난 설문은 수정할 수 없습니다.');
			return;
		}

		var obj = {};
		var data = {};
		data.surveyTitle = title;
		data.surveyContents = contents;
		data.startDatetime = startDatetime;
		data.endDatetime = endDatetime;
		data.participantsList = tmpParticipants;
		data.isOpen = isOpen;

		data.type = 'save';
		data.surveyCode = surveyCode;

		obj.url = '/survey/saveSurvey';
		obj.data = data;
		obj.contentType = 'json';

		console.log(obj);
		ajaxCall(obj, saveSurveyHandler);
	} else {
		console.log('There is not enough information.');
	}
}
function registSurvey() {
	var questionList = $('#question_area').surveyData();
	if (validate(questionList)) {
		var title = $('#survey_title').val();
		var contents = $('#survey_contents').val();
		var isOpen = $('input[name=isOpen]:checked').val();

		var startDatetime = datetime('s');
		var endDatetime = datetime('e');

		var obj = {};
		var data = {};
		data.surveyTitle = title;
		data.surveyContents = contents;
		data.startDatetime = startDatetime;
		data.endDatetime = endDatetime;
		data.questionList = questionList;
		data.participantsList = tmpParticipants;
		data.isOpen = isOpen;

		data.type = 'save';
		data.surveyCode = surveyCode;

		obj.url = '/survey/registSurvey';
		obj.data = data;
		obj.contentType = 'json';

		console.log(obj);
		ajaxCall(obj, saveSurveyHandler);
	} else {
		console.log('There is not enough information.');
	}
}
function saveSurveyHandler(data) {
	var code = data.code;
	if (code == 'fail') {
		alert('적용에 실패하였습니다. 잠시후 다시 시도해주세요.');
	} else {
		alert('정상 처리되었습니다.');

		location.reload();
	}
}
function removeSurvey() {
	if (confirm('설문을 삭제하시겠습니까?')) {
		var obj = {};
		var data = {};
		data.surveyCode = surveyCode;

		obj.url = '/survey/removeSurvey';
		obj.data = data;
		obj.contentType = 'json';

		console.log(JSON.stringify(obj));

		ajaxCall(obj, removeSurveyHandler);
	}
}
function removeSurveyHandler(data) {
	var code = data.code;
	if (code == 'fail') {
		alert('적용에 실패하였습니다. 잠시후 다시 시도해주세요.');
	} else {
		alert('정상 처리되었습니다.');

		location.href = '/survey/'
	}
}
function validateSaveSurvey() {
	var val = true;
	var len_participants = tmpParticipants.length;

	var title = $('#survey_title').val();
	var eDate = $('#eDate').val();
	var eHour = $('#eHour').val();

	if (title == '') {
		alert('제목을 입력하세요.');
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
function datetime(type) {
	console.log("datetime 진입");
	var date = $('#' + type + 'Date').val();
	console.log("datetime1 진입");
	var hour = $('#' + type + 'Hour').val();
	console.log("datetime2 진입");
	var minute = $('#' + type + 'Minute').val();

	hour = (isEmpty(hour)) ? '09' : hour;
	minute = (isEmpty(minute)) ? '00' : minute;

	console.log("hour="+hour);

	var datetime = '';
	if (date != '') {
		datetime = date + ' ' + hour + ':' + minute + ':00';
	}

	return datetime;
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
	$('#memberCnt').text('0');

	var body = $('#member_list tbody');
	body.empty();

	appendParticipantsList(tmpParticipants);
}
function participantsView() {
	dialogParticipantsView();
	appendParticipantsListView(tmpParticipants);
}
function dialogParticipantsView() {
	$('#participants_view').dialog({
		modal: true,
		width: 800,
		buttons: {
			'확인': function () { $(this).dialog('close'); }
		}
	});

	//appendParticipantsListView(list);
}
function setParticipants() {
	var list = $('#participants_list').getItemList();

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
		list.forEach(function (item, idx) {
			var key = item.key;

			if (!hasTmpParticipants(key)) {
				tmpParticipants.push(item);
			}
		});

		console.log(tmpParticipants);
		$('#participants_title').text(participants_title);

		$('#participants_form').dialog('close');
	}
}
function hasOriginParticipants(key) {
	var has = false;
	participantsList.forEach(function (item) {
		var tmp = item.key;
		if (tmp == key) {
			has = true;
		}
	});
	return has;
}
function hasTmpParticipants(key) {
	var has = false;
	tmpParticipants.forEach(function (item) {
		var tmp = item.key;
		if (tmp == key) {
			has = true;
		}
	});
	return has;
}
function appendParticipantsList(list) {
	var body = $('#participants_list tbody');
	body.empty();
	list.forEach(function (item) {
		if (typeof item == 'object') {
			var key = item.key;
			var title = item.title;
			var deptName = item.deptName;
			var posName = item.posName;
			var userId = item.userId;
			var parentOrg = item.parentOrg;
			var initUser = item.initUser;

			var $tr = $('<tr>');
			var $td_checkbox = $('<td>');

			var $td_title = $('<td>').text(title);
			var $td_deptname = $('<td>').text(deptName);
			var $td_posname = $('<td>').text(posName);
			var $td_userId = $('<td>').text(userId);
			var $td_parentOrg = $('<td>').text(parentOrg);

			var $checkbox = $('<input type="checkbox">')
				.addClass('chkItem')
				.data('key', key)
				.data('userId', userId)
				.data('title', title)
				.data('parentOrg', parentOrg)
				.data('deptName', deptName)
				.data('posName', posName)
				.data('initUser', initUser)

			if (initUser == 1) {
				$checkbox.prop('disabled', true);
			}
			$td_checkbox.append($checkbox);
			$tr.append($td_checkbox).append($td_userId).append($td_title).append($td_parentOrg).append($td_deptname).append($td_posname);
			body.append($tr);
		}
	});

	resetChkItems('participants_list');
	resetChkItems('member_list');

	setCount('participants_list', 'participantsCnt');
}
function appendParticipantsListView(list, data) {
	var $head = $('#member_list_view thead');
	var $body = $('#member_list_view tbody');
	$head.empty();
	$body.empty();

	var isAnonymous = 'N';
	var itemType = 'CHOICE';

	if (data) {
		console.log(data);
		itemType = data.itemType;
		isAnonymous = data.isAnonymous;
	} else {
		console.log('data is undefined');
	}

	$tr_head = $('<tr>');
	$head.append($tr_head);

	$th_title = $('<th>').text('이름');
	$th_deptname = $('<th>').text('부서');
	$th_desc = $('<th>').text('내용');
	$tr_head.append($th_title).append($th_deptname);

	if (itemType == 'DESC') {
		$tr_head.append($th_desc);
	}

	list.forEach(function (item) {
		if (typeof item == 'object') {
			var key = item.key;
			var title = item.title;
			var deptName = item.deptName;
			var desc = item.desc;

			if (isAnonymous == 'Y') {
				title = '-';
				deptName = '-'
			}

			var $tr = $('<tr>');

			var $td_title = $('<td>').text(title);
			var $td_deptname = $('<td>').text(deptName);

			$tr.append($td_title).append($td_deptname);

			if (itemType == 'DESC') {
				var $td_desc = $('<td class="td_desc">').text(desc);
				$tr.append($td_desc);
			}

			$body.append($tr);
		}
	});
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
function memberByKeyword() {
	var keyword = $('#searchKeyword').val();

	if (keyword == '') {
		alert('검색어를 입력하세요.');
	} else {
		var obj = {};
		var data = {};
		data.keyword = keyword;

		obj.url = '/organization/memberByKeyword';
		obj.data = data;
		obj.contentType = 'json';

		console.log('[memberByKeyword] ' + JSON.stringify(obj));
		ajaxCall(obj, appendMemberList);
	}

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
		var userId = item.userId;
		var parentOrg = item.parentOrg

		var $tr = $('<tr>');
		var $td_checkbox = $('<td>');

		var $td_title = $('<td>').text(title);
		var $td_deptname = $('<td>').text(deptName);
		var $td_posname = $('<td>').text(posName);
		var $td_userId = $('<td>').text(userId);
		var $td_parentOrg = $('<td>').text(parentOrg);

		var $checkbox = $('<input type="checkbox">')
			.addClass('chkItem')
			.data('key', key)
			.data('userId', userId)
			.data('title', title)
			.data('parentOrg', parentOrg)
			.data('deptName', deptName)
			.data('posName', posName)

		$td_checkbox.append($checkbox);
		$tr.append($td_checkbox).append($td_userId).append($td_title).append($td_parentOrg).append($td_deptname).append($td_posname);
		body.append($tr);
	});

	resetChkItems('member_list');

	setCount('member_list', 'memberCnt');
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
function removeParticipantsList() {
	if (isChecked('participants_list')) {
		$('.chkItem:checked').each(function () {
			var key = $(this).data('key');
			// 화면에서 제거
			$(this).parent().parent().remove();
			
			// tmpParticipants 배열에서도 제거
			tmpParticipants = tmpParticipants.filter(function(item) {
				return item.key !== key;
			});
		});

		resetChkItems('participants_list');
		resetChkItems('member_list');
	} else {
		alert('삭제할 주소록을 체크해주세요.');
	}

	setCount('participants_list', 'participantsCnt');
}
function removeDuplicates(originArray, prop) {
	var newArray = [];
	var lookupObj = {};

	for (var i in originArray) {
	var key = originArray[i][prop];
	if (lookupObj.hasOwnProperty(key)) {
		continue;
	}
	lookupObj[key] = originArray[i];
}

	for (i in lookupObj) {
		newArray.push(lookupObj[i]);
	}
	return newArray;
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
function setCount(key, target) {
	var list = $('#' + key).getItemList();
	var len = list.length;
	$('#' + target).text(len);
}
function submitSurvey() {
	if (validateSurveySelect()) {
		var itemList = [];
		var descList = [];

		var obj = {};
		var data = {};
		data.surveyCode = surveyCode;
		data.itemList = itemList;
		data.descList = descList;

		obj.url = '/survey/submitSurvey';
		obj.data = data;
		obj.contentType = 'json';

		var $items = $('.item:checked');
		$items.each(function () {
			var $item = $(this);
			var questionCode = $item.attr('name');
			var itemCode = $item.val();
			var itemType = $item.data('itemType');

			var itemObj = {};
			itemObj.questionCode = questionCode;
			itemObj.itemCode = itemCode;
			itemList.push(itemObj);

			if (itemType == 'DESC') {
				var desc = {};
				desc.itemCode = itemCode;
				desc.questionCode = questionCode;
				desc.desc = $('#desc_' + itemCode).val();

				descList.push(desc);
			}
		});

		console.log(obj);
		ajaxCall(obj, submitSurveyHandler);
	}
}
function submitSurveyHandler(data) {
	var code = data.code;

	if (code == 'fail') {
		alert('적용에 실패하였습니다. 잠시후 다시 시도해주세요.');
	} else {
		alert('정상 처리되었습니다.');
		location.reload();
	}
}
function validateSurveySelect() {
	var result = true;

	var questionList = $('.question');
	questionList.each(function () {
		var question = $('.question');
		var len_checked = question.find('.item:checked').length;

		if (len_checked == 0) {
			alert('선택하지 않은 설문 항목이 있습니다.');
			result = false;
			return false;
		} else {
			var $items = question.find('.item:checked');
			$items.each(function () {
				var $item = $(this);
				var itemCode = $item.val();
				var itemType = $item.data('itemType');
				if (itemType == 'DESC') {
					var desc = $('#desc_' + itemCode).val();
					if (desc == '') {
						alert('서술형 항목에 내용을 입력해 주세요.');
						result = false;
						return false;
					}
				}
			});
		}
	});

	return result;
}

function exportDesc() {
	$('#exportDescForm').submit();
}
function notiForm() {
	$('#noti_contents').val('');
	$('#noti_form').dialog({
		modal: true,
		resizable: false,
		width: 416,
		buttons: {
			'확인': noti,
			'취소': function () { $(this).dialog('close'); }
		}
	});
}
function noti() {
	var contents = $('#noti_contents').val();
	var subject = $('#survey_title').val();
	var writer = $('#writer').text();
	contents = $.trim(contents);

	console.log(subject, contents, writer);
	if (contents) {
		contents = contents.replaceAll('\n', '<br>');
		var obj = {};
		var data = {};
		data.surveyCode = surveyCode;
		data.subject = subject;
		data.contents = contents;
		data.writer = writer;

		obj.url = '/survey/noti';
		obj.data = data;
		obj.contentType = 'json';
		console.log(data);
		ajaxCall(obj, notiHandler);
	} else {
		alert('알림 메시지를 입력하세요.');
	}
}
function notiHandler(data) {
	console.log(data);
	var code = data.code;
	var msg = '정상 처리되었습니다.';
	if (code != 'OK') {
		msg = '알림 서버와 연결에 실패하였습니다. 잠시 후 다시 시도해주세요.';
	}
	alert(msg);
	$('#noti_form').dialog('close');
}
function exportStatistics() {
	$('#exportResult').submit();
}
