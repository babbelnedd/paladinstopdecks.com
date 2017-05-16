///<reference path="../typings/tsd.d.ts"/>
'use strict';
import {normalize} from '../utils/index';
import {ITeam, IUser} from '../model/index';
import {ITeamMember} from '../model/Team';
import {Types} from 'mongoose';
import Model = require('../model/index');
import Controller = require('../controller/index');
import log = require('../log');

let checkForHexRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;

interface IGetAllTeamsOpts {
    lean?: Boolean;
    select?: String;
}

export let roles = {
    captain: 'captain',
    member: 'member',
    sub: 'sub',
    pending: 'pending',
    management: 'management'
};

export function getAllTeams(opts?:IGetAllTeamsOpts) {
    opts = opts || {};
    let query = Model.Team.find({});

    if (opts.select) {
        query.select(opts.select);
    }

    if (opts.lean === true) {
        query.lean();
    }

    return query.exec();
}

/**
 * Creates a new Team.
 * The passed captain will be registered to the team
 * @param {IUser} captain - User Object of the Team Captain
 * @param {string} name - Team Name. Min 4 Characters, Max 25 Characters
 * @return {Promise}
 * @throws {Error} - Name does not meet the requirements.
 * @throws {Error} - User is already in a Team.
 */
export function newTeam(captain:IUser, name:string) {
    return new Promise(function (resolve:any, reject:any) {
        if (typeof name !== 'string' || name.length < 4 || name.length > 25) {
            throw new Error('Name does not meet the Requirements. (string, >3 && < 26)');
        }

        if (captain.team._id) {
            throw new Error('User is already in a Team');
        }

        Model.Team.create({
            name: name,
            normalizedName: normalize(name),
            roster: [{
                _id: captain._id,
                name: captain.name,
                role: roles.captain
            }]
        }).then(function (team:ITeam) {
            log.debug(`${captain.name} created Team ${name}`);

            captain.team._id = team._id;
            captain.team.name = team.name;
            captain.team.role = roles.captain;
            captain.save(function () {
                resolve(team);
            });
        });
    });
}

export function findTeam(nameOrId:string) {
    let filter:any = [];

    if (checkForHexRegExp.test(nameOrId)) {
        filter.push({
            _id: new Types.ObjectId(nameOrId)
        });
    } else {
        filter.push({name: nameOrId});
        filter.push({normalizedName: nameOrId});
    }

    return Model.Team.findOne({$or: filter}).exec();
}

export function findTeamWithUserProfiles(name:string) {
    return new Promise(function (resolve:any, reject:any) {
        findTeam(name).then(function (team:ITeam) {
            if (team === null) {
                return reject();
            }
            Model.User.find({_id: {$in: team.roster}})
                .select('_id created updated name lastLogin bio avatar team')
                .lean().exec()
                .then(function (users:IUser[]) {
                    // todo: dis is buggy
                    // wenn ich jemanden einlade der schon in einem team ist, dann wird hier die falsche rolle angezeigt
                    // wenn ich jemanden einlade, der in keinem team ist, wird keine rolle angezeigt
                    let result:any = JSON.parse(JSON.stringify(team));
                    result.roster = JSON.parse(JSON.stringify(users));
                    resolve(result);
                });
        });
    });
}

export function invite(inviter:IUser, user:IUser) {
    return new Promise(function (resolve:any, reject:any) {

        if (user.team._id || user.team.name) {
            return reject({err: 'Invited User is already in a team'});
        }

        if (!canAdministrate(inviter)) {
            return reject({err: 'Inviter is not captain'});
        }

        findTeam(inviter.team.name).then(function (team:ITeam) {
            if (!team) {
                return reject({err: 'Not a team'});
            }

            // check user is not in roster
            for (let i = 0; i < team.roster.length; i++) {
                if (team.roster[i]._id.equals(user._id)) {
                    return reject();
                }
            }
            // check user is not already invited
            for (let i = 0; i < team.invited.length; i++) {
                if (team.invited[i]._id.equals(user._id)) {
                    return reject();
                }
            }

            team.invited.push({
                _id: user._id,
                name: user.name
            });
            team.save(function () {
                log.debug(`${inviter.name} invites ${user.name} to join Team ${inviter.team.name}`);

                let msg = `${inviter.name} invited you to join Team ${inviter.team.name}`;
                let opts = {info: msg, url: `/team/${inviter.team.name}`};
                Controller.Notification.newNotification(user, Controller.Notification.types.invitedToTeam, opts);
                resolve();
            });
        });
    });
}

export function acceptInvite(team:string, user:IUser) {
    log.debug(`${user.name} accepts the team invite from ${team}`);
    return new Promise(function (resolve:any, reject:any) {
        Controller.Team.findTeam(team).then(function (team:ITeam) {
            if (!team) {
                return reject('Team does not exist');
            }

            let captain:ITeamMember = null;
            let isInvited = false;
            for (let i = 0; i < team.roster.length; i++) {
                if (team.roster[i].role === Controller.Team.roles.captain) {
                    captain = team.roster[i];
                }
            }

            for (let i = 0; i < team.invited.length; i++) {
                if (team.invited[i]._id.equals(user._id)) {
                    team.invited.splice(i, 1);
                    isInvited = true;
                }
            }

            if (isInvited) {
                team.roster.push({
                    _id: user._id,
                    name: user.name,
                    role: Controller.Team.roles.member
                });
                team.save(function () {
                    user.team._id = team._id;
                    user.team.name = team.name;
                    user.team.role = Controller.Team.roles.member;
                    user.save(function () {
                        // todo: add activity to user
                        let opts = {url: `/team/${team._id}`, info: [`${user.name} joined Team ${team.name}`]};
                        Controller.Activity.newActivity(user, Controller.Activity.Type.joinedTeam, opts);
                        // todo: notify captain
                        if (captain !== null) {
                            Controller.User.findOne(captain.name).then(function (capt:IUser) {
                                let opts = {
                                    url: `/team/${team._id}`,
                                    info: `${user.name} joined your Team`
                                };
                                Controller.Notification
                                    .newNotification(capt, Controller.Notification.types.memberJoinedTeam, opts);
                            });
                        }
                        resolve(`/team/${team._id}`);
                    });
                });
            } else {
                reject('You are not invited');
            }

        });
    });
}

export function canAdministrate(user:IUser) {
    return !!user.team._id &&
        (user.team.role === Controller.Team.roles.captain || user.team.role === Controller.Team.roles.management);
}