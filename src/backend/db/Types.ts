///<reference path="../typings/mongoose/mongoose.d.ts"/>
'use strict';
import mongoose = require('mongoose');

export = {
    optionalString: {
        required: false,
        type: String
    },
    requiredString: {
        required: true,
        type: String
    },
    optionalNumber: {
        required: false,
        type: Number
    },
    requiredNumber: {
        required: true,
        type: Number
    },
    optionalDate: {
        required: false,
        type: Date
    },
    requiredDate: {
        required: true,
        type: Date
    },
    optionalBoolean: {
        required: false,
        type: Boolean
    },
    requiredBoolean: {
        required: true,
        type: Boolean
    },
    optionalBuffer: {
        required: false,
        type: Buffer
    },
    requiredBuffer: {
        required: true,
        type: Buffer
    },
    optionalArray: {
        required: false,
        type: Array
    },
    requiredArray: {
        required: true,
        type: Array
    },
    requiredObjectID: function (ref:string, def?:Function) {
        let ret:any = {
            required: true,
            type: mongoose.Schema.Types.ObjectId,
            ref: ref
        };
        if (def !== undefined) {
            ret['default'] = def;
        }
        return ret;
    },
    optionalObjectID: function (ref:string, def?:Function) {
        let ret:any = {
            required: false,
            type: mongoose.Schema.Types.ObjectId,
            ref: ref
        };
        if (def !== undefined) {
            ret['default'] = def;
        }
        return ret;
    }
};
