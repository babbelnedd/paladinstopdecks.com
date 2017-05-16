///<reference path="../../typings/express/express.d.ts"/>
'use strict';

import express = require('express');
import model = require('../../model/index');
let request = require('request-promise');

export = express.Router()
    .get('/authenticated', function (req:express.Request, res:express.Response, next:Function) {
        res.json(req.isAuthenticated());
    })
    .get('/is/:user', function (req:express.Request, res:express.Response, next:Function) {

        if (req.params.user.trim() === '' || !req.isAuthenticated()) {
            return res.json(false);
        }

        model.User.findOne({name: req.params.user}).exec().then(function (user:model.IUser) {
            res.json(user._id.equals(req.user._id));
        });
    })
    .get('/whoami', function (req:express.Request, res:express.Response, next:Function) {
        if (!req.isAuthenticated()) {
            return res.json(false);
        }

        return res.json({
            created: req.user.created,
            name: req.user.name,
            email: req.user.email,
            activated: req.user.activated,
            avatar: req.user.avatarURL,
            bio: req.user.bio
        });
    })
    .get('/twitch', function (req:express.Request, res:express.Response) {
        if (!req.isAuthenticated() || req.user.twitch === undefined) {
            return res.json(false);
        }

        request(`https://api.twitch.tv/kraken?oauth_token=${req.user.twitch.access_token}`)
            .then(function (result:any) {
                result = JSON.parse(result);

                if (result.token.valid === true) {
                    return res.json({channel: result.token.user_name});
                }

                res.json(false);

            });
    });