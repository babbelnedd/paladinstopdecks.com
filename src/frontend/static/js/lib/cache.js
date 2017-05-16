'use strict';

window.ptdcache = {};

module.exports.set = function (k, v) {
    window.ptdcache[k] = v;
};

module.exports.get = function (k) {
    return window.ptdcache[k];
};