///<reference path="typings/node/node.d.ts"/>
'use strict';

let ua = require('universal-analytics');
let auth = require('../auth');

export = function (uid?:any, ip?:any) {
    if (uid !== undefined) {
        return ua(auth.ga, uid, {https: true, strictCidFormat: false, uip: ip});
    } else {
        return ua(auth.ga, {https: true, uip: ip});
    }
};
