var $ = window.$ = window.jQuery = require('jquery');

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
    $('table').tablesorter({
        sortList: [[3, 1]],
        headers: {
            4: {sorter: 'shortNumber'},
            5: {sorter: 'shortNumber'},
            6: {sorter: 'semver'}
        }
    });
});