'use strict';

var Promise = require('bluebird');
var getWindow = require('./get');
var concat = require('./concat');
var normalize = require('../shared/normalize');
var model = require('../backend/model/index');
var moment = require('moment');
var mongoose = require('mongoose');
var Database = require('../backend/db/index').Database;
var DatabaseConfiguration = require('../backend/db/DatabaseConfiguration').DatabaseConfiguration;
var auth = require('../auth').database;
var getImage = require('./getImage');
var path = require('path');
var mkdirp = require('mkdirp');
var fs = require('fs');

var url = 'http://paladins.gamepedia.com/Champions';
var cfg = new DatabaseConfiguration(auth);
var db = new Database(cfg);

var champPath = path.join(__dirname, 'champions');

function parseChampion(window) {
    return new Promise(function (resolve, reject) {
        var $ = window.$;
        var ctx = $('#mw-content-text');
        // get abilities
        var champ = {};
        champ.name = $('#firstHeading').text();
        while (champ.name.indexOf('\n') > -1) champ.name = champ.name.replace('\n', '');
        while (champ.name.indexOf('\t') > -1) champ.name = champ.name.replace('\t', '');
        champ.normalizedName = normalize(champ.name);
        champ.abilities = [];
        ctx.find('> div').each(function (index) {
            if (index > 2) return false;
            var ability = {};
            ability.name = $(this).find('p:nth-child(1)').text().trim();
            while (ability.name.indexOf('\n') > -1)ability.name = ability.name.replace('\n', ' ');
            ability.description = $(this).find('p:nth-child(3)').text().trim();
            ability.img = $(this).find('p:nth-child(1) > a > img').attr('src');
            ability.type = 'Ability';
            ability.properties = {};

            // get ability property
            $(this).find('div:nth-child(2)').find('div').each(function () {
                var key = $(this).find('a').attr('title').trim().toLowerCase();
                var value = $(this).text().trim();
                if (key.length > 0 && value.indexOf('?') < 0) {
                    ability.properties[key] = value;
                }
            });
            champ.abilities.push(ability);
        });

        // get stats
        var stats = ctx.find('table[class="infobox"] > tbody');
        stats.find('tr:not([style="display: none;"])').each(function () {
            var key = $(this).find('th').text().toLowerCase().trim();
            var value = $(this).find('td').text().trim();
            if (!!value && value.length > 1) {
                while (key.indexOf('\n') > -1) key = key.replace('\n', '');
                while (value.indexOf('\n') > -1) value = value.replace('\n', '');
                while (key.indexOf(':') > -1) key = key.replace(':', '');
                champ.clipSize = 0; // = infinite
                if (key == 'title') champ.title = value.trim();
                else if (key == 'class') champ.class = value.trim();
                else if (key == 'role') champ.role = value.trim();
                else if (key == 'release date') champ.releaseDate = parseInt(moment(toDate(value.trim()), 'MM DD, YYYY').format('x'));
                else if (key == 'health') champ.health = value.trim();
                else if (key == 'clip size') champ.clipSize = value.trim();
                else if (key == 'attack range') champ.attackRange = value.trim();
                else if (key == 'movement speed') champ.movementSpeed = value.trim();
                else champ.abilities.push({
                        name: key,
                        type: 'Basic Attack',
                        img: '' + $(this).find('td img').attr('src'),
                        damage: value.trim()
                    });
            }
        });

        resolve(champ);

    });
}

function toDate(x) {
    var months = ["january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
    ];

    x = x.toLowerCase();
    for (var i = 0; i < 12; i++) {
        x = x.replace(months[i], i);
    }

    return x;
}

function saveChampion(champion) {
    console.info('SAVERINO');
    return new Promise(function (resolve, reject) {
        var champ = JSON.parse(JSON.stringify(champion));
        var p = path.join(path.dirname(path.dirname(__dirname)), 'data', 'champions', normalize(champion.name) + '.json');
        var data = JSON.stringify(champ, null, 4);
        fs.writeFile(p, data, 'utf8', function (err) {
            if (err) return reject(err);
            resolve(champion);
        });
    });
}

function saveImages(champion) {

    var images = [];
    for (var i = 0; i < champion.abilities.length; i++) {
        var abi = champion.abilities[i];
        var p = path.join(path.dirname(__dirname), 'frontend', 'static', 'img', 'champions', normalize(champion.name), 'abilities');
        mkdirp.sync(p);
        images.push({
            image: abi.img,
            path: p,
            name: abi.name
        });
        delete champion.abilities[i].img;
    }

    return new Promise(function (resolve, reject) {
        Promise.mapSeries(images, function (img) {
                return getImage(img);
            })
            .then(function () {
                resolve(champion);
            })
            .catch(function () {
                resolve(champion);
            });
    })
}

function getChampions(champions) {
    return new Promise(function (resolve, reject) {
        Promise.mapSeries(champions, function (champ) {
                console.info('start ', champ.name);
                return getWindow(champ.url)
                    .then(parseChampion)
                    .then(saveImages)
                    .then(saveChampion)
                    .catch(function (err) {
                        console.error('woopsie', err);
                    });
            })
            .then(function (results) {
                resolve(concat(results));
            })
            .catch(reject);
    });
}

function getChampionUrls(url) {
    return new Promise(function (resolve, reject) {
        getWindow(url)
            .then(function (window) {
                var champions = [];
                var $ = window.$;
                var divs = $('#mw-content-text').find('> center > div');

                divs.each(function () {
                    champions.push({
                        name: $(this).text(),
                        url: 'http://paladins.gamepedia.com/' + $(this).text()
                    });
                });
                resolve(champions);

            })
            .catch(function (err) {
                reject(err)
            });

    });
}

db.connect(function (err) {
    if (err) {
        console.error('Could not establish a connection to the database');
        console.error(err);
        process.exit(23);
    } else {
        console.info('start');
        getChampionUrls(url)
            .then(getChampions)
            .then(function () {
                process.exit(0);
            })
            .catch(function (msg, err) {
                console.info(msg);
                console.info(err);
                process.exit(1);
            });
    }
});