///<reference path="../../typings/tsd.d.ts"/>
'use strict';

import {Router, Request, Response} from 'express';
import {User, IUser, DeckFavorite, IDeckFavorite, Deck, IDeck} from '../../model/index';
import {cache} from '../../utils/index';

export = Router()
    .get('/:username', function (req:Request, res:Response, next:Function) {
        let selection = 'deckid name normalizedName rating author patch updated views champion normalizedChampion',
            key = `user_favorites_${req.params.username}`;

        cache.get(key).then(function (result:string) {
            if (typeof result === 'string') {
                return res.json(JSON.parse(result));
            } else {
                User
                    .findOne({name: new RegExp(`^${req.params.username}$`)}).select('_id')
                    .lean().exec()
                    .then(function (user:IUser) {
                        DeckFavorite.find({user: user._id}).exec().then(function (favorites:IDeckFavorite[]) {
                            let decks:any[] = [];
                            for (let i = 0; i < favorites.length; i++) {
                                decks.push(favorites[i].deck);
                            }
                            Deck.find({_id: {$in: decks}}).select(selection).exec().then(function (decks:IDeck[]) {
                                cache.set(key, decks);
                                res.json(decks);
                            });
                        });
                    });
            }
        });
    });