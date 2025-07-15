(function($){
	$.fn.survey = function(options) {
		this.each(function(){
			var survey = new Survey(this, options);
			$(this).data('ultari-survey', survey);
		});
		return this;
	}
	$.fn.appendSurvey = function() {
		this.each(function(){
			var survey = $(this).data('ultari-survey');
			if (survey) {
				survey._appendSurvey();
			}
		});
		return this;
	}
	$.fn.surveyData = function() {
		console.log('test');
		var val = null;
		this.each(function(){
			console.log('test2');
			var survey = $(this).data('ultari-survey');
			console.log(survey);
			if (survey) {
				val = survey._surveyData();
			}
		});
		return val;
	}
	$.fn.setQuestions = function(list) {
		var val = null;
		this.each(function(){
			var survey = $(this).data('ultari-survey');
			if (survey) {
				survey._setQuestions(list);
			}
		});
		return val;
	}
})(jQuery);
function Survey(selector, options) {
	this._$survey = null;
	
	this._options = null;
	
	this._initOptions(options);
	this._init(selector);
	this._initEvent();
	
	//this._initSurvey();
}
Survey.defaultOptions = {}
Survey.prototype._init = function(selector) {
	this._$survey = $(selector);
}
Survey.prototype._initOptions = function(options) {
	this._options = jQuery.extend({}, Survey.defaultOptions, options);
}
Survey.prototype._initEvent = function() {
	var objThis = this;
}
Survey.prototype._initSurvey = function() {
	this._appendSurvey();
}
Survey.prototype._removeSurvey = function() {
	var key = $(this).data('key');
	console.log('revemoSurvey=' + key);
	$('#' + key).remove();
	
	var list = $('.question_num');
	var num = 0;
	list.each(function(){
		var item = $(this);
		
		item.text('질문' + (++num));
	});
}
Survey.prototype._appendSurvey = function(question) {
	var objThis = this;
	
	var $children = this._$survey.children();
	var len = $children.length;
	var num = len + 1;
	
	var code = this.uuid();
	var type = 'regist';
	if (question) {
		code = question.questionCode;
		type = 'save';
	}
	
	var $survey_area = $('<table class="question_area" style="width:100%">')
							.attr('id', 'question_area_' + code)
							.data('type', type);
	
	var $tr_title = $('<tr>');
	var $tr_options = $('<tr>');
	var $tr_items = $('<tr>');
	
	// 질문 내용
	var $th_title = $('<th style="width:140px" class="th_0px_yellow2">');
	var $p_title = $('<p class="q question_num">').text('질문' + num);
	
	$th_title.append($p_title);
	$tr_title.append($th_title);
	
	var $td_contents = $('<td class="td_topline">');
	
	var $table_contents = $('<table style="width:100%">');
	var $tr_contents = $('<tr>');
	var $td_question = $('<td style="width:88%" class="td_none">');
	var $td_btn_del_survey = $('<td style="width:88%" class="td_none">');
	
	var $input_questions = $('<input type="text" class="question_contents">')
							.attr('id', 'q_' + code)
							.attr('placeholder', '질문을 입력하세요.');
	if (question)
		$input_questions.val(question.questionContents);
	
	var $btn_del_survey = $('<span class="button button_gray2">')
								.text('문항 삭제')
								.data('key', 'question_area_' + code)
								.on('click', objThis._removeSurvey);
	var $img_del_survey = $('<img src="/images/icon_minus.png" style="width:10px;height:10px">');
	
	$td_question.append($input_questions);
	$td_btn_del_survey.append($btn_del_survey);
	
	$tr_contents.append($td_question).append($td_btn_del_survey);
	$table_contents.append($tr_contents);
	
	$td_contents.append($table_contents);
	$tr_title.append($td_contents);
	
	// 기타 옵션
	var $th_options_title = $('<th class="th_0px_yellow2">').text('기타옵션');
	var $td_options_contents = $('<td>');
	var $table_options_contents = $('<table style="width:100%">');
	var $tr_options_contents = $('<tr>');
	
	var $td_options_multi_checkbox = $('<td style="width:20px" class="td_none check_box">');
	var $td_options_multi_label = $('<td style="width:150px" class="td_none">');
	var $td_options_anonymous_checkbox = $('<td style="width:20px" class="td_none check_box">');
	var $td_options_anonymous_label = $('<td class="td_none">');
	
	var $input_checkbox_multi = $('<input type="checkbox" class="is_multi">')
									.attr('id', 'multi_' + code);
	
	var $input_checkbox_anonymous = $('<input type="checkbox" class="is_anonymous">')
									.attr('id', 'anonymous_' + code);
	
	if (question) {
		var isMulti = question.isMulti;
		var isAnonymous = question.isAnonymous;
		
		if (isMulti && isMulti == 'Y') $input_checkbox_multi.prop('checked', true);
		if (isAnonymous && isAnonymous == 'Y') $input_checkbox_anonymous.prop('checked', true);
	}
	
	var $label_multi = $('<label>')
							.attr('for', 'multi_' + code)
							.text('복수선택');
	
	var $label_anonymous = $('<label>')
							.attr('for', 'anonymous_' + code)
							.text('익명투표');
	
	$td_options_multi_checkbox.append($input_checkbox_multi);
	$td_options_multi_label.append($label_multi);
	$td_options_anonymous_checkbox.append($input_checkbox_anonymous);
	$td_options_anonymous_label.append($label_anonymous);
	
	$tr_options_contents.append($td_options_multi_checkbox).append($td_options_multi_label).append($td_options_anonymous_checkbox).append($td_options_anonymous_label);
	$table_options_contents.append($tr_options_contents);
	
	$td_options_contents.append($table_options_contents);
	
	$tr_options.append($th_options_title).append($td_options_contents);
	
	// 항목입력
	var $th_items_title = $('<th class="th_0px_yellow2">').text('항목 입력');
	var $btn_add_items = $('<span class="button button_gray2 btn-item">')
							.text('항목 추가  ')
							.data('key', 'items_' + code)
							.on('click', function(){
								objThis._appendQuestionsItems('items_' + code);
							});
	var $icon_add_items = $('<img src="/images/icon_plus.png" style="width:10px;height:10px">');
	
	$btn_add_items.append($icon_add_items);
	$th_items_title.append($btn_add_items);
	
	var $td_items_contents = $('<td class="td_addfile">');
	var $table_items_contents = $('<table style="width:100%">')
									.attr('id', 'items_' + code);;
									
	$td_items_contents.append($table_items_contents);
	$tr_items.append($th_items_title).append($td_items_contents);

	
	$survey_area.append($tr_title).append($tr_options).append($tr_items);
	
	this._$survey.append($survey_area);
	
	if (!question) {
		for (var i = 0; i < 3; i++) {
			objThis._appendQuestionsItems('items_' + code);
		}
	}
}
Survey.prototype._appendQuestionsItems = function(key) {
	var item = arguments[1];
	var objThis = this;
	var $table_items_contents = $('#' + key);
	
	var itemCode = this.uuid();
	var type = 'regist';
	if(item) {
		itemCode = item.itemCode;
		type = 'save';
	}
	
	var $tr_items_contents = $('<tr class="survey_item_contents">').data('type', type);
	var $td_items_input = $('<td class="td_none_underline">');
	var $td_items_checkbox = $('<td style="width:80px">');
	var $td_items_btn = $('<td style="width:10px">');
	
	var $input = $('<input type="text" placeholder="내용을 입력하세요." class="survey_items">').attr('id', 'item_' + itemCode);
	if (item) $input.val(item.itemContents);
	
	var $btn_del = $('<img src="/images/btn_del.png" class="btn_del_items" style="float:right">')
					.on('click', objThis._removeQuestionsItems);
	
	var $input_checkbox_item_type = $('<input type="checkbox" class="check_box item_type">')
										.attr('id', 'item_type_' + itemCode)
										.on('click', function(){
											var numberOfChecked = $table_items_contents.find('input:checkbox:checked').length;
											if (numberOfChecked > 1) {
												alert('한 문항당 서술형은 한개만 가능합니다.');
												$(this).prop('checked', false);
											} else {
												var checked = $(this).prop('checked');
												if (checked) {
													$input.val('기타의견');
												} else {
													var val = $input.val();
													if (val == '기타의견') {
														$input.val('');
													}
												}
											}
										});
	
	if (item && item.itemType != 'CHOICE') {
		$input_checkbox_item_type.prop('checked', true);
	}
	
	var $label_item_type = $('<label style="margin-left:5px">')
								.attr('for', 'item_type_' + itemCode)
								.text('서술형');
	
	var $table_items_checkbox = $('<table style="width:100%">');
	var $tr_items_checkbox = $('<tr>');
	var $td_items_checkbox_input = $('<td style="width:20px" class="td_none checkbox">');
	var $td_items_checkbox_desc = $('<td class="td_none">');
	
	$tr_items_checkbox.append($td_items_checkbox_input).append($td_items_checkbox_desc);
	$table_items_checkbox.append($tr_items_checkbox);
	
	$td_items_input.append($input);
	
	$td_items_checkbox_input.append($input_checkbox_item_type)
	$td_items_checkbox_desc.append($label_item_type);
	
	$td_items_checkbox.append($table_items_checkbox);
	$td_items_btn.append($btn_del);
	$tr_items_contents.append($td_items_input).append($td_items_checkbox).append($td_items_btn);
	
	$table_items_contents.append($tr_items_contents);
}
Survey.prototype._removeQuestionsItems = function() {
	$(this).parent().parent().remove();
}
Survey.prototype._surveyData = function() {
	var list = [];
	var $survey = this._$survey;
	var $survey_list = $survey.children();
	$survey_list.each(function(){
		var question = {};
		var questionItem = [];
		
		var $surveyItem = $(this);
		var questionType = $surveyItem.data('type');
		var questionContents = $surveyItem.find('.question_contents').val();
		var questionCode = $surveyItem.find('.question_contents').attr('id');
		
		if (questionCode) questionCode = questionCode.substring(2);

		var isMulti = $surveyItem.find('.is_multi').is(':checked') == true ? 'Y' : 'N';
		var isAnonymous = $surveyItem.find('.is_anonymous').is(':checked') == true ? 'Y' : 'N';
		
		var $itemContentsList = $surveyItem.find('.survey_item_contents');
		
		var num = 0;
		$itemContentsList.each(function(){
			var $itemContents = $(this);
			var item = {};
			
			var type = $itemContents.data('type');
			var itemContents = $itemContents.find('.survey_items').val();
			var itemCode = $itemContents.find('.survey_items').attr('id');
			if (questionCode) itemCode = itemCode.substring(5);
			var itemType = $itemContents.find('.item_type').is(':checked') == true ? 'DESC' : 'CHOICE';
			
			console.log('type=' + type);
			if (itemContents != '') {
				item.itemCode = itemCode;
				item.itemContents = itemContents;
				item.itemType = itemType;
				item.num = ++num;
				item.type = type;
				
				questionItem.push(item);
			}
		});
		
		question.questionType = questionType;
		question.questionCode = questionCode;
		question.questionContents = questionContents;
		question.isMulti = isMulti;
		question.isAnonymous = isAnonymous;
		question.questionItem = questionItem;
		
		console.log(questionContents + questionItem.length);
		
		if (questionContents != '' && questionItem.length > 0) {
			list.push(question);
		}
	});
	
	return list;
};
Survey.prototype._setQuestions = function(list) {
	var objThis = this;
	list.forEach(function(question) {
		objThis._appendSurvey(question);
		
		var itemList = question.itemList;
		objThis._setItems(itemList);
	});
};
Survey.prototype._setItems = function(list) {
	var objThis = this;
	list.forEach(function(item) {
		var key = 'items_' +  item.questionCode;
		objThis._appendQuestionsItems(key, item);
	});
};
Survey.prototype.uuid = function() {
	var dt = new Date().getTime();
	var val = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return val;
}