///<reference path="../../typings/tsd.d.ts"/>
'use strict';

import {Router, Request, Response} from 'express';

export = Router()
    .get('/', function (req:Request, res:Response) {
        return res.render('admin/index', {layout: 'layout/admin'});
    });