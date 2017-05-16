///<reference path="../typings/mongoose/mongoose.d.ts"/>
'use strict';

import mongoose = require('mongoose');
import IDatabaseObject = require('../db/IDatabaseObject');
import plugin = require('../db/plugins/index');
import Types = require('../db/Types');


export interface IResetUserPassword extends IDatabaseObject, mongoose.Document {
    user: string;
    code: string;
}

let schema:mongoose.Schema = new mongoose.Schema({
    user: Types.requiredObjectID('User'),
    code: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        'default': function () {
            return new mongoose.Types.ObjectId();
        }
    }
});

schema.plugin(plugin.timestamp);
schema.plugin(plugin.toJSON);

export let model = mongoose.model<IResetUserPassword>('ResetUserPassword', schema);