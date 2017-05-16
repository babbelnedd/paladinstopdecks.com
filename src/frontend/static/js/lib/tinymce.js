'use strict';

var loadScript = require('./loadScript');

var tinyMcePlugins = [
    'image',
    'hr',
    'code',
    'autolink',
    'link',
    'textcolor',
    'colorpicker',
    'anchor',
    'imagetools',
    'table',
    'wordcount',
    'preview',
    'card',
    'youtube'
];
var tinyMceToolbar = 'undo redo | card | styleselect | sizeselect | fontsizeselect | forecolor | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent';

module.exports = function (cards, $deckName, deck) {
    var $deckDescription = $('textarea#deck_description'),
        $spinner = $('#description_spinner');
    $deckDescription.css('visibility', 'hidden');
    $spinner.show();
    $deckName.trigger('keyup');
    loadScript('/vendor/tinymce/tinymce.jquery.min.js', function () {
        require('../lib/tinymce/card.plugin');
        require('../lib/tinymce/youtube.plugin');
        tinyMCE.baseURL = '/vendor/tinymce/';
        tinyMCE.suffix = '.min';
        tinymce.init({
            style_formats: [
                {
                    title: 'Headings', items: [
                    // {title: 'Heading 1', format: 'h1'},
                    {title: 'Heading 2', format: 'h2'},
                    {title: 'Heading 3', format: 'h3'},
                    {title: 'Heading 4', format: 'h4'},
                    {title: 'Heading 5', format: 'h5'},
                    {title: 'Heading 6', format: 'h6'}
                ]
                },
                {
                    title: 'Inline', items: [
                    {title: 'Bold', icon: 'bold', format: 'bold'},
                    {title: 'Italic', icon: 'italic', format: 'italic'},
                    {title: 'Underline', icon: 'underline', format: 'underline'},
                    {title: 'Strikethrough', icon: 'strikethrough', format: 'strikethrough'},
                    {title: 'Superscript', icon: 'superscript', format: 'superscript'},
                    {title: 'Subscript', icon: 'subscript', format: 'subscript'},
                    {title: 'Code', icon: 'code', format: 'code'}
                ]
                },

                {
                    title: 'Blocks', items: [
                    {title: 'Paragraph', format: 'p'},
                    {title: 'Blockquote', format: 'blockquote'},
                    {title: 'Div', format: 'div'},
                    {title: 'Pre', format: 'pre'}
                ]
                },

                {
                    title: 'Alignment', items: [
                    {title: 'Left', icon: 'alignleft', format: 'alignleft'},
                    {title: 'Center', icon: 'aligncenter', format: 'aligncenter'},
                    {title: 'Right', icon: 'alignright', format: 'alignright'},
                    {title: 'Justify', icon: 'alignjustify', format: 'alignjustify'}
                ]
                }
            ],
            selector: '#deck_description',
            height: 280,
            content_css: '/static/css/custom/index.css',
            content_style: 'body { background: none !important; } * {color: #333; }',
            font_formats: 'Lato=Lato,sans-serif;',
            toolbar: tinyMceToolbar,
            plugins: tinyMcePlugins,
            cards: cards,
            init_instance_callback: function (ed) {
                if (deck !== undefined) {
                    ed.setContent(deck.description);

                }
                $spinner.hide();
                $deckDescription.css('visibility', 'visible');
            }
        });
    });

};