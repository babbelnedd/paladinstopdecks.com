///<reference path="../typings/node/node.d.ts"/>

'use strict';

export = function (res:any) {
    return function (obj:any) {
        res.json(obj);
    };
}