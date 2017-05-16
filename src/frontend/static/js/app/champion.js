'use strict';

var $ = window.jQuery = window.$ = require('../node_modules/jquery'),
    //$body = $(document.body),
    hbs = require('../lib/hbs'),
    api = require('../lib/api'),
    cardtip = require('../lib/cardtip'),
    tierToColor = require('../../../../shared/tierToColor'),
    mapTier = require('../../../../shared/mapTier'),
    //isMobileDevice = require('../lib/mobile/isMobileDevice'),
    loadScript = require('../lib/loadScript');

require('../lib/vendor/jquery.tablesorter');

$(function () {
    var path = window.location.pathname.substring(1, window.location.pathname.length).split('/');
    if (path.length < 2) {
        return;
    }
    var champion = path[1];

    /*if (!isMobileDevice()) {
        hbs.getPartial('card').then(function (template) {
            api.champion.getCards(champion).then(function (cards) {
                for (var i = 0; i < cards.length; i++) {
                    $body.append(template({card: cards[i], size: 'small cardtip'}));
                }
                cardtip({offset: {x: -250, y: 50}});
            });
        });
    }*/

    $.tablesorter.addParser({
        // set a unique id
        id: 'name',
        is: function () {
            return false;
        },
        format: function (s) {
            return s.split('|')[0];
        },
        // set type, either numeric or text
        type: 'text'
    });

    $.tablesorter.addParser({
        // set a unique id
        id: 'tier',
        is: function () {
            // return false so this parser is not auto detected
            return false;
        },
        format: function (s) {
            return mapTier(s);
        },
        // set type, either numeric or text
        type: 'numeric'
    });

    $('table').tablesorter({
        sortList: [[1, 0], [0, 0]],
        headers: {
            0: {sorter: 'name'},
            1: {sorter: 'tier'}
        }
    });
    api.champion.getChampionStats(champion).then(function (stats) {
        var $mostPicked = $('#chart_mpc'),
            $mostPickedByTier = $('#chart_mpct'),
            data = {mostPicked: [], mostPickedByTier: []},
            i;

        for (i = 0; i < stats.mostPicked.length; i++) {
            data.mostPicked.push({
                y: stats.mostPicked[i].count,
                name: stats.mostPicked[i].card.name,
                color: tierToColor(stats.mostPicked[i].card.tier)
            });
        }

        for (i = 0; i < stats.mostPickedByTier.length; i++) {
            data.mostPickedByTier.push({
                y: stats.mostPickedByTier[i].count,
                name: stats.mostPickedByTier[i].card.name,
                color: tierToColor(stats.mostPickedByTier[i].card.tier)
            });
        }

        loadScript('/vendor/highcharts/highcharts.js').then(function () {
            $('#chart_spinner').hide();
            $mostPicked.highcharts({
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    type: 'pie',
                    backgroundColor: 'rgba(0,0,0,0)'
                },
                credits: false,
                desc: '',
                title: {
                    text: 'Most-Picked Cards',
                    style: {color: '#ffffff'}
                },
                tooltip: {
                    pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                            style: {
                                color: '#fff'
                            }
                        }
                    }
                },
                series: [{
                    name: 'Cards',
                    colorByPoint: true,
                    data: data.mostPicked
                }]
            });
            $mostPickedByTier.highcharts({
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    type: 'pie',
                    backgroundColor: 'rgba(0,0,0,0)'
                },
                credits: false,
                desc: '',
                title: {text: 'Most-Picked Cards by Tier', style: {color: '#fff'}},
                tooltip: {
                    pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                            style: {
                                color: '#fff'
                            }
                        }
                    }
                },
                series: [{
                    name: 'Brands',
                    colorByPoint: true,
                    data: data.mostPickedByTier
                }]
            });
        });
    });

});