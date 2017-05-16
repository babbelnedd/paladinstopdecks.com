'use strict';

var $ = window.jQuery = window.$ = require('jquery');
require('../lib/vendor/slick'); // $.slick

$(function () {

    $('.streams').slick({
        lazyLoad: 'ondemand',
        infinite: true,
        accessibility: false,
        autoplay: true,
        autoplaySpeed: 3000,
        arrows: false,
        cssEase: 'ease-in',
        slidesToShow: 4,
        variableWidth: true
    });

});