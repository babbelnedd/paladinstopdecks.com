///<reference path="../../typings/moment/moment-node.d.ts"/>
///<reference path="../../typings/mongoose/mongoose.d.ts"/>
'use strict';

import mongoose = require('mongoose');
import moment = require('moment');
import Types = require('..//Types');

export = function (schema:mongoose.Schema, options?:{index?: boolean, autoUpdate?: boolean}) {
    if (!options) {
        options = {};
    }
    if (!options.hasOwnProperty('autoUpdate')) {
        options.autoUpdate = true;
    }
    schema.add({created: Types.optionalNumber});
    schema.add({updated: Types.optionalNumber});

    function pre(next:Function) {

        if (this.isNew && this.created === undefined) {
            this.created = moment().format('x');
            this.updated = moment().format('x');
        } else {
            if (options.autoUpdate) {
                this.updated = moment().format('x');
            }
        }
        next();
    }

    schema.pre('save', pre);
    schema.pre('update', pre);

    if (options && options.index) {
        if (this.isNew) {
            schema.path('created').index(options.index);
        }
        schema.path('updated').index(options.index);
    }
};