///<reference path="../typings/tsd.d.ts"/>
'use strict';

import {Express, Response, Request} from 'express';

class Router {
    public static setup(app:Express) {

        // set HTTP headers
        app
            .use(function (req:Request, res:Response, next:Function) {
                res.removeHeader('x-powered-by');
                next();
            })
            .use('/admin', require('./admin/index'))
            .use('/api', require('./api/index'))
            .use('/account', require('./account/index'))
            .use('/news', require('./news.route'))
            .use('/auth', require('./auth.route'))
            .use('/champion', require('./champion.route'))
            .use('/cards', require('./cards.route'))
            .use('/card', require('./card.route'))
            .use('/deckbuilder', require('./deckbuilder.route'))
            .use('/decks', require('./decks.route'))
            .use('/paladins-top-rated-decks', require('./toprateddecks.route'))
            .use('/recent-decks', require('./recentdecks.route'))
            .use('/robots.txt', require('./robots/robots.txt'))
            .use('/sitemap.xml', require('./robots/sitemap.xml'))
            .use('/legal', require('./legal.route'))
            .use('/contact', require('./contact.route'))
            .use('/feedback', require('./feedback.route'))
            .use('/top-decks-league', require('./tdl/index'))
            .use('/', require('./index.route'))
            .use('/team', require('./team.route'))
            .use('/manage-team', require('./team/manage.route'))
            .use('/apple-touch-icon.png', require('./robots/apple-touch-icon.png.route'))
            .use('/manifest.json', require('./robots/manifest.json.route'))
            .use('/feed', require('./feed.route'))
            .use('/tierlists', require('./tierlist.route'))
            // .use('/patchnotes', require('./patchnotes.route'))
            // .use('/user', require('./user.route'))
            // .use('/donate', require('./donate.route'))
            .use('/social', require('./social.route'));
    }
}

export = Router;