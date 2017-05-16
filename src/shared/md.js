'use strict';

var marked = require('./marked/index');
var renderer = new marked.Renderer();

renderer.heading = function (text, level) {
    return '<p class="h' + level + '">' + text + '</p>';
};

/*renderer.image = function (href, title, text) {
    return '![' + text + '](' + href + ' "' + title + '")';
};*/

marked.setOptions({
    renderer: renderer,
    breaks: true,
    sanitize: false
});

module.exports = function (text) {
    return marked(text);
};