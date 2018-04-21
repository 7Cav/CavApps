<!-- /resources/views/components/general/cards/LineGraph.blade.php -->

<div class="c-card u-p-medium u-mb-medium">
    <div class="u-flex u-justify-between u-align-items-center">
        <h3 class="c-card__title">{{$title}}</h3>
        <span class="u-text-small u-text-uppercase u-text-mute">{{$muted}}</span>
    </div>
    
    <br>
    <line-graph :data="{{ $data }}" :options="{{ $options }}"></line-graph>
</div>
