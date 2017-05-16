///<reference path="../typings/tsd.d.ts"/>

'use strict';
import {Router, Request, Response} from 'express';
import {IDeck, Article, IArticle} from '../model/index';
import {cache} from '../utils/index';
import Controller = require('../controller/index');
import Promise = require('bluebird');

let selection = 'name normalizedChampion deckid normalizedName fullPath updated author cards patch rating';

function getDecks() {
    return new Promise(function (resolve:Function) {
        let key = 'index_decks';
        cache.get(key).then(function (result:any) {
            if (typeof result === 'string') {
                resolve(JSON.parse(result));
            } else {
                let recentDecks = Controller.Deck.getRecentDecks(selection, 8);
                let topDecks = Controller.Deck.getTopDecks(selection, 8);
                Promise.props({recent: recentDecks, top: topDecks}).then(function (decks:any) {
                    Controller.Card.buildCurvedDecks(decks.top).then(function (topCurves:any) {
                        Controller.Card.buildCurvedDecks(decks.recent).then(function (recentCurve:any) {
                            let result = {top: topCurves, recent: recentCurve};
                            resolve(result);
                            cache.set(key, result);
                        });
                    });
                });
            }
        });
    });
}

function getNews() {
    return Article.find({}).sort({date: -1}).limit(10).lean().exec();
}

export = Router()
    .get('/', function (req:Request, res:Response) {

        function respond(result:{decks:{recent:IDeck[], top:IDeck[]}, streams: any, news:IArticle[]}) {
            res.render('index', {
                nav: 'index',
                dependencies: {js: ['index']},
                decks: {
                    recent: result.decks.recent,
                    top: result.decks.top
                },
                streams: result.streams,
                news: result.news
            });
        }

        let q = {decks: getDecks(), streams: Controller.Twitch.getStreams(), news: getNews()};
        Promise.props(q).then(respond);

    });