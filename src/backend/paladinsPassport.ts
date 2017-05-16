///<reference path="typings/passport/passport.d.ts"/>
///<reference path="typings/express-session/express-session.d.ts"/>
///<reference path="typings/connect-mongo/connect-mongo.d.ts"/>
'use strict';

import session = require('express-session');
import express = require('express');
import mongoose = require('mongoose');
import mongoStore = require('connect-mongo');

let model = require('./model/index');
let passport = require('passport');
let auth = require('../auth');
let MongoStore = mongoStore(session);
const ONE_DAY = 24 * 60 * 60;

export = {
    passport: passport,
    init: function (app:express.Express) {

        app.use(session({
            secret: auth.session.secret,
            resave: false,
            saveUninitialized: false,
            store: new MongoStore({
                mongooseConnection: mongoose.connection,
                ttl: 365 * ONE_DAY,
                autoRemove: 'native'
            })
        }));
        passport.use(model.User.createStrategy());
        passport.serializeUser(model.User.serializeUser());
        passport.deserializeUser(model.User.deserializeUser());
        app.use(passport.initialize());
        app.use(passport.session());


        app.use(function (req:express.Request, res:express.Response, next:Function) {
            app.locals.static.authenticated = req.isAuthenticated();
            next();
        });
    }
};