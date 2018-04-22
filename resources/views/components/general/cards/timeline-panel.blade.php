<!-- /resources/views/components/general/cards/timeline-panel.blade.php -->

@if($inverted)
	<li class="timeline-inverted">
@else
	<li>
@endif
		@if($badge ?? false)
			<div class="timeline-badge {{ $type ?? 'primary' }}"><i class="fa {{ $icon }}"></i></div>
		@endif
		<div class="timeline-panel {{ ($first ?? false) ? 'first' : null}} ">
			<div class="timeline-heading c-card__header c-card__header--transparent o-line">
				<h3 class="timeline-title">{{ $title }}</h3>
				<p><small class="text-muted"><i class="glyphicon glyphicon-time"></i> {{ $timeSince }} ago via {{ $department }}</small></p>
			</div>
			<div class="timeline-body c-card__body">
				<p>{{ $content }}</p>
			</div>
		</div>
	</li>
