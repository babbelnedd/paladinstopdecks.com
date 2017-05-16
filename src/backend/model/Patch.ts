///<reference path="../typings/mongoose/mongoose.d.ts"/>
'use strict';

import mongoose = require('mongoose');
import IDatabaseObject = require('../db/IDatabaseObject');
import plugin = require('../db/plugins/index');
import Types = require('../db/Types');


export interface IPatch extends IDatabaseObject, mongoose.Document {
    version: String;
    date: number;
    type: String;
    change: String;
    champion?: String;
    card?: String;
    ability?: String;
}

let schema:mongoose.Schema = new mongoose.Schema({
    version: Types.requiredString,
    date: Types.requiredNumber,
    type: Types.requiredString,
    change: Types.requiredString,
    champion: Types.optionalString,
    card: Types.optionalString,
    ability: Types.optionalString
});

schema.plugin(plugin.timestamp);
schema.plugin(plugin.toJSON);

export let model = mongoose.model<IPatch>('Patch', schema);