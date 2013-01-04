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

    // Creates a popup dialog from selected elements
    $.fn.popup = function(options) {
        console.log('Create Popup: ', options);
        options = options || {};
        return this.each(function () {
            if (this.href) {
                $(this).click(function() {

                    // Support for rel="popup.class_name" syntax to add a class.
                    var className = this.rel.match(/popup\.([-_\sa-zA-Z]+)/)
                    if (className) className = className[1];
                    options.className = className;
                    options.url = this.href;
                    $.popup.create(options);
                    return false;
                })
            }
            else {
                options.element = $(this);
                $.popup.create(options);
            }
        });
    }

    $.popup = {}  
    
    // Default popup options
    $.popup.options = {
        onOpen: function(m,e) {},
        onShow: function(m,e) {},
        onRefresh: function(m,e) {},
        onClose: function(m,e) {},
        syncSource: true,   // clones and replaces source element on closure keeping data intact
        showOverlay: true,  // show the background overlay    
        containment: null, // constrain within the bounds of the given element
        width: 'auto',      // css width [auto, pixel, percent]
        height: 'auto',     // css height [auto, pixel, percent]
        //maxWidth: 0,      // css max width [pixel, percent]
        //maxHeight: 0,     // css max height [pixel, percent]
        xPos: 'auto',
        yPos: 'auto',
        life: 0,
        fade: 300,
        className: '',
        template : '\
          <div class="popup">\
            <a href="#" class="popup-close"></a>\
            <div class="popup-content">\
            </div>\
          </div>'
        /*
        template : '\
          <div class="popup">\
            <a href="#" class="close"></a>\
            <table style="height:100%;">\
              <tr>\
                <td class="popup-title">\
                </td>\
              </tr>\
              <tr style="height:100%;">\
                <td style="height:100%;">\
                  <div class="popup-content">\
                  </div>\
                </td>\
              </tr>\
              <tr>\
                <td class="popup-actions">\
                </td>\
              </tr>\
            </table>\
          </div>'
          */
    }
    
    $.popup.parseOptioins = function(options) {
        options = options || {};
        if (typeof(options) == 'string')
            options = { data: options }  
        if (options.element)
            options.element = $(options.element)
        if (options.containment)
            options.containment = $(options.containment)
        return $.extend({}, $.popup.options, options);  
    }

    $.popup.create = function(options) {
        init(); // TODO: once at runtime
            
        //var defaults = $.extend({}, $.popup.options, {
        //    title: ''
        //});
        //options = $.extend(defaults, options);
        options = $.popup.parseOptioins(options);

        var popup;
        if (options.id)
            popup = $.popup.store[options.id];
        if (popup)
            popup.options = $.extend(popup.options, options);
        else {

            // Close existing synchronized popups
            if (options.syncSource && options.element) {                
                for (var popup in $.popup.store) {
                    if ($.popup.store[popup].options.element &&
                        $.popup.store[popup].options.element.get(0) === options.element.get(0)) {
                        $.popup.store[popup].close();
                    }
                }
                /*
                for (var i = 0; i < $.popup.store.length; i++) {
                  if ($.popup.store[i].options.element &&
                      $.popup.store[i].options.element.get(0) === options.element.get(0)) {
                      $.popup.store[i].close();
                  }
                }
                */
            }
            popup = new Popup(options);
            popup.init();
            $('body').append(popup.element);
        }

        popup.load();
        return popup;
    }

    $.popup.close = function(id) {
        //console.log('Close: ', id);
        var popup = $.popup.store[id];
        if (popup) {
            popup.close();
            return true;
        }
        return false;
    }

    $.popup.refresh = function() {
        for (var popup in $.popup.store)
            $.popup.store[popup].refresh();
            
        //for (var i = 0; i < $.popup.store.length; i++) {
        //    $.popup.store[i].refresh();
        //}
    }

    $.popup.count = function() {
        i = 0;
        for (var popup in $.popup.store)
          i++;
        return i;
    }

    $.popup.store = {};


    //
    // Private methods
    //
    
    function init() {      
        if ($('body').data('popup-initialized')) return;
        $(window).bind(jQuery.event.special.resizeend ? 'resizeend' : 'resize', function() { $.popup.refresh(); });
        $(window).bind(jQuery.event.special.scrollstop ? 'scrollstop' : 'scroll', function() { $.popup.refresh(); });
        $('body').data('popup-initialized', true);
    }

    // This class implements a popup window.
    var Popup = function(options) {
        this.id = options.id ? options.id :
            options.element && options.element.attr('id') ?
                options.element.attr('id') : Sourcey.randomString(8);
        this.options = options;
        this.index = $.popup.count() * 2;
        this.xhr = null;
        this.timeout = null;
        //console.log('Popup: Creating: ', this.id, options);

        this.init = function() {
            //console.log('Popup: Initializing: ', this.id);

            var self = this;
            this.element = $(this.options.template);
            this.element.attr('data-popup', this.id);
            if (this.options.className)
                this.element.addClass(this.options.className);
            this.element.find('.popup-close').click(function() {
                self.close();
                return false;
            });
            if (this.options.showOverlay) {
                this.overlay = $('<div />');
                this.overlay.attr('class', 'popup-overlay');
                this.overlay.css('z-index', 1000 + this.index);
                $('body').append(this.overlay);
                this.overlay.click(function() {
                    self.close();
                    return false;
                });
            }
            if (this.options.life) {
              this.timeout = setTimeout(function () {
                  //console.log('Popup: Timeout: ', self.id);
                  self.close();
              }, this.options.life);
            }
            if (this.options.css)
                this.element.css(this.options.css);

            // Capture mouse events and toggle element's .hover class
            this.element.hover(function () {
              self.element.addClass('hover');
            }, function () {
              self.element.removeClass('hover');
            });

            //TODO: need to call before content in place?
            //this.refresh();

            $.popup.store[this.id] = this;
            
            this.options.onOpen(this, this.element);
        }

        this.load = function() {
            //console.log('Popup: Loading');

            if (this.options.data)
                this.loadData(this.options.data);
            else if (this.options.element)
                this.loadElement(this.options.element);
            else if (this.options.url)
                this.loadURL(this.options.url);
        };

        this.loadData = function(data) {
            //console.log('Popup: Loading Data: ', data);
            this.show(data);
        }
        
        this.loadElement = function(element) {
            //console.log('Popup: Loading Element: ', element);
            this.options.element = element;

            // Set a placeholder for the data if required.
            if (this.options.syncSource)
                element.wrap('<div id="popup-placeholder-' + this.id + '"></div>');
            this.options.wasHidden = !element.is(':visible');
            this.show(element.show());
            //element.hide();.clone(true).show()
        };

        this.loadURL = function(url) {
            //console.log('Popup: Loading Async: ', url);
            var self = this;
            this.loading(true);
            this.options.url = url;
            this.xhr = $.get(url, function(data) {
                self.show(data);
            })
        };

        this.loading = function(flag) {
            flag ?
                this.element.addClass('loading') :
                this.element.removeClass('loading');
            this.element.find('.popup-content').html('');
            //this.element.html('');
        };

        this.show = function(data) {
            //console.log('Popup: Showing: ', this.id, data);

            this.loading(false);
                        
            /*
            if (this.options.title)
                this.element.append('<h2>' + this.options.title + '</h2>');
            data = $(data)
            data.hide();
            this.element.html(data);
            data.fadeIn('normal');
            */
                
            var content = this.element.find('.popup-content');
            if (this.options.title)
                content.append('<h2>' + this.options.title + '</h2>');
            content.hide();
            content.html(data);
            content.fadeIn('normal');

            this.options.onShow(this, this.element);

            this.refresh();
        };

        this.close = function() {
            //console.log('Popup: Closing: ',  this.id)
            var self = this;

            if (this.xhr) {
                this.xhr.abort()
                this.xhr = null
            }
            if (this.timeout)
                clearTimeout(this.timeout);

            if (this.overlay)
                this.overlay.remove();

            // Replace the synchronized element with updated content.
            if (self.options.element &&
                self.options.syncSource) {
                var content = self.element.find('.popup-content').children();
                var placeholder = $('#popup-placeholder-' + self.id);
                //var content = self.element.children(); //('.popup-content');
                if (self.options.wasHidden)
                    content.hide();
                placeholder.before(content);
                placeholder.remove();
                self.element.html(content.clone()); // clone so we can fade out
            }

            self.options.onClose(self, self.element);
            
            //$.popup.store.remove(self.id);            
            delete $.popup.store[self.id];

            this.element.fadeOut(this.options.fade, function() {
                //console.log('Popup: Closing: Removing: ', self.id)
                self.element.remove();
            });
        };

        this.refresh = function() {
               
            // Set the fixed element height or auto
            this.element.width(this.options.width);
            this.element.height(this.options.height); 
            
            // Refresh callback
            // Calling here before the position the dialog 
            // just incase size in changed inside callback.
            this.options.onRefresh(this, this.element);       

            // Update position
            var css = this.options.css || {};            
            css.zIndex = 1000 + this.index + 1;     
            css.position = 'fixed';
            if (this.options.xPos == 'auto') {
                css.left = '50%';
                css.marginLeft = -this.element.width() / 2 + 'px';
            }
            else 
                css.left = this.options.xPos;              
            if (this.options.yPos == 'auto') {
                css.top = '50%';
                css.marginTop = -this.element.height() / 2 + 'px'; 
            }
            else 
                css.top = this.options.yPos;
                
            // Apply CSS
            this.element.css(css);
                
            // Set size explicitly to allow for content 100% height
            this.element.width(this.element.width());
            this.element.height(this.element.height());
            
            // Honour the containement value
            // NOTE: Current code only detects overflow, not underflow
            if (this.options.containment && 
                this.options.containment.length) {
                
                var diff = this.options.containment.width() - (this.element.offset().left + this.element.width());
                if (diff < 0) {
                    diff -= 5;
                    css.marginLeft = css.marginLeft || 0;
                    css.marginLeft = css.marginLeft + diff;                      
                } 
                
                diff = this.options.containment.height() - (this.element.offset().top + this.element.height());
                if (diff < 0) {
                    diff -= 5;
                    css.marginTop = css.marginTop || 0;
                    css.marginTop = css.marginTop + diff;                    
                }            
                
                //console.log('Height Diff: ', diff, css.marginTop, css.marginLeft)       
                this.element.css(css);
            }     
        };
    };
})(jQuery);


    
/*
// Creates a popup dialog
$.popup = function(options) {
    console.log('Create Popup: ', options);
    init();
    options = options || {};
    if (typeof(options) == 'string')
        options = { data: options }
    return $.popup.create(options);
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
                    popup = $.popup.create(options);
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
        $(window).bind(jQuery.event.special.resizeend ? 'resizeend' : 'resize', function() { $.popup.refresh(); });
        $(window).bind(jQuery.event.special.scrollstop ? 'scrollstop' : 'scroll', function() { $.popup.refresh(); });
    }
    */