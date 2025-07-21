var Tree = function(opt, handler) {
	var topId = opt.topId;
	var obj;
	
	this.getTopId = function() {
		return topId;
	}
	this.getNode = function() {
		return obj;
	}
	this.getParentNode = function() {
		return obj.parent;
	}
	this.release = function() {
		if (obj) {
			console.log('release');
			
			obj.deactivate();
			obj = undefined;
		}
	}
	this.reload = function() {
		$('#' + opt.target).dynatree('getTree').reload();
	}
	this.getRootNode = function() {
		var $root = $('#' + opt.target).dynatree('getRoot');
		return $root;
	}
	this.getRootChildrenNodes = function() {
		var $root = $('#' + opt.target).dynatree('getRoot');
		var list;
		if ($root.hasChildren()) {
			list = $root.childList;
		}
		return list;
	}
	this.hide = function() {
		$('#' + opt.target).hide();
	}
	this.show = function() {
		$('#' + opt.target).show();
	}
	this.getNodeByKey = function(key) {
		var node = $('#' + opt.target).dynatree('getTree').getNodeByKey(key);
		return node;
	}
	this.bind = function() {
		$('#' + opt.target).dynatree({
			lazy: true,
			onLazyRead: function(node) {
				handler._appendAjax(node);
			},
			onActivate: function(node) {
				if (node.data.isLazy!=true) {
					handler._appendAjax(node);
				}
				
				obj = node;
			},
			onClick: function(node, event) {
				if (handler._onClick) {
					console.log('onClick');
					handler._onClick(node, event);
				} else {
					console.log('not undefined onClick');
				}
				
				obj = node;
			},
			onCreate: function(node, span) {
				if (handler._onCreate) {
					handler._onCreate(node, span);
				} else {
					console.log('not undefined onCreate');
				}
			},
			imagePath : "/imgages/",
			initAjax: {
				type: 'post',
				url: opt.grpTopUri,
				dataType: 'json',
				data: {key:topId}
			},
			onLazyRead: function(node) {
				handler._appendAjax(node);
			}
		});
	}
}