///<reference path="../typings/express/express.d.ts"/>

'use strict';
import express = require('express');

let router = express.Router();

router.get('/privacy', function (req:express.Request, res:express.Response, next:Function) {
    res.render('legal/privacy');
});
router.get('/disclaimer', function (req:express.Request, res:express.Response, next:Function) {
    res.render('legal/disclaimer');
});


export = router;