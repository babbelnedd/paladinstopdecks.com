///<reference path="../typings/express/express.d.ts"/>

'use strict';
import express = require('express');
import model = require('../model/index');
import utils = require('../utils/index');
import moment = require('moment');
let Promise = require('bluebird');


export = express.Router()
    .get('/', function (req:express.Request, res:express.Response, next:Function) {

        function getChampions() {
            return model.Champion.find({}).lean().select('_id').exec();
        }

        function getDecks(champions:model.IChampion[]) {
            return new Promise(function (resolve:any) {
                let queries:any[] = [],
                    past = moment().subtract('30', 'days').format('x');

                for (let i = 0; i < champions.length; i++) {
                    queries.push(
                        model.Deck
                            .find({_champion: champions[i]._id, updated: {$gt: past}})
                            .sort({rating: -1})
                            .select('deckid author name normalizedName rating normalizedChampion fullPath')
                            .limit(5)
                            .exec()
                    );
                }

                Promise.all(queries).then(function (result:any) {
                    resolve(result);
                });
            });
        }

        function buildResult(result:any) {
            let res:any = {};

            for (let i = 0; i < result.length; i++) { // champions
                if (result[i] && result[i].length > 0) {
                    res[result[i][0].normalizedChampion] = [];
                    for (let j = 0; j < result[i].length; j++) {
                        res[result[i][j].normalizedChampion].push({
                            fullPath: result[i][j].fullPath,
                            name: result[i][j].name,
                            rating: result[i][j].rating,
                            author: result[i][j].author
                        });
                    }
                }
            }

            return Promise.resolve(res);
        }

        function render(result:any) {
            res.render('toprateddecks', {decks: result});
            return Promise.resolve(result);
        }

        function setCache(key:string) {
            return function (result:any) {
                return utils.cache.set(key, result).then(function () {
                    // expire cache in 60m
                    utils.cache.expires(key, 3600);
                });
            };
        }

        let key = 'toprated_decks';
        utils.cache.get(key).then(function (result:string) {

            if (typeof result === 'string') {
                render(JSON.parse(result));
            } else {
                getChampions()
                    .then(getDecks)
                    .then(buildResult)
                    .then(render)
                    .then(setCache(key));
            }

        });

    });