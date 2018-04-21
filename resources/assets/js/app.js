/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

require('./bootstrap');

window.Vue = require('vue');


/**
 * Next, we will create a fresh Vue application instance and attach it to
 * the page. Then, you may begin adding components to this application
 * or customize the JavaScript scaffolding to fit your unique needs.
 */

Vue.component('content-wrapper', require('./components/main/ContentWrapper.vue'));

// Header
Vue.component('notification-applet', require('./components/header/NotificationApplet.vue'));
Vue.component('notification-item', require('./components/header/NotificationItem.vue'));
Vue.component('profile-dropdown', require('./components/header/Profile.vue'));

// Graphs
Vue.component('line-graph', require('./components/graphs/LineGraph.vue'));

const app = new Vue({
    el: '#app',
});
