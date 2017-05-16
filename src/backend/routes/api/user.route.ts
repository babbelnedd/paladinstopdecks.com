///<reference path="../../typings/tsd.d.ts"/>
'use strict';

import {IUser} from '../../model/User';
import express = require('express');
import Model = require('../../model/index');
// import Controller = require('../../controller/index');
// import Promise = require('bluebird');
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
            return res.json({err: 'Cheating not allowed'});
        }

        Model.User
            .find({
                name: new RegExp(`^${req.query.q}.*`, 'i')
            })
            .select('-_id name')
            .limit(req.query.limit)
            .lean().exec()
            .then(function (users:IUser[]) {
                res.json(users);
            });

    });