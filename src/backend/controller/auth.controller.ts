///<reference path="../typings/node/node.d.ts"/>
'use strict';

import model = require('../model/index');
// import log = require('../log');
// import utils = require('../utils/index');
let Promise = require('bluebird');

export interface IValidPasswordResult {
    result: boolean;
    msg?: string;
}

export interface IValidUsernameResult {
    result: boolean;
    msg?: string;
}

export function isValidPassword(password:string):IValidPasswordResult {

    if (typeof password !== 'string') {
        return {
            result: false,
            msg: 'Apparently something went horribly wrong'
        };
    }

    if (password.length < 6) {
        return {
            result: false,
            msg: 'Passwords have to be at least 6 Characters long'
        };
    }

    if (password.length > 100) {
        return {
            result: false,
            msg: 'A Username has to be at shorter than 100 Characters'
        };
    }

    if (/[^\x00-\x7F]/.test(password)) {
        return {
            result: false,
            msg: 'A Password can only contain alphanumeric symbols A-Z 0-9'
        };
    }

    return {result: true};
}

export function isValidUsername(username:string):IValidUsernameResult {
    if (typeof username !== 'string') {
        return {
            result: false,
            msg: 'Apparently something went horribly wrong'
        };
    }

    if (username.length < 3) {
        return {
            result: false,
            msg: 'A Username has to be at least 3 Characters long'
        };
    }

    if (username.length > 40) {
        return {
            result: false,
            msg: 'A Username has to be at shorter than 40 Characters'
        };
    }

    if (username.indexOf(' ') !== -1) {
        return {
            result: false,
            msg: 'A Username can\'t contain a Space Character'
        };
    }

    if (/[^\x00-\x7F]/.test(username)) {
        return {
            result: false,
            msg: 'A Username can only contain alphanumeric symbols A-Z 0-9'
        };
    }

    return {result: true};
}

export function usernameExists(username:string) {
    return new Promise(function (resolve:any, reject:any) {
        if (!isValidUsername(username)) {
            resolve(false);
        }
        model.User.findOne({name: new RegExp(username, 'i')}).select('name')
            .lean().exec().then(function (user:model.IUser) {
            resolve(!!user);
        });
    });
}