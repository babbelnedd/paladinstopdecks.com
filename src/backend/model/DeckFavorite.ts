///<reference path="../typings/tsd.d.ts"/>
'use strict';

import {Document, Schema, Types} from 'mongoose';
import mongoose = require('mongoose');
import DatabaseTypes = require('../db/Types');

export interface IDeckFavorite extends Document {
    user: Types.ObjectId;
    deck: Types.ObjectId;
}

let schema:Schema = new Schema({
    user: DatabaseTypes.requiredObjectID('User'),
    deck: DatabaseTypes.requiredObjectID('Deck')
});


export let model = mongoose.model<IDeckFavorite>('DeckFavorite', schema);