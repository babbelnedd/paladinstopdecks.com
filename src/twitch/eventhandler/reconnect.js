'use strict';

var log = require('../log');

/**
 * Trying to reconnect to server.
 * @return {undefined}
 */
module.exports = function onReconnect() {
    log.info('Trying to reconnect to Twitch Server');
};