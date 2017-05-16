///<reference path="../typings/node/node.d.ts"/>
///<reference path="../typings/bluebird/bluebird.d.ts"/>
'use strict';

import model = require('../model/index');
import Promise = require('bluebird');
import utils = require('../utils/index');
import Mail = require('../Mail');
export let types = require('../../shared/notificationType').type;

function getCacheKey(user:model.IUser) {
    return `user_notifications_${user._id}`;
}

export function newNotification(user:model.IUser, type:number, opts?:{url?:string, info?:string}) {
    return new Promise(function (resolve:any, reject:any) {
        let notification:any = {
            _user: user._id,
            type: type
        };
        if (opts && opts.url) {
            notification.url = opts.url;
        }
        if (opts && opts.info) {
            notification.info = opts.info;
        }


        if (process.env.NODE_ENV === 'production') {
            model.User
                .findOne({_id: user._id}).select('emailNotifications email name')
                .lean().exec().then(function (u:model.IUser) {
                if (u && u.emailNotifications === true) {
                    Mail.sendTemplate('notification', u.email, {
                        name: u.name
                    });
                }
            });
        }

        new model.Notification(notification).save(function (err:any, notification:model.INotification) {
            if (err) {
                return reject();
            }
            utils.cache.del(getCacheKey(user)).then(function () {
                return resolve(notification);
            });
        });
    });
}

let getSelect = 'created type url info seen';
function getNotifications(user:model.IUser, limit:number) {
    return new Promise(function (resolve:any, reject:any) {
        function getUnseenNotifications() {
            return model.Notification.find({
                    _user: user._id,
                    seen: false
                })
                .sort({created: -1})
                .select(getSelect)
                .lean()
                .exec();
        }

        function getSeenIfNecessary(unseen:model.INotification[]) {
            return new Promise(function (resolve:any, reject:any) {
                if (unseen.length >= limit) {
                    return resolve(unseen);
                }

                model.Notification.find({
                        _user: user._id,
                        seen: true
                    })
                    .sort({created: -1})
                    .limit(limit - unseen.length)
                    .lean()
                    .exec()
                    .then(function (seen:model.INotification[]) {
                        let all = unseen.concat(seen);
                        return resolve(all);
                    });
            });
        }

        function getCount(notifications:model.INotification[]) {
            return new Promise(function (resolve:any, reject:any) {
                model.Notification.count({_user: user._id}).exec().then(function (count:number) {
                    return resolve({
                        total: count,
                        notifications: notifications
                    });
                });
            });
        }

        getUnseenNotifications()
            .then(getSeenIfNecessary)
            .then(getCount)
            .then(resolve)
            .error(reject);
    });
}

export function getByUser(user:model.IUser, limit:number) {
    let key = getCacheKey(user);
    return new Promise(function (resolve:any, reject:any) {
        utils.cache.get(key).then(function (result:string) {
            if (typeof result === 'string') {
                return resolve(JSON.parse(result));
            } else {
                getNotifications(user, limit).then(function (notifications:any) {
                    utils.cache.set(key, notifications);
                    return resolve(notifications);
                });
            }
        });
    });
}

export function seen(user:model.IUser, id:any) {
    return new Promise(function (resolve:any, reject:any) {
        model.Notification
            .findOne({_user: user._id, _id: id, seen: false})
            .exec()
            .then(function (notification:model.INotification) {
                if (!notification) {
                    return reject();
                }
                notification.seen = true;
                notification.save(function (err:any) {
                    if (err) {
                        return reject(err);
                    }
                    utils.cache.del(getCacheKey(user)).then(resolve);
                });
            });
    });
}