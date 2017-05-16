///<reference path="../typings/tsd.d.ts"/>
'use strict';
import {Types} from 'mongoose';
import {Card, ICard, Deck, IDeck} from '../model/index';
import Promise = require('bluebird');
let sortByTier = require('../../shared/sortByTier');

/**
 * Gets a Card Object by it's name
 * @param {string} name - Name of the wanted card. Can be normalized.
 * @returns {Promise<ICard>}
 */
/*export function getCard(name:string) {
 let nameRx = new RegExp(name, 'i');
 return Card
 .findOne({
 $or: [
 {normalizedName: nameRx},
 {name: nameRx},
 ]
 })
 .exec();
 }*/

export function getCard(champion:string, name:string) {
    let nameRx = new RegExp(name, 'i');
    let filter:any = {
        $or: [
            {normalizedName: nameRx},
            {name: nameRx},
        ]
    };

    if (champion !== null) {
        filter.champion = new RegExp(`^${champion}$`, 'i');
    } else {
        filter.normalizedChampion = null;
    }


    return Card
        .findOne(filter)
        .exec();
}

/**
 * Get the amount of Decks which contain a specific Card
 * @param {mongoose.Types.ObjectId} cardId - The ID of the wanted Card
 * @param {number} [since=] - Optional UNIX Timestamp which specifies the minimum updated timestamp for Decks
 * @returns {Promise<number>}
 */
export function getCountOfCardInDecks(cardId:Types.ObjectId, since?:number) {
    let filter:any = {cards: {$in: [cardId]}};
    if (typeof since === 'number') {
        filter.updated = {$gt: since};
    }
    return Deck
        .count(filter)
        .exec();
}

interface ICurve {
    dmg:number[];
    hp:number[];
}

export function buildCurves(cardIds:Types.ObjectId[]) {
    return new Promise(function (resolve:Function) {
        let q:any[] = [],
            result:ICurve = {dmg: [], hp: []};

        for (let i = 0; i < cardIds.length; i++) {
            q.push(Card.findOne({_id: cardIds[i]}).select('tier hp damage').lean().exec());
        }

        Promise.all(q).then(function (cards:ICard[]) {
            cards = sortByTier(cards);
            for (let i = 0; i < cards.length; i++) {
                let dmg = parseInt(<any>cards[i].damage),
                    hp = parseInt(<any>cards[i].hp);

                if (result.dmg.length > 0) {
                    dmg += result.dmg[result.dmg.length - 1];
                    hp += result.hp[result.hp.length - 1];
                }

                result.dmg.push(dmg);
                result.hp.push(hp);
            }
            return resolve(result);
        });
    });
}

export function buildCurvedDeck(deck:IDeck) {
    return new Promise(function (resolve:Function) {
        buildCurves(deck.cards).then(function (curve:ICurve) {
            let _deck:any = JSON.parse(JSON.stringify(deck));
            _deck.curve = curve;
            _deck.curve.total = {
                dmg: _deck.curve.dmg[_deck.curve.dmg.length - 1],
                hp: _deck.curve.hp[_deck.curve.hp.length - 1]
            };
            resolve(_deck);
        });
    });
}

export function buildCurvedDecks(decks:IDeck[]) {
    let q:any[] = [];

    for (let i = 0; i < decks.length; i++) {
        q.push(buildCurvedDeck(decks[i]));
    }

    return Promise.all(q);
}