///
/// Sourcey Confab
///
/// A Sourcey JQuery plugin for managing multiple dialog windows.
///
/// Features:
///     - Supports layered(multiple) reusable dialogs
///     - AJAX support
///     - Dynamic positioning
///     - Update's source element on modal close (retains data)
///     - Customisable via CSS
///
(function ($) {

    // Creates a modal dialog from selected elements
    $.fn.modal = function(options) {
        init();
        options = options || {};
        return this.each(function () {
            if (this.href) {
                $(this).click(function() {

                    // Support for rel="modal.class_name" syntax to add a class.
                    var className = this.rel.match(/modal\.([-_\sa-zA-Z]+)/)
                    if (className) className = className[1];
                    options.className = className;
                    options.url = this.href;
                    createModal(options);
                    return false;
                })
            }
            else {
                options.element = $(this);
                createModal(options);
            }
        });
    }

    // Creates a tooltip for selected elements
    $.fn.tooltip = function(options) {
        init();
        options = options || {};
        return this.each(function () {
            options.element = $(this);
            var modal = null;
            var ref = 0;
            var hider = function() {
                if (modal && ref == 0) {
                    modal.close();
                    modal = null;
                }
            };
            $(this).hover(
              function (e) {
                ref++;
                console.log('Over Tooltip Link', ref);

                if (modal == null) {
                    console.log('Creating Tooltip');
                    options.syncSource = false;
                    options.showOverlay = false;
                    options.xPos = e.pageX;
                    options.yPos = e.pageY;
                    options.width = options.width || 200;
                    options.fade = 0;
                    options.className += ' tooltip';
                    modal = createModal(options);
                    modal.element.find('.close').hide();
                    modal.element.hover(
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
    
    // Creates a modal dialog
    $.modal = function(options) {
        init();
        options = options || {};
        if (typeof(options) == 'string')
            options = { data: options }
        return createModal(options);
    }

    // Creates a growl style notification
    $.growl = function(options) {
        init();
        options = options || {}
        if (typeof(options) == 'string')
            options = { data: options }
        return createNotification(options);
    }

    $.confab = {}  
    
    // Default window options
    $.confab.options = {
        syncSource: true,
        showOverlay: true,
        width: 'auto',
        height: 'auto',
        xPos: 'auto',
        yPos: 85,
        life: 0,
        fade: 300,
        className: '',
        template : ' \
          <div class="modal"> \
            <a href="#" class="close"></a> \
            <div class="content"> \
            </div> \
          </div>'
    }

    $.confab.close = function(id) {
        //console.log('Close: ', id);
        var modal = $.confab.manager.get(id);
        if (modal) {
            modal.close();
            return true;
        }
        return false;
    }

    $.confab.refresh = function() {
        for (var i = 0; i < $.confab.manager.store.length; i++) {
            $.confab.manager.store[i].refresh();
        }
    }
    
    $.confab.closeNotifications = function() {
        for (var i = 0; i < $.confab.manager.store.length; i++) {
            if ($.confab.manager.store[i].type == 'notice')
                $.confab.manager.store[i].close();
        }
    }

    $.confab.manager = new Manager();


    //
    // Private methods
    //
    
    function init() {
        if ($('div#notifications').length) return;
        $('body').append('<div id="notifications"></div>');
        $(window).resize(function() { $.confab.refresh(); });
        $(window).scroll(function() { $.confab.refresh(); });
    }

    function createNotification(options) {
        options.className += ' opacity-75 growl-message';
        var defaults = $.extend({}, $.confab.options, {
            onOpen: function(m,e) {},
            onShow: function(m,e) {},
            onClose: function(m,e) {},
            sticky: false,
            life: 5000,
            fade: 750
        });
        options = $.extend(defaults, options);
        options.type = 'notice';
        options.width = 0; // use css
        options.yPos = 0; // use css
        options.xPos = 0; // use css
        options.showOverlay = false;
        if (options.sticky)
            options.life = 0;
        modal = new Modal(options);
        modal.init();
        $('#notifications').append(modal.element);
        modal.load();
    }

    function createModal(options) {
        var defaults = $.extend({}, $.confab.options, {
            title: '',
            onOpen: function(m,e) {},
            onShow: function(m,e) {},
            onClose: function(m,e) {}
        });
        options = $.extend(defaults, options);

        var modal;
        if (options.id)
            modal = $.confab.manager.get(options.id);
        if (modal)
            modal.options = $.extend(modal.options, options);
        else {

            // Close existing synchronized modals
            if (options.syncSource && options.element) {
                for (var i = 0; i < $.confab.manager.store.length; i++) {
                  if ($.confab.manager.store[i].options.element &&
                      $.confab.manager.store[i].options.element.get(0) === options.element.get(0)) {
                      $.confab.manager.store[i].close();
                  }
                }
            }
            modal = new Modal(options);
            modal.init();
            $('body').append(modal.element);
        }

        modal.load();
        return modal;
    }

    // This class represents a modal dialog.
    var Modal = function(options) {
        this.id = options.id ? options.id :
            options.element && options.element.attr('id') ?
                options.element.attr('id') : Sourcey.randomString(8);
        this.options = options;
        this.index = $.confab.manager.size() * 2;
        this.xhr = null;
        this.timeout = null;
        //console.log('Modal: Creating: ', this.id, options);

        this.init = function() {
            //console.log('Modal: Initializing: ', this.id);

            var self = this;
            this.element = $(this.options.template);
            this.element.attr('id', 'modal-' + this.id);
            if (this.options.className)
                this.element.addClass(this.options.className);
            this.element.find('.close').click(function() {
                self.close();
                return false;
            });
            if (this.options.showOverlay) {
                this.overlay = $('<div />');
                this.overlay.attr('class', 'modal-overlay');
                this.overlay.css('z-index', 1000 + this.index);
                $('body').append(this.overlay);
                this.overlay.click(function() {
                    self.close();
                    return false;
                });
            }
            if (this.options.life) {
              this.timeout = setTimeout(function () {
                  //console.log('Modal: Timeout: ', self.id);
                  self.close();
              }, this.options.life);
            }
            if (this.options.css)
                this.element.css(this.options.css);

            this.refresh();

            $.confab.manager.add(this);
            this.options.onOpen(this, this.element);
        }

        this.load = function() {
            //console.log('Modal: Loading');

            if (this.options.data)
                this.loadData(this.options.data);
            else if (this.options.element)
                this.loadElement(this.options.element);
            else if (this.options.url)
                this.loadURL(this.options.url);
        };

        this.loadData = function(data) {
            //console.log('Modal: Loading Data: ', data);
            this.show(data);
        }
        
        this.loadElement = function(element) {
            //console.log('Modal: Loading Element: ', element);
            this.options.element = element;

            // Set a placeholder for the data if required.
            if (this.options.syncSource)
                element.wrap('<div id="target-' + this.id + '"></div>');
            this.options.wasHidden = !element.is(':visible');
            this.show(element.show());
            //element.hide();.clone(true).show()
        };

        this.loadURL = function(url) {
            //console.log('Modal: Loading Async: ', url);
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
            this.element.find('.content').html('');
        };

        this.show = function(data) {
            //console.log('Modal: Showing: ', this.id, data);

            this.loading(false);
            var content = this.element.find('.content');
            if (this.options.title)
                content.append('<h2>' + this.options.title + '</h2>');
            content.hide();
            content.html(data);
            content.fadeIn('normal');

            this.refresh();

            this.options.onShow(this, this.element);
        };

        this.close = function() {
            //console.log('Modal: Closing: ',  this.id)
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
                var content = self.element.find('.content');
                if (self.options.wasHidden)
                    content.hide();
                $('#target-' + self.id).html(content);
                self.element.html(content.clone()); // clone so we can fade out
            }

            self.options.onClose(self, self.element);
            $.confab.manager.remove(self.id);

            //this.element.remove();
            this.element.fadeOut(this.options.fade, function() {
                //console.log('Modal: Closing: Removing: ', self.id)
                self.element.remove();
            });
        };

        this.refresh = function() {
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

            // Update position
            var css = this.options.css || {};
            css.zIndex = 1000 + this.index + 1;
            css.left = this.options.xPos != 'auto' ? this.options.xPos :
                ($(window).width() - this.element.outerWidth()) / 2 + $(window).scrollLeft() + 'px';
            css.top = this.options.yPos != 'auto' ? this.options.yPos :
                ($(window).height() - this.element.outerHeight()) / 2 + $(window).scrollTop() + 'px';
            this.element.css(css);

            //console.log('Modal: Refreshing: ', this.id, css)
        };
    };
})(jQuery);