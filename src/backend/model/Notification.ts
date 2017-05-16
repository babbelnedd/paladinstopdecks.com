///<reference path="../typings/node/node.d.ts"/>
///<reference path="../typings/mongoose/mongoose.d.ts"/>
'use strict';

import mongoose = require('mongoose');
import IDatabaseObject = require('../db/IDatabaseObject');
import plugin = require('../db/plugins/index');
import Types = require('../db/Types');

export interface INotification extends IDatabaseObject, mongoose.Document {
    _user: mongoose.Types.ObjectId;
    type: number;
    url?: string;
    info?: string;
    seen?: boolean;
}

let schema:mongoose.Schema = new mongoose.Schema({
    _user: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    type: Types.requiredNumber,
    url: Types.optionalString,
    info: Types.optionalString,
    seen: {
        type: Boolean,
        required: false,
        'default': function () {
            return false;
        }
    }
});

schema.plugin(plugin.timestamp);
schema.plugin(plugin.toJSON);

export let model = mongoose.model<INotification>('Notification', schema);