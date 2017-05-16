var $ = window.jQuery = window.$ = require('jquery'),
    comments = require('../lib/comments'),
    path = require('../lib/path');

$(function () {
    var $comments = $('#comments');

    if ($comments.length === 1 && path.length === 2) {
        comments.init($comments, path[1].trim(), 'article');
    }

});