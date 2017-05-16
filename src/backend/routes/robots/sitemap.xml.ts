///<reference path="../../typings/tsd.d.ts"/>

'use strict';
import express = require('express');
import model = require('../../model/index');
import log = require('../../log');
let Promise = require('bluebird');
let sitemap = require('sitemap');
let moment = require('moment');

let championQuery = model.Champion.find({}).select('normalizedName').exec();
let deckQuery = model.Deck.find({rating: {$gt: 0}}).exec();

export = express.Router()
    .get('', function (req:express.Request, res:express.Response, next:Function) {
        log.info('Sitemap Requested', {ip: req.ip, headers: req.headers});
        // todo: Generate sitemap outside of request & update it every hour
        Promise.all([championQuery, deckQuery]).then(function (result:any[]) {
            let champions = result[0],
                decks = result[1],
                _urls:any[] = [];

            for (let i = 0; i < champions.length; i++) {
                _urls.push({url: '/cards/' + champions[i].normalizedName});
            }
            for (let i = 0; i < decks.length; i++) {
                _urls.push({url: decks[i].fullPath, lastmodISO: moment(decks[i].updated, 'x').format('YYYY-MM-DD')});
            }
            let sm = sitemap.createSitemap({
                hostname: 'https://paladinstopdecks.com',
                urls: _urls
            });
            sm.toXML(function (err:any, xml?:string) {
                res.header('Content-Type', 'application/xml');
                res.send(xml);
            });
        });

    });