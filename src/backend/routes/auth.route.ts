///<reference path="../typings/tsd.d.ts"/>
'use strict';

import {IValidPasswordResult} from '../controller/auth.controller';
import express = require('express');
import Passport = require('../paladinsPassport');
import Mail = require('../Mail');
import log = require('../log');
import mongoose = require('mongoose');
import model = require('../model/index');
import Controller = require('../controller/index');
// let request = require('request-promise');
let activity = require('../../shared/activityType');
let ga = require('../ga');

let router = express.Router();
let passport = Passport.passport;

router.get('/login', function (req:express.Request, res:express.Response) {
        let previous = req.header('Referer') || '/';
        if (req.isAuthenticated()) {
            return res.redirect(previous);
        }
        res.render('auth/login', {
            layout: 'layout/auth',
            dependencies: {js: ['auth']},
            data: {
                pageTitle: 'Login',
            }
        });
    })
    .post('/login', function (req:any, res:any, next:any) {
        if (typeof req.body.name === 'string') {
            req.body.name = req.body.name.toLowerCase();
        }
        passport.authenticate('local', function (err:any, user:any, info:any) {
            if (err) {
                return next(err);
            }
            if (!user) {
                log.debug('Failed Login Attempt', {msg: info.message, user: req.body.name});
                return res.render('auth/login', {
                    layout: 'layout/auth',
                    dependencies: {js: ['auth']},
                    data: {
                        pageTitle: 'Login',
                        error: info.message
                    },
                });
            }
            req.logIn(user, function (err:any) {
                if (err) {
                    return next(err);
                }
                return res.redirect('/');
            });
        })(req, res, next);
    });

function render(res:express.Response, template:string, title:string, error:any) {
    return res.render(template, {
        layout: 'layout/auth',
        dependencies: {js: ['auth', 'register']},
        data: {
            pageTitle: title,
            error: error
        }
    });
}

router
    .get('/register', function (req:express.Request, res:express.Response) {
        let previous = req.header('Referer') || '/';
        if (req.isAuthenticated()) {
            return res.redirect(previous);
        }
        res.render('auth/register', {
            layout: 'layout/auth',
            dependencies: {js: ['auth', 'register']},
            data: {
                pageTitle: 'Register'
            }
        });
    })
    .post('/register', function (req:express.Request, res:express.Response) {
        let _user:any = {name: req.body.paladins_username.toLowerCase(), email: req.body.paladins_email.toLowerCase()};
        Controller.Auth.usernameExists(_user.name).then(function (result:IValidPasswordResult) {
            if (result.result === false) {
                result = Controller.Auth.isValidPassword(req.body.paladins_password);
            }
            if (result.result === false) {
                return render(res, 'auth/register', 'Register', result.msg);
            } else {
                // require here coz u know... installing canvas in fucking vm is a pita, right..
                let identicon = require('identicon-github');
                _user.avatar = identicon((_user.name + _user.email)).toDataURL().replace('data:image/png;base64,', '');

                let user = new model.User(<model.IUser>_user);

                model.User.register(user, req.body.paladins_password, function (err:{name:string, message:string}) {
                    if (err) {
                        log.warn('Failed to register user', err);
                        return render(res, 'auth/register', 'Register', err.message);
                    }

                    req.login(user, function (err:any) {
                        if (err) {
                            log.warn('failed to login user after registration', err);
                            return render(res, 'auth/register', 'Register', err.message);
                        }

                        if (process.env.NODE_ENV === 'production') {
                            ga(req.isAuthenticated() ? req.user._id : undefined, req.connection.remoteAddress).event({
                                ec: 'Authentication',
                                ea: 'Successful Registration'
                            }).send();
                        }
                        let logObj = {name: _user.name, email: _user.email, ip: req.ip};
                        log.info('New user registered!', logObj);
                        let mailConfig = {
                            url: `http://paladinstopdecks.com/auth/activate/${user.id}/${user.activationCode}`,
                            name: _user.name
                        };
                        Mail.sendTemplate('auth/activation', _user.email, mailConfig);
                        Controller.Activity.newActivity(req.user, activity.type.accountCreated);

                        return res.redirect(`/account/${user.name}/edit`);
                    });
                });
            }
        });
    })
    .get('/activate/:uid/:aid', function (req:express.Request, res:express.Response, next:Function) {
        log.info('User activated', req.params.uid);
        let userFilter = {
            _id: new mongoose.Types.ObjectId(req.params.uid),
            activationCode: new mongoose.Types.ObjectId(req.params.aid),
            activated: false
        };
        model.User.update(userFilter, {activated: true}, function (err:any, numAffected:any, doc:any) {
            if (numAffected.nModified > 0) {
                return res.redirect('/');
            } else {
                next();
            }
        });
    })
    .get('/available/username', function (req:express.Request, res:express.Response) {
        if (!req.query.username) {
            return res.json(false);
        }
        model.User
            .findOne({name: {$regex: new RegExp(req.query.username, 'i')}})
            .exec(function (err, user) {
                res.json(user === null);
            });
    })
    .get('/available/email', function (req:express.Request, res:express.Response) {
        if (!req.query.email) {
            return res.json(false);
        }
        model.User
            .findOne({email: {$regex: new RegExp(req.query.email, 'i')}})
            .exec(function (err, user) {
                res.json(user === null);
            });
    })
    .get('/logout', function (req:any, res:express.Response) {
        log.info('User logged out', {ip: req.ip, uid: req.user._id, name: req.user.name});
        let previous = req.header('Referer') || '/';
        req.logout();
        req.session.destroy(function (err:any) {
            if (err) {
                return log.error('Failed to destroy Session', err);
            }
            res.redirect(previous);
        });
    })
    .get('/forgot', function (req:express.Request, res:express.Response) {

        return res.render('auth/forgot', {
            layout: 'layout/auth',
            dependencies: {js: ['auth']},
            data: {
                pageTitle: 'Reset Password'
            }
        });

    })
    .post('/forgot', function (req:express.Request, res:express.Response) {

        // todo: catch
        let mailConfig = {
            url: '',
            name: ''
        };
        let userFilter = {email: {$regex: new RegExp(req.body.mail, 'i')}};
        log.info('Password reset requested', {
            mail: req.body.mail,
            ip: req.ip
        });
        model.User.findOne(userFilter).exec().then(function (user:model.IUser) {
            function finish() {
                return res.render('auth/forgot', {
                    layout: 'layout/auth',
                    dependencies: {js: ['auth']},
                    data: {
                        pageTitle: 'Mail Sent',
                        mail: req.body.mail
                    },
                });
            }

            if (!user) {
                // no user found, rip
                // but still return valid response
                // todo: tell user he sucks
                return finish();
            }
            mailConfig.name = user.name;
            // add to resetPassword collection
            // scheduled task removes reset which are older than 24hours
            // reset gets removed on use

            function sendMail() {
                Mail.sendTemplate('auth/reset', user.email, mailConfig);
                finish();
            }

            model.ResetUserPassword.findOne({user: user._id}).exec().then(function (reset:model.IResetUserPassword) {
                if (!reset) {
                    let id = {user: user._id};
                    new model.ResetUserPassword(id).save(function (err:any, _reset:model.IResetUserPassword) {
                        if (err) {
                            return finish();
                        }
                        mailConfig.url = `http://paladinstopdecks.com/auth/reset/${user.id}/${_reset.code}`;
                        return sendMail();
                    });
                } else {
                    mailConfig.url = `http://paladinstopdecks.com/auth/reset/${user.id}/${reset.code}`;
                    return sendMail();
                }
            });

        });
    })
    .get('/reset/:uid/:rid', function (req:express.Request, res:express.Response, next:Function) {
        model.ResetUserPassword
            .findOne({user: req.params.uid, code: req.params.rid})
            .lean().exec().then(function (x:model.IResetUserPassword) {
            if (!x) {
                return next();
            } else {
                res.render('auth/reset', {layout: 'layout/auth'});
            }
        });
    })
    .post('/reset/:uid/:rid', function (req:express.Request, res:express.Response) {

        let filter:any = {user: req.params.uid, code: req.params.rid},
            isValidPassword:IValidPasswordResult = Controller.Auth.isValidPassword(req.body.password);

        if (isValidPassword.result === false) {
            return res.render('auth/reset', {layout: 'layout/auth', data: {error: isValidPassword.msg}});
        }

        model.ResetUserPassword.findOne(filter).exec().then(function (reset:model.IResetUserPassword) {
            if (reset) {
                filter = {_id: req.params.uid};
                model.User.findOne(filter).exec().then(function (user:any) {
                    // todo: validate pw
                    user.setPassword(req.body.password, function () {
                        user.save(function () {
                            log.info('User password reseted', {
                                uid: user._id,
                                name: user.name,
                                ip: req.ip
                            });

                            model.ResetUserPassword.remove({user: user._id}).exec().then(function () {
                                log.debug(`ResetUserPassword entry has been deleted for ${user.name}`);
                            });
                            res.redirect('/auth/login');
                            // reset.remove();
                        });
                    });
                });
            } else {
                res.redirect('/auth/login');
            }
        });

    })
    .get('/resend-activation', function (req:express.Request, res:express.Response) {
        if (!req.isAuthenticated() || req.user.activated) {
            res.status(401);
            res.redirect('/');
        }

        let logObj = {name: req.user.name, email: req.user.email, ip: req.ip};
        log.info('New Activation Mail requested!', logObj);
        let mailConfig = {
            url: `http://paladinstopdecks.com/auth/activate/${req.user.id}/${req.user.activationCode}`,
            name: req.user.name
        };
        Mail.sendTemplate('auth/activation', req.user.email, mailConfig, function () {
            return res.render('auth/forgot', {
                layout: 'layout/auth',
                dependencies: {js: ['auth']},
                data: {
                    pageTitle: 'New Activation Mail Sent',
                    mail: (<model.IUser>req.user).email
                },
            });
        });

    });
/*.get('/twitch', function (req:express.Request, res:express.Response, next:Function) {
 if (!req.isAuthenticated()) {
 res.status(401);
 return res.redirect('/auth/register');
 }

 request({
 method: 'POST',
 uri: 'https://api.twitch.tv/kraken/oauth2/token',
 body: {
 client_id: 'kza7jkb90h6fu09m51zfk3a1s6ix8ev',
 client_secret: '4bi77oqai9gm1f8x3yplkb6k1g3n7vu',
 grant_type: 'authorization_code',
 redirect_uri: 'http://win-f0ve38moql6:3000/auth/twitch',
 state: req.query.state,
 code: req.query.code
 },
 json: true
 }).then(function (body:any) {
 request(`https://api.twitch.tv/kraken?oauth_token=${body.access_token}`).then(function (result:any) {
 result = JSON.parse(result);

 req.user.twitch.access_token = body.access_token;
 req.user.twitch.refresh_token = body.refresh_token;
 req.user.twitch.scope = body.scope;
 req.user.twitch.channel = result.token.user_name;
 req.user.save(function () {
 res.redirect(`/account/${req.user.name}/edit`);
 });
 });

 }).catch(function (err:any) {
 next();
 });

 });*/

export = router;