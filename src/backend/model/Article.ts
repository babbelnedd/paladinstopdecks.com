///<reference path="../typings/mongoose/mongoose.d.ts"/>
'use strict';

import mongoose = require('mongoose');
import IDatabaseObject = require('../db/IDatabaseObject');
import plugin = require('../db/plugins/index');
import Types = require('../db/Types');

export interface IArticle extends IDatabaseObject, mongoose.Document {
    title: string;
    slug: string;
    preview: string;
    author?: string;
    date: Number;
    logo?: string;
    content: string;
    comments: Boolean;
    visible: boolean;
    meta: {
        title: string;
        description: string;
        other: [{name:string, content: string}]
    };
}

let schema:mongoose.Schema = new mongoose.Schema({
    title: Types.requiredString,
    slug: Types.requiredString,
    preview: Types.requiredString,
    author: Types.optionalString,
    date: Types.requiredNumber,
    logo: Types.optionalString,
    content: Types.requiredString,
    comments: {
        type: Boolean,
        'default': true
    },
    meta: {
        title: Types.optionalString,
        description: Types.optionalString,
        other: [{name: Types.optionalString, content: Types.optionalString}]
    },
    visible: {
        required: false,
        'default': false,
        type: Boolean
    }
});


schema.plugin(plugin.timestamp);

export let model = mongoose.model<IArticle>('Article', schema);