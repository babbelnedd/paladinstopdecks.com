'use strict';

var $ = window.jQuery = window.$ = require('jquery');

function get(url) {
    var d = $.Deferred();

    $.get(url).then(function (result) {
        d.resolve(result);
    }, function () {
        d.resolve(false);
    });

    return d.promise();
}

$(function () {
    module.exports.isAuthenticated = function () {
        var d = $.Deferred();

        $.get('/api/auth/authenticated').then(function (result) {
            d.resolve(result);
        }, function () {
            d.resolve(false);
        });

        return d.promise();
    };
    module.exports.getDeck = function (name) {
        var d = $.Deferred();

        $.get('/api/deck/' + name).then(function (result) {
            d.resolve(result);
        }, function () {
            d.resolve(null);
        });

        return d.promise();
    };
    module.exports.getCards = function (champion) {
        var d = $.Deferred();

        $.get('/api/champion/' + champion + '/cards').then(function (result) {
            d.resolve(result);
        }, function () {
            d.resolve([]);
        });

        return d.promise();
    };
    var vote = module.exports.vote = function (deck, n) {
        var d = $.Deferred();
        $.ajax({
            method: 'PUT',
            url: '/api/deck/' + deck + '/vote',
            data: {vote: n},
            success: function (res) {
                d.resolve(res.rating);
            }
        });
        return d.promise();
    };
    module.exports.upvote = function (deck) {
        return vote(deck, 1);
    };
    module.exports.downvote = function (deck) {
        return vote(deck, -1);
    };
    module.exports.getRating = function (deck) {
        var d = $.Deferred();

        $.ajax({
            method: 'GET',
            url: '/api/deck/rating/' + deck,
            success: function (rating) {
                d.resolve(rating);
            }
        });

        return d.promise();
    };
    module.exports.hasVoted = function (deck) {
        var d = $.Deferred();

        $.ajax({
            method: 'GET',
            url: '/api/deck/voted/' + deck,
            success: function (hasVoted) {
                d.resolve(hasVoted);
            }
        });

        return d.promise();
    };

    module.exports.avatar = function (username) {
        return get('/api/avatar/' + username);
    };

    module.exports.auth = {

        isAuthenticated: function () {
            return get('/api/auth/authenticated');
        },
        whoami: function () {
            return get('/api/auth/whoami');
        }

    };
    module.exports.comments = {
        post: function (data) {
            return $.ajax({
                method: 'POST',
                url: '/api/comments/',
                data: data
            });
        }
    };
    module.exports.notification = {
        'get': function (limit) {
            return $.ajax({
                method: 'GET',
                url: '/api/notifications',
                data: {
                    limit: limit || -1
                },
                headers: {
                    'Cache-Control': 'max-age=60'
                }
            });
        },
        seen: function (id) {
            return $.ajax({
                method: 'POST',
                url: '/api/notifications/seen',
                data: {
                    id: id
                }
            });
        }
    };
    module.exports.champion = {
        getCards: module.exports.getCards,
        getChampionStats: function (champion) {
            return get('/api/champion/' + champion + '/stats');
        }
    };
    module.exports.team = {
        getAll: function () {
            return get('/api/teams/');
        },
        newTeam: function (name) {
            return $.ajax({
                method: 'POST',
                url: '/api/teams/new',
                data: {
                    name: name
                }
            });
        },
        invite: function (name) {
            return $.ajax({
                method: 'POST',
                url: '/api/teams/invite',
                data: {
                    name: name
                }
            });
        },
        changeRole: function (uid, role) {
            return $.ajax({
                method: 'POST',
                url: '/api/teams/change-role',
                data: {
                    uid: uid,
                    role: role
                }
            });
        },
        kick: function (uid) {
            return $.ajax({
                method: 'POST',
                url: '/api/teams/kick',
                data: {
                    uid: uid
                }
            });
        },
        cancelInvite: function (uid) {
            return $.ajax({
                method: 'POST',
                url: '/api/teams/cancel-invite',
                data: {
                    uid: uid
                }
            });
        },
        getRoster: function () {
            return $.ajax({
                method: 'GET',
                url: '/api/teams/roster'
            });
        },
        findFreeAgents: function (query, limit) {
            return $.ajax({
                method: 'GET',
                url: '/api/teams/free-agents',
                data: {
                    q: query,
                    limit: limit
                }
            });
        }
    };
    module.exports.deck = {
        favorite: function (deckId) {
            return $.ajax({
                method: 'POST',
                url: '/api/deck/' + deckId + '/favorite'
            });
        },
        isFavorite: function (deckId) {
            return get('/api/deck/' + deckId + '/favorite');
        },
        submitNew: function (title, champion, cards) {
            return $.ajax({
                method: 'POST',
                dataType: 'json',
                url: '/deckbuilder/publish',
                data: {
                    name: title,
                    normalizedChampion: champion,
                    cards: cards
                }
            });
        },
        update: function (deck) {
            var d = $.Deferred();
            $.ajax({
                method: 'POST',
                url: '/deckbuilder/update',
                data: deck
            }).always(d.resolve);
            return d.promise();
        },
        getById: function (id) {
            return get('/api/deck/' + id);
        },
        getByUser: function (name) {
            return $.ajax({
                url: '/api/deck/user/' + name,
                method: 'POST'
            });
        }
    };
    module.exports.card = {
        getAll: module.exports.getCards,
        getById: function (id) {
            return get('/api/card/' + id);
        },
        getNeutral: function () {
            return get('/api/card/neutral');
        }
    };
    module.exports.tierlists = {
        create: function (tierlist) {
            return $.ajax({
                method: 'POST',
                url: '/api/tierlists',
                data: tierlist
            });
        }
    };
});