'use strict';

import mongoose = require('mongoose');
export = function (schema:mongoose.Schema) {
    schema.add({
        __v: {
            type: Number,
            select: false
        }
    });
};