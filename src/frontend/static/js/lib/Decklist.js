'use strict';
var $ = window.jQuery = window.$ = require('jquery');
require('./vendor/bootstrap-table');

function Decklist($selector, opts) {
    $selector.bootstrapTable({
        striped: true,
        search: false,
        cache: true,
        formatShowingRows: function (from, to, total) {
            return '';
        },
        columns: opts.columns,
        pagination: true,
        minHeight: 250,
        sidePagination: 'server',
        sortName: 'rating',
        sortOrder: 'asc',
        pageList: [],
        pageSize: 100,
        classes: '',
        hideLoading: true,
        showLoading: false,
        formatLoadingMessage: function () {
            // todo: disgusting...
         /*   return '<div class="row">' +
                '<div class="spinner-paladins spinner-75" style="position:absolute;left:50%;transform:translateX(-50%) translateY(-50%);top:50%">' +
                '<div class="spinner-body">' +
                '<div class="spinner-frame"></div>' +
                '</div></div></div><div class="clearfix"></div>';*/
        },
        ajax: function (req) {
            $.ajax({
                url: opts.url,
                method: 'POST',
                data: req.data,
                success: function (res) {

                    for (var i = 0; i < res.rows.length; i++) {
                        var row = res.rows[i];
                        row.name = '<a href="' + row.fullPath + '">' + row.name + '</a>';
                        row.author = '<a href="/user/' + row.author + '">' + row.author + '</a>';
                    }

                    req.success(res);
                    req.complete();
                    // $('.bootstrap-table').css('visibility', 'visible');
                }
            });
        }
    });
}

module.exports = Decklist;