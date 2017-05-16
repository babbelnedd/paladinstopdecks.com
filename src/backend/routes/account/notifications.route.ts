///<reference path="../../typings/express/express.d.ts"/>
'use strict';

import express = require('express');
// import model = require('../../model/index');

export = express.Router({mergeParams: true})
    .get('/', function (req:express.Request, res:express.Response, next:any) {
        return res.render('account/notifications');
    });