'use strict';

module.exports = function stringToHashCode(str) {
    var hash = 0, i, chr, len;
    if (str.length === 0) {
        return hash;
    }
    for (i = 0, len = str.length; i < len; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
};