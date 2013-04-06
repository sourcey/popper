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

var Popper = {
    
    // Default popup options
    options: {
        type: 'default',            // the popup group type
        modal: false,              // modals do not auto close on document click
        syncSource: false,         // clones the source element and replaces it on closure
        showOverlay: true,         // show the background overlay 
        centered: true,            // center the popup on the screen, overrides x,y offset
        containment: null,         // constrain within the bounds of the given element
        relativeTo: null,          // show the popup relative to the given element
        root: 'body',              // the element the popup will be appended to
        content: '.popup-content', // the element the content selector
        width: 'auto',             // css width [auto, pixel, percent]
        height: 'auto',            // css height [auto, pixel, percent]
        xOffset: 0,                // x offset
        yOffset: 0,                // y offset
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
            //console.log('Popper: Create: ', options.type, options);
            this.init();
            options = Popper.methods.coerce(options);

            var popup;
            //if (Popper.store[options.id] && options.id)
            //    popup = Popper.store[options.id];
            //if (popup)
            //    popup.options = $.extend(popup.options, options);
            //else {
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
            //}

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
            if (options.element) // may be selector
                options.element = $(options.element)
            if (options.containment) // may be selector
                options.containment = $(options.containment)                
            if (!options.id) // element id or random
                options.id = (options.element && options.element.attr('id')) ?
                    options.element.attr('id') : 
                    Math.random().toString(36).substring(7);                
            if (!options.index) // << depreciate me
                options.index = this.count() + 1;
            return $.extend({}, Popper.options, options);  
        },
    }
}


//
// The main popup window
var Poppable = function(options) {
    if (!options.id)
        throw 'Must specify an ID'
    if (!options.type)
        throw 'Must specify a type'
    this.options = options;
    this.id = options.id; 
    this.type = options.type; 
    this.xhr = null;
    this.timeout = null;
    
    console.log('Poppable: Showing: ', this.options);
}    
    
Poppable.prototype = {
    init: function() {
        
        // Create and popup element
        this.element = $(this.options.template);
        this.element.data('popup', this);
        this.element.attr('data-popup-id', this.id);
        this.element.attr('data-popup-type', this.type);
        this.element.addClass('popup-' + this.type);        
        if (this.options.className)
            this.element.addClass(this.options.className);
        if (this.options.css)
            this.element.css(this.options.css);            
          
        // Bind close button
        var self = this;
        this.element.find('.popup-close').click(function() {
            self.close();
            return false;
        });
        
        // Set close timeout if required
        if (this.options.life)
          this.timeout = setTimeout(function () { 
              self.close(); }, this.options.life);  
        
        // Non-modals are closed on document mousedown      
        if (!this.options.modal) {
            $(document.body).bind('click', function(event) {
                if ($(event.target).parents('.popup').length == 0) {
                    self.close();
                    $(this).unbind(event);
                }
            });
        } 
        
        // Create document ovelay
        if (this.options.showOverlay) {
            this.overlay = $('<div />');
            this.overlay.attr('class', 'popup-overlay');
            this.overlay.css('z-index', 1000 + this.options.index);
            $('body').append(this.overlay);
        }
        
        // Append to container
        $(this.options.root).append(this.element);

        Popper.store[this.id] = this;        
        this.trigger('open', this)
        return this;
    },

    load: function() {
        // Load data from string
        if (this.options.data)
            this.loadData(this.options.data);
            
        // Load from element source
        else if (this.options.element)
            this.loadElement(this.options.element);
            
        // Load from remote url
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
        this.wasHidden = !element.is(':visible');
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
        //console.log('Popup: Showing: ', this.options.url, this.id);
        this.loading(false);
                    
        if (this.options.title)
            this.element.append(
                '<h1 class="popup-title">' + this.options.title + '</h1>');
        var c = this.content();
        c.hide();
        c.html(data);
        if (this.options.url && 
            this.options.fade > 0) // Fade in AJAX content
            c.fadeIn(this.options.fade);
        else
            c.show();

        this.trigger('show', this)
        
        this.refresh();
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

        if (this.options.element)
            this.options.element.data('popup', null);
        
        // Replace source element if synchronized
        if (this.options.syncSource) {                    
            var content = this.content().contents();
            var placeholder = $('#popup-placeholder-' + this.id);
            if (self.wasHidden)
                content.hide();
            placeholder.before(content);
            placeholder.remove();
            this.element.html(content.clone()); // clone so we can fade out
        }
               
        delete Popper.store[this.id];
        this.trigger('close', this)
        
        // Remove the element if noHide is not set
        if (this.options.noHide !== true)
            this.element.fadeOut(this.options.fade,
                function() { self.element.remove(); });
    },

    refresh: function() {
    
        // Skip resizing if the noResize flag is set.
        if (this.options.noResize) {
            this.trigger('refresh', this)
            return;
        }
           
        //this.element.width(this.options.width);
        //this.element.height(this.options.height); 
        
        // Refresh callback
        // Calling onRefresh before we set the position so the
        // application can modify the size inside the callback.
        this.trigger('refresh', this);

        var css = this.options.css || {};
        if (this.options.xOffset)
            css.marginLeft = this.options.xOffset;
        if (this.options.yOffset)
            css.marginTop = this.options.yOffset;
        css.zIndex = 1000 + this.options.index + 1;
        
        // Set the fixed element height or auto
        if (this.options.width != 'auto')
            css.width = this.options.width;
        if (this.options.height != 'auto')
            css.height = this.options.height; 
            
        // Position the element relative to the given element        
        if (this.options.relativeTo) {
            css.position = css.position || 'absolute';
            css.left = $(this.options.relativeTo).offset().left;
            css.top = $(this.options.relativeTo).offset().top;
        }
        
        // Or center the popup on screen        
        else if (this.options.centered) {
            css.position = css.position || 'absolute';
            css.left = '50%';         
            css.marginLeft = css.marginLeft || 0;   
            css.marginLeft += -this.element.width() / 2; // + 'px';
            css.top = '50%';
            css.marginTop = css.marginTop || 0;   
            css.marginTop += -this.element.height() / 2; // + 'px'; 
        }
            
        // Apply CSS
        //console.log('Popup: Refreshing: ', css);
        this.element.css(css);
            
        // Set the actual size explicitly to allow for 100% content height
        //this.element.width(this.element.width());
        //this.element.height(this.element.height());
        
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
        
    trigger: function(name, popup) {                
        if (popup.options.element) 
            // Events will bubble to document level handlers
            popup.options.element.trigger('popup:' + name, popup)
        else      
            $(document).trigger('popup:' + name, popup)
    },
    
    content: function() {
        // The content element may be a child or the root element itself
        return this.element.find(this.options.content).add(this.element.filter(this.options.content));
    }
};