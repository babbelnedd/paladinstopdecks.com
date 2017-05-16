'use strict';
var $ = window.jQuery = window.$ = require('jquery');

$(function () {
    $('body').tooltip({selector: '[data-toggle=tooltip]'});
});