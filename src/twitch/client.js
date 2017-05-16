'use strict';

var Twitch = require('tmi.js'),
    on = require('./eventhandler'),
    settings = require('./settings'),
    clientOptions = {
        options: {
            debug: false
        },
        connection: {
            random: 'chat',
            reconnect: true
        },
        identity: {
            username: settings.auth.username,
            password: settings.auth.password
        },
        logger: require('./log')
    };

var client = new Twitch.client(clientOptions);

client.on('chat', on.chat);
client.on('connected', on.connected);
client.on('connecting', on.connecting);
client.on('disconnected', on.disconnected);
client.on('logon', on.logon);
client.on('ping', on.ping);
client.on('pong', on.pong);
client.on('reconnect', on.reconnect);
client.on('whisper', on.whisper);

module.exports = client;
module.exports.state = {
    CONNECTING: 'CONNECTING',
    OPEN: 'OPEN',
    CLOSING: 'CLOSING',
    CLOSED: 'CLOSED'
};