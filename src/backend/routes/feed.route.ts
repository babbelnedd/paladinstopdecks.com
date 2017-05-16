///<reference path="../typings/tsd.d.ts"/>
'use strict';

import {Router, Request, Response} from 'express';
import {Deck, IDeck} from '../model/index';
import {cache} from '../utils/index';
import RSS = require('rss');
import moment = require('moment');

let key = 'feed_decks';

export = Router()
    .get('/atom', function (req:Request, res:Response) {

        cache.get(key).then(function (result:string) {
            if (typeof result === 'string') {
                res.header('Content-Type', 'text/xml').send(result);
            } else {
                Deck.find({})
                    .select('name normalizedChampion deckid updated _id')
                    .sort({updated: -1}).limit(20).lean().exec()
                    .then(function (decks:IDeck[]) {
                        let feed = new RSS({
                            title: 'Paladins Top Decks',
                            description: 'Your #1 source for Decks and Guides',
                            feed_url: '/feed/atom',
                            site_url: 'https://paladinstopdecks.com',
                            pubDate: moment().format(),
                            ttl: 1,
                            image_url: 'https://paladinstopdecks.com/static/img/i.ico',
                            generator: 'Paladins Top Decks Feed Generator'
                        });
                        for (let i = 0; i < decks.length; i++) {
                            let deck = decks[i];
                            feed.item({
                                title: deck.name,
                                description: '',
                                url: `/decks/${deck.normalizedChampion}/${deck.deckid}`,
                                guid: deck._id.toString(),
                                date: moment(deck.updated.toString(), 'x').format()
                            });

                        }

                        let xml = feed.xml({indent: true});
                        res.header('Content-Type', 'text/xml').send(xml);
                        cache.set(key, xml);
                        cache.expires(key, 60);
                    });
            }
        });

    });