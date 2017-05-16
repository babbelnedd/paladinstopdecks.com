///<reference path='../../typings/tsd.d.ts'/>
'use strict';

import {Router, Request, Response} from 'express';

function authMiddleware(req:Request, res:Response, next:Function) {
    if (!req.isAuthenticated() || req.user.admin !== true) {
        res.status(404);
        return res.render('404');
    }
    return next();
}

export = Router()
    .use('/', authMiddleware, require('./index.route'))
    .use('/articles', authMiddleware, require('./articles.route'));