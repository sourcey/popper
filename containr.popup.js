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

    $.popup = function(method) {
        if (typeof method === "undefined")
            method = {}
            
        console.log('Create Popup: ', method);
        
        if (Containr.methods[method])
            return Containr.methods[method](Array.prototype.slice.call(arguments, 1));
            
        else if (typeof method === "object")
            return Containr.methods.create(method).load();
            
        else
            $.error("Method '" + method + "' does not exist for $.popup");    
    }

    // Creates a popup dialog from selected elements
    $.fn.popup = function(options) {
        console.log('Create Popup: ', options);
        options = options || {};
        return this.each(function () {
            if (this.href) {
                $(this).click(function() {

                    // Support for rel="popup.className" syntax to add a class.
                    var className = this.rel.match(/popup\.([-_\sa-zA-Z]+)/)
                    if (className) className = className[1];
                    options.className = className;
                    options.url = this.href;
                    Containr.methods.create(options).load();
                    return false;
                })
            }
            else {
                options.element = $(this);
                Containr.methods.create(options).load();
            }
        });
    }
})(jQuery);


    
/*
// Creates a popup dialog
$.popup = function(options) {
    console.log('Create Popup: ', options);
    init();
    options = options || {};
    if (typeof(options) == 'string')
        options = { data: options }
    return Containr.methods.create(options);
}
*/
/*
var width = this.options.width;
var height = this.options.height;

if (typeof width == 'string' && width.indexOf('scale:') == 0)
    width = $(window).width() * parseFloat(width.split(':')[1]);
if (typeof height == 'string' && height.indexOf('scale:') == 0)
    height = $(height).width() * parseFloat(height.split(':')[1]);

// Set element dimensions first
if (width &&
    width != 'auto')
    this.element.width(width);
if (height &&
    height != 'auto')
    this.element.height(height);
               
//css.left = this.options.xPos != 'auto' ? this.options.xPos :
//    ($(window).width() - this.element.outerWidth()) / 2 + $(window).scrollLeft() + 'px';
//css.top = this.options.yPos != 'auto' ? this.options.yPos :
//    ($(window).height() - this.element.outerHeight()) / 2 + $(window).scrollTop() + 'px';
    */
               


    /*
    // Creates a tooltip for selected elements
    $.fn.tooltip = function(options) {
        console.log('Create Tooltip: ', options);
        init();
        options = options || {};
        return this.each(function () {
            options.element = $(this);
            var popup = null;
            var ref = 0;
            var hider = function() {
                if (popup && ref == 0) {
                    popup.close();
                    popup = null;
                }
            };
            $(this).hover(
              function (e) {
                ref++;
                console.log('Over Tooltip Link', ref);

                if (popup == null) {
                    console.log('Creating Tooltip');
                    options.syncSource = false;
                    options.showOverlay = false;
                    options.xPos = e.pageX;
                    options.yPos = e.pageY;
                    options.width = options.width || 200;
                    options.fade = 0;
                    options.className += ' tooltip';
                    popup = Containr.methods.create(options);
                    popup.element.find('.popup-close').hide();
                    popup.element.hover(
                         function (e) {
                            ref++;
                            console.log('Over Tooltip Element', ref);
                         },
                         function (e) {
                            ref--;
                            console.log('Out Tooltip Element', ref);
                            setTimeout(hider, 100);
                         })
                }
              },
              function (e) {
                ref--;
                console.log('Out Tooltip Link', ref);
                setTimeout(hider, 100);
              }
            );
        });
    }
    
    function init() {
        if ($('div#notifications').length) return;
        $('body').append('<div id="notifications"></div>');
        $(window).bind(jQuery.event.special.resizeend ? 'resizeend' : 'resize', function() { Containr.methods.refresh(); });
        $(window).bind(jQuery.event.special.scrollstop ? 'scrollstop' : 'scroll', function() { Containr.methods.refresh(); });
    }
    */