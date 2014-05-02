/*
    Tooltip.js

    A Popper.js extension for displaying tooltip windows using CSS3, 
    and JS sugar for dynamic tooltips.   

    Copyright (c)2010 Sourcey
    http://sourcey.com
    Distributed under The MIT License.
*/


(function ($) {    
    var constants = {
        type: 'tooltip',
        cloneElement: false,
        showOverlay: false,
        centered: false,
        //noResize: true,
        width: 'auto',
        height: 'auto',
        fade: 0, // Using CSS3 transitions, see tooltip.css
        content: '.tooltip'
    }

    //
    // Tooltip constructor            
    //    
    // Tooltips can be displayed when the target element is hovered,
    // or continously by specifying the 'always' and 'life' options.
    //
    // Absolute tooltips operate the same way as default tooltips, except
    // that they are inserted to the document body level, instead of to 
    // the target element. This is useful for displaying tooltips inside
    // elements with hidden overflow, such as scrolled elements.
    $.fn.tooltip = function(options) {
        options = coerceOptions(options)
        
        //
        // Create a standard non-overlayed tooltip
        if (options.overlay !== true) {
        
            return this.each(function () {
                console.log('Creating Tooltip');
                options.root = $(this);
                options.root.addClass('tooltip-container')
                bindOnClose(options);            
                Popper.methods.create(options).load();
            });  
        }
        
        //
        // Create an overlayed tooltip that shows on hover
        else if (
            options.overlay === true && 
            options.always !== true) {            
            options.template = '<div class="tooltip-container tooltip-overlay-container">&nbsp;' + options.template + '</div>';
            options.className = '';
                 
            return this.each(function () {
                console.log('Creating Overlayed Tooltip');    
                var e = $(this);
                e.addClass('has-tooltip')
                options.relativeTo = e;               
                var tooltip;    
                var timeout = null;
                var updateCloseTimeout = function(){
                  timeout = setTimeout(function () {
                      if (tooltip) { // && tooltip.element.data('visible')
                          tooltip.close();
                          tooltip = null;
                      }
                  }, 100);
                }
                e.hover(
                    function() { 
                        options.width = e.outerWidth();
                        options.height = e.outerHeight();   
                        if (!tooltip)          
                            tooltip = Popper.methods.create(options).load();
                        tooltip.element.find('.tooltip').addClass('tooltip-visible')
                        tooltip.element.data('visible', true)
                        /*
                        tooltip.element.hover(
                            function() {
                                clearTimeout(timeout)
                            }, function() {
                                updateCloseTimeout();
                            })
                            */
                    }, 
                    function() {
                        if (tooltip) {
                            tooltip.element.data('visible', false)
                            tooltip.element.find('.tooltip').removeClass('tooltip-visible')
                            updateCloseTimeout();
                        }
                    }
                )
            });
            
            /*               
            return this.each(function () {
                console.log('Creating Overlayed Tooltip');    
                var e = $(this);
                e.addClass('has-tooltip')
                options.relativeTo = e;        
                var tooltip;
                e.mouseenter(
                    function() { 
                        options.width = e.outerWidth();
                        options.height = e.outerHeight();   
                        if (tooltip)
                            return;                    
                        var timeout = null;
                        tooltip = Popper.methods.create(options).load();
                        tooltip.element.hover(
                            function() {
                                clearTimeout(timeout)
                            }, function() {
                                timeout = setTimeout(function () {
                                    tooltip.close();
                                    tooltip = null;
                                }, 500);
                            })
                    })
            }); 
            */
        }
        
        //
        // Create an overlayed tooltip that is always visible
        else if (
            options.overlay === true && 
            options.always === true) {            
            options.template = '<div class="tooltip-container tooltip-overlay-container">&nbsp;' + options.template + '</div>';
            options.className = '';
                     
            return this.each(function () {
                console.log('Creating Overlayed Fixed Tooltip');   
                var e = $(this);
                e.addClass('has-tooltip')
                options.relativeTo = e;    
                options.width = e.outerWidth();
                options.height = e.outerHeight();
                bindOnClose(options);
                Popper.methods.create(options).load();
            });
        }            
    };
    
    var coerceOptions = function(options) {            
        options = $.extend({}, constants, options);  
        options.id = Math.random().toString(36).substring(7)
        
        // Add a special class for tooltips that are always visible.
        if (options.always)
            options.className += ' tooltip-always'
        if (options.overlay)
            options.className += ' tooltip-overlay';    
            
        options.template = '<div class="tooltip ' + options.className + '"></div>';
        options.className = '';
        
        // The modal can be set to true to hide always visible
        // tooltips on document click.
        if (typeof options.modal === 'undefined')
            options.modal = true;     
            
        return options;
    }
    
    var bindOnClose = function(options) {  
        
        /*                 
        // Subscribe to tooltip close event to restore modified
        // elements to their original state.            
        $(document).bind('popup:close', function(ev, popup) {
            if (popup.id != options.id)
                return;
            
            // If always show is true we override default close
            // behaviour and hide after timeout to CSS3 transitions
            // can do their thing.
            if (options.always) {
                popup.content().removeClass('tooltip-always')
                setTimeout(function () {
                    popup.element.remove();
                }, 500); // 500ms should be enough for any effects
                
                // Set noHide flag to tell Poppable to skip hiding
                popup.options.noHide = true;
            }  
            $(this).unbind('popup:close', arguments.callee);
        })
        */
    }
})(jQuery);