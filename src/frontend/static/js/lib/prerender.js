$(function () {
    var added = [];
    var $head = $('head');

    function add() {
        var val = $(this).data('prerender');
        if (added.indexOf(val) === -1) {
            added.push(val);
            $head
                .append($('<link/>').attr('rel', 'prefetch').attr('href', val));
        }
    }

    $('[data-prerender]').on('mouseenter', add);
});