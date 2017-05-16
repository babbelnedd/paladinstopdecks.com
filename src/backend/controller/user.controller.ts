///<reference path="../typings/tsd.d.ts"/>
'use strict';

import {Types} from 'mongoose';
import Model = require('../model/index');

export function findOne(name:string) {
    return Model.User.findOne({
        $or: [
            {name: new RegExp(`^${name}$`, 'i')},
            {normalizedName: new RegExp(`^${name}$`, 'i')}
        ]
    }).exec();
}

export function findOneById(id:Types.ObjectId) {
    return Model.User.findOne({_id: id}).exec();
}