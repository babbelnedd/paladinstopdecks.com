///<reference path='../typings/tsd.d.ts'/>
'use strict';
import {Schema, Types, Document, model} from 'mongoose';
import DatabaseTypes = require('../../backend/db/Types');

export interface IPlayerStats {
    // playTime: number;
    total: number; // = wins + defeats
    wins: number;
    defeats: number;
    kills: number;
    deaths: number;
    assists: number;
}

export interface IPlayerAvg {
    kd: number; // float
    kda: number; // float
    // dmg: number; // int, stored as k (value:3 => 3k avg dmg)
}

export interface IPlayerChampion {
    championId: Types.ObjectId; // ref Champion
    name: string;
    stats:IPlayerStats;
    avg: IPlayerAvg;
}

export interface IPlayerQueue {
    queue: string; // todo: ex: Temple Ruins - Capture and Siege; this is prolly awful for filtering? Not sure
    stats:IPlayerStats;
    champion: IPlayerChampion[];
}

export interface IPlayer extends Document {
    name: string;
    // lastGames: [];
    stats: IPlayerStats;
    avg: IPlayerAvg;
    champions: [IPlayerChampion];
    queues: [IPlayerQueue];
}

let ChampionSchema:Schema = new Schema({
    championId: DatabaseTypes.requiredObjectID('Champion'),
    name: DatabaseTypes.requiredString,
    stats: {
        playTime: DatabaseTypes.requiredNumber,
        wins: DatabaseTypes.requiredNumber,
        defeats: DatabaseTypes.requiredNumber,
        kills: DatabaseTypes.requiredNumber,
        deaths: DatabaseTypes.requiredNumber,
        assists: DatabaseTypes.requiredNumber,
        dmg: DatabaseTypes.requiredNumber
    }
});

ChampionSchema.virtual('stats.total').get(function () {
    return this.wins + this.defeats;
});
ChampionSchema.virtual('avg').get(function () {
    return {
        kd: this.stats.kills / this.stats.deaths,
        kda: (this.stats.kills + this.stats.assists) / this.stats.deaths
    };
});

let QueueSchema:Schema = new Schema({
    queue: DatabaseTypes.requiredString,
    champion: [ChampionSchema]
});
QueueSchema.virtual('stats').get(function () {
    let stats:IPlayerStats = {
        // playTime: 0,
        total: 0, // = wins + defeats
        wins: 0,
        defeats: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
    };

    for (let i = 0; i < this.champion.length; i++) {
        // stats.playTime += this.champion[i].stats.playTime;
        stats.total += this.champion[i].stats.total;
        stats.wins += this.champion[i].stats.wins;
        stats.defeats += this.champion[i].stats.defeats;
        stats.kills += this.champion[i].stats.kills;
        stats.deaths += this.champion[i].stats.deaths;
        stats.assists += this.champion[i].stats.assists;
    }
    // stats.playTime /= this.champion.length;
    stats.total /= this.champion.length;
    stats.wins /= this.champion.length;
    stats.defeats /= this.champion.length;
    stats.kills /= this.champion.length;
    stats.deaths /= this.champion.length;
    stats.assists /= this.champion.length;

    return stats;
});
QueueSchema.virtual('avg').get(function () {
    let avg:IPlayerAvg = {
        kd: 0,
        kda: 0
    };
    let tmp = {kills: 0, deaths: 0, assists: 0};

    for (let i = 0; i < this.champion.length; i++) {
        tmp.kills += this.champion[i].stats.kills;
        tmp.deaths += this.champion[i].stats.deaths;
        tmp.assists += this.champion[i].stats.assists;
    }

    avg.kd = tmp.kills / tmp.deaths;
    avg.kda = (tmp.kills + tmp.assists) / tmp.deaths;

    return avg;
});

let schema:Schema = new Schema({
    name: DatabaseTypes.requiredString,
    queues: [QueueSchema]
});

schema.virtual('stats').get(function () {
    let stats:IPlayerStats = {
        total: 0,
        wins: 0,
        defeats: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
    };

    for (let i = 0; i < this.queues.length; i++) {
        stats.total += this.queues[i].stats.total;
        stats.wins += this.queues[i].stats.wins;
        stats.defeats += this.queues[i].stats.defeats;
        stats.kills += this.queues[i].stats.kills;
        stats.deaths += this.queues[i].stats.deaths;
        stats.assists += this.queues[i].stats.assists;
    }

    return stats;
});
schema.virtual('avg').get(function () {
    let avg:IPlayerAvg = {
        kd: 0,
        kda: 0
    };

    for (let i = 0; i < this.queues.length; i++) {
        avg.kd += this.queues[i].avg.kd;
        avg.kda += this.queues[i].avg.kda;
    }
    avg.kd /= this.queues.length;
    avg.kda /= this.queues.length;

    return avg;
});

export let model = model<IPlayer>('Player', schema);