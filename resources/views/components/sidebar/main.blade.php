<!-- /resources/views/components/sidebar/main.blade.php -->

<div class="o-page__sidebar js-page-sidebar">
	<div class="c-sidebar">
		<a class="c-sidebar__brand" href="#">
			<img class="c-sidebar__brand-img" src="{{ asset('img/logo.png') }}" alt="Logo"><span>{{$appName}}</span>
		</a>
	
		@foreach($menus as $menu)
			@include('components.sidebar.menu', $menu)
		@endforeach
		
	</div><!-- // .c-sidebar -->
</div><!-- // .o-page__sidebar -->  