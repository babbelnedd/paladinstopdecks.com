///<reference path="../typings/mongoose/mongoose.d.ts"/>
'use strict';

import mongoose = require('mongoose');
import IDatabaseObject = require('../db/IDatabaseObject');
import plugin = require('../db/plugins/index');
import Types = require('../db/Types');

interface IAbility {
    name: string;
    description: string;
    type: string;
    properties: {};
}

export interface IChampion extends IDatabaseObject, mongoose.Document {
    name: string;
    normalizedName: string;
    title?: string;
    'class'?: string;
    releaseDate: number;
    clipSize?: number;
    attackRange?: number;
    movementSpeed?: number;
    abilities: IAbility[];
}


let schema:mongoose.Schema = new mongoose.Schema({
    name: Types.requiredString,
    normalizedName: Types.requiredString,
    title: Types.optionalString,
    'class': Types.optionalString,
    health: Types.requiredNumber,
    releaseDate: Types.requiredNumber,
    clipSize: Types.optionalNumber,
    attackRange: Types.optionalString,
    movementSpeed: Types.optionalNumber,
    abilities: []
});

schema.plugin(plugin.timestamp);
schema.plugin(plugin.toJSON);

export let model = mongoose.model<IChampion>('Champion', schema);