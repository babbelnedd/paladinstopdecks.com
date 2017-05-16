'use strict';
var $ = window.jQuery = window.$ = require('jquery'),
    api = require('../lib/api'),
    notificationType = require('../../../../shared/notificationType'),
    hbs = require('../lib/hbs');

$(function () {
    var $notifications = $('#notifications'),
        $icon = $('#notifications_icon'),
        unseen = 0;

    api.notification.get(10).then(function (result) {
        if (!result || result.err !== undefined || result.notifications.length === 0) {
            return;
        }

        hbs.getPartial('notification').then(function (template) {
            $notifications.html('');
            var notifications = result.notifications;

            for (var i = 0; i < notifications.length; i++) {
                if (!notifications[i].seen) { unseen++;}
                notifications[i].title = notificationType[notifications[i].type];
                $notifications.append(template({notification: notifications[i], total: result.total}));
            }

            $('[data-notification]').click(function () {
                var href = $(this).find('[data-href]').data('href');
                if ($(this).hasClass('new')) {
                    api.notification.seen($(this).data('notification')).then(function () {
                        window.location.href = href;
                    });
                } else {
                    window.location.href = href;
                }
            });

            if (unseen > 0) {
                $icon
                    .removeClass('col-light')
                    .addClass('col-highlight')
                    .html('<span class="left5 col-highlight">' + unseen + '</span>');
            }
            $notifications.append('<div class="bottom">' +
                '<a href="/account/' + result.user.name + '/notifications">Show all ' + result.total + ' Notifications</a>' +
                '</div>');
        });
    });

});