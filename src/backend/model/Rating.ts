///<reference path="../typings/mongoose/mongoose.d.ts"/>
'use strict';

import mongoose = require('mongoose');
import IDatabaseObject = require('../db/IDatabaseObject');
import plugin = require('../db/plugins/index');
import Types = require('../db/Types');

export interface IRating extends IDatabaseObject, mongoose.Document {
    _user: mongoose.Types.ObjectId;
    _deck: mongoose.Types.ObjectId;
    vote: number;
}

let schema:mongoose.Schema = new mongoose.Schema({
    _user: Types.requiredObjectID('User'),
    _deck: Types.requiredObjectID('Deck'),
    vote: Types.requiredNumber
});


schema.plugin(plugin.timestamp);

export let model = mongoose.model<IRating>('Rating', schema);