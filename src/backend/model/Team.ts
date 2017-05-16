///<reference path="../typings/tsd.d.ts"/>
'use strict';

import {Document, Schema, Types} from 'mongoose';
import mongoose = require('mongoose');
import IDatabaseObject = require('../db/IDatabaseObject');
import plugin = require('../db/plugins/index');
import types = require('../db/Types');

export interface ITeamMember {
    _id: Types.ObjectId;
    name: string;
    role: string;
}

export interface ITeam extends IDatabaseObject, Document {
    name: string;
    normalizedName: string;
    tag?: string;
    biography: string;
    roster: [ITeamMember];
    invited: [{
        _id: Types.ObjectId;
        name: string;
    }];
    images: {
        logo?: string;
        banner?: string;
    };
    social: {
        website?: string;
        twitter?: string;
        youtube?: string;
        twitch?: string;
    };
    region: string;
    signedUp: string[];
}

let schema:Schema = new mongoose.Schema({
    name: types.requiredString,
    normalizedName: types.requiredString,
    tag: types.optionalString,
    biography: types.optionalString,
    roster: [{
        _id: types.requiredObjectID('User'),
        name: types.requiredString,
        role: types.requiredString
    }],
    invited: [{
        _id: types.requiredObjectID('User'),
        name: types.requiredString,
        'default': []
    }],
    images: {
        logo: types.optionalString,
        banner: types.optionalString
    },
    social: {
        website: types.optionalString,
        twitter: types.optionalString,
        youtube: types.optionalString,
        twitch: types.optionalString,
    },
    region: {
        required: false,
        type: String,
        'default': 'NA'
    },
    signedUp: [{
        required: false,
        type: String,
        'default': []
    }]
});

schema.plugin(plugin.timestamp);
schema.plugin(plugin.toJSON);

export let model = mongoose.model<ITeam>('Team', schema);