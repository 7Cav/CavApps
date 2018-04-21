<!-- /resources/views/components/header/breadcrumbs.blade.php -->

@if (count($breadcrumbs))
<h2 class="c-navbar__title u-mr-auto">
    <ol class="c-breadcrumb">
        @foreach ($breadcrumbs as $breadcrumb)
            @if ($breadcrumb->url && !$loop->last)
                <li class="c-breadcrumb__item"><a href="{{ $breadcrumb->url }}">{{ $breadcrumb->title }}</a></li>
            @else
                <li class="c-breadcrumb__item is-active">{{ $breadcrumb->title }}</li>
            @endif
        @endforeach
    </ol>
</h2>
@endif
