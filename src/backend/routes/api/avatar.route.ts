///<reference path="../../typings/express/express.d.ts"/>
'use strict';

import express = require('express');
import model = require('../../model/index');
// import log = require('../../log');
// import cache = require('../../utils/cache');

export = express.Router()
    .get('/', function (req:express.Request, res:express.Response, next:Function) {
        if (req.isAuthenticated()) {
            return res.send(req.user.avatar);
        }
        next();
    })
    .get('/:username', function (req:express.Request, res:express.Response, next:Function) {
        model.User
            .findOne({name: {$regex: new RegExp(req.params.username, 'i')}}).select('avatar').lean().exec()
            .then(function (user:model.IUser) {
                if (user !== null) {
                    return res.send(user.avatar);
                }
                // todo: return fallback image
                return '';
            });
    });