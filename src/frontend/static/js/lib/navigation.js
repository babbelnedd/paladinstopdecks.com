'use strict';

var $ = window.jQuery = window.$ = require('jquery'),
    Hammer = require('./vendor/hammer');

$(function () {

    $('#cssmenu > ul > li > a').click(function () {
        $('#cssmenu li').removeClass('active');
        var checkElement = $(this).next();
        if (checkElement.is('ul')) {
            $(this).closest('li').addClass('active');
        }
        if ((checkElement.is('ul')) && (checkElement.is(':visible'))) {
            $(this).closest('li').removeClass('active');
            checkElement.slideUp('normal');
        }
        if ((checkElement.is('ul')) && (!checkElement.is(':visible'))) {
            $('#cssmenu ul ul:visible').slideUp('normal');
            checkElement.slideDown('normal');
        }

        return $(this).closest('li').find('ul').children().length == 0;
    });

    var $navLeft = $('#nav_responsive_left'),
        $navTop = $('#nav_responsive_top'),
        $navToggle = $('#showLeftPush'),
        $content = $('#content'),
        $contentOverlay = $('#content_overlay'),
        body = $(document.body);

    function click() {
        $navToggle.click();
    }

    $navToggle.click(function () {
        body.toggleClass('cbp-spmenu-push-toright');
        $navLeft.toggleClass('cbp-spmenu-open');
        $navTop.toggleClass('open');

        if ($navTop.hasClass('open')) {
            $contentOverlay.addClass('active');
            $content.on('click', click);
            body.css('overflow', 'hidden');
        } else {
            $contentOverlay.removeClass('active');
            $content.off('click', click);
            body.css('overflow', 'auto');
        }
    });

    delete Hammer.defaults.cssProps.userSelect;
    var hammertime = new Hammer(document.body, {
        enabled: true,
        inputClass: Hammer.SUPPORT_POINTER_EVENTS ? Hammer.PointerEventInput : Hammer.TouchInput
    });
    hammertime.on('swiperight', function (e) {
        if (!$navTop.hasClass('open')) {
            var start = e.pointers[0].clientX - e.deltaX;
            if (start < 50) {
                $navToggle.click();
            }
        }
    });
    hammertime.on('swipeleft', function (e) {
        if ($navTop.hasClass('open')) {
            $navToggle.click();
        }
    });

});