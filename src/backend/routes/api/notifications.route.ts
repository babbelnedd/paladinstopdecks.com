///<reference path='../../typings/express/express.d.ts'/>
///<reference path='../../typings/bluebird/bluebird.d.ts'/>

'use strict';

import express = require('express');
import Controller = require('../../controller/index');
import utils = require('../../utils/index');
import Promise = require('bluebird');
// import log = require('../../log');

class VoteError extends Error {
    public name = 'VoteError';

    constructor(public message?:string) {
        super(message);
    }
}

export = express.Router()
    .get('/', function (req:express.Request, res:express.Response, next:any) {
        if (!req.isAuthenticated()) {
            return res.json({err: 'Not Authenticated'});
        }

        if (req.query.limit === undefined) {
            return res.json({err: 'No limit specified'});
        }

        if (req.query.limit > 100) {
            return res.json({err: 'Limit to high'});
        }

        let limit:number = parseInt(req.query.limit);
        if (isNaN(limit)) {
            limit = 10;
        }

        Controller.Notification.getByUser(req.user, limit)
            .then(function (notifications:any) {
                notifications.user = {name: req.user.name};
                return Promise.resolve(notifications);
            })
            .then(function (result:any) {
                res.setHeader('Cache-Control', 'max-age=60');
                res.setHeader('Expires', new Date(Date.now() + 60000).toUTCString());
                res.json(result);
            });

    })
    .post('/seen', function (req:express.Request, res:express.Response) {
        if (!req.isAuthenticated()) {
            return res.json({err: 'Not Authenticated'});
        }
        if (req.body.id === undefined) {
            return res.json({err: 'No ID provided'});
        }

        Controller.Notification.seen(req.user, req.body.id).then(utils.respond(res));
    });