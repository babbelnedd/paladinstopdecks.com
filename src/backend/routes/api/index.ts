///<reference path="../../typings/tsd.d.ts"/>
'use strict';

import {Router} from 'express';

export = Router()
    .use('/champion', require('./champions.route'))
    .use('/deck', require('./deck.route'))
    .use('/card', require('./card.route'))
    .use('/activity', require('./activity.route'))
    .use('/avatar', require('./avatar.route'))
    .use('/comments', require('./comments.route'))
    .use('/notifications', require('./notifications.route'))
    // .use('/streams', require('./streams.route') )
    .use('/auth', require('./auth.route'))
    .use('/teams', require('./team.route'))
    .use('/form', require('./form.route'))
    .use('/favorite', require('./favorite.route'))
    .use('/cardtip', require('./cardtip.route'))
    .use('/og', require('./og.route'))
    .use('/upload', require('./upload.route'))
    .use('/tierlists', require('./tierlists.route'))
    .use('/search', require('./search.route'));
// .use('/user',  require('./user.route'));