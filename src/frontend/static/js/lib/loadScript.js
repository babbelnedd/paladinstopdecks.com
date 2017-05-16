'use strict';
var $ = window.jQuery = window.$ = require('jquery'),
    version = require('../../../../package.json').version;

function versionate(url) {
    return url + '?v=' + version;
}

function loadScript(url) {
    var d = $.Deferred();

    $.ajax({
        url: versionate(url),
        method: 'GET',
        // dataType: 'script',
        complete: function () {
            d.resolve();
        }
    });

    return d.promise();
}

module.exports = function (urls, callback) {
    if (urls.constructor !== Array) {
        urls = [urls];
    }
    var tasks = [];
    for (var i = 0; i < urls.length; i++) {
        tasks.push(loadScript(urls[i]));
    }

    if (callback) {
        $.when.apply($, tasks).pipe(function () {
            callback(Array.prototype.slice.call(arguments));
        });
    } else {
        var d = $.Deferred();
        $.when.apply($, tasks).pipe(function () {
            d.resolve(Array.prototype.slice.call(arguments));
        });
        return d.promise();
    }
};
