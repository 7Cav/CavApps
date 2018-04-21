//
// Switches
//

var Switch = function(){
    var $switch = $('.c-switch');

	$switch.on('click', function(e){
    	var $switchInput = $(this).find('.c-switch__input');

    	if ( !$(this).hasClass('is-disabled') ) {
    		if ($(this).hasClass('is-active') && $switchInput.attr('checked')) {
	        	$switchInput.removeAttr('checked');
        		$(this).removeClass('is-active');
	    	} else {
	        	$switchInput.attr('checked', 'checked')
        		$(this).addClass('is-active');
	     	}
    	} 
        return false;
    });
};