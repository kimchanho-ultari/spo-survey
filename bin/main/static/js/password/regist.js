$(function(){
	init();
	initEvent();
});
function init() {
	console.log('init');
	$('#password').focus();
}
function initEvent() {
	$('#btnCancel').on('click', windowClose);
	$('#btnRegist').on('click', regist);
	$('#confirm_password').on('keyup', function(){
		chkEnter(regist);
	});
}
function windowClose() {
	window.close();
	window.open('about:blank', '_self').self.close();
}
function regist() {
	var password = $('#password').val();
	var newPassword = $('#newPassword').val();
	var confirmPassword = $('#confirm_password').val();
	
	var validator = new PasswordValidator(newPassword, key);
	var result = validator.validate();
	
	console.log(result);
	
	if (password == '' || newPassword == '' || confirmPassword == '') {
		alert('각 항목의 입력란을 확인해 주세요.');
	} else if (newPassword != confirmPassword) {
		alert('변경할 비밀번호화 변경할 비밀번호 확인이 일치하지 않습니다.');
	} else if (result.code != 'pass') {
		alert(result.msg);
	} else {
		var obj = {};
		var data = {};
		data.password = password;
		data.newPassword = newPassword;
		
		obj.url = '/password/regist';
		obj.data = data;
		obj.contentType = 'json';
		
		console.log(JSON.stringify(obj));
		ajaxCall(obj, registHandler);
	}
}
function registHandler(data) {
	var code = data.code;
	var msg = '정상 처리되었습니다.';
	
	if (code == 'ok') {
		alert(msg);
		windowClose();
	} else if (code == 'different') {
		msg = '현재 비밀번호가 일치하지 않습니다.';
		alert(msg);
	} else {
		msg = '처리 중 오류가 발생하였습니다. 잠시후 다시 시도해 주세요.';
		alert(msg);
	}
}
