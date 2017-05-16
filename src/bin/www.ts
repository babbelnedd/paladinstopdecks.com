///<reference path="../backend/typings/node/node.d.ts"/>
'use strict';
import {DatabaseConfiguration} from '../backend/db/DatabaseConfiguration';
import {Database} from '../backend/db/index';
import ErrnoException = NodeJS.ErrnoException;

import http = require('http');
import path = require('path');
import DataLoader = require('../backend/DataLoader');
import log = require('../backend/log');

let npid = require('npid');
let cfg = new DatabaseConfiguration(require('../auth').database);

let db = new Database(cfg);
let port = 3000;

db.on('error', onDatabaseError);
db.on('ready', init);
db.connect();

function init() {
    if (process.platform !== 'win32' && process.env.NODE_ENV === 'production') {
        let pid:any = undefined;

        let onStop = function (code:number, msg?:string) {
            return function (err?:any) {
                if (err) {
                    log.critical(msg, err);
                }
                if (pid) {
                    pid.remove();
                }
                process.exit(1);
            };
        };

        process.on('uncaughtException', onStop(1, 'Uncaught Exception!'));
        process.on('SIGINT', onStop(0));

        try {
            // todo: pidfile to settings.json or similiar
            pid = npid.create('/var/run/paladinstopdecks/paladinstopdecks.pid');
            pid.removeOnExit();
        } catch (err) {
            log.critical('Failed to start app', err);
            process.exit(1);
        }
    }

    let dataRoot = path.join(path.dirname(path.dirname(__dirname)), 'data');
    DataLoader.loadArticles(path.join(dataRoot, 'articles'))
        .then(DataLoader.loadChampionsAsync(path.join(dataRoot, 'champions')))
        .then(DataLoader.loadCardsAsync(path.join(dataRoot, 'cards')))
        // .then(DataLoader.loadPatchesAsync(path.join(dataRoot, 'patch')))
        .catch(function (err:any) {
            log.critical('Failed to start app', err);
        })
        .then(start);
}

function start():void {
    let cache = require('../backend/utils/cache');
    let app = require('../backend/app');

    cache.delByPattern('*');

    app.set('port', port);
    let server = http.createServer(app);

    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);

    /* // SHIFT TWITTER
     let Twitter = require('twitter'),
     client:any = null,
     connected:any[] = [],
     _stream:any = null;

     // iholdshift twitter strimm
     let io = require('socket.io').listen(server);
     io.sockets.on('connection', function (socket:any) {
     function doit() {
     console.info('ayy new connection');

     connected.push(socket);
     if (client === null) {
     console.info('client is null');
     client = new Twitter({
     consumer_key: 'BY5BRK9EAhDCB5Sn4k8LlECzV',
     consumer_secret: 'e0Z6mxoxmpDRo8i83pdozxhLNVAO4OjKTFQNLXAiajno6TJwjd',
     access_token_key: '1488627655-uo6wmZaxDWDQGL2zUkPn440s9gTz3yAlmyi3qGM',
     access_token_secret: 'PI0OdXUPUwz35wgrZAprnqGuJHHId2VR9ib6L8JneZhpk'
     });
     }
     if (_stream === null) {
     console.info('_stream is null');
     client.stream('statuses/filter', {track: 'SunkenCitySalt'}, function (stream) {
     _stream = stream;
     stream.on('data', function (tweet:any) {
     connected.forEach(function (socket:any) {
     socket.emit('tweet', tweet);
     });
     });

     stream.on('error', function (error) {
     log.error('oh shiiit', error.stack);
     });
     });
     }

     socket.on('disconnect', function (socket:any) {
     console.info('byeee');
     let index = connected.indexOf(socket);
     connected.splice(index, 1);

     if (connected.length < 1 && _stream !== null) {
     try {
     console.info('close strimm');
     _stream.destroy();
     _stream = null;
     } catch (err) {
     console.info('autsch', err);
     }
     }
     });
     }

     setTimeout(doit, 1000);
     });
     */

    function onError(error:ErrnoException) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        let bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                log.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                log.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    function onListening() {
        let addr = server.address();
        let bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        log.info('Listening on ' + bind);
    }
}

function onDatabaseError(err:any):void {
    log.error('Could not establish a Connection to the database', err);
    process.exit(1);
}