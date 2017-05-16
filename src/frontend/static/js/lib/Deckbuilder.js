'use strict';

var $ = require('jquery');
var normalize = require('../../../../shared/normalize');
var sortByTier = require('../../../../shared/sortByTier');
var api = require('../lib/api');
var hbsstatic = require('./hbs.static');
var cardtip = require('./cardtip');
require('./jquery.eventemitter');

function DeckBuilder(opts) {
    var self = this,
        i = 0;

    this.deck = [];

    this._cards = opts.cards || [];
    this.cards = {};
    this.limit = opts.limit || 15;
    this.template = opts.template;
    this.bigTemplate = opts.bigTemplate;
    this.$deck = opts.$deck;
    this.$deckName = opts.$deckName;
    this.$deckType = opts.$deckType;
    this.$deckVisibility = opts.$deckVisibility;
    this.isAuthenticated = false;
    this.originalDeck = opts.deck || {};
    this.warn = opts.warn || {
            titleMissing: $('#title_missing'),
            cardLimit: $('#card_limit'),
            notEnoughCards: $('#not_enough_cards'),
            notAuthenticated: $('#not_authenticated'),
            panel: $('#warn_panel')
        };

    for (i = 0; i < this._cards.length; i++) {
        this.cards[this._cards[i].normalizedName] = this._cards[i];
    }

    api.isAuthenticated().then(function (isAuthenticated) {
        self.isAuthenticated = isAuthenticated;
        // to update warnings
        self.canPublish();
    });

    this.$deckName.on('keyup cut paste change', function () {
        self._updateValidation();
    });
    this.on('add', function (e, card) {
        self._updateValidation();
        // to update warnings
        self.canPublish();
        cardtip({offset: {x: -220, y: 50}});
    });

    self._render();

    if (opts.deck) {
        for (i = 0; i < opts.deck.cards.length; i++) {
            for (var j = 0; j < this._cards.length; j++) {
                if (this._cards[j]._id === opts.deck.cards[i]) {
                    this.addCard(this._cards[j].normalizedName);
                    break;
                }
            }
        }
    }
}

DeckBuilder.prototype = {
    _hideWarnings: function () {
        for (var key in this.warn) {
            if (this.warn.hasOwnProperty(key)) {
                this.warn[key].hide();
            }
        }
    },
    _getDeckObj: function () {
        var cardIDs = [];
        for (var i = 0; i < this.deck.length; i++) {
            cardIDs.push(this.deck[i]._id);
        }
        var obj = {
            name: this.$deckName.val(),
            cards: cardIDs,
            champion: this.deck.length ? this.deck[0].normalizedChampion : undefined,
            description: typeof tinyMCE !== 'undefined' && tinyMCE.activeEditor !== null ? tinyMCE.activeEditor.getContent() : null,
            //type: this.$deckType.val(),
            visibility: this.$deckVisibility.val()
        };
        obj.normalizedName = normalize(obj.name);
        obj.normalizedChampion = normalize(obj.champion);
        obj._champion = this.deck.length ? this.deck[0]._champion : undefined;
        if (this.originalDeck) {
            obj._id = this.originalDeck._id;
        }
        return obj;
    },
    _buildHTML: function (cards) {
        var html = '';
        for (var i = 0; i < cards.length; i++) {
            if (cards[i] !== undefined) {
                var card = cards[i];
                html += this.template({card: card, static: hbsstatic, tooltip: true});
            }
        }
        html += '<div class="clearfix"></div>';
        return html;
    },
    _highlight: function (card) {
        $('#' + card.normalizedName + ' .overlay')
            .stop()
            .fadeOut(300)
            .fadeIn(300);
    },
    _render: function () {
        var self = this;
        self.$deck.html(self._buildHTML(self.deck));

        $('.card-container').each(function (index, el) {
            var id = $(el).attr('id');
            if (id !== undefined) {
                $(el).click(function () {
                    self.remCard(id);
                });
            }
        });
    },
    _updateValidation: function () {
        if (this.canPublish()) {
            $('#btn-save').removeClass('disabled');
        } else {
            $('#btn-save').addClass('disabled');
        }
    },
    inDeck: function (card) {
        for (var i = 0; i < this.deck.length; i++) {
            if (this.deck[i] === card) {
                return true;
            }
        }
        return false;
    },
    addCard: function (normalizedName) {
        var card = this.cards[normalizedName];
        if (!this.inDeck(card) && this.deck.length < this.limit) {
            this.deck.push(card);
            this.deck = sortByTier(this.deck);
            this._render();
            this.emit('add', card);
        } else {
            this._highlight(card);
        }
    },
    remCard: function (normalizedName) {
        var card = this.cards[normalizedName];
        if (card !== undefined) {
            this.deck.splice(this.deck.indexOf(card), 1);
            $('.cardtip').remove();
            this._render();
            this.emit('remove', card);
        }
    },
    canPublish: function () {

        this._hideWarnings();
        var requirements = {
            nameMinLen: 5,
            nameMaxLen: 125,
            deckMinLen: 1,
            deckMaxLen: 1000000
        };
        if (this.isAuthenticated === false) {
            this.warn.panel.show();
            this.warn.notAuthenticated.show();
            return false;
        }
        var obj = this._getDeckObj();
        var name = obj.name.trim();
        if (typeof name !== 'string' || name.length < requirements.nameMinLen || obj.name.length > requirements.nameMaxLen) {
            this.warn.panel.show();
            this.warn.titleMissing.show();
            return false;
        }
        if (obj.cards.length < requirements.deckMinLen) {
            this.warn.panel.show();
            this.warn.notEnoughCards.show();
            return false;
        }
        if (obj.cards.length === requirements.deckMaxLen) {
            this.warn.panel.show();
            this.warn.cardLimit.show();
        }

        return true;
    },
    publish: function (success, error) {
        if (!this.canPublish()) {
            return;
        }

        $.ajax({
            method: 'POST',
            url: '/deckbuilder/publish',
            data: this._getDeckObj(),
            dataType: 'json',
            success: success,
            error: error
        });
    },
    update: function (success, error) {
        if (!this.canPublish()) {
            return;
        }

        $.ajax({
            method: 'PUT',
            url: '/deckbuilder',
            data: this._getDeckObj(),
            dataType: 'json',
            success: success,
            error: error
        })
    }
};

$.extend(DeckBuilder.prototype, $.eventEmitter);

module.exports = DeckBuilder;