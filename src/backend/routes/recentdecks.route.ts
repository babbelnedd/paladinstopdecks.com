///<reference path="../typings/express/express.d.ts"/>

'use strict';
import {Router, Request, Response} from 'express';
import {Deck, IDeck} from '../model/index';
// import {cache} from '../utils/index';
// import moment = require('moment');


export = Router()
    .get('/', function (req:Request, res:Response) {
        Deck.find({})
            .select('-description -cards').sort({updated: -1})
            .limit(25)
            .exec().then(function (decks:IDeck[]) {

            res.render('deck/recent', {
                decks: decks,
                dependencies: {js: ['recent-decks']}
            });

        });
    });