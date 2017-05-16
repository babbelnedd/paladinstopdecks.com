///<reference path="../../typings/tsd.d.ts"/>
'use strict';

import {Router, Request, Response} from 'express';
import {ITeam, ITeamMember} from '../../model/Team';
import {IUser} from '../../model/User';
import {normalize} from '../../utils/index';
import Controller = require('../../controller/index');
import Model = require('../../model/index');
import log = require('../../log');
import Promise = require('bluebird');

export = Router()
    .get('/', function (req:Request, res:Response) {
        Controller.Team.getAllTeams().then(function (teams:ITeam[]) {
            return res.json(teams);
        });
    })
    .get('/roster', function (req:Request, res:Response, next:Function) {
        if (!req.isAuthenticated() || !Controller.Team.canAdministrate(req.user)) {
            return next();
        }

        Controller.Team.findTeamWithUserProfiles(req.user.team._id).then(function (result:any) {
            let isCaptain = false;
            for (let i = 0; i < result.roster.length; i++) {
                if (req.user._id.equals(result.roster[i]._id)) {
                    if (result.roster[i].team.role === Controller.Team.roles.captain) {
                        isCaptain = true;
                    }
                    break;
                }
            }

            return res.json({team: result, isCaptain: isCaptain});
        });
    })
    .get('/free-agents', function (req:Request, res:Response) {
        Model.User
            .find({
                name: new RegExp(`^${req.query.q}.*`, 'i'),
                'team._id': {$exists: false}
            })
            .select('-_id name')
            .limit(req.query.limit)
            .lean().exec()
            .then(function (users:IUser[]) {
                res.json(users);
            });
    })
    .get('/leave', function (req:Request, res:Response, next:Function) {
        if (!req.isAuthenticated() || !req.user.team._id) {
            return next();
        }
        Model.Team.findOne({_id: req.user.team._id}).exec().then(function (team:ITeam) {
            let index = -1;
            if (!team) {
                return next();
            }
            for (let i = 0; i < team.roster.length; i++) {
                if (req.user._id.equals(team.roster[i]._id)) {
                    index = i;
                }
            }
            if (index > -1) {
                team.roster.splice(index, 1);
            } else {
                return next();
            }
            let opts = {info: [`${req.user.name} left team ${team.name}`]};
            Controller.Activity.newActivity(req.user, Controller.Activity.Type.leftTeam, opts);
            if (team.roster.length < 1) {
                team.remove(function () {
                    Model.User.update({_id: req.user._id}, {$unset: {team: 1}}).exec().then(function () {
                        return res.redirect(`/account/${req.user.name}`);
                    });
                });
            } else {
                for (let i = 0; i < team.roster.length; i++) {
                    if (team.roster[i].role === Controller.Team.roles.captain) {
                        Controller.User.findOne(team.roster[i].name).then(function (user:IUser) {
                            let opts = {info: `${req.user.name} left your Team`};
                            Controller.Notification
                                .newNotification(user, Controller.Notification.types.memberLeftTeam, opts);
                        });
                    }
                }

                team.save(function () {
                    Model.User.update({_id: req.user._id}, {$unset: {team: 1}}).exec().then(function () {
                        return res.redirect(`/account/${req.user.name}`);
                    });
                });
            }
        });
    })
    .post('/new', function (req:Request, res:Response) {
        if (!req.isAuthenticated()) {
            return res.json({err: 'You need to be authenticated to create a new Team!'});
        }

        if (req.user.team._id) {
            res.status(401);
            return res.json({err: 'You are already in a Team!'});
        }

        Controller.Team.newTeam(req.user, req.body.name).then(function (team:ITeam) {
            return res.json({err: null, url: '/manage-team'});
        });
    })
    .post('/invite', function (req:Request, res:Response, next:Function) {

        function onReject(err:any) {
            return res.json(false);
        }

        function invite(user:IUser) {
            Controller.Team.invite(req.user, user).then(function () {
                return res.json(true);
            }).catch(onReject);
        }

        if (!req.isAuthenticated() || !Controller.Team.canAdministrate(req.user)) {
            return res.json(false);
        }

        Controller.User.findOne(req.body.name).then(invite, onReject);

    })
    .post('/cancel-invite', function (req:Request, res:Response) {
        if (!req.isAuthenticated() || !Controller.Team.canAdministrate(req.user) || !req.body.uid) {
            return res.json(false);
        }

        req.user.getTeam().then(function (team:ITeam) {
            if (!team) {
                return res.json(false);
            }

            let index = -1;
            for (let i = 0; i < team.invited.length; i++) {
                if (team.invited[i]._id.equals(req.body.uid)) {
                    index = i;
                    break;
                }
            }

            if (index < 0) {
                return res.json(false);
            }

            team.invited.splice(index, 1);
            team.save(function () {
                return res.json(true);
            });
        });
    })
    .post('/update', function (req:Request, res:Response, next:Function) {
        if (!req.isAuthenticated() || !Controller.Team.canAdministrate(req.user)) {
            return next();
        }

        Model.Team.findOne({_id: req.user.team._id}).exec().then(function (team:ITeam) {

            if (!team) {
                return next();
            }

            if (team.biography !== req.body.biography) {
                team.biography = req.body.biography;
            }
            if (team.name !== req.body.name) {
                team.name = req.body.name;
                team.normalizedName = normalize(req.body.name);
                req.user.team.name = req.body.name;

                team.roster.forEach(function (member:ITeamMember) {
                    Model.User.findOne({_id: member._id}).select('team').exec().then(function (user:IUser) {
                        user.team.name = req.body.name;
                        user.save();
                    });
                });
            }
            if (team.tag !== req.body.tag) {
                team.tag = req.body.tag;
            }
            if (team.biography !== req.body.biography) {
                team.biography = req.body.biography;
            }
            if (team.social.website !== req.body.website) {
                team.social.website = req.body.website;
            }
            if (team.social.twitter !== req.body.twitter) {
                team.social.twitter = req.body.twitter;
            }
            if (team.social.youtube !== req.body.youtube) {
                team.social.youtube = req.body.youtube;
            }
            if (team.social.twitch !== req.body.twitch) {
                team.social.twitch = req.body.twitch;
            }
            if (team.region !== req.body.region) {
                req.body.region = req.body.region.toLowerCase();
                if (req.body.region !== 'eu' && req.body.region !== 'na') {
                    return next();
                }
                team.region = req.body.region;
            }

            req.user.save(function () {
                team.save(function () {
                    return res.redirect(`/manage-team/about`);
                });
            });
        });

    })
    .post('/accept', function (req:Request, res:Response, next:Function) {
        if (!req.isAuthenticated()) {
            next();
        }

        Controller.Team.acceptInvite(req.body.name, req.user)
            .then(function (url:string) {
                res.redirect(url);
            })
            .catch(function () {
                next();
            });

    })
    .post('/signup', function (req:Request, res:Response, next:Function) {
        if (!req.isAuthenticated() || !Controller.Team.canAdministrate(req.user)
            || req.body.tournament !== 'season_one') {
            return next();
        }

        Controller.Team.findTeam(req.user.team.name).then(function (team?:ITeam) {
            if (!team) {
                return next();
            }

            if (team.roster.length < 5) {
                return next();
            }

            if (team.signedUp.indexOf(req.body.tournament) !== -1) {
                return next();
            }

            team.signedUp.push(req.body.tournament);
            team.save(function () {
                log.info(`${req.user.name} signed up ${team.name} for ${req.body.tournament}`);
                return res.redirect(req.header('Referer') || `/team/${team.normalizedName}`);
            });

        });
    })
    .post('/kick', function (req:Request, res:Response, next:Function) {
        if (!req.isAuthenticated() || !Controller.Team.canAdministrate(req.user) || !req.body.name) {
            return next();
        }

        Controller.Team.findTeam(req.user.team).then(function (team:ITeam) {
            let isCaptain = false,
                index = -1;
            for (let i = 0; i < team.roster.length; i++) {
                let member:ITeamMember = team.roster[i];
                if (member._id.equals(req.user._id)) {
                    isCaptain = true;
                }
                if (member.name.toLowerCase() === req.body.name.toLowerCase()) {
                    index = i;
                }
            }

            if (isCaptain === false) {
                return next();
            }

            if (index < 0) {
                return next();
            }

            if (team.roster[index].name === req.user.name) {
                return res.json(false);
            }

            team.roster.splice(index, 1);
            team.save(function (err:any) {
                res.json(!err);
            });

        });


    })
    .post('/change-role', function (req:Request, res:Response) {
        if (!req.isAuthenticated() || !Controller.Team.canAdministrate(req.user)) {
            return res.json(false);
        }
        if (typeof req.body.uid !== 'string' || typeof req.body.role !== 'string') {
            return res.json(false);
        }

        if (Controller.Team.roles.hasOwnProperty(req.body.role) === false) {
            return res.json(false);
        }

        let queries = {
            team: req.user.getTeam(),
            user: Controller.User.findOneById(req.body.uid)
        };

        Promise.props(queries).then(function (result:{team:ITeam, user:IUser}) {
            if (!result.team || !result.user) {
                res.json(false);
            }

            let member:ITeamMember = null;
            for (let i = 0; i < result.team.roster.length; i++) {
                if (result.team.roster[i]._id.equals(req.body.uid)) {
                    member = result.team.roster[i];
                    break;
                }
            }
            if (member === null) {
                return res.json(false);
            }

            result.user.team.role = req.body.role;
            member.role = req.body.role;

            let queries = [result.team.save(), result.user.save()];
            Promise.all(queries).then(function () {
                let opts = {
                        info: `Your role is now ${result.user.team.role}`
                    },
                    notType = Controller.Notification.types.teamRoleChanged;
                Controller.Notification.newNotification(result.user, notType, opts);
                log.debug(`${req.user.name} changed team-role of ${result.user.name} to ${result.user.team.role}`);
                return res.json(true);
            });

        });
    })
    .post('/kick', function (req:Request, res:Response) {
        if (!req.isAuthenticated() || !Controller.Team.canAdministrate(req.user)) {
            return res.json(false);
        }
        if (typeof req.body.uid !== 'string') {
            return res.json(false);
        }

        let queries = {user: Controller.User.findOneById(req.body.uid), team: req.user.getTeam()};

        Promise.props(queries).then(function (result:{team:ITeam, user:IUser}) {
            if (!result.team || !result.user) {
                return res.json(false);
            }
            let member:ITeamMember = null,
                index = -1;
            for (let i = 0; i < result.team.roster.length; i++) {
                if (result.team.roster[i]._id.equals(result.user._id)) {
                    member = result.team.roster[i];
                    index = i;
                    break;
                }
            }

            if (!member || member.role === Controller.Team.roles.captain) {
                return res.json(false);
            }

            result.team.roster.splice(index, 1);
            result.user.team._id = undefined;
            result.user.team.name = undefined;

            let queries = [result.team.save(), result.user.save()];
            Promise.all(queries).then(function () {
                let notType = Controller.Notification.types.kickedFromTeam,
                    notOpts = {info: `${req.user.name} kicked you from ${req.user.team.name}`};
                Controller.Notification.newNotification(result.user, notType, notOpts);
                let actType = Controller.Activity.Type.leftTeam,
                    actOpts = {
                        url: `/team/${result.team._id}`,
                        info: [`${result.user.name} left Team ${result.team.name}`]
                    };
                Controller.Activity.newActivity(result.user, actType, actOpts);
                return res.json(true);
            });
        });
    })
    .post('/promote-to-captain', function (req:Request, res:Response, next:Function) {
        if (!req.isAuthenticated() || !req.user.team._id
            || req.user.team.role !== Controller.Team.roles.captain || !req.body.uid) {
            return next();
        }

        req.user.getTeam().then(function (team:ITeam) {
            if (!team) {
                return next();
            }

            let newCpt:ITeamMember = null,
                oldCpt:ITeamMember = null;
            for (let i = 0; i < team.roster.length; i++) {
                if (team.roster[i]._id.equals(req.body.uid)) {
                    newCpt = team.roster[i];
                }
                if (team.roster[i]._id.equals(req.user._id)) {
                    oldCpt = team.roster[i];
                }
            }
            if (newCpt === null || oldCpt === null) {
                return next();
            }

            let queries = {
                oldCaptainUser: Controller.User.findOneById(oldCpt._id),
                newCaptainUser: Controller.User.findOneById(newCpt._id)
            };

            Promise.props(queries).then(function (result:{oldCaptainUser:IUser, newCaptainUser:IUser}) {
                if (!result.oldCaptainUser || !result.newCaptainUser) {
                    return next();
                }

                oldCpt.role = Controller.Team.roles.member;
                result.oldCaptainUser.team.role = Controller.Team.roles.member;
                newCpt.role = Controller.Team.roles.captain;
                result.newCaptainUser.team.role = Controller.Team.roles.captain;

                let queries = [result.oldCaptainUser.save(), result.newCaptainUser.save(), team.save()];

                Promise.all(queries).then(function () {
                    let opts = {
                            info: `Your are now captain for team ${team.name}`,
                            url: '/manage-team'
                        },
                        notType = Controller.Notification.types.teamRoleChanged;
                    Controller.Notification.newNotification(result.newCaptainUser, notType, opts);
                    log.info(`${result.oldCaptainUser.name} promoted ${result.newCaptainUser.name}` +
                        ` to the team captain of team ${team.name}`);
                    return res.redirect(`/team/${team.id}`);
                });
            });
        });
    });