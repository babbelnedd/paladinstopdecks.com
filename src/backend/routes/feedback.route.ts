///<reference path="../typings/tsd.d.ts"/>
'use strict';

import {Router, Response, Request} from 'express';

export = Router()
    .get('/', function (req:Request, res:Response) {
        return res.render('feedback');
    });