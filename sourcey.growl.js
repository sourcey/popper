///
/// Sourcey Popup
///
/// A Sourcey JQuery plugin for managing popup windows.
///
/// Features:
///     - Supports layered(multiple) reusable dialogs
///     - AJAX support
///     - Dynamic positioning
///     - Update's source element on popup close (retains data)
///     - Customisable via CSS
///
(function ($) {
    
    // Creates a growl style notification
    $.growl = function(options) {
        init();
        options = options || {}
        if (typeof(options) == 'string')
            options = { data: options }
        return createNotification(options);
    }
    
    $.popup.closeNotifications = function() {
        for (var i = 0; i < $.popup.store.length; i++) {
            if ($.popup.store[i].type == 'growl')
                $.popup.store[i].close();
        }
    }

    function createNotification(options) {
        options.className += ' opacity-75 growl-message';
        var defaults = $.extend({}, $.popup.options, {
            sticky: false,
            life: 5000,
            fade: 750,
            template : '\
              <div class="popup">\
                <a href="#" class="popup-close"></a>\
                <div class="popup-content">\
                </div>\
              </div>'
        });
        options = $.extend(defaults, options);
        options.type = 'growl';
        options.width = 0; // use css
        options.yPos = 0;  // use css
        options.xPos = 0;  // use css
        options.showOverlay = false;
        if (options.sticky)
            options.life = 0;
        popup = new Popup(options);
        popup.init();
        $('#notifications').append(popup.element);
        popup.load();
    }
    
    
    //
    // Private methods
    //
    
    function init() {
        if ($('div#notifications').length) return;
        $('body').append('<div id="notifications"></div>');
        //$(window).bind(jQuery.event.special.resizeend ? 'resizeend' : 'resize', function() { $.popup.refresh(); });
        //$(window).bind(jQuery.event.special.scrollstop ? 'scrollstop' : 'scroll', function() { $.popup.refresh(); });
    }
    
})(jQuery);