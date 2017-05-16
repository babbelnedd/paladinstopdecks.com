///<reference path="../../typings/express/express.d.ts"/>
'use strict';

import {Router, Request, Response} from 'express';
import log = require('../../log');
import Mail = require('../../Mail');

export = Router()
    .post('/', function (req:Request, res:Response, next:Function) {
        if (!req.body.title || !req.body.form_body) {
            next();
        }
        log.info(`Form submitted ${req.body.title}`, {ip: req.ip});
        let mail = {
            to: 'schadstoff@paladinstopdecks.com',
            subject: `Form submitted: ${req.body.title}`,
            html: `
            <p><strong>From</strong></p>
            <p>${req.body.from}</p>
            <p><strong>Text</strong></p>
            <p>${req.body.form_body}</p>`
        };
        Mail.sendText(mail, function (err:any) {
            res.render('form/submitted', {
                err: !!err,
                form: req.body.title,
                body: req.body.form_body
            });
        });

    });