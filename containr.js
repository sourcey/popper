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

Containr = {
    
    // Default popup options
    options: {
        onOpen: function(p,e) {},
        onShow: function(p,e) {},
        onRefresh: function(p,e) {},
        onClose: function(p,e) {},
        modal: false,               // Not closable by document click
        syncSource: true,           // clones and replaces source element on closure keeping data intact
        showOverlay: true,          // show the background overlay    
        containment: null,          // constrain within the bounds of the given element
        container: 'body',          // the element the popup will be appended to
        content: '.popup-content',  // the element the popup will be appended to
        width: 'auto',              // css width [auto, pixel, percent]
        height: 'auto',             // css height [auto, pixel, percent]
        //maxWidth: 0,              // css max width [pixel, percent]
        //maxHeight: 0,             // css max height [pixel, percent]
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
    },

    store: {},
    
    methods: {    
        init: function() { 
            if ($('body').data('popup-initialized')) return;
            $(window).bind('resize', function() { Containr.methods.refresh(); }); //jQuery.event.special.resizeend ? 'resizeend' : 'resize'
            $(window).bind(jQuery.event.special.scrollstop ? 'scrollstop' : 'scroll', function() { Containr.methods.refresh(); });
            $('body').data('popup-initialized', true);
        },
        
        create: function(options) {       
            options = Containr.methods.coerceOptions(options);

            var popup;
            if (options.id)
                popup = Containr.store[options.id];
            if (popup)
                popup.options = $.extend(popup.options, options);
            else {
                // Close existing synchronized popups with matching source element
                if (options.syncSource && options.element) {                
                    for (var popup in Containr.store) {
                        if (Containr.store[popup].options.element &&
                            Containr.store[popup].options.element.get(0) === options.element.get(0)) {
                            Containr.store[popup].close();
                        }
                    }
                }
                popup = new Containr.Popup(options);
                popup.init();
            }

            // NOTE: Popup must be loaded
            return popup;
        },
        
        close: function(id) {
            //console.log('Close: ', id);
            var popup = Containr.store[id];
            if (popup) {
                popup.close();
                return true;
            }
            return false;
        },
                
        closeType: function(type) {
            //console.log('Close Type: ', type);
            for (var popup in Containr.store) {
                if (Containr.store[popup].options.type == type)
                    Containr.store[popup].close();
            }
        },
                
        
        refresh: function(id) {
            for (var popup in Containr.store)
                Containr.store[popup].refresh();
        },
        
        count: function() {
            i = 0;
            for (var popup in Containr.store)
                i++;
            return i;
        },
        
        coerceOptions: function(options) {
            options = options || {};
            if (typeof(options) == 'string')
                options = { data: options }  
            if (options.element)
                options.element = $(options.element)
            if (options.containment)
                options.containment = $(options.containment)
            return $.extend({}, Containr.options, options);  
        },
    }
}


Containr.methods.init();


//
// This class implements a popup window.
Containr.Popup = function(options) {
    this.options = options;
    this.id = options.id ? options.id :
        options.element && options.element.attr('id') ?
            options.element.attr('id') : 
              Math.random().toString(36).substring(7);
    this.index = Containr.methods.count() * 2;
    this.xhr = null;
    this.timeout = null;
    //console.log('Popup: Creating: ', this.id, options);
}
    
    
Containr.Popup.prototype = {
    init: function() {
        //console.log('Popup: Initializing: ', this.id);        

        var self = this;
        this.element = $(this.options.template);
        this.element.attr('data-popup', this.id);
        this.element.data('popup', this);
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
        }
        if (this.options.life) {
          this.timeout = setTimeout(function () {
              //console.log('Popup: Timeout: ', self.id);
              self.close();
          }, this.options.life);
        }            
        if (!this.options.modal) {
            // Hide on docuemnt mousedown
            $(document.body).bind('click', function(event) {
                if ($(event.target).parents('.popup').length == 0) {
                    //console.log('Popup: Document OnClick: ', event, self.id);
                    self.close();
                    $(this).unbind(event);
                }
            });
        } 
        if (this.options.css)
            this.element.css(this.options.css);

        // Capture mouse events and toggle element's .hover class
        this.element.hover(
            function () { self.element.addClass('hover'); }, 
            function () { self.element.removeClass('hover'); });
                    
        $(this.options.container).append(this.element);

        Containr.store[this.id] = this;
        
        this.options.onOpen(this, this.element);
        return this;
    },

    load: function() {
        //console.log('Popup: Loading: ', this.options);
        if (this.options.data)
            this.loadData(this.options.data);
        else if (this.options.element)
            this.loadElement(this.options.element);
        else if (this.options.url)
            this.loadURL(this.options.url);                
        return this;
    },

    loadData: function(data) {
        //console.log('Popup: Loading Data: ', data);
        this.show(data);
    },
    
    loadElement: function(element) {
        //console.log('Popup: Loading Element: ', element);
        this.options.element = element;
        this.options.element.data('popup', this)

        // Set a placeholder for the data if required.
        if (this.options.syncSource)
            element.wrap('<div id="popup-placeholder-' + this.id + '"></div>');
        this.options.wasHidden = !element.is(':visible');
        this.show(element.show());
        //element.hide();.clone(true).show()
    },

    loadURL: function(url) {
        //console.log('Popup: Loading URL: ', url);
        var self = this;
        this.loading(true);            
        this.refresh();
        this.options.url = url;
        this.xhr = $.get(url, function(data) {
            self.show(data);
        }).error(function() {
            self.show('Failed to load remote content.');
        })
    },

    loading: function(flag) {
        flag ?
            this.element.addClass('loading') :
            this.element.removeClass('loading');
        this.content().html('');
    },

    show: function(data) {
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
            
        var content = this.content();
        if (this.options.title)
            content.append('<h2>' + this.options.title + '</h2>');
        content.hide();
        content.html(data);
        if (this.options.fade > 0)
            content.fadeIn(this.options.fade);
        else
            content.show();

        this.options.onShow(this, this.element);

        this.refresh();
    },

    close: function() {
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

        // Replace original element if synchronized.
        if (this.options.element) {
            this.options.element.data('popup', null)
            if (this.options.syncSource) {                    
                var content = this.content().contents();
                var placeholder = $('#popup-placeholder-' + this.id);
                if (self.options.wasHidden)
                    content.hide();
                placeholder.before(content);
                placeholder.remove();
                this.element.html(content.clone()); // clone so we can fade out
            }
        }
               
        delete Containr.store[this.id];

        if (this.options.onClose(this, this.element) != false) {
            this.element.fadeOut(this.options.fade, function() {
                //console.log('Popup: Closing: Removing: ', self.id)
                self.element.remove();
            });
        }
    },

    refresh: function() {
    
        // Only resize the popup if the body is the
        // container, otherwise assume sizing is relative.
        if (this.options.container != 'body')
            return;
           
        // Set the fixed element height or auto
        this.element.width(this.options.width);
        this.element.height(this.options.height); 
        
        // Refresh callback
        // Calling onRefresh before we set the position so the
        // application can modify the size inside the callback.
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
            
        // Set the actual size explicitly to allow for 100% content height
        this.element.width(this.element.width());
        this.element.height(this.element.height());
        
        // Honour containement element constraints
        // TODO: Current code only detects overflow, not underflow
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
    }, 
    
    content: function() {
        // The content element may be a child or the root element itself
        return this.element.find(this.options.content).add(this.element.filter(this.options.content));
    }
};