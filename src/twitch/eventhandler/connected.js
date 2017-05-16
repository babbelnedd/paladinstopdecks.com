'use strict';

var log = require('../log');

/**
 * Connected to server.
 * @param {string} address - Remote address
 * @param {number} port - Remote port
 * @return {undefined}
 */
module.exports = function onConnected(address, port) {
    var client = this;
    log.info('Connected to Twitch Server', {address: address, port: port});
};