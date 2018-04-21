<!-- /resources/views/components/sidebar/item.blade.php -->

<li class="c-sidebar__item">
	<a class="c-sidebar__link {{ Request::path() ==  $item->url ? 'is-active' : ''  }}" href="{{ URL::to($item->url) }}">
		<i class="{{ $item->icon }} u-mr-xsmall"></i>{{$item->title}}
	</a>
</li> 
