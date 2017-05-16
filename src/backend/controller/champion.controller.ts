///<reference path="../typings/tsd.d.ts"/>
'use strict';
import {Types} from 'mongoose';
import Model = require('../model/index');

export function getChampion(name:string) {
    let filter = {
        $or: [
            {normalizedName: name},
            {name: name}
        ]
    };
    return Model.Champion.findOne(filter).lean().exec();
}

export interface IGetCardsByChampionOpts {
    lean?: Boolean;
    select?: string;
}

export function getCardsByChampion(championId:Types.ObjectId, opts?:IGetCardsByChampionOpts) {
    opts = opts || {};
    if (!opts.lean) {
        opts.lean = false;
    }
    if (!opts.select) {
        opts.select = null;
    }

    let query = Model.Card.find({_champion: championId});

    if (typeof opts.select !== null) {
        query.select(opts.select);
    }

    if (opts.lean === true) {
        query.lean();
    }

    return query.exec();
}
