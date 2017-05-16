'use strict';

var $ = window.jQuery = window.$ = require('jquery'),
    hbs = require('../lib/hbs'),
    hbsstatic = require('../lib/hbs.static'),
    api = require('../lib/api'),
    redirect = require('../lib/redirect'),
    rivets = require('rivets'),
    validateTitle = require('../lib/deck/validateTitle'),
    sortByTier = require('../../../../shared/sortByTier');

rivets.formatters.gt = function (value, arg) {
    return value.length > arg;
};

$(function () {
    var $card = $('[data-card="true"]'),
        $newDeck = $('#new_deck'),
        $resetDeck = $('#reset_deck'),
        $resetFilter = $('#reset_filter'),
        $deckInfo = $('.deck-info'),
        $saveDeck = $('#save_deck'),
        $deckTitle = $('#deck_title'),
        $champion = $('#normalized_champion'),
        filter = {
            name: $('#filter_name'),
            tier: $('#filter_tier'),
            ability: $('#filter_ability'),
            dmg: {
                operator: $('#filter_dmg_operator'),
                value: $('#filter_dmg_value')
            },
            hp: {
                operator: $('#filter_hp_operator'),
                value: $('#filter_hp_value')
            }
        },
        authenticated = false,
        template;

    var data = {
        count: {
            picked: 0,
            max: 5
        },
        cantSave: true,
        deck: []
    };

    function render() {
        var html = '';
        $card.removeClass('picked');

        for (var i = 0; i < data.deck.length; i++) {
            html += '<li class="float-left">' + template({
                    card: data.deck[i],
                    static: hbsstatic
                }) + '</li>';
        }

        $newDeck.html('').html(html);
        if (data.deck.length === 5) {
            $card.addClass('picked');
        } else {
            $card.removeClass('picked');
            data.deck.forEach(function (card) {
                if (card.tier.toLowerCase() === 'legendary') {
                    $('#cards [data-card="true"][data-tier="' + card.tier + '"]').addClass('picked');
                }
                $('#cards [data-card="true"][data-id="' + card._id + '"]').addClass('picked');
            });
        }
        update();
    }

    function addCard() {

        if (data.deck.length === 5) {
            return;
        }

        var name = $(this).data('name'),
            normalizedName = $(this).data('normalizedName'),
            _id = $(this).data('id'),
            tier = $(this).data('tier'),
            normalizedChampion = $(this).data('normalized-champion'),
            card = {
                normalizedName: normalizedName,
                normalizedChampion: normalizedChampion,
                _id: _id,
                name: name,
                tier: tier,
                imagePath: '/static/img/cards/' + (normalizedChampion ? normalizedChampion : 'neutral') + '/' + normalizedName + '.jpg'
            };

        for (var i = 0; i < data.deck.length; i++) {
            if (data.deck[i]._id === card._id) {
                return;
            }
            if (card.tier.toLowerCase() === 'legendary') {
                if (data.deck[i].tier === card.tier) {
                    return;
                }
            }
        }

        data.deck.push(card);
        data.deck = sortByTier(data.deck);
        render();
    }

    function removeCard() {
        var normalizedName = $(this).data('normalized-name'),
            index = -1;
        for (var i = 0; i < data.deck.length; i++) {
            if (data.deck[i].normalizedName === normalizedName) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            data.deck.splice(index, 1);
        }
        render();
    }

    function update() {
        if (filter.name.val() !== '' ||
            filter.tier.val() !== '' ||
            filter.ability.val() !== '' ||
            filter.dmg.value.val() !== '' ||
            filter.hp.value.val() !== '') {
            $resetFilter.show();
        } else {
            $resetFilter.hide();
        }
        if (data.deck.length > 0) {
            $resetDeck.show();
        } else {
            $resetDeck.hide();
        }

        data.count.picked = data.deck.length;
        data.cantSave = !authenticated || data.deck.length !== data.count.max || !validateTitle($deckTitle.val());
    }

    function resetDeck() {
        data.deck = [];
        render();
    }

    function resetFilter() {
        setTimeout(_filter, 50);
    }

    function _filter() {
        // filter by name
        var v = filter.name.val(),
            rx = new RegExp('.*' + v + '.*', 'i');
        $card.each(function () {
            var hidden = false, operator;

            if (filter.name.val() !== '' && !rx.test($(this).data('name'))) {
                hidden = true;
            }
            if (!hidden && filter.tier.val() !== '') {
                if ($(this).data('tier') !== filter.tier.val()) {
                    hidden = true;
                }
            }
            if (!hidden && filter.ability.val() !== '') {
                if ($(this).data('ability') !== filter.ability.val()) {
                    hidden = true;
                }
            }
            if (!hidden && filter.dmg.value.val() !== '') {
                operator = filter.dmg.operator.val();
                var dmg = parseInt($(this).data('dmg')),
                    filterDmg = filter.dmg.value.val();
                if (operator === 'gt' && dmg <= parseInt(filterDmg)) {
                    hidden = true;
                }
                if (operator === 'lt' && dmg >= parseInt(filterDmg)) {
                    hidden = true;
                }
                if (operator === 'eq' && dmg !== parseInt(filterDmg)) {
                    hidden = true;
                }
            }
            if (!hidden && filter.hp.value.val() !== '') {
                operator = filter.hp.operator.val();
                var hp = parseInt($(this).data('hp')),
                    filterhp = filter.hp.value.val();
                if (operator === 'gt' && hp <= parseInt(filterhp)) {
                    hidden = true;
                }
                if (operator === 'lt' && hp >= parseInt(filterhp)) {
                    hidden = true;
                }
                if (operator === 'eq' && hp !== parseInt(filterhp)) {
                    hidden = true;
                }
            }
            if (hidden) {
                $(this).addClass('hidden');
            } else {
                $(this).removeClass('hidden');
            }
        });
        update();
    }

    hbs.getPartial('rectangleCard').then(function (_template) {
        template = _template;
        $card.click(addCard);
        $resetDeck.click(resetDeck);
        $resetFilter.click(resetFilter);
        $newDeck.on('click', '[data-rectangle-card="true"]', removeCard);
        filter.name.on('keyup change', _filter);
        filter.tier.on('change', _filter);
        filter.ability.on('change', _filter);
        filter.dmg.operator.on('change', _filter);
        filter.dmg.value.on('keyup change', _filter);
        filter.hp.operator.on('change', _filter);
        filter.hp.value.on('keyup change', _filter);
        $deckTitle.on('keyup change', function () {
            $deckTitle.removeClass('error');
            $deckTitle.removeClass('success');

            if (validateTitle($deckTitle.val())) {
                $deckTitle.addClass('success');
            } else {
                $deckTitle.addClass('error');
            }
            update();
        });
        $saveDeck.click(function () {
            var d = [],
                champ = $champion.val();
            for (var i = 0; i < data.deck.length; i++) {
                d.push(data.deck[i]._id);
            }
            api.deck.submitNew($deckTitle.val(), champ, d).then(function (result) {
                if (result.hasOwnProperty('err')) {
                    $('#alert').show().find('p').text(result.err);
                } else {
                    redirect(result.editPath);
                }
            });
        });
    });

    api.isAuthenticated().then(function (_authenticated) {
        authenticated = _authenticated;
    });

    update();
    rivets.bind($deckInfo, data);

});