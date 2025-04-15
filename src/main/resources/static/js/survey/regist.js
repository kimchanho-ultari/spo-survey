var tree;

$(function(){
	init();
	initEvent();
});
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
	$('#searchKeyword').on('keyup', function(){
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
		_onClick: function(node, event) {
			$('#searchKeyword').val('');
			prevAct = 'tree';
			
			memberByDeptId(node.data.key);
		},
		_onCreate: function(node, span) {
			if(node.data.key == opt.topId) {
				obj = node;
				node.activate(true);
				node.expand(true);
			}
		},
		_appendAjax: function(node) {
			node.appendAjax({
				type: 'post',
				url: '/organization/deptListByPid',
				dataType: 'json',
				data: {key:node.data.key},
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
		_onClick: function(node, event) {
			$('#keyword').val('');
			prevAct = 'tree';
			commonMemberByGroupCode(node.data.key);
		},
		_onCreate: function(node, span) {
			
		},
		_appendAjax: function(node) {
			node.appendAjax({
				type: 'post',
				url: '/commongroup/groupListByPid',
				dataType: 'json',
				data: {key:node.data.key},
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
		_onClick: function(node, event) {
			$('#keyword').val('');
			prevAct = 'tree';
			agencyMemberByGroupCode(node.data.key);
		},
		_onCreate: function(node, span) {
			
		},
		_appendAjax: function(node) {
			node.appendAjax({
				type: 'post',
				url: '/agencygroup/groupListForSystem',
				dataType: 'json',
				data: {key:node.data.key},
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
		regional : ['ko'],
		nextText : '다음달',
		prevText : '이전달',
		currentText: '오늘',
		changeYear: true,
		changeMonth: true,
		monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
		monthNamesShort: ['1','2','3','4','5','6','7','8','9','10','11','12'],
		dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
		dayNamesMin: ['일','월','화','수','목','금','토'],
		dateFormat: 'yy-mm-dd',
		closeText : '닫기',
		showOtherMonths : true,
		showOn: "button",
		buttonImageOnly: true,
		buttonImage: "/images/icon_calendar.png"
	});
	
	var sDate = $('#sDate').datepicker({
					minDate:'0d'
				}).on('change', function(){
					$('#eDate').datepicker('option', 'minDate', getDate(this));
				});
	var eDate = $('#eDate').datepicker({
					minDate:'0d'
				}).on('change', function(){
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
	} catch(e) {
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
		modal:true,
		width:900,
		buttons: {
			'확인':setParticipants,
			'취소':function(){$(this).dialog('close');}
		}
	});
	
	tree.reload();

	var body = $('#member_list tbody');
	body.empty();
	
	appendParticipantsList(participantsList);
	
	setCount('member_list', 'memberCnt');
}
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
			title += '외 ' + (len -1) + '명';
			
			participants_title.push(title);
		} else {
			list.forEach(function(item){
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
	list.forEach(function(item){
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
	
	for(var i in originArray) {
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
	list.forEach(function(item){
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
		$('.chkItem:checked').each(function() {
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
	tab.each(function(){
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