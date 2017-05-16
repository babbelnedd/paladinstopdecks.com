///<reference path='../typings/tsd.d.ts'/>
'use strict';

import {Request, Response, NextFunction} from 'express';

let allowedOrigins = ['https://paladinstopdecks.com'];
export = function (req:Request, res:Response, next:NextFunction) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({err: 'You need to be authenticated.'});
    }
    if (process.env.NODE_ENV === 'production') {
        if (req.method === 'POST' && allowedOrigins.indexOf(req.header('origin')) === -1) {
            return res.status(401).json({err: 'Ayyy lmao'});
        }
    }
    next();
}