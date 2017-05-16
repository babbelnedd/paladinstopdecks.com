///<reference path="typings/nodemailer/nodemailer.d.ts"/>
'use strict';

let util = require('util');
let winston = require('winston');

interface IWinstonNodemailerOptions {
    to: string;
    from:string;
    level:string;
    subject?: string;
    transport: nodemailer.Transport;
}

let check = function (options:any) {
    if (!options) {
        throw 'no options object passed';
    }
    if (!options.to) {
        throw 'winston-nodemailer requires \'to\' property';
    }

    if (!options.transport) {
        throw 'winston-nodemailer requires a valid nodemailer transport';
    }

};

let NodeMailer = function (options:IWinstonNodemailerOptions) {
    check(options);
    winston.Transport.call(this, options);
    this.mailOptions = {
        name: this.name,
        to: options.to,
        from: options.from,
        level: options.level || 'info',
    };
    this.transport = options.transport;
};

util.inherits(NodeMailer, winston.Transport);
NodeMailer.prototype.name = 'nodemailer';


NodeMailer.prototype.log = function (level:any, msg:any, meta:any, callback:any) {
    let self = this;
    let mailOptions = JSON.parse(JSON.stringify(this.mailOptions));
    mailOptions.subject = this.mailOptions.subject ? this.mailOptions.subject : `[${level}] - ${msg}`;
    mailOptions.text = `${msg}\n${util.inspect(meta)}`;
    this.transport.sendMail(mailOptions, function (err:any) {
        if (err) {
            self.emit('error', err);
        }

        self.emit('logged');
        callback(null, true);
    });
};


winston.transports.NodeMailer = NodeMailer;
export  = NodeMailer;