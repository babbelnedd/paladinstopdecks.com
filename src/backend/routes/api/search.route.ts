///<reference path="../../typings/express/express.d.ts"/>
'use strict';

import {Router, Request, Response} from 'express';
import {Deck, IDeck,
    Article, IArticle,
    Card, ICard,
    User, IUser,
    Champion, IChampion} from '../../model/index';
import Promise = require('bluebird');

export = Router()
    .get('/:term', function (req:Request, res:Response) {

        let term = req.params.term,
            queries:any = {decks: [], news: [], cards: [], users: [], champions: []};

        // decks
        if (term.length > 8) {
            queries.decks = new Promise(function (resolve:Function) {
                Deck.find({
                    name: new RegExp(term, 'i')
                }).select('name deckid normalizedChampion normalizedName').exec().then(function (decks:IDeck[]) {
                    let result:any[] = [];
                    for (let i = 0; i < decks.length; i++) {
                        result.push({
                            url: decks[i].fullPath,
                            title: decks[i].name,
                            info: {champion: decks[i].normalizedChampion}
                        });
                    }
                    resolve(result);
                });
            });
        }
        // news
        if (term.length > 4) {
            queries.news = new Promise(function (resolve:Function) {
                Article.find({title: new RegExp(term, 'i')})
                    .select('title slug author')
                    .lean().exec()
                    .then(function (articles:IArticle[]) {
                        let result:any[] = [];
                        for (let i = 0; i < articles.length; i++) {
                            result.push({
                                url: `/news/${articles[i].slug}`,
                                title: articles[i].title,
                                info: {author: articles[i].author}
                            });
                        }
                        resolve(result);
                    });
            });
        }
        // card
        if (term.length > 2) {
            queries.cards = new Promise(function (resolve:Function) {
                Card.find({name: new RegExp(term, 'i'), isRemoved: false})
                    .select('name normalizedName champion tier')
                    .lean().exec()
                    .then(function (cards:ICard[]) {
                        let result:any[] = [];
                        for (let i = 0; i < cards.length; i++) {
                            result.push({
                                url: `/card/${cards[i].normalizedName}`,
                                title: cards[i].name,
                                info: {tier: cards[i].tier, champion: cards[i].champion}
                            });
                        }
                        resolve(result);
                    });
            });
        }
        // user
        if (term.length > 2) {
            queries.users = new Promise(function (resolve:Function) {
                User.find({name: new RegExp(term, 'i')})
                    .select('name avatar')
                    .lean().exec()
                    .then(function (users:IUser[]) {
                        let result:any[] = [];
                        for (let i = 0; i < users.length; i++) {
                            result.push({
                                url: `/account/${users[i].name}`,
                                title: users[i].name,
                                info: {avatar: users[i].avatar}
                            });
                        }
                        resolve(result);
                    });
            });
        }
        // champions
        if (term.length > 2) {
            queries.champions = new Promise(function (resolve:Function) {
                let rx = new RegExp(term, 'i'),
                    filter = {
                        $or: [
                            {name: rx},
                            {title: rx},
                            {abilities: {$elemMatch: {name: rx}}}
                        ]
                    };
                Champion.find(filter)
                    .select('name avatar')
                    .lean().exec()
                    .then(function (champions:IChampion[]) {
                        let result:any[] = [];
                        for (let i = 0; i < champions.length; i++) {
                            result.push({
                                url: `/champion/${champions[i].name}`,
                                title: champions[i].name,
                                info: {}
                            });
                        }
                        resolve(result);
                    });
            });
        }


        Promise.props(queries).then(function (result:any) {
            return res.json(result);
        });

    });