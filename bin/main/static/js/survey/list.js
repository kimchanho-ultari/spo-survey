$(function(){
	init();
	initEvent();
});
function init() {
	console.log('init');
}
function initEvent() {
	$('#btnSearch').on('click', listBySearch);
	$('#keyword').on('keyup', function(){
		chkEnter(listBySearch);
	});
	$('.paging').on('click', listByPaging);
	$('.listItem').on('click', article);
}
function listByPaging() {
	var pageNo = $(this).data('pageNo');
	console.log('[listByPaging]' + pageNo);
	search(pageNo);
}
function listBySearch() {
	search(1);
}
function search(pageNo) {
	var $form = $('<form>');
	$form.attr('action', '/survey/');
	$form.attr('method', 'post');
	$form.appendTo('body');
	
	var $keyword = $('<input type="hidden" name="keyword">').val($('#keyword').val());
	var $pageNo = $('<input type="hidden" name="pageNo">').val(pageNo);
	
	$form.append($keyword).append($pageNo);
	$form.submit();
}
function article() {
	var surveyCode = $(this).data('surveyCode');
	var status = $(this).data('status');
	var isOpen = $(this).data('isOpen');
	var isWriter = $(this).data('isWriter');
	
	console.log(surveyCode, isOpen, status, isWriter);
	
	if (isWriter == 'N' && isOpen == 'N' && status == 'C') {
		var msg = '설문을 완료하였습니다.';
		alert(msg);
	} else if (isWriter == 'N' && status == 'W') {
		var msg = '대기중인 설문입니다.';
		alert(msg);
	}  else {
		location.href = '/survey/article/' + surveyCode;
	}
}