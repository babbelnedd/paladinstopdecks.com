///<reference path="../../typings/tsd.d.ts"/>
'use strict';

import {Router, Request, Response} from 'express';
import model = require('../../model/index');

export = Router({mergeParams: true})
    .get('/', function (req:Request, res:Response, next:any) {
        let filter = {
            name: {$regex: new RegExp(`^${req.params.username}$`, 'i')}
        };

        function render(user:model.IUser) {
            if (!user) {
                return next();
            }
            let profileTitle = '';
            if (user.name.slice(-1) === 's') {
                profileTitle = `${user.name}' Profile`;
            } else {
                profileTitle = `${user.name}'s Profile`;
            }

            res.render('account/index', {
                user: user,
                nav: 'account',
                title: profileTitle,
                dependencies: {js: ['account/index']}
            });
        }

        model.User.findOne(filter).exec().then(render, next);

    });