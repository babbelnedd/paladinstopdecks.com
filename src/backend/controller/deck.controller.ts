///<reference path="../typings/node/node.d.ts"/>
'use strict';

import {Deck, IDeck, DeckFavorite, Champion, IChampion, Rating, IUser} from '../model/index';
import {versionCompare, normalize, cache} from '../utils/index';
import moment = require('moment');
import Settings = require('../../settings');
import log = require('../log');

export function getTopDecks(selection:string, count:number) {
    selection += ' normalizedChampion deckid views';
    return new Promise(function (resolve:any) {
        let min = moment().subtract(20, 'd').format('x');

        return Deck
            .find({updated: {$gte: min}, rating: {$gt: 1}, cards: {$size: 5}})
            .select(selection)
            .sort({rating: -1})
            .limit(100).exec().then(function (decks:IDeck[]) {

                let q:any[] = [];

                for (let i = 0; i < decks.length; i++) {
                    (function (j:number) {
                        q.push(new Promise(function (resolve:Function) {
                            DeckFavorite.count({deck: decks[j]._id}).exec().then(function (count:number) {
                                (<any>decks[j]).favorites = count;
                                resolve(decks[j]);
                            });
                        }));
                    })(i);
                }

                Promise.all(q).then(function (decks:IDeck[]) {
                    let versions:string[] = [];
                    for (let i = 0; i < decks.length; i++) {
                        if (versions.indexOf(decks[i].patch) === -1) {
                            versions.push(decks[i].patch);
                        }
                    }
                    versions = versions.sort(function (a:string, b:string) {
                        return versionCompare(a, b);
                    });

                    for (let i = 0; i < decks.length; i++) {
                        // weight patch 10
                        decks[i].rating += (versions.indexOf(decks[i].patch) * 10);
                        // weight favorites 5
                        decks[i].rating += (<any>decks[i]).favorites * 5;
                        decks[i].rating += decks[i].views * 0.0001;
                    }

                    decks = decks.sort(function (a:IDeck, b:IDeck) {
                        return b.rating - a.rating;
                    });

                    /*decks = decks.sort(function (a:IDeck, b:IDeck) {
                        let value = 0;
                        // patch
                        value += versions.indexOf(a.patch) - versions.indexOf(b.patch) > 0
                            ? -1 * WEIGHTS.patch : WEIGHTS.patch;
                        // rating
                        value += a.rating - b.rating > 0
                            ? -1 * WEIGHTS.rating : WEIGHTS.rating;

                        return value;
                    });*/

                    resolve(decks.slice(0, count));
                });
            });
    });
}

export function getRecentDecks(selection:string, count:number) {
    return Deck
        .find({rating: {$gte: 1}})
        .select(selection)
        .sort({updated: -1})
        .limit(count)
        .exec();
}

export function updateDeck(user:IUser, updatedDeck:IDeck) {
    return new Promise(function (resolve:Function, reject:Function) {
        let filter:any = {
            _id: updatedDeck._id
        };
        if (user.admin !== true) {
            filter._author = user._id;
        }

        Deck.findOne(filter).exec().then(function (deck:IDeck) {
            if (deck.patch !== Settings.patch) {
                return reject({err: 'We told you..'});
            }

            Deck
                .find({_author: deck._author}).select('updated').sort({updated: -1}).limit(1)
                .lean().exec()
                .then(function (decks:IDeck[]) {
                    if (decks && decks.length > 0) {
                        let diff = moment.duration(moment().diff(moment(decks[0].updated.toString(), 'x'))).asSeconds();
                        if (diff < 10) {
                            return reject({
                                err: `You are trying it too often. Try it again in ${Math.round(10 - diff)} seconds`
                            });
                        }
                    }

                    // let oldDeck = JSON.parse(JSON.stringify(deck));
                    if (!deck) {
                        let logObj = {
                            // ip: req.ip,
                            uid: user._id,
                            uname: user.name,
                            triedToUpdate: filter
                        };
                        log.critical('Someone tried to update a deck which does not exist!', logObj);
                        return reject({err: 'Deck does not exist!'});
                    }

                    if (typeof updatedDeck.description === 'string' && updatedDeck.description.trim().length > 0) {
                        deck.description = updatedDeck.description;
                    }
                    deck.name = updatedDeck.name;
                    deck.normalizedName = normalize(updatedDeck.name);
                    deck.patch = Settings.patch;
                    deck.cards = updatedDeck.cards;
                    deck.levels = updatedDeck.levels;
                    deck.substitutions = updatedDeck.substitutions;
                    deck.updated = parseInt(moment().format('x'));
                    if (deck.description.length > 1000000) {
                        return reject({err: 'Description length exceeded limit!'});
                    }
                    if (deck.name.length > 125 || deck.name.length < 5) {
                        return reject({err: 'Title length exceeded limit!'});
                    }
                    deck.save(function (err) {
                        if (err) {
                            log.warn('Failed to update Deck!', err);
                            return reject({err: 'We are working on it, sorry!'});
                        }

                        cache.del('deck_' + deck.normalizedChampion + '_' + deck.deckid).then(function () {
                            cache.del('index_decks');
                            return resolve(deck);
                        });
                    });
                });
        });
    });
}

export function publishDeck(user:IUser, deck:IDeck) {

    let seen:any = {};
    let hasDuplicates = deck.cards.some(function (currentObject:any) {
        return seen[currentObject] = false;
    });
    if (hasDuplicates) {
        return Promise.reject({err: 'No duplicate cards...'});
    }


    return new Promise(function (resolve:Function, reject:Function) {
        Champion
            .findOne({normalizedName: deck.normalizedChampion})
            .select('_id').lean().exec()
            .then(function (champion:IChampion) {
                if (!champion) {
                    return reject({err: 'Champion does not exist.'});
                }

                Deck
                    .find({_author: user._id}).select('updated').sort({updated: -1}).limit(1)
                    .lean().exec()
                    .then(function (decks:IDeck[]) {
                        if (decks && decks.length > 0) {
                            let diff = moment
                                .duration(moment().diff(moment(decks[0].updated.toString(), 'x'))).asSeconds();
                            if (diff < 60) {
                                return reject({
                                    err: `You are trying it too often. Try it again in ${Math.round(60 - diff)} seconds`
                                });
                            }
                        }

                        // let deck = JSON.parse(JSON.stringify(req.body));
                        deck._champion = champion._id;
                        deck.rating = 1;
                        deck._author = user._id;
                        deck.author = user.name;
                        if (deck.name.length > 100) {
                            return reject({err: 'Title length exceeded limit!'});
                        }
                        deck.description = '';
                        deck.normalizedName = normalize(deck.name);
                        deck.deckid = Math.floor(Math.random() * 999999) + 10000;
                        deck.visibility = 'visible';
                        new Deck(deck).save(function (err:any, _deck:IDeck) {
                            if (err) {
                                log.error('Failed to save new deck', {deck: deck, err: err.message});
                                return reject({err: 'Failed to save deck.'});
                            }

                            cache.delByPattern('decksearch_' + _deck.normalizedChampion + '*');
                            cache.del('index_decks');

                            new Rating({_user: user._id, _deck: _deck._id, vote: 1}).save(function () {
                                return resolve(_deck);
                            });
                        });
                    });
            });
    });
}