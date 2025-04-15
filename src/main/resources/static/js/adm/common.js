$(function(){
	initGnb();
});
function initGnb() {
	var code = getServiceCode();
	console.log('serviceCode=' + code)
	$('.nav-item').each(function(){
		var service = $(this).data('service');
		if (service == code) {
			$(this).addClass('active');
		}
	})
}
function getServiceCode() {
	var url = location.href;
	var info = url.split('/');
	
	return info[4];
}