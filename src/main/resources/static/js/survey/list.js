$(function () {
	initEvent();		// PC
	mobileEvent();		// MOBILE
});

function initEvent() {
	$('#btnSearch').on('click', listBySearch);
	$('#keyword').on('keyup', function () {
		chkEnter(listBySearch);
	});

	$('.paging').on('click', listByPaging);

	$('.listItem').on('click', article);
}

function mobileEvent() {
	$('#btnSearchMobile').on('click', function () {
		mobileListBySearch(1);
	});

	$('.survey-card').on('click', article);

	// 진행중인 투표 | 종료된 투표
	document.querySelectorAll('.toggle-header').forEach(header => {
		header.addEventListener('click', () => {
			const content = header.nextElementSibling;
			content.classList.toggle('active');
		});
	});
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

function mobileListBySearch(pageNo = 1) {
	const keyword = $('#keywordMobile').val();

	$.ajax({
		type: 'POST',
		url: '/survey/',
		dataType: 'html',
		data: {
			keyword: keyword,
			pogeNo: pageNo
		},
		success: function (data) {
			$('body').empty();
			$('body').html(data);
		},
		error: function (req, status, e) {
		},
		complete: function (data) {
		}
	})
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
	} else {
		location.href = '/survey/article/' + surveyCode;
	}
}