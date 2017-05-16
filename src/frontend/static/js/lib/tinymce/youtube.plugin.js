'use strict';

tinymce.PluginManager.add('youtube', function (editor, url) {

    function getParameterByName(url, name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(url);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    function getIdFromUrl(url) {
        return getParameterByName(url, 'v');
    }

    function generateHTML(url) {
        return '[youtube]' + getIdFromUrl(url) + '[/youtube]';
    }

    function addVideo(url) {
        editor.execCommand('mceInsertContent', false, generateHTML(url));
    }

    editor.addMenuItem('youtube', {
        text: 'Insert Video',
        context: 'insert',
        onclick: function () {
            editor.windowManager.open({
                title: 'Add YouTube Video',
                body: [
                    {type: 'textbox', name: 'source', label: 'Source'}
                ],
                onsubmit: function (e) {
                    addVideo(e.data.source);
                }
            });
        }
    });
});