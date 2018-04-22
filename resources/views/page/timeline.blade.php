@extends('layouts.app')

@section('content')
<div class="container">
	<div class="row justify-content-center">
		<div class="col-md-10 text-center">
			<ul class="timeline">

				@component('components.general.cards.timeline-panel', ['inverted' => false, 'badge' => true, 'first' => true])
					@slot('type')
						danger
					@endslot
					@slot('icon')
						fa-exclamation
					@endslot
					@slot('title')
						Application Denied
					@endslot
					@slot('timeSince')
						12 hours
					@endslot
					@slot('department')
						RRD
					@endslot
					@slot('content')
						Because you're a dick
					@endslot
				@endcomponent

				@component('components.general.cards.timeline-panel', ['inverted' => false, 'badge' => false])
				@slot('type')
					danger
				@endslot
				@slot('icon')
					fa-check
				@endslot
				@slot('title')
					Banned
				@endslot
				@slot('timeSince')
					5 Minutes
				@endslot
				@slot('department')
					S2
				@endslot
				@slot('content')
					FYI we found your porn stash
				@endslot
				@endcomponent

				@component('components.general.cards.timeline-panel', ['inverted' => true, 'badge' => true, 'first' => true])
				@slot('type')
					success
				@endslot
				@slot('icon')
					fa-check
				@endslot
				@slot('title')
					Test Title
				@endslot
				@slot('timeSince')
					12 hours
				@endslot
				@slot('department')
					RRD
				@endslot
				@slot('content')
					Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
					tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
					quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
					consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
					cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
					proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
				@endslot
				@endcomponent

			</ul>
		</div>
	</div>
</div>
@endsection
