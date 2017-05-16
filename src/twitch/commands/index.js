'use strict';

var rx = /^\!(decks|cards) (barik|buck|cassie|fernando|grohk|pip|ruckus|skye|evie)$/i;
module.exports = {
    decks: require('./decks'),
    parse: function (msg) {
        var matches = rx.exec(msg);
        if (matches === null) {
            return null;
        }
        return {cmd: module.exports[matches[1]], arg: matches[2]};
    }
};