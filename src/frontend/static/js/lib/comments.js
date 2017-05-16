'use strict';

var $ = window.jQuery = window.$ = require('jquery'),
    hbs = require('./hbs'),
    hbsStatic = require('./hbs.static'),
    scrollToSelector = require('./scrollToSelector'),
    api = require('./api'),
    slug = null,
    $selector = null,
    user = null,
    type = null;

function setSlug(_slug, _$selector, _type) {
    var d = $.Deferred();
    slug = _slug;
    $selector = _$selector;
    type = _type;
    d.resolve(slug);
    return d.promise();
}

function parseComments(comments) {
    var d = $.Deferred();
    var nodes = {};

    //insert artificial root node
    nodes[-1] = {
        text: 'Fake root',
        replies: []
    };

    //index nodes by their id
    comments.forEach(function (item) {
        item.id = item._id;
        if (item.origin === null) {
            item.origin = -1;
        }
        nodes[item.id] = item;
        item.replies = [];
    });

    //put items into parent replies
    comments.forEach(function (item) {
        var origin = nodes[item.origin];
        origin.replies.push(item);
    });

    var jobs = [],
        avatars = {};
    comments.forEach(function (item) {
        if (!avatars.hasOwnProperty(item.author.name)) {
            avatars[item.author.name] = '';
            jobs.push(api.avatar(item.author.name).then(function (avatar) {
                avatars[item.author.name] = avatar;
                item.author.avatar = avatar;
            }));
        }
    });
    $.when.apply($, jobs).then(function () {

        comments.forEach(function (item) {
            item.author.avatar = avatars[item.author.name];
        });

        d.resolve(nodes[-1].replies);
    });
    return d.promise();
}

function loadComments(slug) {
    var d = $.Deferred();

    // todo: api.comments.get(slug)
    $.get('/api/comments/' + slug).success(function (comments) {
        parseComments(comments).then(d.resolve);
        // d.resolve(parseComments(comments));
    });

    return d.promise();
}

function loadTemplate() {
    var d = $.Deferred();
    hbs.getPartial('comments/single').then(function (tpl) {
        hbs.registerPartial('comments/single', tpl);
        return hbs.getPartial('comments/list').then(function (partial) {
            d.resolve(partial);
        });
    });
    return d.promise();
}

function buildHTML(comments) {
    var d = $.Deferred();
    loadTemplate().then(function (template) {
        d.resolve(template({comments: comments, 'static': hbsStatic, user: user}));
    });
    return d.promise();
}

function injectHTML($selector) {
    return function (html) {
        var d = $.Deferred();
        $selector.html(html);
        d.resolve(html);
        return d.promise();
    }
}

function onNewPost(result) {
    if (!result.hasOwnProperty('err')) {
        module.exports.init($selector, slug).then(function () {
            scrollToSelector($('#' + result), -100);
        });
    } else {
        $('#alert_comment').show().text(result.err);
    }
}

function registerEventListeners() {
    var d = $.Deferred();
    var $submitComment = $('#submit_comment'),
        $textarea = $('.textarea-wrapper .textarea'),
        $textareaBot = $('.textarea-wrapper .bot'),
        $dataReply = $('[data-reply]');

    function isValidComment($selector) {
        return $selector.text().trim().length > 0;
    }

    function validate($textSelector, $btnSelector) {
        return function () {
            if (isValidComment($textSelector)) {
                $btnSelector.removeClass('disabled');
            }
            else {
                $btnSelector.addClass('disabled');
            }
        }
    }

    if (user !== false) {
        $textarea.on('click focus', function () {
            $textareaBot.css({display: 'block'});
        });
        $submitComment.on('click', function () {
            if (isValidComment($textarea)) {
                // unbind listener
                $submitComment.off('click');
                // submit
                $submitComment.addClass('disabled');
                api.comments.post({
                    text: $textarea.html(),
                    slug: slug,
                    type: type
                }).then(onNewPost);
            }
        });
        $textarea.on('keyup cut paste', validate($textarea, $submitComment));
        $dataReply.click(function () {
            var id = $(this).data('reply');

            $('#new_reply').remove();

            $('#' + id + ' > .content').append('<header class="top20" id="new_reply">' +
                '<img class="gravatar" src="' + user.avatar + '">' +
                '<div class="textarea-wrapper">' +
                '<div class="textarea" contenteditable="true" tabindex="1"></div>' +
                '<div class="bot" style="display:block;">' +
                '<span id="submit_reply" data-reply="' + id + '" class="submit-reply btn btn-dark pull-right">Post As ' + user.name + '</span>' +
                '</div >' +
                '</div >' +
                '</header > ');

            var $submitReply = $('#submit_reply'),
                ta = $('#new_reply').find('.textarea');

            ta.on('keyup cut paste', validate(ta, $submitReply));
            $submitReply.on('click', function () {
                if (!isValidComment(ta)) {
                    return;
                }
                // unbind btn
                $submitReply.off('click');
                // post
                api.comments.post({
                    text: ta.html(),
                    slug: slug,
                    origin: id,
                    type: type
                }).then(onNewPost);
            });
        });
    }
    d.promise();
}

function getUser(slug) {
    var d = $.Deferred();
    if (user === null) {
        api.auth.whoami().then(function (_user) {
            user = _user;
            d.resolve(slug);
        });
    } else {
        d.resolve(slug);
    }

    return d.promise();
}

module.exports = {
    init: function ($selector, slug, type) {
        var d = $.Deferred();
        setSlug(slug, $selector, type)
            .then(getUser)
            .then(loadComments)
            .then(buildHTML)
            .then(injectHTML($selector))
            .then(registerEventListeners)
            .then(d.resolve);
        return d.promise();
    }
};