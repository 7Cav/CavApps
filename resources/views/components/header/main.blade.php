<!-- /resources/views/components/header/main.blade.php -->

    <header class="c-navbar u-mb-medium">
        <button class="c-sidebar-toggle u-mr-small">
            <span class="c-sidebar-toggle__bar"></span>
            <span class="c-sidebar-toggle__bar"></span>
            <span class="c-sidebar-toggle__bar"></span>
        </button><!-- // .c-sidebar-toggle -->

        {{-- <h2 class="c-navbar__title u-mr-auto">TODO: breadcrumbs</h2> --}}
        {{ Breadcrumbs::render() }}

        {{-- <notification-applet
        icon="fa-user-o"></notification-applet> --}}

        <notification-applet
        icon="far fa-bell">
        </notification-applet>

        <span class="header-username">{{Auth::user()->name}}</span>
        

        <profile-dropdown
        avatar="{{Auth::user()->avatar}}"
        domain="{{Request::root()}}">
        </profile-dropdown>

    </header>
