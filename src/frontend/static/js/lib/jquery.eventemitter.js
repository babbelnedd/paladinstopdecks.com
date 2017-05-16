'use strict';

var $ = window.jQuery = window.$ = require('jquery');

$.eventEmitter = {
    _JQInit: function () {
        this._JQ = $(this);
    },
    emit: function (evt, data) {
        this._JQInit();
        this._JQ.trigger(evt, data);
    },
    once: function (evt, handler) {
        this._JQInit();
        this._JQ.one(evt, handler);
    },
    on: function (evt, handler) {
        this._JQInit();
        this._JQ.bind(evt, handler);
    },
    off: function (evt, handler) {
        this._JQInit();
        this._JQ.unbind(evt, handler);
    }
};