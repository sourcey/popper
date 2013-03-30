/*
    Tooltip.js

    A Popper.js extension for displaying tooltip windows using CSS3, 
    and JS sugar for dynamic tooltips.   

    Copyright (c)2010 Sourcey
    http://sourcey.com
    Distributed under The MIT License.
*/


(function ($) {
    //
    // Tooltip JQuery constructor
    $.fn.tooltip = function(options) {
        // By default tooltips will show when the target element is hovered.
        // Tooltip can also be displayed continously now by specifying the
        // 'always' and 'life' and 'modal' options.
        options = options || {};        
        options.syncSource = false;
        options.showOverlay = false;
        options.fade = 0; // Using CSS3 transitions, see tooltip.css
        options.content = '.tooltip';
        options.template = '<div class="tooltip"></div>';
        
        // Add a special class for tooltips that are always visible.
        if (options.always)
          options.className += ' tooltip-always'
        
        // options.modal can be set to true to hide always visible
        // tooltips on document click
        if (typeof options.modal === 'undefined')
            options.modal = true; 

        // Override onClose to restore modified elements to 
        // their original state.
        var func = options.onClose;        
        options.onClose = function(popup, el) {
            if (func)
                func(popup, el);
            popup.options.container.removeClass('tooltip-container')
            
            // If always show is true we override default close
            // behaviour and hide after timeout to CSS3 transitions
            // can do their thing.
            if (options.always) {
                el.removeClass('tooltip-always')
                setTimeout(function () {
                    el.remove();
                }, 500); // 500ms should be enough
                return false;
            }            
        }       
        
        // Initialize tooltip popups for selected elements
        return this.each(function () {
            options.container = $(this);
            options.container.addClass('tooltip-container')
            $.popup(options); 
        });
    }
})(jQuery);