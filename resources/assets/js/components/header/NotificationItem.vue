<template>
        <a href="#" class="c-dropdown__item dropdown-item o-media">
            <span class="o-media__img u-mr-xsmall">
                <span class="c-avatar c-avatar--xsmall">
                    <span class="c-avatar__img u-bg-primary u-flex u-justify-center u-align-items-center">
                        <i class="fa u-text-large u-color-white" :class="notification.icon"></i>
                    </span>
                </span>
            </span>
            <div class="o-media__body">
                <h6 class="u-mb-zero">{{notification.title}}</h6>
                <p class="u-text-mute">{{notification.msg}}</p>
            </div>
        </a>
</template>

<script>
    module.exports = {
        data: function() {
            return  {

            }
        },
        props: {
            notification:Object
        }
    }
</script>