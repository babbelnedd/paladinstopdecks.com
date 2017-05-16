///<reference path="typings/express/express.d.ts"/>
///<reference path="typings/express-handlebars/express-handlebars.d.ts"/>
///<reference path="typings/moment/moment-node.d.ts"/>
import {IChampion} from './model/Champion';
'use strict';

import express = require('express');
import path = require('path');
import expressHandlebars = require('express-handlebars');
import model = require('./model/index');
import log = require('./log');
import Settings = require('../settings');
import {cache} from './utils/index';

let frontendPath = path.join(path.dirname(__dirname), 'frontend', 'static');
let templatePath = path.join(frontendPath, 'templates');
let viewPath = path.join(templatePath, 'views');
let partialPath = path.join(templatePath, 'partials');
let _package = require('../package.json');

class TemplateEngine {
    public static setup(app:express.Express) {
        let hbs = expressHandlebars.create({
            layoutsDir: viewPath,
            partialsDir: partialPath,
            defaultLayout: 'layout/main',
            extname: '.min.hbs',
            helpers: require('../shared/handlebars-helper')
        });


        if (app.get('production')) {
            app.enable('view cache');
        }
        app.engine('min.hbs', hbs.engine);
        app.set('views', viewPath);
        app.set('view engine', 'min.hbs');
        app.use('*', function (req:express.Request, res:express.Response, next:Function) {
            if (req.baseUrl.toLowerCase().indexOf('/api') !== -1) {
                return next();
            }
            res.locals['_auth'] = {};
            if (req.url.indexOf('/api/') !== 0 && req.url.indexOf('/static/') !== 0) {

                let authenticated = req.isAuthenticated();
                if (authenticated) {
                    let user:model.IUser = req.user;
                    res.locals['_auth'].authenticated = authenticated;
                    res.locals['_auth'].uid = user._id;
                    res.locals['_auth'].username = user.name;
                    res.locals['_auth'].activated = user.activated;
                    res.locals['_auth'].avatar = user.avatar;
                    res.locals['_auth'].email = user.email;
                    res.locals['_auth'].admin = user.admin;
                } else {
                    res.locals['_auth'].authenticated = false;
                    res.locals['_auth'].activated = false;
                }
            }
            next();
        });

        // todo: settings in some kind of settings.json
        app.locals['static'] = {
            version: _package.version,
            patch: Settings.patch,
            production: app.get('production'),
            title: Settings.page.title,
            meta: Settings.page.meta,
            cdn: Settings.cdn
        };
        model.Article
            .find({})
            .sort({date: -1})
            .select('_id title date logo slug')
            .lean()
            .exec(function (err:any, articles:model.IArticle[]) {
                if (err) {
                    return log.warn('Failed to load articles from database');
                }
                app.locals['static'].articles = articles;
            });
        model.Champion
            .find({}).select('name normalizedName').sort({name: 1})
            .exec().then(function (champions:IChampion[]) {
            app.locals['static'].champions = [];
            for (let i = 0; i < champions.length; i++) {
                app.locals['static'].champions.push({
                    normalizedName: champions[i].normalizedName,
                    name: champions[i].name
                });
            }
        });
        this.refreshDeckCounter(app);

        // update index cache every 5minutes...
        // setInterval(this.rfdc(app), 5 * 60000);
        setInterval(this.rfdc(app), 5000);

    }

    private static rfdc(app:any) {
        let self = this;
        return function () {
            self.refreshDeckCounter(app);
        };
    }

    private static refreshDeckCounter(app:any) {
        model.Deck.aggregate([{
            $group: {
                _id: '$normalizedChampion',
                count: {$sum: 1}
            }
        }]).exec().then(function (decks:any) {
            let count:any = {};
            for (let i = 0; i < decks.length; i++) {
                count[decks[i]._id] = decks[i].count;
            }
            app.locals['static'].deckCount = count;
        });
        cache.get('index_decks').then(function (decks:any) {
            if (typeof decks === 'string') {
                app.locals['static'].decks = JSON.parse(decks);
            }
        });
    };
}

export = TemplateEngine;