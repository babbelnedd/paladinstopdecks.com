///<reference path='../typings/tsd.d.ts'/>
'use strict';
import {Schema, Types, model} from 'mongoose';
import DatabaseTypes = require('../../backend/db/Types');

export interface IGamePlayer {
    player: Types.ObjectId;
    champion: Types.ObjectId;
    knockouts: number;
    blowouts: number;
    deaths: number;
    dmg: number;
    cards: Types.ObjectId[];
}

export interface IGame {
    gameid: string;
    queue: string;
    // minutes more efficient as second here
    duration: number;
    players: [IGamePlayer];
}

let schema:Schema = new Schema({
    gameid: DatabaseTypes.requiredString,
    queue: DatabaseTypes.requiredString,
    duration: DatabaseTypes.requiredNumber,
    players: [{
        player: DatabaseTypes.requiredObjectID('Player'),
        champion: DatabaseTypes.requiredObjectID('Champion'),
        knockouts: DatabaseTypes.requiredNumber,
        blowouts: DatabaseTypes.requiredNumber,
        deaths: DatabaseTypes.requiredNumber,
        dmg: DatabaseTypes.requiredNumber,
        cards: [DatabaseTypes.requiredObjectID('Card')]
    }]
});


export let model = model<IGame>('Game', schema);