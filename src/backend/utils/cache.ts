///<reference path="../typings/express/express.d.ts"/>
///<reference path="../typings/bluebird/bluebird.d.ts"/>

'use strict';

import log = require('../log');
import Promise = require('bluebird');
let redis = require('../db/redis');

function set(key:string, obj:any) {
    log.debug('Set Redis Key', {key: key});
    if (typeof obj !== 'string') {
        obj = JSON.stringify(obj);
    }
    return redis.set(key, obj);
}

function expires(key:string, sec:number) {
    log.debug('Set expiration for Redis Key', {key: key, expires: sec});
    return redis.expire(key, sec);
}

function del(key:string) {
    log.debug('Delete Redis Key', {key: key});
    return redis.del(key);
}

export = {
    get: function (key:string) {
        return redis.get(key);
    },
    set: function (key:string, obj:any) {
        return set(key, obj);
    },
    thenSet: function (key:string) {
        return function (obj:any) {
            return set(key, obj);
        };
    },
    expires: function (key:string, sec:number) {
        return expires(key, sec);
    },
    thenExpires: function (key:string, sec:number) {
        return function () {
            return expires(key, sec);
        };
    },
    del: function (keys:any) {
        if (typeof keys === 'string') {
            keys = [keys];
        }
        let dels:any[] = [];
        for (let i = 0; i < keys.length; i++) {
            dels.push(del(keys[i]));
        }
        return Promise.all(dels);
    },
    delByPattern: function (pattern:string) {
        return new Promise(function (resolve:any) {
            redis.keys(pattern).then(function (keys:string[]) {
                for (let i = 0; i < keys.length; i++) {
                    del(keys[i]);
                }
                resolve();
            });
        });

    },
    buildKey: function (type:string) {

    }
}