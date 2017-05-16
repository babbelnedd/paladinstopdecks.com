'use strict';
var $ = window.jQuery = window.$ = require('jquery');
var handlebars = require('handlebars');
var helper = require('../../../../shared/handlebars-helper');
var cache = require('./cache');

for (var key in helper) {
    if (helper.hasOwnProperty(key)) {
        handlebars.registerHelper(key, helper[key]);
    }
}

function getTemplate(name) {
    var d = $.Deferred();

    if (cache.get(name) !== undefined) {
        d.resolve(cache.get(name));
    } else {
        $.get(name)
            .then(function (src) {
                cache.set(name, handlebars.compile(src));
                d.resolve(cache.get(name));
            })
            .fail(d.reject);
    }
    return d.promise();
}

module.exports = handlebars;
var getView = module.exports.getView = function (name) {
    return getTemplate('/static/templates/views/' + name + '.min.hbs');
};
var getPartial = module.exports.getPartial = function (name) {
    return getTemplate('/static/templates/partials/' + name + '.min.hbs');
};
var getPartials = module.exports.getPartials = function (partials) {
    var _partials = [];

    for (var i = 0; i < partials.length; i++) {
        _partials.push(getPartial(partials[i]));
    }
    return $.when.apply($, _partials).pipe(function () {
        return Array.prototype.slice.call(arguments);
    });
};