'use strict';

var $ = window.jQuery = window.$ = require('jquery'),
    isMobileDevice = require('./mobile/isMobileDevice'),
    api = require('./api');

require('./vendor/qtip2'); // $.qtip

$(function () {
    if (isMobileDevice()) {
        return;
    }
    var cached = {},
        $body = $('body'),
    // cards = $('.cardtip[data-id]'),
        el = $('<div></div>').css({
            transition: 'left 0.5s ease-out, opacity 0.15s ease-in',
            opacity: 0,
            'pointer-events': 'none'
        });
    $body.append(el);

    function showTooltip(pos, content) {
        el.html(content);
        var top = pos.top - $(el).height();
        var left = pos.left - 35;
        var css = {
            position: 'absolute',
            display: 'block',
            opacity: 1,
            left: left,
            top: top
        };

        el.css(css);
    }

    /*cards.on('mouseenter', */
    $body.on('mouseenter', '.cardtip[data-id]', function () {
        var self = $(this),
            pos = self.offset(),
            id = self.data('id');
        if (cached.hasOwnProperty(id)) {
            showTooltip(pos, cached[id]);
        } else {
            $.get('/api/cardtip/' + id + '/small').then(function (content) {
                cached[id] = content;
                showTooltip(pos, content);
            });
        }
    });
    $body.on('mouseleave', '.cardtip[data-id]', function () {
        el.css({opacity: 0});
        // el.hide();
    });
});

$(function () {

    $('[data-tooltip!=""]').qtip({
        content: {
            attr: 'data-tooltip'
        },
        position: {
            target: 'mouse',
            adjust: {
                mouse: true
            }
        }
    });

});