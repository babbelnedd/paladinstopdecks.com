'use strict';

var log = require('../log'),
    commands = require('../commands'),
    settings = require('../settings');

/**
 * Received message on channel.
 * @param {string} channel - Channel name
 * @param {object} user - User object
 * @param {string} message - Message received
 * @param {boolean} self - Message was sent by the client
 * @return {undefined}
 */
module.exports = function onChat(channel, user, message, self) {
    if (self) {
        return;
    }
    // client.say(channel, 'wuaat');

    log.info('Message Received', {channel: channel, user: user.username, message: message});
    if (typeof message !== 'string' || message.charAt(0) !== '!') {
        console.info('SKIPPED MESSAGE');
        return;
    }
    var result = commands.parse(message);
    // console.info('result?', result);
    if (result !== null) {
        result.cmd(this, channel, result.arg);
    }
    // 1. parse message
    // 2. return if it's not a command
    // 3. get command result
    // 4. answer
};