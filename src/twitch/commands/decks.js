'use strict';

var model = require('../../backend/model/index'),
    cache = require('../../backend/utils/cache');

module.exports = function (client, channel, champion) {

    channel = channel.replace('#', '');

    model.User.find({'twitch.channel': channel}).lean().exec().then(function (user) {

        var url = 'https://paladinstopdecks.com/account/' + user.name + '/decks';
        client.say(channel, url);

    });

};