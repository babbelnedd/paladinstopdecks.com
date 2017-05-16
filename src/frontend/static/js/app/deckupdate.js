'use strict';
var $ = window.jQuery = window.$ = require('jquery'),
    hbs = require('../lib/hbs'),
    hbsstatic = require('../lib/hbs.static'),
    md = require('../../../../shared/md'),
    api = require('../lib/api'),
    rivets = require('rivets'),
    mapTier = require('../../../../shared/mapTier'),
    sortByTier = require('../../../../shared/sortByTier'),
    validateTitle = require('../lib/deck/validateTitle'),
    redirect = require('../lib/redirect'),
    scrollToSelector = require('../lib/scrollToSelector'),
    capitalize = require('../lib/capitalize');
require('../lib/vendor/bootstrap.markdown'); // $.markdown
require('../lib/vendor/jquery.tablesorter'); // $.tablesorter
require('../lib/vendor/form.jquery');  // $.ajaxSubmit

$(function () {
    var $title = $('#title'),
        $saveDeck = $('#save_deck'),
        $id = $('#_id'),
        $modal = $('#card_modal'),
        $deckUpdate = $('.deck-update'),
        $description = $('#description'),
        $spinner = $('#spinner'),
        $imageInput = $('#image_input'),
        $imageForm = $('#image_form'),
        data = {
            tiers: [],
            deck: {},
            cards: [],
            championCards: [],
            neutralCards: [],
            substitutions: []
        },
        spinnerData = {text: ''},
        template, description = '';

    if ($id.length < 1) {
        return;
    }

    $.tablesorter.addParser({
        id: 'name',
        is: function () {
            return false;
        },
        format: function (s) {
            return s.split('|')[0];
        },
        type: 'text'
    });

    $.tablesorter.addParser({
        id: 'tier',
        is: function () {
            return false;
        },
        format: function (s) {
            return mapTier(s);
        },
        type: 'numeric'
    });

    rivets.formatters.length = function (value) {
        if (!!value && value.length) {
            return value.length;
        } else {
            return 0;
        }
    };

    rivets.formatters.gt = function (value, arg) {
        if (value && value.length) {
            return value.length > arg;
        } else {
            return false;
        }
    };

    rivets.formatters.eq = function (value, arg) {
        return value === arg;
    };

    rivets.binders.picked = function (el) {
        setTimeout(function () {
            var row = $(el).data('row'),
                col = $(el).data('col');

            if (data.deck.levels[row] && data.deck.levels[row].indexOf(col) > -1) {
                $(el).addClass('lvl pickable picked');
            } else {
                $(el).addClass('lvl pickable');
            }
        }, 50);
    };

    rivets.binders['add-tier-class'] = function (el, value) {
        $(el).addClass('col-' + value);
    };

    rivets.binders.rectanglecard = function (el, value) {
        var size = $(el).data('size'),
            showTitle = $(el).data('show-title');
        $(el).html(template({
            card: value,
            class: size ? size : '',
            showTitle: showTitle,
            static: hbsstatic
        }));
    };

    rivets.bind($deckUpdate, data);

    $description.markdown({
        autofocus: false,
        savable: false,
        iconlibrary: 'fa',
        resize: 'vertical',
        fullscreen: {
            enable: true
        },
        hiddenButtons: ['Image'],
        additionalButtons: [[
            {
                name: 'groupLink',
                data: [
                    {
                        name: 'cmdVideo',
                        title: 'YouTube',
                        icon: 'fa fa-youtube-play',
                        callback: function (e) {
                            // Give ![] surround the selection and prepend the image link
                            var link;

                            link = prompt('Insert YouTube Link', 'https://');
                            if (/.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/.test(link)) {
                                e.replaceSelection('[yt:' + link + ']');
                            }
                        }
                    },
                    {
                        name: 'cmdUpload',
                        title: 'Add Image',
                        icon: 'fa fa-photo',
                        callback: function (e) {
                            spinnerData.text = 'Uploading Image ..';
                            $imageInput.val(null);
                            $imageForm.on('submit', function () {
                                $spinner.show();
                                $(this).ajaxSubmit({
                                    error: function (xhr) {
                                        $imageForm.off('submit');
                                        $spinner.hide();
                                        console.info('errr', xhr.status);
                                    },
                                    success: function (response) {
                                        $imageForm.off('submit');
                                        $spinner.hide();
                                        if (response.url) {
                                            e.replaceSelection('![enter image description here](' + response.url + ')');
                                        }
                                    }
                                });
                                return false;
                            });
                            $imageInput.click();
                        }
                    }
                ]
            }
        ]],
        onPreview: function (e) {
            return md(e.getContent());
        }
    });

    $imageInput.change(function () {
        if (!this.files || this.files.length !== 1) {
            return {err: 'No File selected'};
        }
        var file = this.files[0];
        if (file.size / 1024 / 1024 > 10) {
            return {err: 'Max. File Size 10mb'};
        }
        $imageForm.submit();
    });

    function initialized() {
        $modal.find('table').tablesorter({
            sortList: [[1, 0], [0, 0]],
            headers: {
                0: {sorter: 'name'}
            }
        });
        $spinner.hide();
        rivets.bind($spinner, spinnerData);
    }

    function addCard(id) {
        var d = $.Deferred();
        var cards = data.cards.concat(data.neutralCards);
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].id === id) {
                data.deck.cards.push(cards[i]);
                data.deck.cards = sortByTier(data.deck.cards);
                data.deck = JSON.parse(JSON.stringify(data.deck));
                return d.resolve(id);
            }
        }

        return d.promise();
    }

    function addSub(origId, id) {
        var orig, sub;
        for (var i = 0; i < data.cards.length; i++) {
            if (data.cards[i].id === origId) { orig = data.cards[i]; }
            if (data.cards[i].id === id) { sub = data.cards[i]; }
        }
        data.deck.substitutions.push({orig: origId, sub: id, text: ' '});
        data.substitutions.push({orig: orig, sub: sub});
    }

    function hideModalTierId(id, tier) {
        $modal.find('[data-tier]').each(function () {
            if ((!!tier && $(this).data('tier') !== tier)
                || $(this).data('add-card') === id) {
                $(this).hide();
            } else {
                $(this).show();
            }
        });
    }

    function dataDeckCardAdd() {
        /*
         important:
         FOR FUCKS SAKE
         DONT FUCKING USE .data('') HERE
         BECAUSE ITS FUCKING CACHED OR SO; WHATEVER DONT FUCKING USE IT
         */
        // var tier = $(this).attr('data-tier'),
        // var tier = mapTier($(this).attr('data-tier')),
        var tier = $(this).attr('data-tier'),
            id = $(this).attr('data-deck-card'),
            hasLeg = false;

        // hideModalTierId(id);
        $modal.find('[data-add-card]').show();
        for (var i = 0; i < data.deck.cards.length; i++) {
            if (tier.toLowerCase() !== 'legendary') {
                if (data.deck.cards[i].tier.toLowerCase() === 'legendary') {
                    hasLeg = true;
                }
            }
            $modal.find('[data-add-card="' + data.deck.cards[i]._id + '"]').hide();
        }
        if (hasLeg === true) {
            $modal.find('[data-tier="legendary"]').hide();
        }

        $modal.find('[data-add-card]').click(function () {
            var newId = $(this).attr('data-add-card');
            data.deck.cards = data.deck.cards.filter(function (c) {
                return c.id !== id;
            });

            // remove subs for the replaced cards
            data.substitutions = data.substitutions.filter(function (s) {
                return s.orig.id !== id;
            });
            data.deck.substitutions = data.deck.substitutions.filter(function (s) {
                return s.orig !== id;
            });
            data.substitutions = JSON.parse(JSON.stringify(data.substitutions));
            data.deck = JSON.parse(JSON.stringify(data.deck));

            addCard(newId).then(function () {
                $modal.modal('hide');
            });
        });
        $modal.modal('show');
    }

    function getCard(id) {
        for (var i = 0; i < data.cards.length; i++) {
            if (data.cards[i].id === id) {
                return data.cards[i];
            }
        }
        return null;
    }

    function tryToPickLevel(row, col) {
        var i, j, abrf = 0;
        for (j = 0; j < data.deck.levels.length; j++) {
            if (j === row) {continue;}
            if (data.deck.levels[j].length === 3) { abrf++; }
        }
        var allButRowFull = abrf === (data.deck.levels.length - 1);

        for (j = 0; j < data.deck.levels.length; j++) {
            for (i = 0; i < data.deck.levels[j].length; i++) {
                if (j === row && data.deck.levels[j][i] === col) {
                    var index = data.deck.levels[row].indexOf(col);
                    data.deck.levels[row].splice(index, 1);
                    return false;
                }
                if (data.deck.levels[j][i] === col) {
                    return false;
                }
                if (!allButRowFull && (data.deck.levels[row][i] === col - 1 || data.deck.levels[row][i] === col + 1)) {
                    return false;
                }
            }
        }
        if (data.deck.levels[row].length === 3) {
            return false;
        }
        data.deck.levels[row].push(col);
        return true;
    }

    hbs.getPartial('rectangleCard').then(function (_template) {
        template = _template;

        api.card.getAll($('#champion').val()).then(function (cards) {
            api.card.getNeutral().then(function (neutralCards) {
                data.championCards = cards;
                data.neutralCards = neutralCards;
                data.cards = cards.concat(neutralCards);
                api.deck.getById($('#_id').val()).then(function (deck) {
                    data.deck = JSON.parse(JSON.stringify(deck));
                    var levels = [];
                    for (var i = 0; i < data.deck.levels.length; i++) {
                        levels.push(data.deck.levels[i].map(Number));
                    }
                    data.deck.levels = levels;

                    data.deck.cards = []; // reset cards
                    deck.cards.forEach(addCard);
                    deck.substitutions.forEach(function (sub) {
                        var _orig = getCard(sub.orig),
                            _sub = getCard(sub.sub);
                        if (_orig !== null && _sub !== null) {
                            data.substitutions.push({orig: _orig, sub: _sub, text: sub.text});
                        }
                    });
                    initialized();
                });
            });
        });
    });

    $title.on('change keyup', function () {
        $title.removeClass('error');
        $title.removeClass('success');
        if (validateTitle($title.val())) {
            $title.addClass('success');
        } else {
            $title.addClass('error');
        }
    });

    $deckUpdate.on('click', '[data-deck-card]', dataDeckCardAdd);

    $deckUpdate.on('click', '[data-add-sub]', function () {
        // var tier = mapTier($(this).data('tier')),
        var tier = $(this).data('tier'),
            id = $(this).attr('data-add-sub');

        hideModalTierId(id);
        // hide cards which are already subbed
        var e = [];
        for (var i = 0; i < data.deck.substitutions.length; i++) {
            if (data.deck.substitutions[i].orig === id) {
                e.push(data.deck.substitutions[i].sub);
            }
        }
        $modal.find('[data-tier]').each(function () {
            if (e.indexOf($(this).data('add-card')) !== -1) {
                $(this).hide();
            }
        });

        $modal.find('[data-add-card]').click(function () {
            var newId = $(this).attr('data-add-card');
            addSub(id, newId);
            $modal.modal('hide');
        });
        $modal.modal('show');

    });

    $deckUpdate.on('click', '[data-remove-sub]', function () {
        var id = $(this).attr('data-orig'),
            subId = $(this).attr('data-sub');
        data.substitutions = data.substitutions.filter(function (s) {
            return !(s.orig.id === id && s.sub.id === subId);
        });
        data.deck.substitutions = data.deck.substitutions.filter(function (s) {
            return !(s.orig === id && s.sub === subId);
        });
        data.substitutions = JSON.parse(JSON.stringify(data.substitutions));
        data.deck = JSON.parse(JSON.stringify(data.deck));
    });

    $saveDeck.click(function () {
        var cards = [];
        for (var i = 0; i < data.deck.cards.length; i++) {
            cards.push(data.deck.cards[i].id);
        }

        var substitutions = [];
        for (var i = 0; i < data.substitutions.length; i++) {
            substitutions.push({
                orig: data.substitutions[i].orig.id,
                sub: data.substitutions[i].sub.id,
                text: data.substitutions[i].text
            });
        }

        spinnerData.text = 'Saving Deck';
        $spinner.show();

        api.deck.update({
            _id: $id.val(),
            cards: cards,
            levels: data.deck.levels,
            name: $title.val(),
            //description: description,
            description: $description.data('markdown').getContent(),
            substitutions: substitutions
        }).then(function (result) {
            if (result.hasOwnProperty('err')) {
                // timeout to avoid ugly flashing of spinner
                setTimeout(function () {
                    var $alert = $('#alert');
                    $alert.find('p').text(result.err);
                    $alert.show();
                    scrollToSelector($alert, -3000);
                    $spinner.hide()
                }, 250);
            }
            if (result.hasOwnProperty('url')) {
                redirect(result.url);
            }
        });
    });

    $modal.on('hidden.bs.modal', function () {
        $modal.find('[data-tier]').show();
        $modal.find('[data-add-card]').off('click');
        $modal.find('*').off('click');
    });

    $('body').on('click', '.levels li[data-row]', function () {
        var row = $(this).data('row'),
            col = $(this).data('col');
        if (tryToPickLevel(row, col) === true) {
            $(this).addClass('picked');
        } else {
            $(this).removeClass('picked');
        }
    });

});