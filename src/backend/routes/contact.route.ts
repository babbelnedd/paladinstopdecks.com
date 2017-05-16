///<reference path="../typings/express/express.d.ts"/>

'use strict';
import express = require('express');

let router = express.Router();

router.get('/', function (req:express.Request, res:express.Response, next:Function) {
    res.render('contact');
});

export = router;