///<reference path="../typings/mongoose/mongoose.d.ts"/>
'use strict';

import mongoose = require('mongoose');
import IDatabaseObject = require('../db/IDatabaseObject');
import Types = require('../db/Types');

export interface IUpload extends IDatabaseObject, mongoose.Document {
    hash: string;
    url: string;
    user: mongoose.Types.ObjectId;
}

let schema:mongoose.Schema = new mongoose.Schema({
    hash: {
        required: true,
        type: String,
        index: true
    },
    url: {
        required: true,
        type: String,
        index: false
    },
    user: Types.requiredObjectID('User')
});

export let model = mongoose.model<IUpload>('Upload', schema);