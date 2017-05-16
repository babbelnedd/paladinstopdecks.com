'use strict';
var seneca = require('./seneca'),
    client = require('./client'),
    settings = require('./settings'),
    utils = require('./node_modules/tmi.js/lib/utils');

module.exports.init = function () {
    seneca()
        .add({role: 'bot', cmd: 'join'}, function (msg, respond) {
            if (client.readyState() !== client.state.OPEN) {
                return respond({err: true}, null);
            }

            if (client.getChannels().indexOf(utils.normalizeChannel(msg.channel)) > -1) {
                return respond(null, {joined: false, msg: 'Already in Channel'});
            }
            client.join(msg.channel);
            client.say(msg.channel, settings.JOIN_MESSAGE);
            respond(null, {joined: true, msg: 'Joined Channel'});

        })
        .add({role: 'bot', cmd: 'leave'}, function (msg, respond) {
            if (client.readyState() !== client.state.OPEN) {
                return respond({err: true}, null);
            }

            if (client.getChannels().indexOf(utils.normalizeChannel(msg.channel)) === -1) {
                return respond(null, {left: false, msg: 'Not in Channel'});
            }

            client.say(msg.channel, settings.LEAVE_MESASGE);
            client.part(msg.channel);
            respond(null, {left: true, msg: 'Left Channel'});

        });

    client.connect();

};