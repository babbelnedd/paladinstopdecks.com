///<reference path="../typings/express/express.d.ts"/>

'use strict';
import express = require('express');

let router = express.Router()
    .get('/', function (req:express.Request, res:express.Response) {
        return res.render('donation/index');
    })
    .get('/thanks', function (req:express.Request, res:express.Response) {
        return res.render('donation/thanks');
    });

export = router;