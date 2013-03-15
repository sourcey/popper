///
/// Sourcey Tooltip
///
/// A Sourcey JQuery plugin for displaying dynamic tooltips.
///
(function ($) {
    // Create a tooltip for selected elements.
    //
    // By default tooltips will show when the target element is hovered.
    // Tooltip can also be displayed continously now by specifying the
    // 'always' and 'life' and 'modal' options.
    $.fn.tooltip = function(options) {
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


                
        
        // tooltip-always
                  
        // Call default function
        /*tooltip-always 
          //    <div class="tooltip popup-content ' + options.className + '">\
          //<div class="tooltip-popup">\
          //    </div>\
          //</div>';
          //' + options.className + '
        //options.className = '';
                
        options.template : '\
          <div class="popup">\
            <a href="#" class="popup-close"></a>\
            <div class="popup-content">\
            </div>\
          </div>'
        //options.width = options.width || 190;     
        //options.className += ' tooltip';
         //   <div class="">\
         //<a href="#" class="popup-close"></a>\
         //   var container = $('<span class="">aaaaaaaa</span>')
                //popup.element.find('.popup-close').hide();
                //popup.element.find('.popup-close').hide();
            
            //options.width = element.outerWidth();
            //options.height = element.outerHeight();
            //options.xPos = element.offset().left + element.width(); // + options.width
            //options.yPos = element.offset().top; // + options.height;
            
            //if (options.yOffset)
            //    options.yPos += options.yOffset;
            //if (options.xOffset)
            //    options.xPos += options.xOffset; //(options.width + 30);
            
            // Create and show the tooltip now for life duration
                //options.element = container;
        */  
            //popup = 
            //var element = $(this);
            // ('tooltip-container')
            
            // If life is specified
            //if (options.life) {            
            //}
            
            // Create the tooltip and show on element hover
            //else {
                //popup = $.popup(options);
                /*
                element.hover(
                     function (e) { popup.element.addClass('hover') },
                     function (e) { popup.element.removeClass('hover') })
                var ref = 0;   
                var popup = null;
                var hider = function() {
                    if (popup && ref == 0) {
                        popup.close();
                        popup = null;
                    }
                };
                element.hover(
                  function (e) {
                    ref++;
                    //console.log('Over Tooltip Link', ref);

                    if (popup == null) {
                        //console.log('Creating Tooltip');
                        //options.xPos = e.pageX;
                        //options.yPos = e.pageY;
                        popup = $.popup(options);
                        popup.element.hover(
                             function (e) {
                                ref++;
                                //console.log('Over Tooltip Element', ref);
                             },
                             function (e) {
                                ref--;
                                //console.log('Out Tooltip Element', ref);
                                setTimeout(hider, 100);
                             })
                    }
                  },
                  function (e) {
                    ref--;
                    //console.log('Out Tooltip Link', ref);
                    setTimeout(hider, 100);
                  }
                );
                */
            //}