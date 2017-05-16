///<reference path='typings/mongoose/mongoose.d.ts'/>
///<reference path='typings/winston/winston.d.ts'/>
'use strict';

import winston = require('winston');
import auth = require('../auth');

let DailyRotateFile = require('winston-daily-rotate-file');
let WinstonNodemailer = require('./WinstonNodemailer');
let LogglyTransport = require('winston-loggly').Loggly;

let config = {
    levels: {
        trace: 5,
        debug: 4,
        info: 3,
        warn: 2,
        error: 1,
        critical: 0
    },
    colors: {
        trace: 'black',
        debug: 'gray',
        info: 'white',
        warn: 'yellow',
        error: 'red',
        critical: 'red bgGreen',
    },
    transports: <any>[]
};

if (process.env.NODE_ENV == 'production') {
    config.transports.push(new WinstonNodemailer({
        level: 'warn',
        to: 'schad.lucas@gmail.com',
        from: 'Paladins Log Service <donotreply@paladinstopdecks.com>',
        transport: require('./Mail').transporter
    }));
    config.transports.push(new winston.transports.Console({
        level: 'warn'
    }));
    config.transports.push(new DailyRotateFile({
        level: 'debug',
        name: 'file',
        datePattern: '_yyyy-MM-dd.log',
        filename: 'paladinstopdecks',
        dirname: '/var/log/paladinstopdecks/'
    }));
    config.transports.push(new LogglyTransport({
        level: 'trace',
        inputToken: auth.loggly.token,
        subdomain: auth.loggly.subdomain,
        stripColors: true,
        tags: auth.loggly.tags,
        json: true
    }));
} else {
    config.transports.push(new winston.transports.Console({
        level: 'trace'
    }));
}

let logger:winston.LoggerInstance = new winston.Logger(config);

export = logger;