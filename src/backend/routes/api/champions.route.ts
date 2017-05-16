///<reference path="../../typings/tsd.d.ts"/>
import {ICard} from '../../model/index';
'use strict';
import {Router, Request, Response} from 'express';
import {IChampion} from '../../model/index';
import Model = require('../../model/index');
import Controller = require('../../controller/index');
import Promise = require('bluebird');


function getStats(champion:IChampion) {

    return new Promise(function (resolve:any, reject:any) {
        Controller.Champion.getCardsByChampion(champion._id, {
                lean: true,
                select: '_id tier name type ability'
            })
            .then(function (cards:ICard[]) {
                let queries:any = {};
                for (let i = 0; i < cards.length; i++) {
                    queries[i] = Controller.Card.getCountOfCardInDecks(cards[i]._id);
                }
                Promise.props(queries).then(function (result:any) {
                    let sortable:any = [];
                    for (let key in result) {
                        if (result.hasOwnProperty(key)) {
                            sortable.push({
                                card: cards[key],
                                count: result[key]
                            });
                        }
                    }
                    sortable.sort(function (a:any, b:any) {
                        return b.count - a.count;
                    });

                    let mostPickedCards = sortable.slice(0, 5);
                    let _filtered:any[] = [];
                    let mostPickedByTier = sortable.filter(function (el:any) {
                        if (_filtered.indexOf(el.card.tier) === -1) {
                            _filtered.push(el.card.tier);
                            return true;
                        }
                        return false;
                    });

                    resolve({
                        mostPicked: mostPickedCards,
                        mostPickedByTier: mostPickedByTier,
                        // countPerType: countPerType
                    });
                });
            });
    });

}

export = Router()
    .get('/:champion/cards', function (req:Request, res:Response, next:Function) {
        Model.Card.find({
            $and: [
                {champion: {$regex: new RegExp(req.params.champion, 'i')}},
                {isRemoved: false}
            ]
        }).exec(function (err, cards) {
            if (err) {
                res.status(500);
            }
            res.json(cards);
        });
    })
    .post('/:champion/cards', function (req:Request, res:Response, next:Function) {

        let filter:any = {
            champion: {$regex: new RegExp(req.params.champion, 'i')}
        };

        if (req.body.tier) {
            filter.tier = req.body.tier;
        }
        if (req.body.type) {
            filter.type = req.body.type;
        }
        if (req.body.ability) {
            filter.ability = req.body.ability;
        }

        Model.Card.find(filter).exec(function (err, cards) {
            if (err) {
                res.status(500);
            }
            res.json(cards);
        });
    })
    .get('/:champion/stats', function (req:Request, res:Response, next:Function) {
        Controller.Champion.getChampion(req.params.champion)
            .then(getStats)
            .then(function (stats:any) {
                return res.send(stats);
            });
    });