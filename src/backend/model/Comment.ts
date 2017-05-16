///<reference path="../typings/mongoose/mongoose.d.ts"/>
'use strict';

import mongoose = require('mongoose');
import IDatabaseObject = require('../db/IDatabaseObject');
import plugin = require('../db/plugins/index');
import Types = require('../db/Types');


export interface IComment extends IDatabaseObject, mongoose.Document {
    author: {
        id: mongoose.Types.ObjectId;
        name: string;
    };
    slug: string; // ==deckid; in case I'm going to add comments somewhere else we'll just call it slug
    text: string;
    rating?: number; // or should I store up/down votes and just calc them for frontend.. hmm
    mentions: string[]; // do I need this?
    origin?: mongoose.Types.ObjectId;
    type: string;
    findBySlug(slug:string): void;
}

let originDefault = function ():any {
    return null;
};
let schema:mongoose.Schema = new mongoose.Schema({
    author: {
        id: Types.requiredObjectID('User'),
        name: Types.requiredString
    },
    slug: Types.requiredString,
    text: Types.requiredString,
    type: Types.requiredString,
    rating: {
        type: Number,
        required: false,
        'default': function () {
            return 0;
        }
    },
    mentions: [Types.optionalString],
    origin: Types.optionalObjectID('Comment', originDefault)
});

schema.plugin(plugin.timestamp);
schema.plugin(plugin.toJSON);
let select = 'created text origin mentions rating author.name';
schema.statics.findBySlug = function (slug:string) {
    return this.find({slug: slug}).select(select).lean().exec();
};

export let model = mongoose.model<IComment>('Comment', schema);