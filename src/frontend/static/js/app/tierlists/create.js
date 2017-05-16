'use strict';

var $ = window.$ = window.jQuery = require('jquery'),
    api = require('../../lib/api'),
    md = require('../../../../../shared/md'),
    rivets = require('rivets'),
    redirect = require('../../lib/redirect');
require('../../lib/vendor/bootstrap.markdown'); // $.markdown

$(function () {

    var $champions = $('[data-champion]'),
        $modal = $('#dialog'),
        $btnSave = $('#btn_save'),
        $description = $('#description'),
        data = {
            champion: '',
            list: {SS: [], S: [], A: [], B: [], C: []},
            opts: {
                hasChampion: false,
                canCreate: false,
                error: {
                    available: false,
                    msg: ''
                }
            }
        };

    rivets.binders['champion-class'] = function (el, value) {
        $(el).addClass('champion-50 pointer ' + value);
    };

    rivets.bind($('[data-rivets]'), data);

    $('#title').on('change keyup', verify);

    function verify() {
        var x = data.list;
        var len = x.SS.length + x.S.length + x.A.length + x.B.length + x.C.length;

        data.opts.hasChampion = len > 0;

        if (len < 5 || $('#title').val().length < 5) {
            data.opts.canCreate = false;
            return;
        }
        data.opts.canCreate = true;
    }

    $champions.click(function () {
        if (!$(this).hasClass('picked')) {
            data.champion = $(this).data('champion');
            $modal.modal('show');
        }

        verify();
    });

    $('body').on('click', '[data-picked]', function () {
        var list = data.list[$(this).data('tier')],
            champion = $(this).data('picked'),
            index = list.indexOf(champion);

        if (index > -1) {
            $('[data-champion="' + champion + '"]').removeClass('picked');
            list.splice(index, 1);
        }
    });

    $modal.on('click', 'button', function () {
        var champion = data.champion,
            tier = $(this).data('tier');

        if (!data.list[tier]) {
            data.list[tier] = [];
        }
        if (data.list[tier].indexOf(champion) > -1) {
            return;
        }

        data.list[tier].push(champion);

        $('[data-champion="' + champion + '"]').addClass('picked');
        $modal.modal('hide');
        verify();
    });

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
            /*{
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
             if (/.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*!/.test(link)) {
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

             /!* // Give ![] surround the selection and prepend the image link
             var link;

             link = prompt('Insert YouTube Link', 'https://');
             if (/.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*!/.test(link)) {
             e.replaceSelection(link);
             }*!/
             }
             }
             ]
             }*/
        ]],
        onPreview: function (e) {
            return md(e.getContent());
        }
    });

    $btnSave.click(function () {
        var obj = JSON.parse(JSON.stringify(data.list));
        obj.title = $('#title').val();
        obj.description = $('#description').val();
        obj.queue = $('#queue').val();
        api.tierlists.create(obj).then(function (result) {
            if (result.hasOwnProperty('err')) {
                data.opts.error.available = true;
                data.opts.error.msg = result.err;
            } else {
                redirect('/tierlists/' + result._id);
            }
        });
    });

});