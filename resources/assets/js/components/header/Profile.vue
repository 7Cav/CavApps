<template>
    <div class="c-dropdown dropdown">
        <a  class="c-avatar c-avatar--xsmall has-dropdown dropdown-toggle" href="#" id="dropdwonMenuAvatar" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <img class="c-avatar__img" :src="avatar" alt="User's Profile Picture">
        </a>

        <div class="c-dropdown__menu dropdown-menu dropdown-menu-right" aria-labelledby="dropdwonMenuAvatar">
            <!-- <a class="c-dropdown__item dropdown-item" href="#">Edit Profile</a>
            <a class="c-dropdown__item dropdown-item" href="#">View Activity</a> -->
            <a class="c-dropdown__item dropdown-item" :href="domain + '/logout'">Sign out</a>
        </div>
    </div>
</template>

<script>
    module.exports = {
        data: function() {
            return {

            }
        },
        props: {
            avatar:String,
            domain:String,
        },
    }
</script>
