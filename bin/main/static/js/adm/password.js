$(function(){
	init();
	initEvent();
});
function init() {
	$('#password').focus();
}
function initEvent() {
	$('#confirm_password').on('keyup', function(){
		chkEnter(regist);
	});
	$('#btnRegist').on('click', regist);
}
function regist() {
	var password = $('#password').val();
	var confirmPassword = $('#confirm_password').val();
	
	var len = password.length;
	
	if (len < 8) {
		alert('비밀번호는 8자리 이상 입력해 주세요.');
	} else if (password == '' || confirmPassword == '') {
		alert('각 항목의 입력란을 확인해 주세요.');
	} else if (password != confirmPassword) {
		alert('비밀번호화 비밀번호 확인이 일치하지 않습니다.');
	} else {
		var obj = {};
		var data = {};
		data.password = password;
		
		obj.url = '/adm/password';
		obj.data = data;
		obj.contentType = 'json';
		
		console.log(JSON.stringify(obj));
		ajaxCall(obj, registHandler);
	}
}
function registHandler(data) {
	var code = data.code;
	var msg = '정상 처리되었습니다.';
	
	if (code == 'fail') {
		msg = '처리 중 오류가 발생하였습니다. 잠시후 다시 시도해 주세요.';
		alert(msg);
	} else {
		alert(msg);
		windowClose();
	}
}