/*
    Growl.js

    A Popper.js extension for displaying OSX growl style notifications.   

    Copyright (c)2010 Sourcey
    http://sourcey.com
    Distributed under The MIT License.
*/


(function ($) {    
    //
    // Growl constructor
    $.growl = function(options) {
        return Popper.methods.createGrowl(options);
    }
    
    //
    // API extensions    
    Popper.methods.createGrowl = function(options) {
        //console.log('Growl: Creating: ', options);
        Popper.methods.initGrowl();
        options = options || {}
        if (typeof(options) === 'string')
            options = { data: options }
        
        // Defaults
        options = $.extend({
            sticky: false,
            life: 5000,
            fade: 750,
            //template : '\
            //  <div class="popup opacity-75 popup-growl">\
            //    <a href="#" class="popup-close"></a>\
            //    <div class="popup-content"></div>\
            //  </div>'
        }, options);
        
        // Constants
        options.root = '#growl-notifications'
        options.type = 'growl';
        options.width = 'auto'; // use css
        options.height = 'auto'; // use css
        options.showOverlay = false;
        options.centered = false;
        if (options.sticky)
            options.life = 0;
            
        // Create it
        return Popper.methods.create(options).load();
        
    }
    
    Popper.methods.initGrowl = function() {
        if ($('div#growl-notifications').length) return;
        $('body').append('<div id="growl-notifications"></div>');
    }
    
    Popper.methods.closeGrowls = function() {
        Popper.methods.closeType('growl')
    } 
})(jQuery);