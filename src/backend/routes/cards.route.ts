///<reference path="../typings/tsd.d.ts"/>
'use strict';
import {Router, Response, Request} from 'express';

export = Router()
    .get('/:champion', function (req:Request, res:Response, next:Function) {
        res.status(301);
        res.redirect(`/champion/${req.params.champion}`);
    });