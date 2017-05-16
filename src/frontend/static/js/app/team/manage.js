'use strict';

require('selectize');
var $ = window.jQuery = window.$ = require('jquery'),
    api = require('../../lib/api'),
    path = require('../../lib/path'),
    hbs = require('../../lib/hbs'),
    hbsStatic = require('../../lib/hbs.static');

$(function () {
    var template = null,
        $notification = $('#roster_notification');

    hbs.getPartial('team/management/roster-table').then(function (tpl) {
        template = tpl;
    });

    function setNotification(b, positiveText) {
        $notification.show();
        if (b === true) {
            $notification
                .hide()
                .removeClass('alert-danger')
                .addClass('alert-success')
                .text(positiveText)
                .fadeIn(250);
        } else {
            $notification
                .hide()
                .removeClass('alert-success')
                .addClass('alert-danger')
                .text('Something went wrong..')
                .fadeIn(250);
        }
    }

    function initListeners() {

        $('[data-role]').change(function () {
            var $this = $(this),
                newVal = $this.val(),
                name = $this.data('name'),
                id = $this.data('role');
            api.team.changeRole(id, newVal).then(function (res) {
                setNotification(res, 'Updated role for ' + name + ' successfully ');
            });
        });

        // ==========================

        $('[data-kick]').click(function () {
            var $this = $(this),
                id = $this.data('kick'),
                name = $this.data('name');

            api.team.kick(id).then(function (result) {
                setNotification(result, 'Kicked ' + name + ' from team successfully');
                renderRoster();
            });
        });

        // ==========================

        var $modal = $('#promotion_modal');

        $modal.on('show.bs.modal', function (e) {
            var relatedTarget = $(e.relatedTarget),
                currentTarget = $(e.currentTarget),
                uid = relatedTarget.data('uid'),
                name = relatedTarget.data('name');
            currentTarget.find('.modal-body>p>.name').text(name);
            currentTarget.find('#promote_id').val(uid);
        });

        // ==========================

        $('[data-cancel]').click(function () {

            var $this = $(this),
                uid = $this.data('cancel'),
                name = $this.data('name');

            api.team.cancelInvite(uid).then(function (result) {
                setNotification(result, 'Canceled invitation for ' + name + ' successfully');
                renderRoster();
            });

        });
    }

    function renderRoster() {
        api.team.getRoster().then(function (result) {
            $('#roster').html(template({static: hbsStatic, team: result.team, isCaptain: result.isCaptain}));
            initListeners();
        });
    }

    initListeners();
    // ==========================

    var selected = null,
        $select = $('#invite_member').selectize({
            valueField: 'name',
            labelField: 'name',
            searchField: 'name',
            placeholder: 'Search for an user..',
            options: [],
            create: false,
            render: {
                option: function (item, escape) {
                    return '<div><span>' + item.name + '</span></div>';
                }
            },
            load: function (query, callback) {
                if (!query.length) {
                    return callback();
                }

                api.team.findFreeAgents(query, 10).then(function (res) {
                    callback(res);
                });
            }
        }),
        $btn = $('#invite_member_btn');

    $select[0].selectize.on('change', function (val) {
        selected = val;
        if (!!selected) {
            $btn.removeClass('disabled');
        } else {
            $btn.addClass('disabled');
        }
    });

    $btn.click(function () {
        if (!selected) {
            return;
        }
        api.team.invite(selected).then(function (result) {
            setNotification(result, selected + ' got invited!');
            renderRoster();
            $select[0].selectize.clearOptions();
        });
    });

    // ==========================

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        var target = $(e.target).attr("href"),
            targetPath = target.replace('#tab_', '');

        // history.pushState(targetPath, null, targetPath);
        history.replaceState(targetPath, null, targetPath);
        $('a[href="#tab_' + targetPath + '"').tab('show');
        // tabs[target].load();
    });

    if (path.length === 2) {
        var currentTab = '#tab_' + path[1];
        $('a[href="' + currentTab + '"').tab('show');
    }
});