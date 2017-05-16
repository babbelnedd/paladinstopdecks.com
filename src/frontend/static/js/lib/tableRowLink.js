'use strict';

var redirect = require('../lib/redirect');
$('html').on('click', 'tr[data-href] td', function () {
    var a = $(this).find('a');
    if (a.length > 0 && a.attr('href')) {
        redirect(a.attr('href'));
    } else {
        redirect($(this).parent().data('href'));
    }
});
$('html').on('click', '[data-href]', function () {
    redirect($(this).data('href'));
});
