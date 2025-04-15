var tree;
var treeForMoveMember;
var prevAct = 'tree';		// search/tree

var GB_PAGE_NO = 1;

var mode = 'regist';

var dialog_progressbar;

$(function(){
	init();
	initEvent();
});
function init() {
	initTree();
	$('#list').chkbox();
	$('.modal-dialog').draggable();
}
function initEvent() {
	$('#keyword').on('keyup', function(){
		chkEnter(memberBySearch);
	});
	$('#btnRegistMemberForm').on('click', resetMemberForm);
	$('#btnRegistMember').on('click', registMember);
	$('#btnModifyMember').on('click', modifyMember);
	$('#btnRemoveMember').on('click', removeMember);
	$('#btnMoveMemberForm').on('click', moveMemberForm);
	$('#moveMemberIdList').on('click', moveMemberIdList);
	$('#btnMoveMember').on('click', moveMember);
	$('#btnExport').on('click', exportMember);
	$('#btnSyncOrg').on('click', migration);
}
function initTree() {
	initMainTree();
	initTreeForMoveMember();
}
function initMainTree() {
	var opt = {};
	opt.topId = '0';
	opt.target = 'tree';
	opt.grpTopUri = '/organization/deptListByPid';
	
	var handler = {
		_onClick: function(node, event) {
			$('#keyword').val('');
			prevAct = 'tree';
			
			memberByDeptIdPaging(node.data.key, 1);
		},
		_onCreate: function(node, span) {
			if (node.data.pid == '0') {
				obj = node;
				node.activate(true);
				node.expand(true);
				
				memberByDeptIdPaging(node.data.key, 1);
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
	
	tree = new Tree(opt, handler);
	tree.bind();
}
function initTreeForMoveMember() {
	var opt = {};
	opt.topId = '0';
	opt.target = 'tree_move_member';
	opt.grpTopUri = '/organization/deptListByPid';
	
	var handler = {
		_onClick: function(node, event) {
			var key = node.data.key;
			var title = node.data.title;
			
			$('#deptname_tobe').text(title);
		},
		_onCreate: function(node, span) {
			if (node.data.pid == '0') {
				obj = node;
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
	
	treeForMoveMember = new Tree(opt, handler);
	treeForMoveMember.bind();
}
function memberByDeptIdPaging(key, pageNo) {
	var obj = {};
	var data = {};
	data.deptId = key;
	data.pageNo = pageNo;
	
	obj.url = '/organization/memberByDeptIdPaging';
	obj.data = data;
	obj.contentType = 'json';
	
	console.log(JSON.stringify(obj));
	ajaxCall(obj, memberSearchHandler);
}
function memberSearchHandler(data) {
	console.log(data);
	var list = data.list;
	var paging = data.pageManager;
	
	setList(list);
	setPagination(paging);
}
function setPagination(paging) {
	console.log(paging);
	var pageNo = paging.pageNo;
	
	var startPageNo = paging.startPageNo;
	var endPageNo = paging.endPageNo;
	
	var firstPageNo = paging.firstPageNo;
	var finalPageNo = paging.finalPageNo;
	
	var prevPageNo = paging.prevPageNo;
	var nextPageNo = paging.nextPageNo;
	
	var $target = $('#pagination-area');
	$target.empty();
	
	var $pagination = $('<ul class="pagination justify-content-center">');
	
	if (startPageNo > 1) {
		var $page = $('<li class="page-item">')
						.css({'cursor':'pointer'})
						.data('pageNo', firstPageNo);
		var $link = $('<span class="page-link">')
						.text('first');
		$page.append($link);
		$pagination.append($page);
		$target.append($pagination);
	}
	if (prevPageNo < startPageNo) {
		var $page = $('<li class="page-item">')
						.css({'cursor':'pointer'})
						.data('pageNo', prevPageNo);
		var $link = $('<span class="page-link">')
						.text('prev');
		$page.append($link);
		$pagination.append($page);
		$target.append($pagination);
	}
	for (var i = startPageNo; i <= endPageNo; i++) {
		var $page = $('<li class="page-item">')
						.css({'cursor':'pointer'})
						.data('pageNo', i);
		var $link = $('<span class="page-link">')
						.text(i);
		$page.append($link);
		$pagination.append($page);
		$target.append($pagination);
		
		if (pageNo == i) $page.addClass('active');
	}
	if (nextPageNo < finalPageNo) {
		var $page = $('<li class="page-item">')
						.css({'cursor':'pointer'})
						.data('pageNo', nextPageNo);
		var $link = $('<span class="page-link">')
						.text('next');
		$page.append($link);
		$pagination.append($page);
		$target.append($pagination);
	}
	if (endPageNo < finalPageNo) {
		var $page = $('<li class="page-item">')
						.css({'cursor':'pointer'})
						.data('pageNo', finalPageNo);
		var $link = $('<span class="page-link">')
						.text('final');
		$page.append($link);
		$pagination.append($page);
		$target.append($pagination);
	}
	
	$('.page-item').on('click', listByPaging);
}
function setList(list) {
	var $list = $('#list tbody');
	$list.empty();
	list.forEach(function(item){
		var userId = item.userId;
		var password = item.password;
		var userName = item.userName;
		var phone = item.phone;
		var mobile = item.mobile;
		var email = item.email;
		var deptName = item.deptName;
		var posName = item.posName;
		var type = item.type;
		
		var decUserId = item.decUserId;
		
		var userType = type == 'ORG' ? '조직도 사용자' : '추가 사용자';
		
		var $tr = $('<tr >').data('item', item)
							.css({'cursor':'pointer','height':'26px'})
							.on('click', userInfoForm);
		
		var $td_check = $('<td style="height:30px">');
		var $td_id = $('<td>').text(decUserId);
		var $td_title = $('<td>').text(userName);
		var $td_dept_name = $('<td>').text(deptName);
		var $td_pos_name = $('<td>').text(posName);
		var $td_phone = $('<td>').text(phone);
		var $td_mobile = $('<td>').text(mobile);
		var $td_email = $('<td>').text(email);
		var $td_type = $('<td>').text(userType);
		var $td_reset_password = $('<td>');
		var $td_reset_failed_password_count = $('<td>');
		
		var $checkbox = $('<input type="checkbox" class="chkItem">')
							.data('item', item)
							.on('click', function(e){e.stopPropagation();});

		var $btnResetPassword = $('<button type="button" class="btn btn-sm" style="font-size:12px">')
								.addClass('btn-outline-secondary')
								.data('item', item)
								.text('비밀번호 초기화')
								.on('click', resetPassword);
		
		var $btnResetFailedPasswordCount = $('<button type="button" class="btn btn-sm" style="font-size:12px">')
								.addClass('btn-outline-secondary')
								.data('item', item)
								.text('비밀번호 실패 횟수 초기화')
								.on('click', resetFailedPasswordCount);
		
		if (type != 'ORG') {
			$td_check.append($checkbox);
		}
		
		$td_reset_password.append($btnResetPassword);
		$td_reset_failed_password_count.append($btnResetFailedPasswordCount);
		
		$tr.append($td_check).append($td_id).append($td_title).append($td_dept_name).append($td_pos_name).append($td_phone).append($td_mobile).append($td_email).append($td_type).append($td_reset_password).append($td_reset_failed_password_count);
		$list.append($tr);
	});
	$('#list').reset();
}
function memberBySearch() {
	prevAct = 'search';
	memberByKeywordPaging(1);
}
function listByPaging() {
	var pageNo = $(this).data('pageNo');
	GB_PAGE_NO = pageNo;
	if (prevAct == 'search') {
		memberByKeywordPaging(pageNo);
	} else {
		var key = tree.getNode().data.key;
		memberByDeptIdPaging(key, pageNo);
	}
}
function listByEvent() {
	if (prevAct == 'search') {
		memberByKeywordPaging(GB_PAGE_NO);
	} else {
		var key = tree.getNode().data.key;
		memberByDeptIdPaging(key, GB_PAGE_NO);
	}
}
function memberByKeywordPaging(pageNo) {
	var keyword = $('#keyword').val();
	
	var obj = {};
	var data = {};
	data.keyword = keyword;
	data.pageNo = pageNo;
	
	obj.url = '/organization/memberByKeywordPaging';
	obj.data = data;
	obj.contentType = 'json';
	
	console.log(JSON.stringify(obj));
	ajaxCall(obj, memberSearchHandler);
}
function userInfoForm() {
	resetMemberForm();
	
	$('#user_info').modal('show');
	
	var item = $(this).data('item');
	var userId = item.userId;
	var decUserId = item.decUserId;
	var userName = item.userName;
	var deptName = item.deptName;
	var posName = item.posName;
	var phone = item.phone;
	var mobile = item.mobile;
	var email = item.email;
	var type = item.type;
	console.log(item);
	
	$('#userId').val(userId);
	$('#decUserId').val(decUserId);
	$('#userName').val(userName);
	$('#posName').val(posName);
	$('#phone').val(phone);
	$('#mobile').val(mobile);
	$('#email').val(email);
	
	$('#btnRegistMember').hide();
	$('#userId').attr('disabled', true);
	
	mode = 'modify';
	
	if (type == 'ORG') {
		$('#btnModifyMember').hide();
	} else {
		$('#btnModifyMember').show();
	}
}
function resetMemberForm() {
	$('#userId')
		.val('')
		.attr('disabled', false);
	
	$('#decUserId').val('');
	$('#userName').val('');
	$('#posName').val('');
	$('#phone').val('');
	$('#mobile').val('');
	$('#email').val('');
	
	$('#btnRegistMember').show();
	$('#btnModifyMember').hide();
	
	mode = 'regist';
}
function userInfoByForm() {
	var node = tree.getNode().data;
	var deptId = node.key;
	
	var userId = $('#userId').val();
	var decUserId = $('#decUserId').val();
	var userName = $('#userName').val();
	var posName = $('#posName').val();
	var phone = $('#phone').val();
	var mobile = $('#mobile').val();
	var email = $('#email').val();
	
	var obj = {}
	obj.userId = userId;
	obj.decUserId = decUserId;
	obj.userName = userName;
	obj.posName = posName;
	obj.phone = phone;
	obj.mobile = mobile;
	obj.email = email;
	obj.deptId = deptId;
	
	return obj;
}
function registMember() {
	var info = userInfoByForm();
	
	info.userId = info.decUserId;
	
	var obj = {};
	var data = info;
	
	obj.url = '/organization/registMember';
	obj.data = data;
	
	console.log(JSON.stringify(obj));
	ajaxCall(obj, registMemberHandler);
}
function registMemberHandler(data) {
	console.log(data);
	var code = data.code;
	var msg = '정상 처리되었습니다.';
	if (code == 'fail') {
		msg = '처리중 오류가 발생하였습니다. 잠시후 다시 시도해주세요.';
	} else if (code == 'overlaps') {
		msg = '사용중인 아이디가 있습니다. 아이디를 다시 입력해주세요.';
		$('#userId').select();
	} else {
		listByEvent();
		$('#user_info').modal('hide');
	}
	
	alert(msg);
}
function modifyMember() {
	var info = userInfoByForm();
	
	var obj = {};
	var data = info;
	
	obj.url = '/organization/modifyMember';
	obj.data = data;
	
	console.log(JSON.stringify(obj));
	ajaxCall(obj, modifyMemberHandler);
}
function modifyMemberHandler(data) {
	var code = data.code;
	var msg = '정상 처리되었습니다.';
	if (code != 'ok') {
		msg = '처리중 오류가 발생하였습니다. 잠시후 다시 시도해주세요.';
	}
	
	alert(msg);
	
	listByEvent();
	$('#user_info').modal('hide');
}
function resetPassword() {
	event.stopPropagation();
	
	var item = $(this).data('item');
	var key = item.userId;
	
	var obj = {};
	var data = {}
	data.key = key;
	
	obj.url = '/organization/resetPassword';
	obj.data = data;
	obj.contentType = 'json';
	
	console.log(JSON.stringify(obj));
	ajaxCall(obj, resetPasswordHandler);
}
function resetFailedPasswordCount() {
	event.stopPropagation();
	
	var item = $(this).data('item');
	var key = item.userId;
	
	var obj = {};
	var data = {}
	data.key = key;
	
	obj.url = '/organization/resetFailedPasswordCount';
	obj.data = data;
	obj.contentType = 'json';
	
	console.log(JSON.stringify(obj));
	ajaxCall(obj, resetPasswordHandler);
}
function resetPasswordHandler(data) {
	var code = data.code;
	var msg = '정상 처리되었습니다.';
	if (code != 'ok') {
		msg = '처리중 오류가 발생하였습니다. 잠시후 다시 시도해주세요.';
	}
	
	alert(msg);
}
function removeMember() {
	var chk = isChecked('list');
	if (!chk) {
		alert('삭제할 사용자를 체크해주세요.');
	} else if (confirm('체크한 사용자를 삭제하시겠습니까?')) {
		var itemList = getChkItemList('list');
		var list = [];
		itemList.forEach(function(info){
			var item = info.item;
			var key = item.userId;
			
			var obj = {};
			obj.key = key;
			list.push(obj);
		});
		
		if (list.length > 0) {
			var obj = {};
			var data = {}
			data.list = list;
			
			obj.url = '/organization/removeMember';
			obj.data = data;
			obj.contentType = 'json';
			
			console.log('[removeMember] ' + JSON.stringify(obj));
			ajaxCall(obj, removeMemberHandler);
		} else {
			alert('데이터에 문제가 있어 삭제되지 않았습니다. 담당 엔지니어에게 문의하세요.');
		}
	}
}
function removeMemberHandler(data) {
	var code = data.code;
	var msg = '정상 처리되었습니다.';
	if (code != 'ok') {
		msg = '처리중 오류가 발생하였습니다. 잠시후 다시 시도해주세요.';
	}
	
	alert(msg);
	
	listByEvent();
	$('#user_info').modal('hide');
}
function moveMemberForm() {
	var chk = isChecked('list');
	if (!chk) {
		alert('이동할 사용자를 체크해주세요.');
	} else {
		treeForMoveMember.reload();
		$('#deptname_tobe').text('');
		var list = getChkItemList('list');
		var arr = [];
		list.forEach(function(info){
			var item = info.item;
			var key = item.decUserId;
			
			arr.push(key);
		});
		var deptName = list[0].item.deptName;
		
		$('#deptname_origin').text(deptName);
		$('#moveMemberIdList').text(arr);
		$('#move_user').modal('show');
	}
}
function moveMemberIdList() {
	var list = getChkItemList('list');
	var $list = $('#move_user_list tbody');
	$list.empty();
	
	list.forEach(function(info){
		var item = info.item;
		var key = item.decUserId;
		var userName = item.userName;
		var deptName = item.deptName;
		var posName = item.posName;
		
		var $tr = $('<tr >');
		
		var $td_id = $('<td>').text(key);
		var $td_title = $('<td>').text(userName);
		var $td_dept_name = $('<td>').text(deptName);
		var $td_pos_name = $('<td>').text(posName);
		
		$tr.append($td_id).append($td_title).append($td_dept_name).append($td_pos_name);
		$list.append($tr);
	});
	
	$('#form_move_user_list').modal('show');
}
function moveMember() {
	var memberList = getChkItemList('list');
	var node = treeForMoveMember.getNode();
	var deptIdForMoveMember = node.data.key;
	console.log(deptIdForMoveMember);
	
	var list = [];
	memberList.forEach(function(info){
		var item = info.item;
		var key = item.userId;
		
		var obj = {};
		obj.key = key;
		list.push(obj);
	});
	
	console.log(list);
	
	var obj = {};
	var data = {}
	data.list = list;
	data.deptId = deptIdForMoveMember;
	
	obj.url = '/organization/moveMember';
	obj.data = data;
	obj.contentType = 'json';
	
	console.log(obj);
	ajaxCall(obj, moveMemberHandler);
}
function moveMemberHandler(data) {
	var code = data.code;
	var msg = '정상 처리되었습니다.';
	if (code != 'ok') {
		msg = '처리중 오류가 발생하였습니다. 잠시후 다시 시도해주세요.';
	}
	$('#move_user').modal('hide');
	
	alert(msg);
	
	listByEvent();
}
function exportMember() {
	var key = tree.getNode().data.key;
	console.log('key=' + key);
	
	location.href = '/organization/exportMember/' + key;
}
function progress(cmd, msg) {
	$('#progressbar-label').text(msg);
	
	if (cmd == 'open') {
		dialog_progressbar = $('#dialog_progressbar').dialog({
			dialogClass: "no-close",
			resizable: false,
			closeOnEscape: false,
			modal: true,
			open: function(){
				$('.ui-dialog-titlebar-close', $(this).parent()).hide();
			}
		});
		$( "#progressbar" ).progressbar({
	      value: false
	    });	
	} else if (cmd == 'close') {
		dialog_progressbar.dialog('option', 'buttons', [{
			text: '확인',
			click: function(){dialog_progressbar.dialog('close');}
		}]);
	}
	
}
function migration() {
	progress('open', '조직도 동기화 중.. 잠시만 기다려 주세요... ');
	var obj = {};
	var data = {}

	obj.url = '/organization/migration';
	obj.data = data;
	obj.contentType = 'json';
	
	console.log(obj);
	ajaxCall(obj, migrationHandler);
}
function migrationHandler(data) {
	var code = data.code;
	console.log(code);
	if (code == 'ok') {
		syncOrg();
	} else {
		progress('close', '조직도 동기화에 실패하였습니다. 잠시후 다시 시도해주세요.');
	}
}
function syncOrg() {
	var obj = {};
	var data = {}

	obj.url = '/organization/syncOrg';
	obj.data = data;
	obj.contentType = 'json';
	
	console.log(obj);
	ajaxCall(obj, syncOrgHandler);
}
function syncOrgHandler(data) {
	var code = data.code;
	console.log(code);
	if (code == 'ok') {
		progress('close', '조직도 동기화를 완료하였습니다. 메신저 서버에 적용되는데 몇분 소요될 수 있습니다.');
	} else {
		progress('close', '조직도 동기화에 실패하였습니다. 잠시후 다시 시도해주세요.');
	}
}