///<reference path='typings/tsd.d.ts'/>
import {ICard} from './model/index';
'use strict';

import {IChampion} from './model/Champion';
import {Types} from 'mongoose';
import fs = require('fs');
import path = require('path');
import moment = require('moment');
import utils = require('./utils/index');
import log = require('./log');
import model = require('./model/index');
import YAML = require('yamljs');

let Promise = require('bluebird');
let normalize = require('../shared/normalize');
/*let minify = require('html-minifier').minify;
 let minifyOpts = {
 removeComments: true,
 collapseWhitespace: true,
 conservativeCollapse: true,
 removeAttributeQuotes: true,
 removeRedundantAttributes: true,
 minifyJS: true,
 minifyCSS: true
 };*/
// todo: DataLoader ist ein bescheidener Name!

function loadPatches(patchPath:string) {
    return new Promise(function (resolve:Function, reject:Function) {
        fs.readdir(patchPath, function (err:any, files:string[]) {
            if (err) {
                log.warn('Failed to read patch directory', err);
                reject(err);
            }

            Promise.mapSeries(files, function (file:string) {
                    return new Promise(function (resolve:Function, reject:Function) {
                        file = path.join(patchPath, file);
                        fs.readFile(file, 'utf8', function (err:any, content:string) {
                            if (err) {
                                log.warn('Failed to read patch file', err);
                                reject(err);
                            }

                            let patch = JSON.parse(content);
                            patch.date = moment(patch.date, 'DD.MM.YYYY').format('x');

                            Promise.mapSeries(patch.changes, function (change:any) {
                                return new Promise(function (resolve:Function, reject:Function) {
                                    change.version = patch.version;
                                    change.date = patch.date;
                                    change.type = change.type.toUpperCase();

                                    let filter = {
                                        type: change.type,
                                        change: change.change,
                                        version: change.version
                                    };
                                    // todo upsert sucks!
                                    model.Patch.update(filter, change, {upsert: true}, function (err:any, doc:any) {
                                        if (err) {
                                            log.error('Failed to createOrUpdate patch', doc, err);
                                            return reject(err);
                                        }

                                        log.trace('Patch inserted or updated', doc);
                                        resolve(doc);
                                    });
                                });
                            }).then(resolve);
                        });
                    });
                })
                .catch(reject)
                .then(resolve);
        });
    });
}

function loadCards(cardPath:string) {
    function getChampionID(champions:any[], name:string):Types.ObjectId {
        for (let i = 0; i < champions.length; i++) {
            if (champions[i].name == name) {
                return champions[i]._id;
            }
        }
        return undefined;
    }

    return new Promise(function (resolve:Function, reject:Function) {
        model.Champion.find({}, '_id name normalizedName', function (err:any, champions:typeof model.Champion[]) {
            if (err) {
                log.error('Could not query database', err);
                return reject(err);
            }

            utils.walk(cardPath, function (err:any, result?:string[]) {
                if (err) {
                    log.error('Could not load cards', err);
                    return reject(err);
                }

                Promise.mapSeries(result, function (fn:string) {
                        return new Promise(function (resolve:Function, reject:Function) {
                            log.trace('Load card from file', fn);
                            fs.readFile(fn, 'utf8', function (err:any, data:any) {
                                if (err) {
                                    log.warn('Could not read file', fn, err);
                                    return reject(err);
                                }
                                try {
                                    data = JSON.parse(data);
                                } catch (err) {
                                    log.warn('Could not parse JSON from ', fn, err);
                                    return reject(err);
                                }

                                // let cardFilter = {name: {$regex: new RegExp(data.name, 'i')}};
                                let cardFilter = {
                                    name: {$regex: new RegExp(data.name, 'i')},
                                    champion: data.champion
                                };
                                model.Card.findOne(cardFilter, function (err:any, doc?:typeof model.Card) {
                                    data._champion = getChampionID(champions, data.champion);
                                    if (doc !== null) {
                                        log.trace('Card already exists, update incoming!', data.name);
                                        model.Card.update(cardFilter, data, function (err:any) {
                                            if (err) {
                                                log.warn('Failed to update card!', data, err);
                                                return reject(err);
                                            }
                                            log.trace('Card updated', data.name);
                                            return resolve();
                                        });
                                    } else {
                                        log.trace('Insert new card into database', data.name);
                                        new model.Card(data).save(function (err:any) {
                                            if (err) {
                                                log.warn('Failed to save new card!', data, err);
                                                return reject(err);
                                            }
                                            log.info('Saved new card', data.name);
                                            return resolve();
                                        });
                                    }
                                });
                            });
                        });
                    })
                    .then(resolve)
                    .catch(reject);
            });
        });
    });
}

function loadArticles(articlePath:string) {
    return new Promise(function (resolve:Function, reject:Function) {
        fs.readdir(articlePath, function (err:any, files:string[]) {
            if (err) {
                log.warn('Failed to read article directory', err);
                return reject(err);
            }

            Promise.mapSeries(files, function (file:string) {
                    return new Promise(function (resolve:Function, reject:Function) {
                        file = path.join(articlePath, file);
                        fs.readFile(file, 'utf8', function (err:any, content:string) {
                            if (err) {
                                log.warn('Failed to read article file', err);
                                return reject(err);
                            }

                            let article:model.IArticle = YAML.parse(content);
                            // article.content = minify(article.content, minifyOpts);
                            let articleFilter = {date: article.date};
                            model.Article.findOne(articleFilter, function (err:any, doc?:typeof model.Article) {
                                if (err) {
                                    log.warn('Failed to query database', err);
                                    return reject(err);
                                }

                                if (!!doc) {
                                    model.Article.update(articleFilter, article, function (err:any) {
                                        if (err) {
                                            log.warn('Failed to update Article', err);
                                            return reject(err);
                                        }
                                        log.trace('Updated article', article.title);
                                        return resolve();
                                    });
                                } else {
                                    new model.Article(article).save(function (err:any) {
                                        if (err) {
                                            log.warn('Failed to save Article', err);
                                            return reject(err);
                                        }

                                        log.info('Saved new article', article.title);
                                        return resolve();
                                    });
                                }
                            });
                        });
                    });
                })
                .then(resolve)
                .catch(reject);
        });
    });
}

function loadChampions(championPath:string) {

    let readFile = Promise.promisify(fs.readFile);

    return new Promise(function (resolve:Function, reject:Function) {
        utils.walk(championPath, function (err:any, files:string[]) {
            if (err) {
                return reject('Failed to walk in champion path', err);
            }

            Promise.mapSeries(files, function (file:string) {
                    return new Promise(function (resolve:Function, reject:Function) {
                        readFile(file, 'utf8')
                            .then(function (content:string) {
                                let champion:model.IChampion = JSON.parse(content);
                                let filter = {name: champion.name};
                                model.Champion.findOne(filter, function (err:any, champ:typeof model.Champion) {
                                    if (err) {
                                        return reject('Failed to query database', err);
                                    }
                                    if (champ !== null) {
                                        model.Champion.update(filter, champion, function (err:any) {
                                            if (err) {
                                                return reject('Failed to update Champion', err);
                                            }
                                            resolve(champion);
                                        });
                                    } else {
                                        log.trace('Insert new champion into database', champion.name);

                                        new model.Champion(champion).save(function (err:any) {
                                            if (err) {
                                                return reject('Failed to save Champion', err);
                                            }
                                            log.info('New champion saved', champion.name);
                                            resolve(champion);
                                        });
                                    }
                                });
                            }).catch(reject);
                    });
                })
                .then(resolve)
                .catch(reject);
        });
    });
}

function createAsyncLoader(fn:Function) {
    return function (path:string) {
        return function () {
            return fn(path);
        };
    };
}

function loadCardsTwo(cardPath:string) {
    let fs = Promise.promisifyAll(require('fs'));

    function getChampions() {
        return model.Champion.find({}).select('_id name normalizedName').lean().exec();
    }

    function getFile(p:string) {
        return new Promise(function (resolve:any, reject:any) {
            fs.readFileAsync(p, 'utf8').then(function (content:string) {
                resolve(JSON.parse(content));
            });
        });
    }

    function loadCards(champions:IChampion[]) {
        return new Promise(function (resolve:any, reject:any) {
            let q:any[] = [];
            for (let i = 0; i < champions.length; i++) {
                q.push(getFile(path.join(cardPath, champions[i].normalizedName + '.json')));
            }
            q.push(getFile(path.join(cardPath, 'neutral.json')));

            Promise.all(q).then(resolve);
        });
    }

    function updateCard(card:ICard) {
        return new Promise(function (resolve:any) {

            card.normalizedChampion = normalize(card.champion);
            card.normalizedName = normalize(card.name);
            let cardFilter:any = {
                normalizedName: card.normalizedName
            };
            if (typeof card.normalizedChampion === 'string') {
                cardFilter.normalizedChampion = card.normalizedChampion;
            }
            model.Card.findOne(cardFilter).exec().then(function (dbCard:ICard) {
                if (dbCard !== null) {
                    // important todo: FUCKING ATTENTION HERE
                    // this COULD FUCK THINGS UP WITH NETURAL CARDS
                    model.Card.update(cardFilter, card).exec(function () {
                        return resolve(card);
                    });
                } else {
                    if (typeof card.normalizedChampion === 'string') {
                        model.Champion.findOne({name: card.champion})
                            .exec().then(function (champ:IChampion) {
                            if (champ === null) {
                                //  console.info('ayy add le card', card);
                            }
                            card._champion = champ._id;
                            new model.Card(card).save(function () {
                                log.info('Added new card to database', {name: card.name, champion: card.champion});
                                return resolve(card);
                            });
                        });
                    } else {
                        new model.Card(card).save(function (err) {
                            log.info('Added new neutral card to database', {name: card.name});
                            return resolve(card);
                        });
                    }
                }
            });

            resolve(card);
        });
    }

    function updateCards(cards:any) {
        return new Promise(function (resolve:any, reject:any) {
            let q:any[] = [];
            cards.forEach(function (cardsPerChampion:ICard[]) {
                cardsPerChampion.forEach(function (card:ICard) {
                    q.push(updateCard(card));
                });
            });
            Promise.all(q).then(resolve);
        });
    }

    return new Promise(function (resolve:any) {
        getChampions()
            .then(loadCards)
            .then(updateCards)
            .then(resolve);
    });

}


export = {
    loadPatches: loadPatches,
    loadCards: loadCards,
    loadArticles: loadArticles,
    loadChampions: loadChampions,
    loadPatchesAsync: createAsyncLoader(loadPatches),
    loadCardsAsync: createAsyncLoader(loadCardsTwo),
    loadArticlesAsync: createAsyncLoader(loadArticles),
    loadChampionsAsync: createAsyncLoader(loadChampions),
    loadCardsTwo: loadCardsTwo
}