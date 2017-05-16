///<reference path="../../typings/tsd.d.ts"/>
'use strict';

import {Router, Request, Response, NextFunction} from 'express';
import {IDeck, IDeckFavorite} from '../../model/index';
import model = require('../../model/index');
import Promise = require('bluebird');
import log = require('../../log');

class VoteError extends Error {
    public name = 'VoteError';

    constructor(public message?:string) {
        super(message);
    }
}

export = Router()
    .get('/:id', function (req:Request, res:Response, next:NextFunction) {
        if (!req.isAuthenticated() || !req.params.id) {
            return res.json({err: 'Cheating not allowed'});
        }

        let filter:any = {
            _id: req.params.id
        };
        if (req.user.admin !== true) {
            filter._author = req.user._id;
        }

        function render(deck:model.IDeck) {
            if (!deck) {
                return next();
            }

            res.json(deck);
        }

        model.Deck.findOne(filter).exec().then(render, next);

    })
    .get('/rating/:name', function (req:Request, res:Response) {
        let filter = {deckid: req.params.name.substring(0, req.params.name.indexOf('-'))};
        model.Deck.findOne(filter).select('rating').exec().then(function (deck:model.IDeck) {
            return res.json(deck.rating);
        });
    })
    .get('/voted/:name', function (req:Request, res:Response) {
        if (!req.isAuthenticated()) {
            return res.json(0);
        }
        // todo den ganzen indexof dreck irwo in eine lib packen
        let index = req.params.name.indexOf('-');
        let filter = {
            deckid: req.params.name.substring(0, index)
        };
        if (index === -1) {
            filter.deckid = req.params.name;
        }

        model.Deck.findOne(filter).select('_id').exec().then(function (deck:model.IDeck) {
            // todo: if deck null
            model.Rating.findOne({_user: req.user._id, _deck: deck._id}).exec().then(function (rating:any) {
                return res.json(!!rating ? rating.vote : 0);
            });
        });
    })
    .put('/:name/vote', function (req:Request, res:Response) {
        if (!req.isAuthenticated() /*|| !req.user.activated*/) {
            return res.json('You need to be authenticated to vote');
        }

        function getDeck(path:any) {
            let filter = {deckid: path.substring(0, path.indexOf('-'))};
            return Promise.resolve(model.Deck.findOne(filter)
                .select('rating _id')
                .exec());
        }

        function hasVoted(result:any) {
            return new Promise(function (resolve:any, reject:any) {
                let filter = {_deck: result.deck._id, _user: req.user._id};
                return model.Rating.findOne(filter, function (err:any, rating:any) {
                    resolve({deck: result.deck, hasVoted: rating !== null, oldRating: rating, rating: result.rating});
                });
            });
        }

        function vote(deck:model.IDeck, rating:number) {
            new model.Rating({_deck: deck._id, _user: req.user._id, vote: rating}).save();
            deck.rating += rating;
            return Promise.resolve(deck.save()); // todo: combine both in one promise()
        }

        function getNewRating(deck:model.IDeck) {

            if (!req.body.vote) {
                throw new VoteError('Missing parameters!');
            }

            let value = parseInt(req.body.vote);
            if (isNaN(value)) {
                throw new VoteError('Dude, please. Rating is NaN!');
            }

            if (value !== 1 && value !== -1 && value !== 0) {
                // todo: report hax!
                throw new VoteError('Cheating disallowed, sorry!');
            }

            return Promise.resolve({deck: deck, rating: value});
        }

        function updateVote(deck:model.IDeck, rating:model.IRating, value:number) {
            if (rating.vote === value) {
                throw new VoteError('Already voted');
            }

            if (value === 0) {
                deck.rating -= rating.vote;
            } else if (value === 1 && rating.vote === -1) {
                deck.rating += 2;
            } else if (value === -1 && rating.vote === 1) {
                deck.rating -= 2;
            } else {
                deck.rating += value;
            }

            rating.vote = value;
            rating.save();
            return Promise.resolve(deck.save());
        }

        function failIfDeckNull(deck:model.IDeck) {
            if (deck === null) {
                throw new VoteError('Deck does not exist');
            }

            return Promise.resolve(deck);
        }

        getDeck(req.params.name)
            .then(failIfDeckNull)
            .then(getNewRating)
            .then(hasVoted)
            .then(function (result:any) {
                let logObj = {deck: result.deck.name, ip: req.ip, ua: req.headers['user-agent'], rating: req.body.vote};

                if (result.hasVoted) {
                    log.debug('User has updated his vote', logObj);
                    return updateVote(result.deck, result.oldRating, result.rating);
                } else {
                    log.debug('User has voted', logObj);
                    return vote(result.deck, result.rating);
                }
            })
            .then(function (deck:any) {
                res.json({rating: deck.rating});
            })
            .catch(VoteError, function (e:any) {
                log.warn(e);
                res.status(405);
                res.json(e.message);
            });

    })
    .post('/user/:name', function (req:Request, res:Response) {
        model.User.findOne({name: {$regex: new RegExp(req.params.name, 'i')}}).exec().then(function (user:model.IUser) {
            if (!user) {
                return res.json([]);
            }

            model.Deck.find({_author: user._id})
                .select('deckid name normalizedName rating author patch updated views champion normalizedChampion')
                .exec().then(function (decks:model.IDeck[]) {
                return res.json(decks);
            });

        });
    })
    .post('/:deckId/favorite', function (req:Request, res:Response, next:NextFunction) {
        if (!req.isAuthenticated()) {
            return next();
        }
        model.Deck.findOne({deckid: req.params.deckId}).select('_id').lean().exec().then(function (deck:IDeck) {
            // user, deck
            model.DeckFavorite.findOne({deck: deck._id}).exec().then(function (deckFavorite:IDeckFavorite) {
                if (deckFavorite) {
                    deckFavorite.remove(function () {
                        return res.json(false);
                    });
                } else {
                    new model.DeckFavorite({user: req.user._id, deck: deck._id}).save(function () {
                        return res.json(true);
                    });
                }
            });
        });
    })
    .get('/:deckId/favorite', function (req:Request, res:Response, next:NextFunction) {
        if (!req.isAuthenticated()) {
            return next();
        }
        model.Deck.findOne({deckid: req.params.deckId}).select('_id').lean().exec().then(function (deck:IDeck) {
            // user, deck
            model.DeckFavorite.findOne({
                deck: deck._id,
                user: req.user._id
            }).exec().then(function (deckFavorite:IDeckFavorite) {
                return res.json(!!deckFavorite);
            });
        });
    });