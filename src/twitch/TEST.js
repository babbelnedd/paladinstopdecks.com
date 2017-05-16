'use strict';

var settings = require('./settings');

var ms = require('seneca')()
    .client({
        host: settings.microservice.host,
        port: settings.microservice.port,
        type: 'tcp'
    });

ms.act({role: 'bot', cmd: 'join', channel: 'topdecksbot'}, function (err, result) {
    console.info('RES?', result);
});