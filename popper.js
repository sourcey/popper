/*
    Popper.js
   
    A window manager for creating and managing dynamic popup windows
    for web applications.
        
        - Supports layered(multiple) reusable dialogs
        - AJAX support
        - Dynamic positioning
        - Update's source element on popup close (retains data)
        - Customisable via CSS3

    Copyright (c)2010 Sourcey
    http://sourcey.com
    Distributed under The MIT License.
*/

Popper = {
    
    // Default popup options
    options: {
        type: 'default',            // the popup group type
        modal: false,              // modals do not auto close on document click
        syncSource: false,         // clones the source element and replaces it on closure
        showOverlay: true,         // show the background overlay 
        containment: null,         // constrain within the bounds of the given element
        container: 'body',         // the element the popup will be appended to
        content: '.popup-content', // the element the content selector
        width: 'auto',             // css width [auto, pixel, percent]
        height: 'auto',            // css height [auto, pixel, percent]
        xPos: 'auto',
        yPos: 'auto',
        life: 0,
        fade: 300,
        className: '',
        template : '\
          <div class="containr popup">\
            <a href="#" class="popup-close"></a>\
            <div class="popup-content">\
            </div>\
          </div>'
    },

    // Popup store for fast index 
    store: {},
    
    // API methods
    methods: {    
        init: function() { 
            if (Popper.initialized) return;
            $(window).bind('resize', function() { Popper.methods.refresh(); }); //jQuery.event.special.resizeend ? 'resizeend' : 'resize'
            $(window).bind(jQuery.event.special.scrollstop ? 'scrollstop' : 'scroll', function() { Popper.methods.refresh(); });
            Popper.initialized = true;
        },
        
        create: function(options) {       
            options = Popper.methods.coerce(options);

            var popup;
            if (options.id)
                popup = Popper.store[options.id];
            if (popup)
                popup.options = $.extend(popup.options, options);
            else {
                // Close existing synchronized popups with matching source element
                if (options.syncSource && options.element) {                
                    for (var popup in Popper.store) {
                        if (Popper.store[popup].options.element &&
                            Popper.store[popup].options.element.get(0) === options.element.get(0)) {
                            Popper.store[popup].close();
                        }
                    }
                }
                popup = new Poppable(options);
                popup.init();
            }

            // NOTE: Popup must be loaded
            return popup;
        },
        
        close: function(id) {
            //console.log('Close: ', id);
            var popup = Popper.store[id];
            if (popup) {
                popup.close();
                return true;
            }
            return false;
        },
                
        closeType: function(type) {
            //console.log('Close Type: ', type);
            for (var popup in Popper.store) {
                if (Popper.store[popup].options.type == type)
                    Popper.store[popup].close();
            }
        },
        
        trigger: function(name, popup) {              
            //console.log('Popup: Trigger: ', name);      
            $(document).trigger('popup:' + name, popup)
            if (popup.options.element) {
                console.log('Popup: Trigger Element: ', name, $._data(popup.options.element.get(0), "events"));      
                popup.options.element.trigger('popup:' + name, popup)
            }
        },                
        
        refresh: function(id) {
            for (var popup in Popper.store)
                Popper.store[popup].refresh();
        },
        
        count: function() {
            i = 0;
            for (var popup in Popper.store)
                i++;
            return i;
        },
        
        coerce: function(options) {
            options = options || {};
            if (typeof(options) == 'string')
                options = { data: options }  
            if (options.element)
                options.element = $(options.element)
            if (options.containment)
                options.containment = $(options.containment)
            return $.extend({}, Popper.options, options);  
        },
    }
}


Popper.methods.init();


//
// This class implements a popup window.
Poppable = function(options) {
    this.options = options;
    this.id = options.id = options.id ? options.id :
        options.element && options.element.attr('id') ?
            options.element.attr('id') : 
              Math.random().toString(36).substring(7);
    this.index = Popper.methods.count() * 2;
    this.xhr = null;
    this.timeout = null;
    //console.log('Popup: Creating: ', this.id, options);
}
    
    
Poppable.prototype = {
    init: function() {
        //console.log('Popup: Initializing: ', this.id);
        var self = this;
        this.element = $(this.options.template);
        this.element.data('popup', this);
        this.element.attr('data-popup-id', this.id);
        //this.element.attr('data-popup-type', this.options.type);
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
                    self.close();
                    $(this).unbind(event);
                }
            });
        } 
        if (this.options.css)
            this.element.css(this.options.css);

        // Capture mouse events and toggle element's .hover class
        //this.element.hover(
        //    function () { self.element.addClass('hover'); }, 
        //    function () { self.element.removeClass('hover'); });
                    
        $(this.options.container).append(this.element);

        Popper.store[this.id] = this;        
        Popper.methods.trigger('open', this)
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
        this.show(data);
    },
    
    loadElement: function(element) {
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

        Popper.methods.trigger('show', this)
        
        this.refresh();
    },

    close: function() {
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
               
        delete Popper.store[this.id];        

        Popper.methods.trigger('close', this)
        
        // TODO: Can't get false on close, check tooltip hiding
        this.element.fadeOut(this.options.fade, function() { // != false) {
            //console.log('Popup: Closing: Removing: ', self.id)
            self.element.remove();
        });
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
        //this.options.onRefresh(this, this.element);       
        Popper.methods.trigger('refresh', this)

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