///<reference path="../../typings/tsd.d.ts"/>

'use strict';
import express = require('express');

let router = express.Router();
let text = 'User-agent: *\nDisallow: /admin\nDisallow: /donation\nDisallow: /auth\nDisallow: /account';
router.get('', function (req:express.Request, res:express.Response, next:Function) {
    res.send(text);
});

export = router;