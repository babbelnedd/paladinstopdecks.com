///<reference path="../../typings/tsd.d.ts"/>
'use strict';

import {Router, Request, Response} from 'express';
import path = require('path');
let gm = require('gm');
let im = gm.subClass({imageMagick: true});
let imgPath = path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'frontend', 'static', 'img');
let overlay = path.join(imgPath, 'oglay.png');

export = Router()
    .get('/', function (req:Request, res:Response) {
        let p = path.join(imgPath, req.query.path);
        res.writeHead(200, {'Content-Type': 'image/png'});
        im(p)
            .resize(772)
            .composite(overlay)
            .stream('png')
            .pipe(res);
    });