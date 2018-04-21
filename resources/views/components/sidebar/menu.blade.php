<!-- /resources/views/components/sidebar/menu.blade.php -->

<div>
    <h4 class="c-sidebar__title">{{$menu->title}}</h4>
    <ul class="c-sidebar__list">
    
        @foreach($menu->items as $item)
            @include('components.sidebar.item', $item)
        @endforeach

    </ul>
</div>