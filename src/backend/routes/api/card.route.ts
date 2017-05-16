///<reference path="../../typings/express/express.d.ts"/>
'use strict';

import {Router, Request, Response} from 'express';
import {cache} from '../../utils/index';
import {Card, ICard} from '../../model/index';

const CARD_SELECTION = '-_id normalizedName normalizedChampion name ' +
    'tier hp cooldown damage description ability imagePath';

export = Router()
    .get('/:champion/:name', function (req:Request, res:Response, next:Function) {
        let filter = {
            normalizedChampion: req.params.champion,
            normalizedName: req.params.name
        };

        if (!filter.normalizedChampion || !filter.normalizedName) {
            next();
        }

        let key = `api_card_${filter.normalizedChampion}_${filter.normalizedName}`;
        cache.get(key).then(function (result:any) {
            if (typeof result === 'string') {
                res.json(JSON.parse(result));
            } else {
                Card.findOne(filter).select(CARD_SELECTION).lean().exec().then(function (card:ICard) {
                    delete card.id;
                    card.imagePath = (<any>Card).buildImagePath(card);
                    res.json(card);
                    cache.set(key, card);
                    // eigtl kein expires.. aber was wenn update..
                    // einfach redis cache on start platt machen?!
                });
            }
        });
    })
    .get('/neutral', function (req:Request, res:Response) {
        // todo: cache
        Card.find({normalizedChampion: null, isRemoved: false}).exec().then(function (cards:ICard[]) {
            res.json(cards);
        });
    })
    .get('/:id', function (req:Request, res:Response) {
        Card.findOne({_id: req.params.id}).exec().then(function (card:ICard) {
            return res.json(card);
        });
    });