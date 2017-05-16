'use strict';

var $ = window.jQuery = window.$ = require('jquery');

$(function () {

    var wto,
        $search = $('.site-search'),
        $result = $('.site-search-result'),
        cache = {},
        delay = 500;

    function showResults() {
        $search.addClass('has-results');
        $(document).on('click', hideResults);
    }

    function hideResults() {
        $search.removeClass('has-results');
        $(document).off('click', hideResults);
    }

    function appendResults(result) {
        var appended = false;
        $result.html('');
        result.cards.forEach(function (card) {
            appended = true;
            $result.append('<li><a href="' + card.url + '" class="title col-' + card.info.tier + '">' + card.title + '</a><span class="type">' + card.info.tier + ' Card</span></li>');
        });
        result.news.forEach(function (article) {
            appended = true;
            $result.append('<li><a href="' + article.url + '" class="title">' + article.title + '</a><span class="type">Article</span></li>');
        });
        result.decks.forEach(function (deck) {
            appended = true;
            $result.append('<li><a href="' + deck.url + '" class="title">' + deck.title + '</a><span class="type">Deck</span></li>');
        });
        result.users.forEach(function (user) {
            appended = true;
            $result.append('<li><a href="' + user.url + '" class="title">' + user.title + '</a><span class="type">User</span></li>');
        });
        result.champions.forEach(function (champ) {
            appended = true;
            $result.append('<li><a href="' + champ.url + '" class="title">' + champ.title + '</a><span class="type">Champion</span></li>');
        });

        if (!appended) {
            $result.append('<li><span class="title">No Results ..</span></li>')
        }
        showResults();
    }

    function search(text) {
        return function () {
            if (typeof text === 'string' && text.length > 2) {
                if (cache.hasOwnProperty(text)) {
                    return appendResults(cache[text]);
                }
                $.get('/api/search/' + text).then(function (result) {
                    cache[text] = result;
                    appendResults(result);
                });
            }
        }
    }

    $(document).on('click', '.site-search', function () {
        search($(this).val())();
    });
    $(document).on('keyup', '.site-search', function (e) {
        clearTimeout(wto);
        wto = setTimeout(search($(this).val()), delay);
    });

});