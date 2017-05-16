///<reference path='../../typings/tsd.d.ts'/>
'use strict';

import {IUser, ITeam} from '../../model/index';
import {Router, Request, Response} from 'express';
import Model = require('../../model/index');

export = Router({mergeParams: true})
    .get('/', function (req:Request, res:Response, next:any) {
        let user:IUser = req.user;
        if (user.team._id) {
            Model.Team.findOne({_id: user.team._id}).lean().exec().then(function (team:ITeam) {
                res.redirect(`/team/${team.normalizedName}`);
            });
        } else {
            res.render('account/team', {
                nav: 'account/team',
                dependencies: {js: ['account/team']}
            });
        }
    })
    .get('/leave', function (req:Request, res:Response, next:Function) {
        if (!req.user.team._id) {
            return next();
        }
        res.render('team/leave', {
            team: req.user.team
        });
    });