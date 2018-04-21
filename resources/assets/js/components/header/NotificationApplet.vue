<template>
        <div class="c-dropdown dropdown u-mr-medium u-ml-small u-hidden-down@mobile">
            <a class="c-notification dropdown-toggle" href="#" id="dropdownMenuUser" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="c-notification__icon">
                    <i class="fa" :class="icon"></i>
                </span>
                <span v-if="notifications.length > 0" class="c-notification__number">{{notifications.length}}</span>
            </a>
        
            <div v-if="present" class="c-dropdown__menu c-dropdown__menu--large dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuUser">
                <notification-item
                v-for="(notification, key) in notifications"
                :key="key"
                :notification="notification"
                ></notification-item>
            </div>
        </div>    
</template>

<script>
    module.exports = {
        data: function() {
            return {
                notifications:Array,
                present:false,
            }
        },

        props: {
            icon:String
        },

        mounted: function() {
            this.notifications = [
                // {
                //     'title': 'testing notif 1',
                //     'msg': 'a long message',
                //     'icon': 'fa-calendar'
                // },
                // {
                //     'title': 'testing notif 2',
                //     'msg': 'another long message',
                //     'icon': 'fa-check'
                // },
                // {
                //     'title': 'testing notif 3',
                //     'msg': 'another long message',
                //     'icon': 'fa-info',
                // }
            ];         
            this.present = this.notifications.length> 0 ? true : false;
        }
    }

</script>
