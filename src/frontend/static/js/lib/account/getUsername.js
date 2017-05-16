'use strict';

module.exports = function () {
    var path = window.location.pathname.substring(1, window.location.pathname.length).split('/');

    if (path.length > 1 && path[0] === 'account') {
        return path[1];
    }

};