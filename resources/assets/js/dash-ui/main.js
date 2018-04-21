//
// Main javascript
// 
//
// Initialize & Configure plugins


//
// Table of content:
//
// 1. Sidebar
// 2. Switches
// 3. Toggles
// 4. Todo Tasks
// 5. Chat Dialogue
// 6. Boards (dragula plugin)
// 7. Select (select2 plugin)
// 8. File Upload (dropzone plugin)
// 9. Sortable Table (dataTable plugin)
// 10. Date Picker (datepicker plugin)
// 11. Map (jqvmap plugin)

"use strict";

//
// Note: Bootstrap plugins is enabled via data attributes
//

// A fix to initialise dropzone on document ready
Dropzone.autoDiscover = false;

var Sidebar = function(){

    var $document = $(document),
        $sidebar = $(".js-page-sidebar"), // page sidebar itself
        $sidebarToggle = $(".c-sidebar-toggle"), // sidebar toggle icon
        $sidebarToggleContainer = $(".c-navbar"), // component that contains sidebar toggle icon
        $sidebarItem = $(".c-sidebar__item"),
        $sidebarSubMenu = $(".c-sidebar__submenu");

    $sidebarToggleContainer.on('click', function(e){
        var $target = $(e.target);
        if ($target.closest($sidebarToggle).length) {
            $sidebar.addClass('is-visible');
            return false;
        }
    });

    // Bootstrap collapse.js plugin is used for handling sidebar submenu.
    $sidebarSubMenu.on('show.bs.collapse', function () {
        $(this).parent($sidebarItem).addClass('is-open');
    });

    $sidebarSubMenu.on('hide.bs.collapse', function () {
        $(this).parent($sidebarItem).removeClass('is-open');
    });

    $document.on('click', function(e) {
        var $target = $(e.target);
        if (!$target.closest($sidebar).length) {
            $sidebar.removeClass('is-visible');
        }
    });
};

var Switch = function(){
    var $switch = $('.c-switch');

    $switch.on('click', function(e){
        var $switchInput = $(this).find('.c-switch__input');

        if ( !$(this).hasClass('is-disabled') ) {
            if ($(this).hasClass('is-active') && $switchInput.attr('checked')) {
                $switchInput.removeAttr('checked');
                $(this).removeClass('is-active');
            } else {
                $switchInput.attr('checked', 'checked')
                $(this).addClass('is-active');
            }
        } 
        return false;
    });
};

var Toggle = function() {
    var $toggle = $(".c-toggle"),
        toggleButton = ".c-toggle__btn";

    $toggle.on('click', toggleButton, function(e){
        $(this)
            .addClass('is-active')
            .siblings()
            .removeClass('is-active');
        return false;
    });
};

var Todo = function() {
    var $todo = $(".c-todo"),
        $todoInput = $(".c-todo__input");

    $todo.on('click', function(e){
        var $target = $(e.target);
        if ($target.closest($todoInput).length) {
            $(this)
                .closest($todo)
                .toggleClass('is-completed');
        }
    });
};

var ChatDialogue = function(){
    var $document = $(document),
        $chatDialogueBody = $('.c-chat-dialogue__body'),
        $chatDialogueMessages = $('.c-chat-dialogue__messages'),
        $chatDialogueMessagesHeight = $chatDialogueMessages.height();

    function addChatMessage($message) {
        $chatMessageTemplate = '<div class="c-chat-dialogue__message c-chat-dialogue__message--self">'+
                                '<div class="c-chat-dialogue__message-content">'+
                                $message.val()+
                                '</div>'+
                                '</div>';

        $chatDialogueMessages.append($chatMessageTemplate);
        $message.val('');
    }

    function updateHeight(){
        $chatDialogueMessages.animate({scrollTop: $chatDialogueMessagesHeight}, 500);
        $chatDialogueMessagesHeight += $chatDialogueMessages.height(); // update height
    }

    // Open & close chat dialogue 
    $document.on('click', '.c-chat-dialogue__btn', function(e){
        $chatDialogueBody.toggleClass('is-active');
        $(this).toggleClass('is-open');
    });

    // Disable scrolling on any element outside the chat dialogue
    $chatDialogueMessages.on('mousewheel DOMMouseScroll', function(e) {
        var scrollTo = null;

        if (e.type == 'mousewheel') {
            scrollTo = (e.originalEvent.wheelDelta * -1);
        } 
        else if (e.type == 'DOMMouseScroll') {
            scrollTo = 40 * e.originalEvent.detail;
        }
        if (scrollTo) {
            e.preventDefault();
            $(this).scrollTop(scrollTo + $(this).scrollTop());
        }
    });

    // Add new message on pressing Enter Key
    $('#input-chat').on('keypress', function (e) {
        if (e.which == 13) {
            addChatMessage($(this));
            updateHeight();
            return false;
        }
    });
}; 


$(function() {
    // Initialize 

    Sidebar(); // 1. Sidebar
    Switch();  // 2. Switches
    Toggle();  // 3. Toggles
    Todo();    // 4. Todo
    ChatDialogue(); // 5. Chat Dialogue

    // 6. Boards 
    if($('.c-board').length) {
        var dragulaObj = dragula( $('.c-board__content').toArray(), {});
    }

    // 7. Select
    if($('.c-select').length) {
        var $singleSelect = $('.c-select'),
            $singleSelectHasSearch = $('.c-select.has-search'),
            $multipleSelect = $('.c-select.c-select--multiple'),
            $disabledSelect = $('.c-select.is-disabled');

        $singleSelect.select2({
            width: '100%',
            minimumResultsForSearch: Infinity // disable search
        });

        // single select with search enabled
        $singleSelectHasSearch.select2({
            width: '100%' 
        });

        // multiple select
        $multipleSelect.select2({
            width: '100%',
            multiple: true
        });

        // disabled select
        $disabledSelect.select2({
            width: '100%',
            disabled: true
        });
    }

    // 8. dropzone
    if($('.dropzone').length) {
        $(".dropzone").dropzone();
    }

    // 9. datatable
    if($('#datatable').length) {
        $("#datatable").DataTable({
            searching: false,
            "lengthChange": false, 
            "order": [], // disable ordering on init
            "ordering": true,
            columnDefs: [{
              orderable: false,
              targets: "no-sort"
            }]
        });
    }

    // 10. datepicker
    if($('[data-toggle="datepicker"]').length) {
        $('[data-toggle="datepicker"]').datepicker();
    }

    // 11. Custom Bootstrap Popovers
    $('[data-toggle=popover]').popover({
      trigger: 'focus',
      template: '<div class="c-popover popover">'+
                '<div class="c-popover__arrow popover-arrow"></div>'+
                '<div class="c-popover__body popover-body">'+
                '</div>'+
                '</div>'
    });

    // 11. Map
    if($('#vmap').length){
        function escapeXml(string) {
            return string.replace(/[<>]/g, function (c) {
                switch (c) {
                    case '<': return '\u003c';
                    case '>': return '\u003e';
                }
            });
        }

        var pins = { 
          us: escapeXml('<i class="fa fa-map-marker u-color-success"></i>'),
          au: escapeXml('<i class="fa fa-map-marker u-color-danger"></i>'),
          fr: escapeXml('<i class="fa fa-map-marker u-color-warning"></i>'),
          br: escapeXml('<i class="fa fa-map-marker u-color-info"></i>'),
          cn: escapeXml('<i class="fa fa-map-marker u-color-info"></i>'),
          th: escapeXml('<i class="fa fa-map-marker u-color-primary"></i>')
        };

        jQuery('#vmap').vectorMap({
            map: 'world_en',
            mode: 'svg',
            backgroundColor: null,
            color: '#eff3f6',
            hoverOpacity: 1,
            borderColor: '#eff3f6',
            hoverColor: '#d7dfe6',
            selectedColor: '#d7dfe6',
            enableZoom: false,
            showTooltip: true,
            selectedRegions: ['US', 'AU', 'FR', 'BR', 'CN', 'TH'],
            pins: pins,
            pinMode: 'content',
            scaleColors: ['#eff3f6', '#d7dfe6'],
            normalizeFunction: 'polynomial'
        });
    }
}); 
