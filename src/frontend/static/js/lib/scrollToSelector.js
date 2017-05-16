'use strict';

module.exports = function ($selector, offset) {
    offset = offset || 0;
    $('html,body').animate({scrollTop: $selector.offset().top + offset}, 'slow');
};