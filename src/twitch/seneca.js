'use strict';

var settings = require('./settings');

module.exports = function () {
    return require('seneca')({strict: false})
        .listen({
            host: settings.microservice.host,
            port: settings.microservice.port,
            type: 'tcp'
        });
};