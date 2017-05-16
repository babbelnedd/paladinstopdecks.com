///<reference path="../typings/tsd.d.ts"/>
'use strict';
import {Router, Request, Response} from 'express';
import {ICard, IChampion} from '../model/index';

import model = require('../model/index');
import utils = require('../utils/index');
import Promise = require('bluebird');
let normalize = require('../../shared/normalize');

export = Router()
    .get('/:champion', function (req:Request, res:Response, next:Function) {
        interface IQueryResult {
            cards: ICard[];
            champion: IChampion;
        }

        let filter = {normalizedChampion: normalize(req.params.champion), isRemoved: false};
        let champFilter = {normalizedName: normalize(req.params.champion)};
        let queries = {
            cards: model.Card.find(filter).exec(),
            champion: model.Champion.findOne(champFilter).exec()
        };
        Promise
            .props(queries)
            .then(function (results:IQueryResult) {
                let cards = results.cards;
                let champion = results.champion;
                if (!cards || !champion) {
                    return next();
                }
                let options = {
                    nav: 'cards',
                    cards: cards,
                    champion: champion,
                    title: `${utils.capitalize(req.params.champion.toLowerCase())} Cards`,
                    meta: {
                        image: `/static/img/champions/${champion.normalizedName}/og.png`
                    },
                    dependencies: {js: ['champion']}
                };

                res.render('champion', options);
            });
    });