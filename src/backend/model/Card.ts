///<reference path="../typings/mongoose/mongoose.d.ts"/>
'use strict';

import mongoose = require('mongoose');
import IDatabaseObject = require('../db/IDatabaseObject');
import Enum = require('../enum/index');
import plugin = require('../db/plugins/index');
import Types = require('../db/Types');

export interface ICard extends IDatabaseObject, mongoose.Document {
    name: string;
    normalizedName: string;
    description: string;
    _champion?: typeof mongoose.Schema.Types.ObjectId;
    champion?: string;
    normalizedChampion?: string;
    type: typeof Enum.CardType;
    tier: typeof Enum.CardTier; // alias rarity
    ability?: string;
    cooldown: number;
    damage: number;
    hp: number;
    isRemoved: boolean;
    imagePath: string;
    rankText: string;
}

let schema:mongoose.Schema = new mongoose.Schema({
    _champion: Types.optionalObjectID('Champion'),
    name: Types.requiredString,
    normalizedName: Types.requiredString,
    champion: Types.optionalString,
    normalizedChampion: Types.optionalString,
    isRemoved: Types.requiredBoolean,
    type: {
        type: typeof Enum.CardType,
        required: false
    },
    tier: {
        type: typeof Enum.CardTier,
        required: true
    },
    description: Types.requiredString,
    ability: Types.optionalString,
    cooldown: Types.requiredNumber,
    damage: Types.requiredNumber,
    hp: Types.requiredNumber,
    url: {
        required: false,
        type: String
        // select: false
    },
    rankText: {
        type: String,
        required: false,
        'default': ''
    }
});

function buildImagePath(card:ICard) {
    if (!card.normalizedChampion || card.normalizedChampion === '') {
        return `/static/img/cards/neutral/${card.normalizedName}.jpg`;
    } else {
        return `/static/img/cards/${card.normalizedChampion}/${card.normalizedName}.jpg`;
    }
}

schema.virtual('imagePath').get(function () {
    return buildImagePath(this);
});
schema.statics.buildImagePath = function (card:ICard) {
    return buildImagePath(card);
};
schema.plugin(plugin.timestamp);
schema.plugin(plugin.toJSON);

export let model = mongoose.model<ICard>('Card', schema);