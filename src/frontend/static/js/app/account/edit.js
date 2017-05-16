'use strict';

var $ = window.jQuery = window.$ = require('jquery');

function getFormData() {
    return JSON.parse(JSON.stringify({
        currentPassword: $('#current_password').val(),
        newPassword: $('#new_password').val(),
        twitter: $('#twitter').val(),
        twitch: $('#twitch').val(),
        youtube: $('#youtube').val(),
        biography: $('#biography').val(),
        //avatar: $('.gravatar').attr('src'),
        avatar: $('#avatar').val(),
        emailNotifications: $('#email_notifications').is(':checked')
    }));
}

function equalFormData(a, b) {
    if (a.currentPassword !== b.currentPassword) {
        return false;
    }
    if (a.newPassword !== b.newPassword) {
        return false;
    }
    if (a.twitter !== b.twitter) {
        return false;
    }
    if (a.twitch !== b.twitch) {
        return false;
    }
    if (a.youtube !== b.youtube) {
        return false;
    }
    if (a.biography !== b.biography) {
        return false;
    }
    if (a.avatar !== b.avatar) {
        return false;
    }
    if (a.emailNotifications !== b.emailNotifications) {
        return false;
    }
    return true;
}

$(function () {

    $.get('/api/avatar/').then(function (avatar) {
        var $gravatar = $('.gravatar'),
            $avatar = $('#avatar'),
            $btn = $('#submit'),
            original = getFormData();

        $gravatar.attr('src', 'data:image/png;base64,' + avatar);

        $('#current_password')
            .add($('#new_password'))
            .add($('#twitter'))
            .add($('#twitch'))
            .add($('#youtube'))
            .add($('#biography'))
            .add($('#email_notifications'))
            .add($('#h_avatar'))
            .on('change keyup', function () {
                if (equalFormData(getFormData(), original)) {
                    $btn.attr('disabled', 'true');
                } else {
                    $btn.removeAttr('disabled');
                }
            });

        $('#email_notifications').change(function () {
            $('#h_email_notifications').val($('#email_notifications').is(':checked'));
        });

        $avatar.change(function () {
            // Load the image
            var reader = new FileReader();
            reader.onload = function (readerEvent) {
                var image = new Image();
                image.onload = function (imageEvent) {
                    // Resize the image
                    var canvas = document.createElement('canvas');
                    canvas.width = 50;
                    canvas.height = 50;
                    canvas.getContext('2d').drawImage(image, 0, 0, 50, 50);
                    var dataUrl = canvas.toDataURL();
                    $gravatar.attr('src', dataUrl);
                    $('#h_avatar').val(dataUrl);
                    $('#h_avatar').trigger('change');

                };
                image.src = readerEvent.target.result;
            };
            reader.readAsDataURL(this.files[0]);
        });
    });

});