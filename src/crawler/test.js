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

getWindow('http://forums.paladins.com/showthread.php?1581-December-3rd-2015-0-8-The-Frigid-Queen-Patch-Notes')
    .then(function (window) {
        var $ = window.$;
        var hits = [];
        var rx = /(reduced|increased) rarity from (common|rare|epic|legendary) to (common|rare|epic|legendary)/i;

        $('#posts > li:nth-child(1)').find('li').each(function (index, el) {
            var text = $(el).text();
            if (rx.test(text)) {

                hits.push(text);
            }
        });

        setTimeout(function () {
            console.info('hits:', hits);
        }, 500);
    });