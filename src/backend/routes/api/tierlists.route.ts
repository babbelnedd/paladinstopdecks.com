///<reference path='../../typings/tsd.d.ts'/>
'use strict';

import {Router, Request, Response} from 'express';
import {Tierlist} from '../../controller/index';
import {ITierlist} from '../../model/Tierlist';
import Settings = require('../../../settings');
import authOrigin = require('../../middleware/authOrigin.middleware');


export = Router()
    .post('/', authOrigin, function (req:Request, res:Response) {
        let obj:any = JSON.parse(JSON.stringify(req.body));
        obj._user = req.user._id;
        obj.patch = Settings.patch;
        Tierlist.create(obj)
            .then(function (tierlist:ITierlist) {
                res.json(tierlist);
            })
            .catch(function (err:any) {
                res.json(err);
            });
    });