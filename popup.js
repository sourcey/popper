/*
    Popup.js

    A Popper.js extension for displaying popup windows.   

    Copyright (c)2010 Sourcey
    http://sourcey.com
    Distributed under The MIT License.
*/


(function ($) {

    // Static constructor
    $.popup = function(method) {
        if (typeof method === "undefined")
            method = {}                
        if (Popper.methods[method])
            return Popper.methods[method](Array.prototype.slice.call(arguments, 1));            
        else if (typeof method === "object")
            return Popper.methods.create(method).load();            
        else
            $.error("Method '" + method + "' does not exist for $.popup");    
    }

    // Jquery selector extension
    $.fn.popup = function(options) {
        options = options || {};
        return this.each(function () {
            if (this.href) {
                $(this).click(function() {

                    // Support for rel="popup.className" syntax to add a class.
                    var className = this.rel.match(/popup\.([-_\sa-zA-Z]+)/)
                    if (className) className = className[1];
                    options.className = className;
                    options.url = this.href;
                    Popper.methods.create(options).load();
                    return false;
                })
            }
            else {
                options.element = $(this);
                Popper.methods.create(options).load();
            }
        });
    }
})(jQuery);