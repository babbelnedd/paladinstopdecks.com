///<reference path='../typings/tsd.d.ts'/>
'use strict';

import {Router, Request, Response, NextFunction} from 'express';
import {IChampion, IDeck, ICard, Activity} from '../model/index';
import Controller = require('../controller/index');
import model = require('../model/index');
import log = require('../log');
import authOrigin = require('../middleware/authOrigin.middleware');

let activity = require('../../shared/activityType');
let ga = require('../ga');
let sortByTier = require('../../shared/sortByTier');

export = Router()
    .get('/', function (req:Request, res:Response) {
        res.render('deck/deckbuilder');
    })
    .get('/:champion', function (req:Request, res:Response) {

        function getChampion(name:string) {
            return model.Champion
                .findOne({normalizedName: new RegExp(`^${name}$`, 'i')})
                .lean().exec();
        }

        function getCards(champion:IChampion) {
            return new Promise(function (resolve:Function) {
                model.Card.find({
                        $and: [
                            {normalizedChampion: champion.normalizedName},
                            {isRemoved: false}
                        ]
                    })
                    .exec().then(function (cards:ICard[]) {
                    return resolve({champion: champion, cards: cards});
                });
            });
        }

        function render(result:{champion:IChampion, cards:ICard[]}) {
            res.render('deck/builder', {
                nav: 'deckbuilder',
                champion: result.champion,
                cards: sortByTier(result.cards),
                dependencies: {js: ['deckbuilder']}
            });
        }

        getChampion(req.params.champion)
            .then(getCards)
            .then(render);

    })
    .get('/update/:id', authOrigin, function (req:Request, res:Response, next:NextFunction) {

        function getDeck() {
            let filter:any = {_id: req.params.id};
            if (req.user.admin !== true) {
                filter._author = req.user._id;
            }

            return model.Deck.findOne(filter).exec();
        }

        function getCards(deck:IDeck) {
            return new Promise(function (resolve:Function) {
                if (!deck) {
                    return next();
                }
                let filter:any = {$or: [{_champion: deck._champion}, {normalizedChampion: null}], isRemoved: false};
                model.Card.find(filter).exec().then(function (cards:ICard[]) {
                    resolve({deck: deck, cards: cards});
                });
            });
        }

        function render(result:{deck:IDeck, cards:ICard[]}) {
            return res.render('deck/update', {
                deck: result.deck,
                cards: result.cards,
                champion: result.deck.normalizedChampion,
                dependencies: {js: ['deckupdate']}
            });
        }

        getDeck()
            .then(getCards)
            .then(render);
    })
    .post('/update', authOrigin, function (req:any, res:Response) {
        Controller.Deck.updateDeck(req.user, <IDeck>req.body)
            .then(function (updatedDeck:IDeck) {
                log.info('Deck Updated', updatedDeck.fullPath);
                if (process.env.NODE_ENV === 'production') {
                    // todo: pass ip
                    ga(req.user._id).event({
                        ec: 'Deckbuilder',
                        ea: 'Deck Updated'
                    }).send();
                }
                new Activity({
                    _user: req.user._id,
                    type: activity.type.deckUpdated,
                    url: updatedDeck.fullPath,
                    info: [`Deck ${updatedDeck.name} Updated`],
                }).save();
                return res.json({url: updatedDeck.fullPath});
            })
            .catch(function (err:any) {
                return res.json(err);
            });
    })
    .post('/publish', authOrigin, function (req:Request, res:Response) {
        Controller.Deck
            .publishDeck(req.user, <IDeck>req.body)
            .then(function (publishedDeck:IDeck) {
                log.info('New Deck published', {deck: publishedDeck.name, uid: req.user._id});
                new Activity({
                    _user: req.user._id,
                    type: activity.type.newDeck,
                    url: publishedDeck.fullPath,
                    info: [`Created Deck: ${publishedDeck.name}`],
                }).save();
                if (process.env.NODE_ENV === 'production') {
                    ga(req.user._id).event({
                        ec: 'Deckbuilder',
                        ea: 'Deck Published'
                    }).send();
                }
                res.json({editPath: publishedDeck.editPath, path: publishedDeck.fullPath});
            })
            .catch(function (err:any) {
                res.json(err);
            });
    });