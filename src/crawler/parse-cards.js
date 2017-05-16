'use strict';

var path = require('path');
var mkdirp = require('mkdirp');
var request = require('request');
var Promise = require('bluebird');
var mongoose = require('mongoose');
var moment = require('moment');
var rename = require('gulp-rename');
var getImage = require('./getImage');
var auth = require('../auth').database;
var Database = require('../backend/db/index').Database;
var DatabaseConfiguration = require('../backend/db/DatabaseConfiguration').DatabaseConfiguration;
var model = require('../backend/model/');
var normalize = require('../shared/normalize');
var getWindow = require('./get');
var concat = require('./concat');
var fs = require('fs');

var FORCE_UPDATE = true;
var DAY = 1000 * 24 * 60 * 60;

var cfg = new DatabaseConfiguration(auth);
var db = new Database(cfg);

function errorHandler(err, err2) {
    console.info('err', err, err2);
}

function getAllCardUrls() {
    //console.info('getAllCardUrls()');

    return new Promise(function (resolve, reject) {
        resolve([
            'http://paladins.gamepedia.com/Category:Damage_Cards',
            'http://paladins.gamepedia.com/Category:Armor_Cards',
            'http://paladins.gamepedia.com/Category:Utility_Cards',
            'http://paladins.gamepedia.com/Category:Removed_cards'
        ]);
    });
}

function parseUrls(urls) {
    //console.info('parseUrls()');

    return new Promise(function (resolve, reject) {
        Promise.mapSeries(urls, function (url) {
                return parseUrl(url);
            })
            .then(function (results) {
                resolve(concat(results));
            })
            .catch(reject);
    });
}

function parseUrl(url) {
    //console.info('parseUrl()');

    return new Promise(function (resolve, reject) {

        getWindow(url)
            .then(getCardsFromWindow)
            .then(resolve)
            .catch(reject);

    });
}

function getCardsFromWindow(window) {
    //console.info('getCardsFromWindow()');

    return new Promise(function (resolve, reject) {

        var _cards = [];
        var $ = window.$;
        var cards = $('#mw-pages').find('li > a');
        cards.each(function (index) {
            var cardEl = $(this);
            var name = cardEl.text();
            var normalizedName = name.replace(' ', '_').replace('\'', '%27');
            var url = 'http://paladins.gamepedia.com/' + normalizedName;
            _cards.push({
                name: name,
                url: url,
                type: window._document.URL
            });
            if (index == cards.length - 1) resolve(_cards);
        });

    });

}

var _i = 0;
function getCardFromWindow(window) {
    return new Promise(function (resolve, reject) {
        _i++;
        console.info('Parse Card', _i, window._document.URL);
        var $ = window.$;
        var ctx = $('#mw-content-text');
        var card = {};
        card.url = window._document.URL;
        card.image = ctx.find('> div > div > img').attr('src');
        card.champion = ctx.find('> div > div:nth-child(2) > a').attr('title');
        card.name = ctx.find('> div > div:nth-child(3)').text();
        card.tier = mapRarity(ctx.find('> div > div:nth-child(4) > a').attr('title').split(' ')[0]);
        card.ability = ctx.find('> div > div:nth-child(6)').text();
        card.damage = ctx.find('> div > div:nth-child(7)').text().replace('+', '').replace('%', '');
        card.hp = ctx.find('> div > div:nth-child(8)').text().replace('+', '');
        card.description = ctx.find('> div > div:nth-child(9)').text();
        card.cooldown = ctx.find('> div > div:nth-child(10)').text();
        card.type = $('#mw-normal-catlinks > ul > li:nth-child(2) > a').text().split(' ')[0].toLowerCase();
        card.normalizedName = normalize(card.name);
        card.normalizedChampion = normalize(card.champion);
        //card.normalizedChampion = normalize(card.champion);
        //card.normalizedName = normalize(card.name);
        //card.tierIcon = ctx.find('> div > div:nth-child(4) > a > img').attr('src');
        //card.frame = ctx.find('> div > div:nth-child(5) > img').attr('src');

        resolve(card);
    });
}

function prepareCard(type) {
    return function (card) {
        return new Promise(function (resolve, reject) {
            card.isRemoved = type == 'http://paladins.gamepedia.com/Category:Removed_cards';
            console.info('isRemoved?', card.isRemoved);
            card.path = path.join(path.dirname(__dirname), 'frontend', 'static', 'img', 'cards', card.normalizedChampion, card.tier);
            try {
                for (var key in card.files) if (card.files.hasOwnProperty(key)) {
                    mkdirp.sync(path.dirname(card.files[key]));
                }
            } catch (err) {
                return reject('Failed to create folder', err);
            }
            resolve(card);
        });
    }
}

function mapRarity(rarity) {
    rarity = normalize(rarity);
    if (rarity == 'green') return 'common';
    if (rarity == 'blue') return 'rare';
    if (rarity == 'purple') return 'epic';
    if (rarity == 'orange') return 'legendary';
    return rarity;
}

// =========================================================================

function getEm(cardUrls) {
    return new Promise(function (resolve, reject) {
        Promise.mapSeries(cardUrls, function (card) {
                return checkIfCardsNeedToBeUpdated(card.url)
                    .then(getWindow)
                    .then(getCardFromWindow)
                    .then(prepareCard(card.type))
                    .then(getImage)
                    .then(saveCardToFile)
                    //.then(saveCardToDb)
                    .catch(function (msg, err) {
                        console.error(msg, err);
                    });
            })
            .then(resolve)
            .catch(reject);
    });
}

function checkIfCardsNeedToBeUpdated(url) {
    //console.info('checkIfCardsNeedToBeUpdated()');
    return new Promise(function (resolve, reject) {
        while (url.indexOf(' ') > -1) url = url.replace(' ', '_');
        if (FORCE_UPDATE) return resolve(url);

        model.Card.findOne({url: url}, 'url updated', function (err, doc) {
            if (err) return reject('Failed to query database', err);
            if (doc) {
                var diff = moment().diff(moment(doc.updated, 'x'));
                if (diff < DAY) {
                    return reject('Card was updated in the last 24hours', url);
                }
            }

            return resolve(url);
        });
    });
}

function saveCardToFile(card) {
    return new Promise(function (resolve, reject) {
        if (!card) return reject('CARD IS EMPTY DAFUQ' + card);
        var stringified = JSON.stringify(card);
        if (!stringified) {
            return reject('CARD IS 2EMPTY2 DAFUQ')
        }
        var clone = JSON.parse(stringified);
        delete clone.url;
        delete clone.image;
        delete clone.path;
        var filename = path.join(path.dirname(path.dirname(__dirname)), 'data', 'cards', card.normalizedChampion, card.tier, card.normalizedName + '.json');

        mkdirp.sync(path.dirname(filename));

        var data = JSON.stringify(clone, null, 4);
        fs.writeFile(filename, data, {encoding: 'utf8'}, function (err) {
            if (err) return reject('Failed to save Card to fs', err);
            return resolve(card);

        });
    });
}

function saveCardToDb(card) {
    //console.info('saveCardToDb()');

    return new Promise(function (resolve, reject) {
        delete card.image;
        console.info(card);
        model.Champion.findOne({name: card.champion}, function (err, doc) {
            if (err) return reject('No champion found for card', err);

            card._champion = doc.id;

            model.Champion.findOne({name: card.name, champion: card.champion}, function (err, doc) {
                if (!!err) return reject('Failed to query db', err);
                if (doc !== null) {
                    model.Card.update({name: card.name, champion: card.champion}, card, function (err, doc) {
                        if (err) return reject('Failed to update db', err);
                        resolve(card);
                    });
                } else {
                    new model.Card(card).save(function (err, doc) {
                        console.info('e', err);
                        if (err) return reject('Failed to insert doc', err);
                        resolve(card);
                    });
                }

            });

            // well fuck.. upsert triggert keine hooks. dummen mongoose penners :D
            //model.Card.update({name: card.name, champion: card.champion}, card, {upsert: true}, function (err) {
            //    if (err) return reject('Could save card not to DB', err);
            //    resolve(card);
            //});
        });

    });
}

db.connect(function (err) {
    if (err) {
        console.error('Could not establish a connection to the database');
        console.error(err);
        process.exit(23);
    } else {
        getAllCardUrls()
            .then(parseUrls)
            .then(getEm)
            .then(process.exit)
            .catch(errorHandler);
    }
});