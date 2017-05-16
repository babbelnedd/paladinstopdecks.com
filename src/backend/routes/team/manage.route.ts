///<reference path='../../typings/tsd.d.ts'/>
'use strict';

import {Router, Request, Response} from 'express';
import Controller = require('../../controller/index');

export = Router({mergeParams: true})
    .get('/leave', function (req:Request, res:Response, next:Function) {
        if (!req.isAuthenticated() || !req.user.team._id) {
            return next();
        }
        res.render('team/leave', {
            team: req.user.team
        });
    })
    .get('/', function (req:Request, res:Response, next:Function) {
        res.redirect(`/manage-team/about`);
    })
    .get('/:name', function (req:Request, res:Response, next:Function) {
        if (!req.isAuthenticated() || !Controller.Team.canAdministrate(req.user)) {
            return next();
        }
        Controller.Team.findTeamWithUserProfiles(req.user.team.name).then(function (team:any) {
            if (!team) {
                return next();
            }
            let isCaptain = false;

            for (let i = 0; i < team.roster.length; i++) {
                if (req.user._id.equals(team.roster[i]._id)) {
                    isCaptain = team.roster[i].team.role === Controller.Team.roles.captain;
                    break;
                }
            }
            res.render('team/update', {
                team: team,
                isCaptain: isCaptain,
                dependencies: {
                    js: ['team/manage']
                }
            });
        });
    });