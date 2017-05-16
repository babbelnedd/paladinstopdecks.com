///<reference path="../../typings/express/express.d.ts"/>
'use strict';
import express = require('express');

function authMid(req:express.Request, res:express.Response, next:Function) {
    if (req.isAuthenticated() && req.params.username === req.user.name) {
        return next();
    }
    return res.redirect(`/account/${req.params.username}/activity`);
}

export = express.Router()
    .get('/:username', function (req:express.Request, res:express.Response) {
        return res.redirect(`/account/${req.params.username}/activity`);
    })
    .use('/:username/decks', require('./index.route'))
    .use('/:username/favorites', require('./index.route'))
    .use('/:username/comments', require('./index.route'))
    .use('/:username/activity', require('./index.route'))
    .use('/:username/team', authMid, require('./team.route'))
    .use('/:username/notifications', authMid, require('./notifications.route'))
    .use('/:username/edit', authMid, require('./edit.route'));