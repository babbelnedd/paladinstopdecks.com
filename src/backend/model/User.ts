///<reference path="../typings/tsd.d.ts"/>
'use strict';

import {ITeamMember} from './Team';
import {Schema, Document} from 'mongoose';
import mongoose = require('mongoose');
import IDatabaseObject = require('../db/IDatabaseObject');
import plugin = require('../db/plugins/index');
import Types = require('../db/Types');
import Controller = require('../controller/index');
let passportLocalPlugin = require('passport-local-mongoose');

interface IUserBio {
    twitter: string;
    youtube: string;
    twitch: string;
    biography: string;
}

interface IUserPermissions {
    articles: {
        canPublish: boolean;
        canCreate: boolean;
        canEdit: boolean;
    };
}

export interface IUser extends IDatabaseObject, Document {
    name: string;
    email: string;
    emailNotifications: boolean;
    activationCode?: string;
    activated: boolean;
    avatar: string;
    twitch?: {
        access_token: string;
        refresh_token: string;
        scope: string[];
        channel: string;
    };
    bio: IUserBio;
    team?: ITeamMember;
    admin: boolean;
    permissions: IUserPermissions;
}

let schema:Schema = new Schema({
    name: Types.requiredString,
    email: Types.requiredString,
    emailNotifications: {
        type: Boolean,
        required: true,
        'default': true
    },
    avatar: Types.optionalString,
    bio: {
        twitter: {
            required: false,
            type: String,
            'default': ''
        },
        youtube: {
            required: false,
            type: String,
            'default': ''
        },
        twitch: {
            required: false,
            type: String,
            'default': ''
        },
        biography: {
            required: false,
            type: String,
            'default': ''
        }
    },
    activationCode: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        'default': function () {
            return new mongoose.Types.ObjectId();
        }
    },
    activated: {
        type: Boolean,
        required: true,
        'default': false
    },
    twitch: {
        access_token: Types.optionalString,
        refresh_token: Types.optionalString,
        scope: [Types.optionalString],
        channel: Types.optionalString
    },
    team: {
        _id: Types.optionalObjectID('Team'),
        name: Types.optionalString,
        role: Types.optionalString
    },
    admin: {
        required: true,
        type: Boolean,
        'default': false
    },
    permissions: {
        required: false,
        type: Schema.Types.Mixed,
        'default': {
            articles: {
                canPublish: false,
                canEdit: false,
                canCreate: false
            }
        }
    }
});

schema.virtual('avatarURL').get(function () {
    return `data:image/png;base64,${this.avatar}`;
});
schema.methods.getTeam = function () {
    return Controller.Team.findTeam(this.team._id);
};
schema.plugin(plugin.timestamp);
schema.plugin(plugin.toJSON);
schema.plugin(passportLocalPlugin, {
    salten: 32,
    iterations: 25000,
    keylen: 512,
    interval: 1000, // specifies the interval in milliseconds between login attempts. Default: 100
    usernameField: 'name',
    usernameUnique: true,
    saltField: 'salt',
    hashField: 'hash',
    attemptsField: 'attempts',
    lastLoginField: 'lastLogin',
    usernameLowerCase: true,
    populateFields: undefined,
    encoding: 'hex',
    usernameQueryFields: ['name', 'email'],
    // limitAttempts: true,
    // maxAttempts: 100,
    errorMessages: {
        MissingPasswordError: 'No password was given',
        AttemptTooSoonError: 'Account is currently locked. Try again later',
        TooManyAttemptsError: 'Account locked due to too many failed login attempts',
        NoSaltValueStoredError: 'Authentication not possible. No salt value stored',
        IncorrectPasswordError: 'Password or username is incorrect',
        IncorrectUsernameError: 'Password or username is incorrect',
        MissingUsernameError: 'No username was given',
        UserExistsError: 'A user with the given username is already registered',
    }
});

export let model = mongoose.model<IUser>('User', schema);