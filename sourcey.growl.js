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
        return $.popupMethods.createGrowl(options);
    }
    
    $.popupMethods.initGrowl = function() {
        if ($('div#growl-notifications').length) return;
        $('body').append('<div id="growl-notifications"></div>');
    }
    
    $.popupMethods.closeGrowls = function() {
        for (var i = 0; i < $.popupStore.length; i++) {
            if ($.popupStore[i].type == 'growl')
                $.popupStore[i].close();
        }
    }

    $.popupMethods.createGrowl = function(options) {
        console.log('Growl: Creating: ', options);
        $.popupMethods.initGrowl();
        options = options || {}
        if (typeof(options) == 'string')
            options = { data: options }
        
        // Defaults
        options = $.extend({
            sticky: false,
            life: 5000,
            fade: 750,
            template : '\
              <div class="popup opacity-75 growl-message">\
                <a href="#" class="popup-close"></a>\
                <div class="popup-content">\
                </div>\
              </div>'
        }, options);
        
        // Constants
        options.type = 'growl';
        options.width = 0; // use css
        options.yPos = 0;  // use css
        options.xPos = 0;  // use css
        options.showOverlay = false;
        if (options.sticky)
            options.life = 0;
            
        // Create it
        popup = $.popupMethods.create(options);
        $('#growl-notifications').append(popup.element);
        popup.load();
    }    
})(jQuery);


        /*
        var defaults = $.extend({}, { //$.popup.options, 
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
        */