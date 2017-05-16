'use strict';

import Auth = require('../../auth');
let Redis = require('ioredis');

let opts:any = {db: 0};
if (!!Auth.redis.host && !!Auth.redis.port) {
    opts.host = Auth.redis.host;
    opts.port = Auth.redis.port;
} else {
    opts.path = Auth.redis.socket;
}
let redis = new Redis(opts);

export = redis;