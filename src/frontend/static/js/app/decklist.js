'use strict';

var $ = window.jQuery = window.$ = require('jquery'),
    redirect = require('../lib/redirect');

require('../lib/vendor/purl'); // $.url()
require('../lib/vendor/jquery.tablesorter');

$(function () {

    $.tablesorter.addParser({
        // set a unique id
        id: 'shortNumber',
        is: function () {
            // return false so this parser is not auto detected
            return false;
        },
        format: function (s) {
            // format your data for normalization
            var k = s.toLowerCase().indexOf('k') !== -1,
                result = 0;
            if (k === true) {
                result = parseFloat(s.replace('k', '')) * 1000;
            } else {
                result = parseFloat(s);
            }
            return result;
        },
        // set type, either numeric or text
        type: 'numeric'
    });

    $.tablesorter.addParser({
        // set a unique id
        id: 'semver',
        is: function () {
            // return false so this parser is not auto detected
            return false;
        },
        format: function (s) {
            s = s.replace(/\./, '');
            return parseInt(s) * 1000;
        },
        // set type, either numeric or text
        type: 'numeric'
    });

    var $table = $('table.decks'),
        $nextPage = $('.next-page'),
        $prevPage = $('.prev-page'),
        $name = $('#name'),
        $author = $('#author'),
        url = $.url(window.location.href),
        q = url.param();

    function switchPage(n) {
        return function () {
            var currentPage = parseInt(q.page),
                nextPage = currentPage + n;

            if (isNaN(nextPage)) {
                nextPage = 2;
            }
            q.page = nextPage;

            var newUrl = window.location.pathname + '?' + $.param(q);
            redirect(newUrl);

        }
    }

    $table.tablesorter({
        sortList: [[5, 1], [3, 1]],
        headers: {
            3: {sorter: 'shortNumber'},
            4: {sorter: 'shortNumber'},
            5: {sorter: 'semver'}
        }
    });
    $nextPage.click(switchPage(1));
    $prevPage.click(switchPage(-1));

    if (!!q.author) {
        $author.val(q.author);
    }
    if (!!q.name) {
        $name.val(q.name);
    }

});