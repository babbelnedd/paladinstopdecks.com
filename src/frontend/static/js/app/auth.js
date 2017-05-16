'use strict';

var $ = window.jQuery = window.$ = require('jquery');

// .onclick-input layout
$(function () {
    var input = $('.onclick-input');

    function setActive(that) {
        var len = $(that).val().trim().length;
        if (len > 0) {
            return $(that).find('+ label').addClass('active');
        }
        if (len < 1) {
            return $(that).find('+ label').removeClass('active');
        }
    }

    input.each(/* @this HTMLElement */function () {
        setActive(this);
    });

    input.on('change', /* @this HTMLElement */function () {
        setActive(this);
    });
});
