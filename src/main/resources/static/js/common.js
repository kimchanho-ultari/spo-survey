$(function(){
	$('#btnLogout').on('click', logout);
});
function logout() {
	location.href = '/logout';
}
function ajaxCall(obj, callback) {
	var contentType = 'application/x-www-form-urlencoded; charset=UTF-8';
	var data = obj.data;
	
	if (obj.contentType != undefined) {
		if (obj.contentType == 'json') {
			contentType = 'application/json; charset=UTF-8';
			data = JSON.stringify(data);
		}
	} 
	
	$.ajax({
		type: 'POST',
		url: obj.url,
		dataType: 'JSON',
		contentType: contentType,
		data: data,
		beforeSend: function(xmlHttpRequest) {
			xmlHttpRequest.setRequestHeader('AJAX', 'true');
		},
		error: function(req, status, e) {
			var status = req.status;
			var message = req.responseText;
			var error = e;
			
			var msg = '[_initAjax] status: ' + status + ', ';
			msg += 'message: ' + message + '\n';
			msg += 'error: ' + error;
			console.log(msg);
			
			if (status == 400) {
				alert('세션이 만료되었습니다.');
				location.href = '/invalid';
			}
		},
		success: function(data) {
			data.req = obj.data;
			callback(data);
		},
		complete: function(data) {
		}
	});
}
String.prototype.replaceAll = function(str1, str2) {
	return this.split(str1).join(str2);
}
function chkEnter(callback) {
	if (event.keyCode == 13) {
		callback();
	}
}
function validator(str, regExp, msg) {
	var result = regExp.test(str);
	if (!result) {
		if (msg) {
			alert(msg);
		}
	}
	return result;
}
function isEmpty(str) {
	var result = false;
	if (typeof str == undefined || str == null || str == "undefined" || str == '') {
		result = true;
	}
	return result;
}
function nvl(str, replace) {
	var val = str;
	if (isEmpty(val)) {
		val = replace;
	}
	return val;
}
function checkNumberFormat() {
	console.log($(this).val());
	$(this).val($(this).val().replace(/[^0-9]/gi, ''));
}
function isChecked(target) {
	var isChecked = $('#' + target).isChecked();
	return isChecked;
}
function getChkItemList(target) {
	var list = $('#' + target).getChkItemList();
	return list;
}
function lpad(str, len, pad) {
	var tmp = str;
	var s = tmp.length;
	
	for (var i = s; i < len; i++) {
		tmp = pad + tmp;
	}
	return tmp;
}
function makeHour(target) {
	var tag = '<option value="_time">_time</option>';
	var option = '';
	
	for (var i = 9; i <= 18; i++) {
		option += tag.replaceAll('_time', i);
	}
	
	$('#' + target).empty();
	$('#' + target).append(option);
}
function makeMinute(target) {
	var tag = '<option value="_minute">_minute</option>';
	var option = '';
	for (var i = 0; i < 60; i += 10) {
		option += tag.replaceAll('_minute', lpad(i + '', 2, '0'));
	}
	
	$('#' + target).empty();
	$('#' + target).append(option);
}
Array.prototype.division = function(n) {
	var arr = this;
	var len = arr.length;
	var cnt = Math.floor(len / n);
	var tmp = [];
	
	for (var i = 0; i <= cnt; i++) {
		tmp.push(arr.splice(0, n));
	}
	
	return tmp;
}
function validator(str, regExp, msg) {
	var result = regExp.test(str);
	if (!result) {
		alert(msg);
	}
	return result;
}