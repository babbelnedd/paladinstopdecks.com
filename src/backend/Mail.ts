///<reference path="typings/nodemailer/nodemailer.d.ts"/>
///<reference path="typings/yamljs/yamljs.d.ts"/>

'use strict';

import nodemailer = require('nodemailer');
import YAML = require('yamljs');
import log = require('./log');
import path = require('path');
import fs = require('fs');
let auth = require('../auth');
let logo = path.join(path.dirname(__dirname), 'frontend', 'static', 'img', 'logo.png');
export let transporter = nodemailer.createTransport(auth.mail, {from: auth.mail.auth.user});

interface IMailSettings {
    to:string;
    subject:string;
    text?:string;
    html?:string;
    from?: string;
}

function sendMail(settings:any, cb:Function) {
    try {
        transporter = nodemailer.createTransport(auth.mail, {from: auth.mail.auth.user});
    } catch (err) {
        require('./log').warn('Failed to create nodemailer', {err: err.message});
    }

    if (settings.from) {
        settings.from += `<${auth.mail.auth.user}>`;
    }
    if (!settings.attachments) {
        settings.attachments = [];
    }
    settings.attachments.push({
        filename: path.basename(logo),
        path: logo,
        cid: 'logopng@paladinstopdecks.com'
    });

    transporter.sendMail(settings, function (err?:any, info?:any) {
        // important: wenn ich hier log.warn // log.info benutze dann fliegt mir das um die ohren - allerdings nur
        // important: in prod mode. i have no idea why. wtf ffs!!
        if (err) {
            require('./log').warn('Failed to send an email', {err: err});
        } else {
            require('./log').info('Successfully sent email', {info: info});
        }
        if (cb) {
            cb(err, info);
        }
    });
}

export function sendText(settings:IMailSettings, cb?:(err?:any, info?:any) => void) {
    sendMail(settings, cb);
}

export function sendHTML(settings:IMailSettings, cb?:(err?:any, info?:any) => void) {
    sendMail(settings, cb);
}

// ==============================

let hbs = require('handlebars');
let templatePath = path.join(path.dirname(path.dirname(__dirname)), 'data', 'mailtemplates');
let layout:any = undefined;
let cache:any = {};
getTemplate('layout/main', function (err:any, template:any) {
    if (err) {
        log.critical('Could not load Mail Layout!', {err: err});
        process.exit(1);
    }

    layout = template.content;
});


function getTemplate(name:string, cb:(err:any, data:any) => void) {

    if (process.env.NODE_ENV === 'production') {
        if (cache.hasOwnProperty(name)) {
            return cb(null, cache[name]);
        }
    }

    // build filename
    let filename = templatePath;
    let names = name.split('/');

    for (let i = 0; i < names.length; i++) {
        let templateName = names[i];
        if (i == (names.length - 1) && templateName.indexOf('.yaml') === -1) {
            templateName += '.yaml';
        }
        filename = path.join(filename, templateName);
    }

    fs.readFile(filename, 'utf8', function (err:NodeJS.ErrnoException, data:string) {
        if (err) {
            return cb({msg: 'Could not read template', err: err.message}, undefined);
        }

        let template:any = undefined;
        try {
            template = YAML.parse(data);
            template.content = hbs.compile(template.content);
        } catch (err) {
            log.warn('Failed to compile an template', {err: err.message});
            return cb('Failed to compile', {err: err.message});
        }
        if (require('./app').get('production')) {
            cache[name] = template;
        }
        return cb(null, template);
    });

}

export function sendTemplate(template:string, to:string, templateVariables?:any, cb?:(err?:any, inf?:any)=>void) {

    templateVariables = templateVariables || {};
    cb = cb || function () {
        };

    getTemplate(template, function (err:any, template:any) {
        if (err) {
            return log.warn('Failed to get template', err);
        }
        let html = '';
        try {
            html = layout({body: template.content(templateVariables)});
            sendHTML({to: to, html: <string>html, from: <string>template.from, subject: <string>template.subject}, cb);
        } catch (err) {
            log.warn('Failed to compile mail template', {err: err.message});
            return cb({msg: 'Failed to compile template', err: err.message});
        }

    });

}