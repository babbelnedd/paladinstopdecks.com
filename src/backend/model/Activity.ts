///<reference path="../typings/mongoose/mongoose.d.ts"/>
'use strict';

import mongoose = require('mongoose');
import IDatabaseObject = require('../db/IDatabaseObject');
import plugin = require('../db/plugins/index');
import Types = require('../db/Types');

export interface IActivity extends IDatabaseObject, mongoose.Document {
    _user: mongoose.Types.ObjectId;
    type: number;
    url?: string;
    info?: string[];
}

let schema:mongoose.Schema = new mongoose.Schema({
    _user: Types.requiredObjectID('User'),
    type: Types.requiredNumber,
    url: Types.optionalString,
    info: [Types.optionalString]
});

schema.plugin(plugin.timestamp);
schema.plugin(plugin.toJSON);

export let model = mongoose.model<IActivity>('Activity', schema);