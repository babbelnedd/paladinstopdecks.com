'use strict';

var log = require('../log');

/**
 * Got disconnected from server.
 * @param {string} reason - Reason why you got disconnected
 * @return {undefined}
 */
module.exports = function onDisconnected(reason) {
    log.info('Got disconnected from Twitch Server', {reason: reason});
};