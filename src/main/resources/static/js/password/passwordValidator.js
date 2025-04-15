var PasswordValidator = function(pass, id) {
	this.regRules = /^(?=.*?[a-zA-Z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{9,15}$/;
	this.regSameChar = /(\w)\1\1/;
	this.regHangul = /[ㄱ-ㅎ|ㅑ-ㅣ|가-힣]/;
	this.regUnusable = /script|alert|\/script|cookie|document/;
	
	this.password = pass;
	this.id = id;
}
PasswordValidator.prototype.validate = function() {
	var rules = this.test(this.password, this.regRules);			// 비밀번호 룰
	var sameChar = this.test(this.password, this.regSameChar);		// 동일 문자 3회이상 연속 여부
	var hangul = this.test(this.password, this.regHangul);			// 한글 폼함 여부
	var unusable = this.test(this.password, this.regUnusable);		// 사용 불가 문자열 여부
	var isIncludeId = this.search(this.password, this.id);			// 아이디 포함 여부
	var isBlank = this.search(this.password, /\s/);					// 공백 포함 여부
	
	//console.log('rules=' + rules);
	//console.log('sameChar=' + sameChar);
	//console.log('hangul=' + hangul);
	//console.log('unusable=' + unusable);
	//console.log('isIncludeId=' + isIncludeId);
	//console.log('isBlank=' + isBlank);
	
	var result = {};
	
	if (!rules) {
		result.code = 'rules';
		result.msg = '영문(대/소문자), 숫자, 특수문자(#?!@$%^&*-) 조합 9자 이상 15자 이하로 설정 가능합니다.';
	} else if (isIncludeId) {
		result.code = 'id';
		result.msg = '비밀번호에 아이디를 포함하여 설정할 수 없습니다.';
	} else if (sameChar) {
		result.code = 'same_char';
		result.msg = '동일 문자를 3회이상 연속 사용할 수 없습니다.';
	} else if (unusable) {
		result.code = 'unusable';
		result.msg = '사용할 수 없는 문자가 포함되어있습니다.';
	} else if (hangul) {
		result.code = 'hangul';
		result.msg = '비밀번호에 한글을 포함하여 설정할 수 없습니다.';
	} else if (isBlank) {
		result.code = 'blank';
		result.msg = '비밀번호에 공백을 포함하여 설정할 수 없습니다.';
	} else {
		result.code = 'pass';
		result.msg = '유효성 통과';
	}
	
	return result;
}
PasswordValidator.prototype.test = function(password, regExp) {
	return regExp.test(password);
}
PasswordValidator.prototype.search = function(password, compare) {
	return password.search(compare) > -1 ? true : false;
}

//var id = 'ultari1';
//var password = 'msger1234!';
//var validator = new PasswordValidator(password, id);
//var res = validator.validate();
//console.log(res);