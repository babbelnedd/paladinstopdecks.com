///<reference path="typings/node/node.d.ts"/>
///<reference path="typings/body-parser/body-parser.d.ts"/>
///<reference path="typings/express/express.d.ts"/>
///<reference path="typings/cookie-parser/cookie-parser.d.ts"/>
///<reference path="typings/serve-favicon/serve-favicon.d.ts"/>
'use strict';

import express = require('express');
import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');
import path = require('path');
import TemplateEngine = require('./TemplateEngine');
import Router = require('./routes/index');
import Passport = require('./paladinsPassport');
import log = require('./log');

let favicon = require('serve-favicon');
let compression = require('compression');
let ms = require('ms');
let faviconPath = path.join(path.dirname(__dirname), 'frontend', 'static', 'img', 'i.ico');
let faviconOpts = {maxAge: ms('7 days', {long: false})};

let app = express();
app.enable('trust proxy');

let staticFilePath = path.join(path.dirname(__dirname), 'frontend', 'static');
let vendorFilePath = path.join(path.dirname(__dirname), 'frontend', 'bower_components');

app.set('env', process.env.NODE_ENV);
app.set('production', (process.env.NODE_ENV == 'production'));

/*
 important: include static paths before passport
 https://www.airpair.com/express/posts/expressjs-and-passportjs-sessions-deep-dive
 */
app.use('/static', express.static(staticFilePath));
app.use('/vendor', express.static(vendorFilePath));

/*
 important: compression() beyond static files
 static files will be stored as precompressed version on the server!
 */
app.use(compression({}));
app.use(favicon(faviconPath, faviconOpts));
if (!app.get('production')) {
    let requestLogger = require('morgan')('dev');
    app.use(requestLogger);
}
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
Passport.init(app);
TemplateEngine.setup(app);
Router.setup(app);

export = app;

// important todo: ONLY ACCEPT TXT,HTML & JSON => CHECK SEO REQUIREMENTS BEFORE THO!!
app.use(function (req:express.Request, res:express.Response) {
    log.info('invalid link requested', {url: req.url, baseUrl: req.baseUrl, ip: req.ip, ua: req.headers['user-agent']});
    res.status(404);

    res.format({
        'text/plain': function () {
            res.type('txt').send('Content not Found');
        },

        'text/html': function () {
            return res.render('404');
        },

        'application/json': function () {
            return res.json({err: 'content not found'});
        },
        'default': function () {
            log.warn('406 happens because of 404, confirmed', {
                headers: req.headers,
                ip: req.ip,
                username: req.user ? req.user.name : null,
                url: req.url
            });
            return res.status(404).send('Content not Found');
        }
    });
});

app.use(function (err:any, req:any, res:any, next:Function) {
    if (err) {
        log.error('Uncaught exception', {errName: err.name, errMsg: err.message, stack: err.stack, ip: req.ip});
    }
    res.status(500);
    // todo: http 500 page
    res.send('sorry, something blew up :|');
});


// === hackish
/*
 import model = require('./model/index');
 let request = require('request-promise'),
 seneca = require('seneca'),
 Promise = require('bluebird'),
 settings = require('../twitch/settings');

 let bot = seneca().client({
 host: settings.microservice.host,
 port: settings.microservice.port,
 type: 'tcp'
 });

 function getChannelsFromDatabase() {
 return model.User.find({twitch: {$exists: 1}}).distinct('twitch.channel').lean().exec();
 }

 function getChannelsFromTwitch(channels:any[]) {
 return new Promise(function (resolve:any, reject:any) {
 request({
 url: `https://api.twitch.tv/kraken/streams/?channel=${channels.join(',')}`,
 headers: {
 'Accept': 'application/vnd.twitchtv.v3+json',
 'client_id': 'kza7jkb90h6fu09m51zfk3a1s6ix8ev'
 },
 json: true
 }).then(function (result:any) {
 resolve({channels: channels, result: result});
 }).catch(function (err:any) {
 reject(err);
 });
 });
 }

 function tellTwitchBot(obj:any) {

 let online:string[] = [];
 for (let i = 0; i < obj.result.streams.length; i++) {
 online.push(obj.result.streams[i].channel.display_name);
 }
 for (let i = 0; i < obj.channels.length; i++) {
 let channel = obj.channels[i];
 if (online.indexOf(channel) > -1) {
 bot.act({role: 'bot', cmd: 'join', channel: channel});
 } else {
 bot.act({role: 'bot', cmd: 'leave', channel: channel});
 }
 }

 }

 function updateTwitchBot() {
 getChannelsFromDatabase()
 .then(getChannelsFromTwitch)
 .then(tellTwitchBot);
 }

 updateTwitchBot();
 setInterval(updateTwitchBot, 30000);*/
