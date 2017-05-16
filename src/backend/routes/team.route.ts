///<reference path="../typings/tsd.d.ts"/>

'use strict';
import {Router, Request, Response} from 'express';
import {ITeam} from '../model/Team';
import Controller = require('../controller/index');
import Team = require('../controller/team.controller');


export = Router()
    .get('/:name', function (req:Request, res:Response, next:Function) {
        Controller.Team.findTeamWithUserProfiles(req.params.name)
            .then(function (team:ITeam) {
                if (team.normalizedName !== req.params.name) {
                    return res.redirect(`/team/${team.normalizedName}`);
                }

                if (!team) {
                    return next();
                }

                let isCaptain = false,
                    isManager = false,
                    isMember = false,
                    isInvited = false;

                if (req.isAuthenticated()) {
                    if (req.user.team._id && req.user.team._id.equals(team._id)) {
                        for (let i = 0; i < team.roster.length; i++) {
                            let member:any = team.roster[i];
                            if (req.user._id.equals(member._id)) {
                                isMember = true;
                                if (member.team.role === Team.roles.captain) {
                                    isCaptain = true;
                                } else if (member.team.role === Team.roles.management) {
                                    isManager = true;
                                }
                                break;
                            }
                        }
                    } else {
                        for (let i = 0; i < team.invited.length; i++) {
                            if (req.user._id.equals(team.invited[i]._id)) {
                                isInvited = true;
                                break;
                            }
                        }
                    }
                }

                res.render('team/overview', {
                    // nav: '',
                    team: team,
                    isCaptain: isCaptain,
                    isMember: isMember,
                    isManager: isManager,
                    isInvited: isInvited
                });
            })
            .catch(function (err:any) {
                return next();
            });
    });
