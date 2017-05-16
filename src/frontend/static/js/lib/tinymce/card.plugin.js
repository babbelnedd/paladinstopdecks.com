'use strict';

tinymce.PluginManager.add('card', function (editor, url) {
    var cards = editor.settings.cards,
        menu = [],
        popupCards = [],
        _tiers = [];

    function generateHTML(card) {
        return '<a class="stronger col-' + card.tier + '">' +
            '[card=' + card.normalizedChampion + '#' + card.normalizedName + ']' + card.name + '[/card]' +
            '</a>';
    }

    function addCard(card) {
        return function () {
            editor.execCommand('mceInsertContent', false, generateHTML(card));
            editor.windowManager.close();
        }
    }

    for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        if (_tiers.indexOf(c.tier) === -1) {
            _tiers.push(c.tier);
            menu.push({
                text: c.tier,
                menu: []
            });
        }

        for (var j = 0; j < menu.length; j++) {
            if (menu[j].text === c.tier) {
                menu[j].menu.push({text: c.name, onclick: addCard(c)})
            }
        }
    }

    for (var i = 0; i < cards.length; i++) {
        popupCards.push({
            text: cards[i].name,
            value: cards[i]
        });
    }

    editor.addMenuItem('card', {
        text: 'Insert Card',
        context: 'insert',
        menu: menu
    });

    var selectedCard = null;
    editor.addButton('card', {
        tooltip: 'Add Card',
        image: '/static/img/cards/cardback.png',
        onclick: function () {
            editor.windowManager.open({
                title: 'Add a Card to your Guide',
                body: [
                    {
                        type: 'listbox',
                        name: 'listbox',
                        label: 'Select a Card',
                        values: popupCards,
                        onselect: function () {
                            selectedCard = this.value();
                        }
                    }
                ],
                buttons: [
                    {
                        text: 'Add',
                        onclick: function () {
                            addCard(selectedCard)();
                        }
                    },
                    {
                        text: 'Cancel',
                        onclick: 'close'
                    }
                ]
            });
        }
    });
});