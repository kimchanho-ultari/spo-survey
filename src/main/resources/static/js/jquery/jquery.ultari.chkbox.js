(function($){
	$.fn.chkbox = function(options) {
		this.each(function(){
			var chkbox = new Chkbox(this, options);
			$(this).data('chkbox', chkbox);
		});
		return this;
	}
	$.fn.getChkItemList = function() {
		var list = [];
		this.each(function(){
			var chkbox = $(this).data('chkbox');
			if (chkbox) {
				list = chkbox._getChkItemList();
			}
		});
		return list;
	}
	$.fn.getChkKeyList = function() {
		var list = [];
		this.each(function(){
			var chkbox = $(this).data('chkbox');
			if (chkbox) {
				list = chkbox._getChkKeyList();
			}
		});
		return list;
	}
	$.fn.getChkTitleList = function() {
		var list = [];
		this.each(function(){
			var chkbox = $(this).data('chkbox');
			if (chkbox) {
				list = chkbox._getChkTitleList();
			}
		});
		return list;
	}
	$.fn.getItemList = function() {
		var list = [];
		this.each(function(){
			var chkbox = $(this).data('chkbox');
			if (chkbox) {
				list = chkbox._getItemList();
			}
		});
		return list;
	}
	$.fn.reset = function() {
		this.each(function(){
			var chkbox = $(this).data('chkbox');
			if (chkbox) {
				chkbox._reset();
			}
		});
		return this;
	}
	$.fn.isChecked = function() {
		var isChecked = false;
		this.each(function(){
			var chkbox = $(this).data('chkbox');
			if (chkbox) {
				isChecked = chkbox._isChecked();
			}
		});
		return isChecked;
	}
	$.fn.sizeOfItem = function() {
		var size = 0;
		this.each(function(){
			var chkbox = $(this).data('chkbox');
			if (chkbox) {
				size = chkbox._sizeOfItem();
			}
		});
		return size;
	}
	$.fn.sizeOfCheckItem = function() {
		var size = 0;
		this.each(function(){
			var chkbox = $(this).data('chkbox');
			if (chkbox) {
				size = chkbox._sizeOfCheckItem();
			}
		});
		return size;
	}
})(jQuery);
function Chkbox(selector, options) {
	this._$chkboxArea = null;
	this._$chkAll = null;
	this._$chkItems = null;
	
	this._options = null;
	
	this._initOption(options);
	this._init(selector);
	this._initEvent();
}
Chkbox.defaultOptions = {
}
Chkbox.prototype._initOption = function(options) {
	this._options = jQuery.extend({}, Chkbox.defaultOptions, options);
}
Chkbox.prototype._init = function(selector) {
	this._$chkboxArea = $(selector);
	this._$chkAll = this._$chkboxArea.find('.chkAll');
	this._$chkItems = this._$chkboxArea.find('.chkItem');
}
Chkbox.prototype._reset = function() {
	this._$chkAll = this._$chkboxArea.find('.chkAll');
	this._$chkItems = this._$chkboxArea.find('.chkItem');
	this._unchkAll();
	this._initEvent();
}
Chkbox.prototype._initEvent = function() {
	var objThis = this;
	$(this._$chkAll).on('click', function(){
		objThis._chkAll($(this));
	});
	$(this._$chkItems).on('click', function(){
		objThis._chkItem($(this));
	});
}
Chkbox.prototype._chkAll = function($item) {
	var isChecked = $item.is(':checked');
	
	this._$chkboxArea.find('.chkItem').each(function(){
		var item = $(this);
		var isDisabled = item.prop('disabled');
		if (!isDisabled) {
			item.prop('checked', isChecked);
		}
	});
	//this._$chkItems.prop('checked', isChecked);
}
Chkbox.prototype._chkItem = function($item) {
	var totalItemCnt = this._$chkItems.length;
	var chkItemCnt = this._$chkboxArea.find('.chkItem:checked').length;
	if (totalItemCnt == chkItemCnt) {
		this._$chkAll.prop('checked', true);
	} else {
		this._$chkAll.prop('checked', false);
	}
}
Chkbox.prototype._unchkAll = function() {
	this._$chkAll.prop('checked', false);
	this._$chkItems.prop('checked', false);
}
Chkbox.prototype._getChkItemList = function() {
	var list = [];
	this._$chkboxArea.find('.chkItem:checked').each(function(){
		var obj = $(this).data();
		list.push(obj);
	});
	
	return list;
}
Chkbox.prototype._getChkKeyList = function() {
	var list = [];
	this._$chkboxArea.find('.chkItem:checked').each(function(){
		var obj = $(this).data('item');
		var key = obj.key;
		list.push(key);
	});
	
	return list;
}
Chkbox.prototype._getChkTitleList = function() {
	var list = [];
	this._$chkboxArea.find('.chkItem:checked').each(function(){
		var obj = $(this).data('item');
		var title = obj.title;
		list.push(title);
	});
	
	return list;
}
Chkbox.prototype._getItemList = function() {
	var list = [];
	this._$chkboxArea.find('.chkItem').each(function(){
		var obj = $(this).data();
		list.push(obj);
	});
	
	return list;
}
Chkbox.prototype._isChecked = function() {
	var isChecked = false;
	var len = this._$chkboxArea.find('.chkItem:checked').length;
	if (len > 0) isChecked = true;
	return isChecked;
}
Chkbox.prototype._sizeOfItem = function() {
	var size = this._$chkboxArea.find('.chkItem').length;
	
	return size;
}
Chkbox.prototype._sizeOfCheckItem = function() {
	var size = this._$chkboxArea.find('.chkItem:checked').length;
	
	return size;
}