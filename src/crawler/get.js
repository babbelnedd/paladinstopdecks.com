'use strict';

var fs = require('fs');
var jsdom = require('jsdom');
var jquery = fs.readFileSync("./jquery.min.js", "utf-8");
var UA = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36';

module.exports = function (url) {
    return new Promise(function (resolve, reject) {
        jsdom.env({
            url: url,
            src: [jquery],
            userAgent: UA,
            done: function (err, window) {
                if (err) return reject('Failed to grab Window', err);
                resolve(window);
            }
        });
    });
};