'use strict';

var rx = {
    space: /\s+/g,
    disallowed: /[^a-z0-9\-\_]/gi,
    nonAlphaNumeric: /[^a-z0-9]/gi
};
// important todo: improve regex!!
var normalize = module.exports = function (str) {
    if (typeof str !== 'string')
        return str;
    str = str
        .replace(rx.space, '_')
        .replace(rx.disallowed, '')
        .toLowerCase();
    while (rx.nonAlphaNumeric.test(str.substring(0, 1))) str = str.substring(1, str.length);
    while (rx.nonAlphaNumeric.test(str.substring(str.length - 1, str.length))) str = str.substring(0, str.length - 1);
    str = str.replace(/__/g, '_');
    return str;
};