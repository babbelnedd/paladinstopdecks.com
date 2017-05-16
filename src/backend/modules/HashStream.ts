///<reference path="../typings/tsd.d.ts"/>
'use strict';
import ReadableStream = NodeJS.ReadableStream;

let crypto = require('crypto');

export = function (stream:ReadableStream, callback:(err:Error, md5:string, buffer:Buffer)=>void) {
    let hash = crypto.createHash('md5'),
        arr:any[] = [];

    stream.on('data', function (data:any) {
        arr.push(data);
        hash.update(data);
    });
    stream.on('end', function () {
        callback(null, hash.digest('hex'), Buffer.concat(arr));
    });

    stream.on('error', callback);
};