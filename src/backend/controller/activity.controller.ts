///<reference path="../typings/express/express.d.ts"/>
///<reference path="../typings/bluebird/bluebird.d.ts"/>
'use strict';

import model = require('../model/index');
import Promise = require('bluebird');
export let Type = require('../../shared/activityType').type;

export function newActivity(user:model.IUser, type:number, opts?:{url?:string, info?:string[]}) {
    return new Promise(function (resolve:any, reject:any) {
        let activity:any = {
            _user: user._id,
            type: type
        };
        if (opts && opts.url) {
            activity.url = opts.url;
        }
        if (opts && opts.info) {
            activity.info = opts.info;
        }

        new model.Activity(activity).save(function (err:any) {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
}