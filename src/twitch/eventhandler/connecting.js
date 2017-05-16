'use strict';

var log = require('../log');

/**
 * Connecting to a server.
 * @param {string} address - Remote address
 * @param {number} port - Remote port
 * @return {undefined}
 */
module.exports = function onConnecting(address, port) {
    log.info('Connecting to Twitch Server', {address: address, port: port});
};