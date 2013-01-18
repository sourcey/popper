///
/// Sourcey Tooltip
///
/// A Sourcey JQuery plugin for managing tooltips.
///
(function ($) {

    // Creates a tooltip for selected elements
    $.fn.tooltip = function(options) {
        console.log('Creating Tooltip: ', options);
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
                //console.log('Over Tooltip Link', ref);

                if (popup == null) {
                    //console.log('Creating Tooltip');
                    options.syncSource = false;
                    options.showOverlay = false;
                    options.xPos = e.pageX;
                    options.yPos = e.pageY;
                    options.fade = 0;
                    options.containment = window;
                    options.className += ' tooltip';
                    options.width = options.width || 200;
                    popup = $.popup(options);
                    popup.element.find('.popup-close').hide();
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
        });
    }
})(jQuery);