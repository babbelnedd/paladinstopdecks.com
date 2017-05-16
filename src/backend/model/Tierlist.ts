///<reference path='../typings/tsd.d.ts'/>
'use strict';

import mongoose = require('mongoose');
import IDatabaseObject = require('../db/IDatabaseObject');
import plugin = require('../db/plugins/index');
import Types = require('../db/Types');
let shortid = require('shortid');

export interface ITierlist extends IDatabaseObject, mongoose.Document {
    _user: mongoose.Types.ObjectId;
    title: string;
    queue: number;
    description?: string;
    patch: string;
    SS: [string];
    S: [string];
    A: [string];
    B: [string];
    C: [string];
}

let schema:mongoose.Schema = new mongoose.Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    _user: Types.requiredObjectID('User'),
    title: Types.requiredString,
    queue: Types.requiredNumber,
    description: Types.optionalString,
    patch: Types.requiredString,
    SS: {type: [String], 'default': []},
    S: {type: [String], 'default': []},
    A: {type: [String], 'default': []},
    B: {type: [String], 'default': []},
    C: {type: [String], 'default': []}
});

schema.plugin(plugin.timestamp);
schema.plugin(plugin.toJSON);

export let model = mongoose.model<ITierlist>('Tierlist', schema);