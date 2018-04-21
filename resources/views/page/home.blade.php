@extends('layouts.app')

@section('content')
<div class="container-fluid">
	<div class="row">


		<div class="col-md-12">
			@component('components.general.cards.text')
				@slot('title')
					Welcome
				@endslot
				@slot('content')
					<strong>Step 1</strong>
					<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
					tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
					quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.
					</p>
					<br>
					<strong>Thing 2</strong>
					<p>Consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
					cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
					proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
				@endslot
			@endcomponent
		</div>

	</div>
</div><!-- // .container -->
@endsection
