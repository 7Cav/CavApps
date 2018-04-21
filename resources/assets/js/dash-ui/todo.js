// 
// Todo Tasks
//

var Todo = function() {
	var $todo = $(".c-todo"),
		$todoInput = $(".c-todo__input");

	$todo.on('click', function(e){
		var $target = $(e.target);
		if ($target.closest($todoInput).length) {
			$(this)
				.closest($todo)
				.toggleClass('is-completed');
		}
	});
};
