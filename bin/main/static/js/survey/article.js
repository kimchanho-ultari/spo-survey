var tmpParticipants = [];

$(function () {
	init();
	initEvent();
});
function init() {
	initDatepicker();
	initTime();
	initParticipants();
	initTree();
	chkSubmitBtn();
	initSurvey();

	$('#member_list').chkbox();
	$('#participants_list').chkbox();
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
function initTime() {
	makeHour('sHour');
	makeHour('eHour');
	makeMinute('sMinute');
	makeMinute('eMinute');

	var tmpSHour = sHour;
	var tmpEHour = eHour;

	if (tmpSHour < 10) tmpSHour = 9;
	if (tmpEHour < 10) tmpEHour = 9;

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
	if (!hasTmpParticipants(userId)) {
		$('#btnSubmitSurvey')
			.removeClass('button_survey')
			.addClass('button_survey_disabled')
			.prop('disabled', true);

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

			var $tr = $('<tr>');
			var $td_checkbox = $('<td>');

			var $td_title = $('<td>').text(title);
			var $td_deptname = $('<td>').text(deptName);

			var $checkbox = $('<input type="checkbox">')
				.addClass('chkItem')
				.data('key', key)
				.data('title', title)
				.data('deptName', deptName);

			if (hasOriginParticipants(key) && status != 'W') {
				$checkbox.prop('disabled', true);
			}
			$td_checkbox.append($checkbox);
			$tr.append($td_checkbox).append($td_title).append($td_deptname);
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

		var $tr = $('<tr>');
		var $td_checkbox = $('<td>');

		var $td_title = $('<td>').text(title);
		var $td_deptname = $('<td>').text(deptName);

		var $checkbox = $('<input type="checkbox">')
			.addClass('chkItem')
			.data('key', key)
			.data('title', title)
			.data('deptName', deptName);

		$td_checkbox.append($checkbox);
		$tr.append($td_checkbox).append($td_title).append($td_deptname);
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
			$(this).parent().parent().remove();
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
		var key = originArray[i].key;
		lookupObj[originArray[i][prop]] = originArray[i];
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
		var question = $(this);
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
