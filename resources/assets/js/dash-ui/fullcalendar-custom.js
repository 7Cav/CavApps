//
// Full Calendar 
//
// Specify your own calendar events, options
// Read More: https://fullcalendar.io/docs/

$(function(){

	if($('.js-calendar').length){
		var $calendar = $('.js-calendar');
		
	    $calendar.fullCalendar({
	    	//
	        // Put your options and callbacks here
	        //
	        
	        header:
	        {
	            left: 'prev,next',
	            center: 'title',
	            right: 'month,agendaWeek,agendaDay'
	        },

	        // Show full name of day instead of short(default) name
	        dayNamesShort: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

	        // Time Format
	        timeFormat: 'hh:mm a',

	        // Events
	        events: [
		        {
		            title  : 'Sara\'s birthday',
		            start  : '2018-01-28',
		            className: 'fc-event--orange',
		            allDay: true
		        },
		        {
		        	title  : 'Jason',
		            start  : '2018-02-24',
		            end    : '2018-02-26',
		            className: 'fc-event--green',
		            allDay: true
		        },
		        {
		            title  : 'Ruth in London',
		            start  : '2018-02-08',
		            end    : '2018-02-12',
		            className: 'fc-event--blue'
		        },
		        {
		            title  : 'All Hands 4',
		            start  : '2018-02-27',
		            className: 'fc-event--green',
		            allDay: true
		        },
		        {
		            title  : 'Carl',
		            start  : '2018-02-30',
		            className: 'fc-event--green'
		        }, //
		        {
		            title  : 'Adam\'s birthday',
		            start  : '2018-02-28',
		            className: 'fc-event--orange',
		            allDay: true
		        },
		        {
		        	title  : 'Business Meeting',
		            start  : '2018-02-24',
		            end    : '2018-02-26',
		            className: 'fc-event--green',
		            allDay: true
		        },
		        {
		            title  : 'Vist Japan',
		            start  : '2018-02-08',
		            end    : '2018-02-12',
		            className: 'fc-event--blue'
		        },
		        {
		            title  : 'Buy New Mac',
		            start  : '2018-02-27',
		            className: 'fc-event--green',
		            allDay: true
		        },
		        {
		            title  : 'New Product Launch',
		            start  : '2018-02-30',
		            className: 'fc-event--green'
		        }
		    ]
	    });
	}
});