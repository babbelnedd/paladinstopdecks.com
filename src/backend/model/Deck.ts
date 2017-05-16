///<reference path="../typings/mongoose/mongoose.d.ts"/>
'use strict';

import mongoose = require('mongoose');
import IDatabaseObject = require('../db/IDatabaseObject');
import plugin = require('../db/plugins/index');
import Types = require('../db/Types');
import Settings = require('../../settings');

export interface IDeck extends IDatabaseObject, mongoose.Document {
    deckid: number;
    _author: mongoose.Types.ObjectId;
    author: string;
    cards: mongoose.Types.ObjectId[];
    champion: string;
    _champion: mongoose.Types.ObjectId;
    // path: string;
    normalizedName: string;
    normalizedChampion: string;
    name: string;
    description?: string;
    editPath: string;
    fullPath: string;
    rating: number;
    patch: string;
    views: number;
    levels: [number[]];
    curve: any;
    visibility: string;
    substitutions: [{orig: mongoose.Types.ObjectId, sub: mongoose.Types.ObjectId, text?: string}];
}

let schema:mongoose.Schema = new mongoose.Schema({
    deckid: Types.requiredNumber,
    cards: [Types.requiredObjectID('Card')],
    _champion: Types.requiredObjectID('Champion'),
    _author: Types.requiredObjectID('User'),
    author: Types.requiredString,
    // type: Types.requiredString,
    visibility: Types.requiredString,
    name: Types.requiredString,
    normalizedChampion: Types.requiredString,
    normalizedName: Types.requiredString,
    description: Types.optionalString,
    rating: {
        required: false,
        type: Number,
        'default': function () {
            return 0;
        }
    },
    patch: {
        type: String,
        required: false,
        'default': function () {
            return Settings.patch;
        }
    },
    substitutions: [{
        orig: Types.requiredObjectID('Card'),
        sub: Types.requiredObjectID('Card'),
        text: Types.optionalString
    }],
    levels: {
        required: false,
        type: Array,
        'default': [[], [], [], [], []]
    }
});

schema.virtual('fullPath').get(function () {
    return `/decks/${this.normalizedChampion}/${this.deckid}-${this.normalizedName}`;
});
schema.virtual('editPath').get(function () {
    return `/deckbuilder/update/${this._id}`;
});

schema.plugin(plugin.timestamp, {autoUpdate: false});
schema.plugin(plugin.toJSON);
schema.plugin(plugin.viewCounter);

export let model = mongoose.model<IDeck>('Deck', schema);