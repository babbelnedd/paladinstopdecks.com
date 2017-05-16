///<reference path="../../typings/express/express.d.ts"/>
'use strict';

import express = require('express');
import model = require('../../model/index');
// import log = require('../../log');
// import cache = require('../../utils/cache');

export = express.Router()
    .get('/:username', function (req:express.Request, res:express.Response, next:Function) {

        model.User
            .findOne({name: {$regex: new RegExp(req.params.username, 'i')}}).lean().exec()
            .then(function (user:model.IUser) {
                // todo: paginatioN!!!
                model.Activity
                    .find({_user: user._id}).select('type info url created').lean().exec()
                    .then(function (activities:model.IActivity[]) {
                        for (let i = 0; i < activities.length; i++) {
                            delete activities[i]._id;
                        }
                        res.json(activities);
                    });
            });

    });