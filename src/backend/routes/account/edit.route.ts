///<reference path="../../typings/tsd.d.ts"/>
import {IValidPasswordResult} from '../../controller/auth.controller';
'use strict';

import {Router, Request, Response} from 'express';
import model = require('../../model/index');
import log = require('../../log');
import utils = require('../../utils/index');
import Controller = require('../../controller/index');
let activity = require('../../../shared/activityType');
let base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
let isBase64 = function (str:string):boolean {
    return base64Regex.test(str);
};

function hasChanged(a:model.IUser, b:model.IUser) {

    if (a.bio.biography !== b.bio.biography ||
        a.bio.twitch !== b.bio.twitch ||
        a.bio.twitter !== b.bio.twitter ||
        a.bio.youtube !== b.bio.youtube ||
        a.avatar !== b.avatar ||
        a.emailNotifications !== b.emailNotifications) {
        // a.name !== b.name ||
        // a.email !== b.email ||
        return true;
    }

    return false;
}

export = Router({mergeParams: true})
    .get('/', function (req:Request, res:Response, next:any) {
        if (!req.isAuthenticated()) {
            return res.redirect('/');
        }
        let user:model.IUser = req.user;
        res.render('account/edit', {
            data: {
                bio: user.bio,
                username: user.name,
                mail: user.email,
                emailNotifications: user.emailNotifications
            },
            dependencies: {js: ['account/edit']},
        });
    })
    .post('/', function (req:Request, res:Response, next:any) {

        if (!req.isAuthenticated()) {
            return next();
        }

        let error:string = undefined;
        model.User.findOne({_id: req.user._id}).exec().then(function (user:model.IUser) {
            let original = JSON.parse(JSON.stringify(user));

            function getActivity(oldUser:model.IUser, newUser:model.IUser) {
                let info:string[] = [];

                if (oldUser.avatar !== newUser.avatar) {
                    info.push('Updated Avatar');
                }
                if (oldUser.bio) {
                    if (oldUser.bio.twitter !== newUser.bio.twitter) {
                        info.push('Updated Twitter Account');
                    }
                    if (oldUser.bio.twitch !== newUser.bio.twitch) {
                        info.push('Updated Twitch Account');
                    }
                    if (oldUser.bio.youtube !== newUser.bio.youtube) {
                        info.push('Updated YouTube Account');
                    }
                    if (oldUser.bio.biography !== newUser.bio.biography) {
                        info.push('Updated Biography');
                    }
                } else {
                    if (newUser.bio.twitter) {
                        info.push('Added Twitter Account');
                    }
                    if (newUser.bio.twitch) {
                        info.push('Added Twitch Account');
                    }
                    if (newUser.bio.youtube) {
                        info.push('Added YouTube Account');
                    }
                    if (newUser.bio.biography) {
                        info.push('Added Biography');
                    }
                }

                return new model.Activity({
                    _user: req.user._id,
                    url: '/account/' + req.user.name,
                    info: info,
                    type: activity.type.profileUpdated
                });
            }

            function save(err?:string) {
                if (err) {
                    return res.render('account/edit', {
                        data: {
                            bio: user.bio,
                            username: user.name,
                            mail: user.email,
                            updated: false,
                            emailNotifications: user.emailNotifications,
                            error: err
                        },
                        dependencies: {js: ['account/edit']}
                    });
                }

                model.Deck.find({_author: req.user._id}).exec().then(function (decks:model.IDeck[]) {
                    for (let i = 0; i < decks.length; i++) {
                        utils.cache.del('deck_' + decks[i].normalizedChampion + '_' + decks[i].deckid);
                    }
                });

                if (hasChanged(original, user)) {
                    getActivity(original, user).save();
                    user.save(function () {
                        res.render('account/edit', {
                            data: {
                                bio: user.bio,
                                username: user.name,
                                mail: user.email,
                                emailNotifications: user.emailNotifications,
                                updated: true,
                                error: error
                            },
                            dependencies: {js: ['account/edit']}
                        });
                    });
                } else {
                    res.render('account/edit', {
                        data: {
                            bio: user.bio,
                            username: user.name,
                            mail: user.email,
                            updated: false,
                            error: error
                        },
                        dependencies: {js: ['account/edit']}
                    });
                }
            }

            log.trace('User Profile changed', {
                ip: req.ip,
                name: user.name,
                mail: user.email
            });
            if (req.body.avatar.length > 0) {
                let avatar = req.body.avatar.replace('data:image/png;base64,', '');
                if (!isBase64(avatar)) {
                    log.warn('Seems like on wants to upload an Avatar which is actually not bas64 encoded', {
                        ip: req.ip,
                        headers: req.headers,
                        username: req.user.name,
                        mail: req.user.email
                    });
                    res.status(406);
                    return save('Seems like your avatar is not an image');
                }
                if (avatar.length > 500000) {
                    return save('Avatar is too large!');
                }
                user.avatar = avatar;
            }

            // todo: care, sanitize
            user.bio.twitter = req.body.twitter.trim();
            user.bio.twitch = req.body.twitch.trim();
            user.bio.youtube = req.body.youtube.trim();
            user.bio.biography = req.body.biography.trim();

            if (req.body.email_notifications) {
                user.emailNotifications = req.body.email_notifications === 'true';
            }

            if (req.body.current_password && req.body.new_password) {
                req.user.authenticate(req.body.current_password, function (err:any, self:any, wrongPassword:any) {
                    if (err) {
                        error = 'Something went wrong, try it again later';
                        return save(error);
                    }
                    if (wrongPassword) {
                        error = wrongPassword.message;
                        return save(error);
                    }
                    let isValidPassword:IValidPasswordResult = Controller.Auth.isValidPassword(req.body.new_password);
                    if (isValidPassword.result === false) {
                        return save(isValidPassword.msg);
                    }
                    (<any>user).setPassword(req.body.new_password, function (err:any, self:any, passErr:any) {
                        // todo: send mail: "Yo, pw changed brudi"... ?
                        if (err || passErr) {
                            error = 'Could not update your password';
                        }
                        return save(error);
                    });
                });
            } else {
                return save();
            }
        });
    });