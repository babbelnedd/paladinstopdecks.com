///<reference path="../typings/tsd.d.ts"/>
'use strict';
import {Types} from 'mongoose';
import {ICard} from '../model/Card';
import {Router, Request, Response} from 'express';
import model = require('../model/index');
import Promise = require('bluebird');
import moment = require('moment');
import utils = require('../utils/index');
import Controller = require('../controller/index');


interface IStatsResult {
    cardsWithDeck: number;
    decksPerChampion: number;
}

interface ICardsAndStats {
    card:ICard;
    stats:IStatsResult;
}


/**
 * Get Card Statistics
 * @param {ICard} card - Card Object for the wanted Card
 * @param {number }[since=-30d] - Optional UNIX Timestamp which specify the max age for including Decks/Cards
 * @returns {Promise<IStatsResult>}
 */
function getStats(card:ICard, since?:number):Promise<IStatsResult> {
    if (typeof since !== 'number') {
        since = parseInt(moment().subtract('30', 'days').format('x'));
    }
    let queries = {
        cardsWithDeck: Controller.Card.getCountOfCardInDecks(card._id, since),
        decksPerChampion: getCountOfDecksPerChampion(card._champion, since)
    };

    return <Promise<IStatsResult>>Promise.props(queries);
}

/**
 * Promise Wrapper for {@getStats}, which returns Stats & Card
 * @param {ICard} card - Card Object
 * @returns {Promise<ICardsAndStats>}
 */
function fetchStats(card:ICard) {
    return new Promise(function (resolve:any, reject:any) {
        getStats(card).then(function (stats:IStatsResult) {
            return resolve({card: card, stats: stats});
        });
    });
}

/**
 * Get the amount of Decks for a specific Champion
 * @param {mongoose.Types.ObjectId} championId - The ID of the wanted Champion
 * @param {number} [since=] - Optional UNIX Timestamp which specifies the minimum updated timestamp for Decks
 * @returns {Promise<number>}
 */
function getCountOfDecksPerChampion(championId:Types.ObjectId, since?:number) {
    let filter:any = {_champion: championId};
    if (typeof since === 'number') {
        filter.updated = {$gt: since};
    }
    return model.Deck.count(filter).exec();
}


function setCache(key:string) {
    return function (result:ICardsAndStats) {
        utils.cache.set(key, result).then(function () {
            // expires in 12 hours
            utils.cache.expires(key, 12 * 3600);
        });
        return Promise.resolve(result);
    };
}

function getCard(champion:string, card:string) {
    return new Promise(function (resolve:any) {
        let key = `card_${champion}_${card}`.toLowerCase();
        utils.cache.get(key).then(function (result:string) {
            if (typeof result === 'string') {
                resolve(JSON.parse(result));
            } else {
                Controller.Card.getCard(champion, card)
                    .then(fetchStats)
                    .then(setCache(key))
                    .then(resolve);
            }
        });
    });
}

export = Router()
    .get('/:card', function (req:Request, res:Response, next:Function) {
        model.Card.findOne({normalizedName: req.params.card}).exec().then(function (card:ICard) {
            if (!card) {
                return next();
            }
            let name = card.normalizedChampion === null ? 'neutral' : card.normalizedChampion;
            res.status(302).redirect(`/card/${name}/${card.normalizedName}`);
        });
    })
    .get('/:champion/:card', function (req:Request, res:Response) {
        let champion:any = req.params.champion;
        if (champion === 'neutral') {
            champion = null;
        }
        getCard(champion, req.params.card).then(function (result:ICardsAndStats) {
            let decksWithCardPercentage = ((result.stats.cardsWithDeck / result.stats.decksPerChampion) * 100);
            return res.render('card', {
                card: result.card,
                title: result.card.name,
                stats: {
                    decksWithCardPercentage: decksWithCardPercentage.toFixed(2)
                },
                meta: {
                    image: `/api/og?path=cards/${result.card.normalizedChampion}/${result.card.normalizedName}.jpg`
                    //  image: `/static/img/cards/${result.card.normalizedChampion}/${result.card.normalizedName}.jpg`
                }
            });
        });
    });