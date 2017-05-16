'use strict';

var $ = window.jQuery = window.$ = require('jquery'),
    api = require('../../lib/api'),
    hbs = require('../../lib/hbs'),
    activity = require('../../../../../shared/activityType'),
    getUsername = require('../../lib/account/getUsername');

$(function () {
    var path = window.location.pathname.substring(1, window.location.pathname.length).split('/'),
        username = getUsername();

    var tabs = {
        '#tab_decks': {
            loaded: false,
            load: function () {
                if (this.loaded === false) {
                    this.loaded = true;
                    api.deck.getByUser(username).then(function (decks) {
                        hbs.getPartial('deck/table').then(function (tpl) {
                            $('#tab_decks').html(tpl({decks: decks, hide: {author: true}}));
                        });
                    });
                }
            }
        },
        '#tab_activity': {
            loaded: false,
            load: function () {
                if (this.loaded === false) {
                    this.loaded = true;
                    hbs.getPartial('account/activity').then(function (tpl) {
                        $.get('/api/activity/' + username).then(function (activities) {
                            // get type description
                            for (var i = 0; i < activities.length; i++) {
                                activities[i].type = activity[activities[i].type];
                            }
                            // sort activity by time (newest first)
                            activities = activities.sort(function (a, b) {
                                return b.created - a.created;
                            });
                            // compile & inject template
                            $('#tab_activity').html(tpl({activities: activities}));
                        });
                    })
                }
            }
        },
        '#tab_favorites': {
            loaded: false, load: function () {
                if (this.loaded === false) {
                    this.loaded = true;
                    hbs.getPartial('deck/table').then(function (tpl) {
                        $.get('/api/favorite/' + username).then(function (favorites) {
                            $('#tab_favorites').html(tpl({decks: favorites}));
                        });
                    });
                }
            }
        }
        /*'#tab_comments': {
         loaded: false, load: function () {
         }
         }*/
    };

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        var target = $(e.target).attr("href"),
            targetPath = target.replace('#tab_', '');

        // history.pushState(targetPath, null, targetPath);
        history.replaceState(targetPath, null, targetPath);
        $('a[href="#tab_' + targetPath + '"').tab('show');
        tabs[target].load();
    });

    if (path.length === 3) {
        var currentTab = '#tab_' + path[2];
        $('a[href="' + currentTab + '"').tab('show');
    }
});