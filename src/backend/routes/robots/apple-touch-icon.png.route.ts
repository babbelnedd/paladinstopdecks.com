///<reference path="../../typings/tsd.d.ts"/>
'use strict';
import {Router, Response, Request} from 'express';
import path = require('path');

let staticPath = path.dirname(path.dirname(path.dirname(__dirname)));
let icon = path.join(staticPath, 'frontend', 'static', 'img', 'mobile', 'apple-touch-icon.png');

export = Router()
    .get('', function (req:Request, res:Response) {
        res.sendFile(icon);
    });