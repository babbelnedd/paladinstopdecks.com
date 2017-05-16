'use strict';

var $ = window.jQuery = window.$ = require('jquery'),
    api = require('../lib/api'),
    rivets = require('rivets'),
    comments = require('../lib/comments');

$(function () {

    var path = window.location.pathname.substring(1, window.location.pathname.length).split('/');

    var champion = path[1],
        deck = path[2],
        deckId = deck.split('-')[0],
        $rating = $('.rating'),
        hasVoted = {
            up: true,
            down: false
        },
        $upvote = $('.upvote'),
        $downvote = $('.downvote'),
        $favorite = $('.favorite'),
        $alertVote = $('#alert_vote'),
        $alertFavorite = $('#alert_favorite'),
        $twitterDeck = $('#twitter_deck');

    comments.init($('#comments'), champion + '_' + deck.substring(0, deck.indexOf('-')), 'deck');

    var data = {
        rating: 1,
        canVote: false
    };
    rivets.bind($rating, data);

    function update(vote) {
        return function (newRating) {
            $upvote.removeClass('voted');
            $downvote.removeClass('voted');

            hasVoted.up = false;
            hasVoted.down = false;

            if (vote === 1) {
                hasVoted.up = true;
                $upvote.addClass('voted');
            } else if (vote === -1) {
                hasVoted.down = true;
                $downvote.addClass('voted');
            }

            var prefix = parseInt(newRating) > 0 ? '+' : '';
            data.rating = prefix + String(newRating);
        }
    }

    function updateFavorite(isFavorite) {
        if (isFavorite) {
            $favorite.addClass('is-favorite');
        } else {
            $favorite.removeClass('is-favorite');
        }
    }

    $upvote.click(function () {
        if (!data.canVote) {
            return;
        }
        if (hasVoted.up) {
            api.vote(deck, 0).then(update(0));
        } else {
            api.upvote(deck).then(update(1));
        }
    });
    $downvote.click(function () {
        if (!data.canVote) {
            return;
        }
        if (hasVoted.down) {
            api.vote(deck, 0).then(update(0));
        } else {
            api.downvote(deck).then(update(-1));
        }
    });
    $favorite.click(function () {
        if (!data.canVote) {
            return $alertFavorite.show();
        }
        api.deck.favorite(deckId).then(function (isFavorite) {
            updateFavorite(isFavorite);
        })
    });
    $upvote.add($downvote).click(function () {
        if (!data.canVote) {
            $alertVote.show();
        }
    });

    $.when(api.getRating(deck), api.hasVoted(deck), api.isAuthenticated(), api.deck.isFavorite(deckId))
        .then(function (rating, vote, canVote, isFavorite) {
            data.canVote = canVote;
            update(vote)(rating);
            updateFavorite(isFavorite);
        });

    $twitterDeck.click(function () {
        if (typeof ga !== 'undefined') {
            ga('send', 'social', 'Twitter', 'Tweet Deck', window.location.href);
        }
    });

});