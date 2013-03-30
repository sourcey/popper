/*
    Growl.js

    A Popper.js extension for displaying OSX growl style notifications.   

    Copyright (c)2010 Sourcey
    http://sourcey.com
    Distributed under The MIT License.
*/


(function ($) {    
    //
    // Growl JQuery constructor
    $.growl = function(options) {
        return Popper.methods.createGrowl(options);
    }
    
    //
    // API extensions    
    Popper.methods.createGrowl = function(options) {
        //console.log('Growl: Creating: ', options);
        Popper.methods.initGrowl();
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
                <div class="popup-content"></div>\
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
        popup = Popper.methods.create(options);
        $('#growl-notifications').append(popup.element);
        popup.load();
    }
    
    Popper.methods.initGrowl = function() {
        if ($('div#growl-notifications').length) return;
        $('body').append('<div id="growl-notifications"></div>');
    }
    
    Popper.methods.closeGrowls = function() {
        Popper.methods.closeType('growl')
    } 
})(jQuery);