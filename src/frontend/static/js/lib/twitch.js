/*
'use strict';

var $ = window.jQeury = window.$ = require('jquery');

module.exports.getStream = function (stream) {
    var d = $.Deferred();

    $.get('https://api.twitch.tv/kraken/streams/' + stream, function (data) {
        d.resolve(data);
    });

    return d.promise();
};

module.exports.getStreams = function (streams) {

    var d = $.Deferred();
    $.get('https://api.twitch.tv/kraken/streams?channel=' + streams.join(','), function (streams) {
        d.resolve(streams.streams);
    });

    return d.promise();

};*/
