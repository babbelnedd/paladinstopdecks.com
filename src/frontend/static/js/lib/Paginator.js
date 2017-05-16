'use strict';

var $ = require('jquery');
var DotNav = require('./DotNav');
var normalize = require('../../../../shared/normalize');
var hbsStatic = require('./hbs.static');
var typeahead = require('../lib/vendor/typeahead');
var Hammer = require('./vendor/hammer');
var sortByTier = require('../../../../shared/sortByTier');
require('./jquery.eventemitter');

function hasAttr($el, name) {
    var attr = $el.attr(name);
    return (typeof attr !== typeof undefined && attr !== false);
}

function Paginator(opts) {

    var self = this;

    this.lazyLoad = opts.lazyLoad || false;
    this.currentPage = opts.currentPage || 0;
    this.breakpoints = opts.breakpoints || [[1200, 10], [992, 8], [768, 6], [500, 2], [0, 1]];
    this.cards = opts.cards || [];
    this.template = opts.template;
    this.linkCards = opts.linkCards || false;
    this.$container = opts.$container;
    this.$spinner = opts.$spinner || undefined;
    this.$search = opts.$search;
    this.$typeFilter = opts.$typeFilter;
    this.$tierFilter = opts.$tierFilter;
    this.$abilityFilter = opts.$abilityFilter;
    this.$clearSearch = opts.$clearSearch;
    this.$cards = opts.$cards;
    this.$next = opts.$next;
    this.$prev = opts.$prev;
    this.$currentPage = opts.$currentPage;
    this.$maxPages = opts.$maxPages;
    this.$window = opts.$window || $(window);

    this._setResults(opts.cards);
    this.pages = Math.ceil(this._results.length / this.cardsPerPage());
    this.loading = 0;
    this.loaded = [];
    this.minHeight = 0;
    this.width = this.$window.width();

    var hammer = new Hammer(this.$container[0]);
    hammer.get('swipe').set({direction: Hammer.DIRECTION_HORIZONTAL});
    hammer.on('swipe', function (e) {
        if (e.velocityX > 0) {
            self.prevPage();
        } else {
            self.nextPage();
        }
    });

    // setup event listeners
    this.$search.on('keyup paste', function () {
        self.filter();
    });
    this.$typeFilter.on('change', function () {
        self.filter();
    });
    this.$tierFilter.on('change', function () {
        self.filter();
    });
    this.$abilityFilter.on('change', function () {
        self.filter();
    });
    this.$next.click(function () {
        self.nextPage();
    });
    this.$prev.click(function () {
        self.prevPage();
    });
    this.$window.keydown(function (e) {
        // if left
        if (e.keyCode === 37) {
            self.prevPage();
        }
        // if right
        if (e.keyCode === 39) {
            self.nextPage();
        }
    });
    this.$window.on('resize', function () {
        if (self.$window.width() !== self.width) {
            self.width = self.$window.width();
            self.refreshPagination(self._results);
        }
    });

    // clear search
    this.$clearSearch.click(function () {
        self.$search.val(null);
        self.$search.trigger('keyup');
    });

    this.on('scrolled', function () {
        self.$currentPage.text(self.currentPage + 1);
        self.$maxPages.text(self.pages > 0 ? self.pages : 1);
    });

    // auto completion
    function findMatches(q, cb) {
        var matches, substrRegex, card;
        matches = [];
        substrRegex = new RegExp(q, 'i');

        for (var i = 0; i < self._results.length; i++) {
            card = self._results[i];
            if (substrRegex.test(card.name)) {
                matches.push(card.name);
            }
        }

        cb(matches);
    }

    this.$search
        .typeahead({
            hint: true,
            _highlight: true,
            minLength: 1
        }, {
            source: findMatches
        })
        .bind('typeahead:select', function () {
            self.update();
        });

    this.$container.bind('mousewheel DOMMouseScroll', function (e) {
        e.preventDefault();
        if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
            self.prevPage();
        }
        else {
            self.nextPage();
        }
    });

    // setup
    this.fillAbilitySelect();
    this.filter();
}

Paginator.prototype = {
    _getCardByID: function (id) {
        var name = id.substring(id.indexOf('-') + 1);
        //var name = id.split('-')[1];
        for (var i = 0; i < this.cards.length; i++) {
            if (this.cards[i].normalizedName === name) {
                return this.cards[i];
            }
        }
    },
    _refreshMinHeight: function () {
        this.$container.css('min-height', 'auto');
        this.$container.css('min-height', this.$container.height() + 'px');
    },
    _setResults: function (cards) {
        this._results = sortByTier(cards);
    },
    refreshPagination: function (cards) {
        this._setResults(cards);
        this.pages = (Math.ceil(this._results.length / this.cardsPerPage()));

        if (this.pages < 2) {
            this.$next.addClass('disabled');
            this.$prev.addClass('disabled');
        } else {
            this.$next.removeClass('disabled');
            this.$prev.removeClass('disabled');
        }

        this.goToPage(0);
        this._refreshMinHeight();
    },
    goToPage: function (n) {
        var self = this;
        this.loading = 0;
        this.currentPage = n;

        this.$container.html('');
        var cpp = this.cardsPerPage();
        var start = cpp * n;
        var end = start + cpp;
        if (end > this._results.length) {
            end = this._results.length;
        }
        for (var i = start; i < end; i++) {
            //var lazyLoad = self.lazyLoad;
            //if (self.loaded.indexOf(this._results[i].imagePath) > -1) {
            //    lazyLoad = false;
            //}
            this.$container.append(this.template({
                card: this._results[i],
                size: 'small',
                //lazyLoad: lazyLoad,
                lazyLoad: self.lazyLoad,
                'static': hbsStatic,
                linked: self.linkCards
            }));
        }
        this.$container.find('.card').each(/* @this HTMLElement */function () {
            $(this).click(/* @this HTMLElement */function () {
                self.emit('click', self._getCardByID($(this).attr('id')));
            });
        });

        if (self.lazyLoad === true && !!self.$spinner) {
            this.$container.find('[data-src]').each(/* @this HTMLElement */function () {
                var val = $(this).data('src');
                var $img = $(this);
                $img.attr('src', $(this).data('src'));
                $img.removeAttr('data-src');

                if (self.loaded.indexOf(val) === -1) {
                    self.$container.css('visibility', 'hidden');
                    self.$spinner.show();
                    self.loading++;
                    $img.on('load error', /* @this HTMLElement */function () {
                        self.loaded.push(val);
                        self.loading--;
                        if (self.loading < 1) {
                            self.loading = 0;
                            self.$spinner.fadeOut(250);
                            self.$container.css('visibility', 'visible');
                        }
                    });
                }

            });
        }

        self.emit('scrolled', n);
    },
    nextPage: function () {
        if (this.currentPage === 0 && (this.pages - 1) === 0) {
            return;
        }
        if (this.currentPage < this.pages - 1) {
            this.goToPage(this.currentPage + 1);
        }
    },
    prevPage: function () {
        if (this.currentPage === 0 && (this.pages - 1) === 0) {
            return;
        }
        if (this.currentPage > 0) {
            this.goToPage(this.currentPage - 1);
        }
    },
    cardsPerPage: function () {

        var width = $(window).width(), bp;

        for (var i = 0; i < this.breakpoints.length; i++) {
            bp = this.breakpoints[i];
            if (width > bp[0]) {
                return bp[1];
            }
        }
    },
    filter: function () {
        var self = this;

        function getFiltered() {
            var search = {
                name: self.$search.val(),
                tier: self.$tierFilter.val(),
                type: self.$typeFilter.val(),
                ability: self.$abilityFilter.val()
            };
            var anyFilter = !!search.name || !!search.tier || !!search.type || !!search.ability;
            if (!anyFilter) {
                return self.cards;
            }
            var result = [];

            for (var i = 0; i < self.cards.length; i++) {
                var card = self.cards[i];
                if (search.name) {
                    if (card.name.toLowerCase().indexOf(search.name.toLowerCase().trim()) < 0) {
                        continue;
                    }
                }
                if (search.tier) {
                    if (card.tier.toLowerCase().trim() !== search.tier.toLowerCase().trim()) {
                        continue;
                    }
                }
                if (search.type) {
                    if (card.type.toLowerCase().indexOf(search.type.toLowerCase().trim()) < 0) {
                        continue;
                    }
                }
                if (search.ability) {
                    if (card.ability.toLowerCase().trim() !== search.ability.toLowerCase().trim()) {
                        continue;
                    }
                }

                result.push(card);
            }

            return result;
        }

        var filtered = getFiltered();
        this.refreshPagination(filtered);
    },
    fillAbilitySelect: function () {
        var abilities = [];
        for (var i = 0; i < this.cards.length; i++) {
            if (abilities.indexOf(this.cards[i].ability) === -1 && !!this.cards[i].ability) {
                abilities.push(this.cards[i].ability);
            }
        }
        abilities = abilities.sort();
        for (var j = 0; j < abilities.length; j++) {
            this.$abilityFilter.append('<option value="' + abilities[j].toLowerCase() + '">' + abilities[j] + '</option>');
        }
    },
    update: function () {
        this.filter();
    }
};

$.extend(Paginator.prototype, $.eventEmitter);
module.exports = Paginator;