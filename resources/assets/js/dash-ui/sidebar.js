//
// Sidebar
//

var Sidebar = function(){

	var $document = $(document),
		$sidebar = $(".js-page-sidebar"), // page sidebar itself
		$sidebarToggle = $(".c-sidebar-toggle"), // sidebar toggle icon
		$sidebarToggleContainer = $(".c-navbar"), // component that contains sidebar toggle icon
		$sidebarItem = $(".c-sidebar__item"),
		$sidebarSubMenu = $(".c-sidebar__submenu");

	$sidebarToggleContainer.on('click', function(e){
		var $target = $(e.target);
		if ($target.closest($sidebarToggle).length) {
			$sidebar.addClass('is-visible');
			return false;
		}
	});

	// Bootstrap collapse.js plugin is used for handling sidebar submenu.
	$sidebarSubMenu.on('show.bs.collapse', function () {
		$(this).parent($sidebarItem).addClass('is-open');
	});

	$sidebarSubMenu.on('hide.bs.collapse', function () {
		$(this).parent($sidebarItem).removeClass('is-open');
	});

	$document.on('click', function(e) {
		var $target = $(e.target);
		if (!$target.closest($sidebar).length) {
			$sidebar.removeClass('is-visible');
		}
	});
}; 