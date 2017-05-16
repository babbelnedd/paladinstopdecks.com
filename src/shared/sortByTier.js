'use strict';

var mapTier = require('./mapTier');

module.exports = function (arr) {
    arr = arr.sort(function (a, b) {
        var tier = mapTier(a.tier) - mapTier(b.tier);
        if (tier === 0) {
            return a.name > b.name;
        }
        return tier;
    });
    return arr;
};