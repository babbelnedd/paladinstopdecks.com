'use strict';

function deepCompare() {
    var i, l, leftChain, rightChain;

    function compare2Objects(x, y) {
        var p;

        // remember that NaN === NaN returns false
        // and isNaN(undefined) returns true
        if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
            return true;
        }

        // Compare primitives and functions.
        // Check if both arguments link to the same object.
        // Especially useful on step when comparing prototypes
        if (x === y) {
            return true;
        }

        // Works in case when functions are created in constructor.
        // Comparing dates is a common scenario. Another built-ins?
        // We can even handle functions passed across iframes
        if ((typeof x === 'function' && typeof y === 'function') ||
            (x instanceof Date && y instanceof Date) ||
            (x instanceof RegExp && y instanceof RegExp) ||
            (x instanceof String && y instanceof String) ||
            (x instanceof Number && y instanceof Number)) {
            return x.toString() === y.toString();
        }

        // At last checking prototypes as good a we can
        if (!(x instanceof Object && y instanceof Object)) {
            return false;
        }

        if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
            return false;
        }

        if (x.constructor !== y.constructor) {
            return false;
        }

        if (x.prototype !== y.prototype) {
            return false;
        }

        // Check for infinitive linking loops
        if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
            return false;
        }

        // Quick checking of one object beeing a subset of another.
        // todo: cache the structure of arguments[0] for performance
        for (p in y) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }
        }

        for (p in x) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }

            switch (typeof (x[p])) {
                case 'object':
                case 'function':

                    leftChain.push(x);
                    rightChain.push(y);

                    if (!compare2Objects(x[p], y[p])) {
                        return false;
                    }

                    leftChain.pop();
                    rightChain.pop();
                    break;

                default:
                    if (x[p] !== y[p]) {
                        return false;
                    }
                    break;
            }
        }

        return true;
    }

    if (arguments.length < 1) {
        return true; //Die silently? Don't know how to handle such case, please help...
        // throw "Need two or more arguments to compare";
    }

    for (i = 1, l = arguments.length; i < l; i++) {

        leftChain = []; //Todo: this can be cached
        rightChain = [];

        if (!compare2Objects(arguments[0], arguments[i])) {
            return false;
        }
    }

    return true;
}

module.exports = {
    loop: function (arr, start, end, increment, options) {
        var ret = '';
        if (end === '*') {
            end = arr.length;
        }
        if (options === undefined) {
            options = increment;
            increment = 1;
        }
        for (var i = start; i < end; i += increment) {
            ret += options.fn(arr[i]);
        }
        return ret;
    },
    modulo: function (v1, v2, v3, options) {
        if (options === undefined) {
            options = v3;
            v3 = 0;
        }

        if (v1 % v2 == v3) {
            return options.fn(this);
        }
        return options.inverse(this);
    },
    ifEqualObj: function (v1, v2, options) {
        if (deepCompare(v1, v2)) {
            return options.fn(this);
        }
        return options.inverse(this);
    },
    ifEqualObjId: function (v1, v2, options) {
        if (v1) {
            v1 = v1.toString();
        }
        if (v2) {
            v2 = v2.toString();
        }
        if (v1 === v2) {
            return options.fn(this);
        }
        return options.inverse(this);
    },
    ifEqual: function (v1, v2, options) {
        if (v1 == v2) {
            return options.fn(this);
        }
        return options.inverse(this);
    },
    ifNotEqual: function (v1, v2, options) {
        if (v1 != v2) {
            return options.fn(this);
        }
        return options.inverse(this);
    },
    ifGreater: function (v1, v2, options) {

        if (v1 > v2) {
            return options.fn(this);
        }
        return options.inverse(this);
    },
    ifIn: function (v1, v2, options) {
        if (v1.indexOf(v2) !== -1) {
            return options.fn(this);
        }
        return options.inverse(this);
    },
    ifIn2d: function (arr, index, v3, options) {
        if (arr && arr[index]) {
            if (arr[index].indexOf(v3.toString()) !== -1) {
                return options.fn(this);
            }
        }
        return options.inverse(this);
    },
    ifNotIn: function (v1, v2, options) {
        if (v1.indexOf(v2) === -1) {
            return options.fn(this);
        }
        return options.inverse(this);
    },
    ifLess: function (v1, v2, options) {
        if (v1 < v2) {
            return options.fn(this);
        }
        return options.inverse(this);
    },
    normalize: require('../shared/normalize'),
    JSON: function (v1, v2) {
        if (isNaN(v2)) {
            v2 = 4;
        }
        return JSON.stringify(v1, null, v2);
    },
    moment: function (v1, v2, v3) {
        var moment = require('moment');
        if (v2 === 'utc') {
            return moment.utc(v1).format(v3);
        }

        return moment(v1, v2).format(v3);
    },
    relativeMoment: function (v1, v2, v3, v4) {
        var moment = require('moment'),
            parsed = moment(v1, v2),
            now = moment();
        if (typeof v3 !== 'undefined' && typeof v4 !== 'undefined') {
            var diff = moment.duration(now.diff(parsed)).asMinutes();
            if (diff > v3) {
                return parsed.format(v4);
            }
        }

        return parsed.from(now);
    },
    capitalize: function (v1, v2) {
        var doNotCapitalize = [];
        if (typeof v2 === 'string') {
            doNotCapitalize = v2.split(';');
        }
        return v1.replace(/\w\S*/g, function (txt) {
            if (doNotCapitalize.indexOf(txt) > -1) {
                return txt;
            }
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    },
    shortNumber: function (v1) {
        if (isNaN(v1)) {
            return v1;
        }
        var n = parseInt(v1);
        if (n < 1000) {
            return n;
        }
        if (n < 100000) {
            n = n / 1000.0;
            return n.toFixed(1) + 'k';
        }
        n = n / 1000.0;
        return Math.floor(n) + 'k';
    },
    getProperty: function (v1, v2) {
        return v1[v2];
    },
    lowercase: function (v1) {
        if (typeof v1 !== 'string') {
            return v1;
        }
        return v1.toLowerCase();
    },
    uppercase: function (v1) {
        if (typeof v1 !== 'string') {
            return v1;
        }
        return v1.toUppercase();
    },
    ifAny: function (v1, options) {
        if (!v1) {
            return options.inverse(this)
        }
        try {
            v1 = JSON.parse(JSON.stringify(v1));
        } catch (err) {
            console.info('woopsie2?', err, v1);
        }
        var result = false;
        for (var key in v1) {
            if (v1.hasOwnProperty(key)) {
                if (!!v1[key]) {
                    result = true;
                    break;
                }
            }
        }
        if (result === true) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    },
    isOdd: function (v1, options) {
        if (v1 % 2 !== 0) {
            return options.fn(this);
        }
        return options.inverse(this);
    },
    isEven: function (v1, options) {
        if (v1 % 2 === 0) {
            return options.fn(this);
        }
        return options.inverse(this);
    },
    eachByProp: function (arr, prop, options) {
        if (arr[prop]) {

            if (options.data) {
                var data = options.data;
            }

            var x = arr[prop],
                ret = '';
            for (var i = 0; i < x.length; i++) {
                if (data) {
                    data.index = i;
                }

                ret += options.fn(x[i], {data: data});
            }
            return ret;
        }
    },
    times: function (n, block) {
        var accum = '';
        for (var i = 0; i < n; ++i)
            accum += block.fn(i);
        return accum;
    },
    divide: function (v1, v2, round) {
        round = round || false;
        var result = v1 / v2;
        if (round) {
            result = Math.round(result);
        }
        return result;
    },
    addition: function (v1, v2) {
        return v1 + v2;
    },
    substring: function (str, start, end) {
        if (typeof str !== 'string') {
            return str;
        }

        if (typeof end === 'undefined') {
            end = start;
            start = 0;
        }

        return str.substring(start, end);
    },
    replace: function (str, r, w) {
        return str.replace(r, w);
    },
    escape: function (str) {
        var entityMap = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': '&quot;',
            "'": '&#39;',
            "/": '&#x2F;'
        };

        return String(str).replace(/[&<>"'\/]/g, function (s) {
            return entityMap[s];
        });

    }
};