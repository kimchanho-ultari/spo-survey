$(function(){
	init();
	initEvent();
});
function init() {
	$('#userId').focus();
}
function initEvent() {
	$('#password').on('keyup', function(){
		chkEnter(login);
	});
	$('#btnLogin').on('click', login);
}
function login() {
	var userId = $('#userId').val();
	var password = $('#password').val();
	
	if (isEmpty(userId) || isEmpty(password)) {
		alert('아이디 또는 비밀번호를 입력하세요.');
	} else {
		var obj = {};
		var data = {};
		data.userId = userId;
		data.password = password;
		
		obj.url = '/adm/account';
		obj.data = data;
		obj.contentType = 'json';
		
		console.log(JSON.stringify(obj));
		ajaxCall(obj, loginHandler);
	}
}
function loginHandler(data) {
	var code = data.code;
	
	if (code != 'LOGIN') {
		alert('아이디 또는 비밀번호가 일치하지 않습니다.');
	} else {
		location.href = '/adm/organization';
	}
}