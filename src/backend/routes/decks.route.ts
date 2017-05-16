///<reference path="../typings/tsd.d.ts"/>
'use strict';
import express = require('express');
import model = require('../model/index');
import utils = require('../utils/index');
import cache = require('../utils/cache');
import {IDeck, ICard} from '../model/index';
import cheerio = require('cheerio');

let sortByTier = require('../../shared/sortByTier');
let Promise = require('bluebird');
let striptags = require('striptags');
let youtubeRx = /\[youtube\]([a-zA-Z0-9\-\_]{4,15})\[\/youtube\]/g;
let cardRx = /\[card=([a-zA-Z0-9\#\_\-]{5,100})\]([^\]\[]*)\[\/card\]/g;
let md = require('../../shared/md');


function youtube(id:string) {
    return `<div class="youtube-wrapper">
    <iframe src="https://www.youtube.com/embed/${id}?html5=1&hd=1&modestbranding=1" frameborder="0"></iframe>
    </div>`;
}

function sanitize(input:string) {
    return require('sanitize-html')(input, {
        allowedTags: ['h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
            'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
            'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span', 'img'],
        allowedAttributes: {
            '*': ['style'],
            a: ['href', 'name', 'target'],
            strong: ['class'],
            img: ['src', 'width', 'height']
        },
        selfClosing: ['img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],
        allowedSchemes: ['http', 'https'],
        allowedSchemesByTag: {}
    });
}

function getAllCards() {
    let key = 'ALL_CARDS';
    return new Promise(function (resolve:Function) {
        cache.get(key).then(function (cards:any) {

            if (!!cards) {
                resolve(JSON.parse(cards));
            } else {
                model.Card.find({isRemoved: false}).lean().exec().then(function (cards:ICard[]) {
                    cache.set(key, cards);
                    resolve(cards);
                });
            }
        });
    });
}

export = express.Router()
    .get('/:champion', function (req:express.Request, res:express.Response) {

        function respond(result:any) {
            res.render('deck/list', {
                nav: 'decks',
                champion: req.params.champion,
                decks: result.decks,
                meta: {
                    description: `An overview of the best ${utils.capitalize(req.params.champion)} decks for Paladins. `
                },
                pagination: {
                    page: result.page,
                    from: result.from,
                    to: result.to > result.count ? result.count : result.to,
                    max: result.count
                },
                hide: {champion: true},
                dependencies: {
                    js: ['decklist']
                }
            });
        }

        let filter:any = {
            normalizedChampion: req.params.champion.toLowerCase()
        };
        const decksPerPage:number = 50;
        let skip:number = 0;

        let page = parseInt(req.query.page);
        if (!isNaN(page)) {
            page--; // page 1 is technical page 0
            skip = decksPerPage * page;
        }

        if (!!req.query.author) {
            filter.author = new RegExp(`.*${req.query.author}.*`, 'i');
        }
        if (!!req.query.name) {
            filter.name = new RegExp(`.*${req.query.name}.*`, 'i');
        }

        let queries = {
            count: model.Deck.count(filter).lean().exec(),
            decks: model.Deck
                .find(filter)
                .select('updated author rating views patch name deckid normalizedName normalizedChampion')
                .skip(skip)
                .limit(decksPerPage)
                .exec(),
            page: page + 1,
            from: skip + 1,
            to: skip + decksPerPage
        };

        Promise.props(queries).then(respond);
    })
    .get('/:champion/:deck', function (req:express.Request, res:express.Response) {
        let redirect = false,
            index = req.params.deck.indexOf('-'),
            deckFilter:any = {
                normalizedChampion: req.params.champion
            };

        function render(opts:any) {
            opts.deck.substitutions = opts.substitutions;
            res.render('deck/single', {
                nav: 'decks',
                deck: opts.deck,
                decks: opts.decks,
                title: `${utils.capitalize(opts.deck.normalizedChampion)} Deck: ${opts.deck.name}`,
                author: opts.author,
                meta: {
                    description: opts.meta,
                    noindex: opts.deck.rating < 0,
                    date: opts.deck.created,
                    'last-modified': opts.deck.updated,
                    image: `/static/img/champions/${opts.deck.normalizedChampion}/og.png`
                },
                dependencies: {js: ['deck']}
            });
            return Promise.resolve(opts);
        }

        function getDeck(deckFilter:any) {

            function getUser(author:any) {
                return model.User
                    .findOne({_id: author})
                    .select('avatar avatarURL bio name created')
                    // .lean()
                    .exec();
            }

            function getCards(cards:any[]) {
                return model.Card
                    .find({_id: {$in: cards}})
                    .exec();
            }

            function getDeck(deckFilter:any) {
                return model.Deck.findOne(deckFilter).exec();
            }

            function getDecksByChampion(champion:any, exclude:any, limit:number) {
                // todo: prefer current patch!
                return model.Deck
                    .find({_champion: champion, _author: {$ne: exclude}})
                    .select('deckid normalizedChampion normalizedName name')
                    .sort({rating: -1})
                    .limit(limit).exec();
            }

            function getDecksByAuthor(author:any, exclude:any, limit:number) {
                // todo: prefer current patch!
                return model.Deck
                    .find({_author: author, _id: {$ne: exclude}})
                    .select('deckid normalizedChampion normalizedName name')
                    .sort({rating: -1})
                    .limit(limit).exec();
            }

            function getSubs(deck:IDeck) {
                return new Promise(function (resolve:any) {
                    let cards:any[] = [],
                        substitutions:any[] = [];
                    for (let i = 0; i < deck.substitutions.length; i++) {
                        if (cards.indexOf(deck.substitutions[i].orig) === -1) {
                            cards.push(deck.substitutions[i].orig);
                        }
                        if (cards.indexOf(deck.substitutions[i].sub) === -1) {
                            cards.push(deck.substitutions[i].sub);
                        }
                    }
                    model.Card.find({_id: {$in: cards}}).exec().then(function (cards:ICard[]) {
                        function getCard(id:any) {
                            for (let i = 0; i < cards.length; i++) {
                                if (cards[i]._id.equals(id)) {
                                    return cards[i];
                                }
                            }
                        }

                        for (let i = 0; i < deck.substitutions.length; i++) {
                            substitutions.push({
                                orig: getCard(deck.substitutions[i].orig),
                                sub: getCard(deck.substitutions[i].sub),
                                text: deck.substitutions[i].text
                            });
                        }
                        resolve(substitutions);
                    });
                });
            }

            function getMeta(deck:IDeck) {
                let stripped = utils.unescape.html(striptags(deck.description)
                    .replace(/\r?\n/g, ' ')
                    .replace(/\s\s+/g, ' ')
                    .replace(/"/g, ''));
                let dlen = deck.description.length;
                // let og = stripped.substring(0, deck.description.length > 200 ? 200 : dlen);
                let meta = stripped
                    .substring(0, deck.description.length > 160 ? 160 : dlen);
                if (meta.length < 10) {
                    meta = undefined;
                }
                return meta;
            }

            function sanitizeDescription(deck:IDeck) {
                return new Promise(function (resolve:Function) {
                    let description = '', $:CheerioStatic;
                    if (deck.updated < 1455269934000) {
                        description = sanitize(deck.description)
                            .replace(youtubeRx, youtube('$1'))
                            .replace(cardRx, function (_:string, name:string, text:string) {
                                let cardName = name.substring(name.indexOf('#') + 1, name.length);
                                return `<a
                                                    href="/card/${cardName}"
                                                    data-cardtip="${name}">${text}</a>`;
                            });
                        $ = cheerio.load(description);
                        $('a').removeAttr('rel').attr('rel', 'nofollow');
                        $('.stronger').each(function () {
                            $(this).find('a').addClass($(this).attr('class'));
                            $(this).removeAttr('class');
                        });
                        $('p').filter(function () {
                            let t = $(this).html().trim();
                            return t === '&nbsp;' || t === '&#xA0;' || t === '&#xa0;';
                        }).remove();
                        $('*').css({
                            'font-family': '',
                            'text-align': '',
                            'font-size': '',
                            'line-height': '',
                            'white-space': '',
                            'background': '',
                            'background-color': '',
                            'color': ''
                        });
                        $('*').each(function () {
                            if ($(this).attr('style') === '') {
                                $(this).removeAttr('style');
                            }
                        });
                        description = $.html();
                        resolve(description);
                    } else {
                        getAllCards().then(function (cards:ICard[]) {
                            description = require('sanitize-html')(deck.description, {
                                allowedTags: [],
                                allowedAttributes: {},
                                selfClosing: [],
                                allowedSchemes: ['http', 'https'],
                                allowedSchemesByTag: {}
                            });
                            description = md(description);

                            for (let i = 0; i < cards.length; i++) {
                                let c = cards[i];

                                if (c) {
                                    if (c.normalizedChampion === deck.normalizedChampion
                                        || c.normalizedChampion === null) {
                                        let r = `<a class="cardtip col-${c.tier}" href="/card/` +
                                            `${c.normalizedChampion === null ? 'neutral' : c.normalizedChampion}/` +
                                            `${c.normalizedName}" data-id="${c._id}">${c.name}</a>`;
                                        description = description.replace(new RegExp(c.name, 'gi'), r);
                                    }
                                }
                            }

                            $ = cheerio.load(description);
                            $('a').removeAttr('rel').attr('rel', 'nofollow');
                            $('a[data-id]').removeAttr('rel');
                            description = $.html();
                            resolve(description);
                        });
                    }
                });
            }

            return new Promise(function (resolve:any, reject:any) {
                getDeck(deckFilter).then(function (deck:model.IDeck) {
                    if (redirect === false) {
                        if (deck.normalizedName !== req.params.deck.substring(index + 1, req.params.deck.length)) {
                            redirect = true;
                        }
                    }
                    if (redirect) {
                        res.status(301);
                        res.redirect(deck.fullPath);
                        return reject();
                    }

                    getUser(deck._author)
                        .then(function (user:model.IUser) {
                            let x = {
                                byChampion: getDecksByChampion(deck._champion, deck._author, 5),
                                byAuthor: getDecksByAuthor(deck._author, deck._id, 5)
                            };
                            Promise.props(x).then(function (x:any) {
                                getCards(deck.cards)
                                    .then(function (cards:model.ICard[]) {
                                        // todo: sort cards while insert/update
                                        deck.cards = sortByTier(cards);
                                        sanitizeDescription(deck).then(function (description:string) {
                                            deck.description = description;

                                            getSubs(deck).then(function (subs:any) {
                                                return resolve({
                                                    deck: deck,
                                                    author: user,
                                                    substitutions: subs,
                                                    meta: getMeta(deck),
                                                    decks: {
                                                        byChampion: x.byChampion,
                                                        byAuthor: x.byAuthor
                                                    }
                                                });
                                            });
                                        });
                                    });
                            });
                        });
                });
            });
        }

        function updateViewCounter(deckFilter:any) {
            return function () {
                model.Deck.findOne(deckFilter).exec().then(function (deck:model.IDeck) {
                    deck.views++;
                    deck.save();
                });
            };
        }

        if (index > -1) {
            deckFilter.deckid = req.params.deck.substring(0, index);
        } else {
            deckFilter.deckid = req.params.deck;
            redirect = true;
        }

        if (redirect) {
            return getDeck(deckFilter).then(render);
        }
        // todo: CacheKey.generate.singleDeck(req.params.champion, deckFilter.deckid)
        let key = 'deck_' + req.params.champion.toLowerCase() + '_' + deckFilter.deckid;
        cache.get(key).then(function (result:any) {
            if (typeof result === 'string') {
                result = JSON.parse(result);
                if (result.deck.normalizedName !== req.params.deck.substring(index + 1, req.params.deck.length)) {
                    redirect = true;
                }
                if (redirect) {
                    res.status(301);
                    return res.redirect(result.deck.fullPath);
                }
                render(result).then(updateViewCounter(deckFilter));
            } else {
                getDeck(deckFilter)
                    .then(render)
                    .then(cache.thenSet(key));
                // set 30m cache
                // .then(cache.thenExpires(key, 1800));
                // .then(updateViewCounter(deckFilter));
            }
        });
    })
    .post('/:champion', function (req:express.Request, res:express.Response) {

        let championRegex = new RegExp(req.params.champion, 'i'),
            select = 'updated name author path patch normalizedChampion rating fullPath deckid normalizedName',
            filter:any = {normalizedChampion: {$regex: championRegex}},
            sortOrder = 1,
            limit = req.body.limit || 100,
            offset = req.body.offset || 0,
            sortField = 'name';

        if (model.Deck.schema.path(req.body.sort)) {
            sortField = String(req.body.sort);
        }

        if (!!req.body.order) {
            if (req.body.order === 'asc') {
                sortOrder = -1;
            } else {
                sortOrder = 1;
            }
        }
        if (!!req.body.search) {
            filter.name = {$regex: new RegExp('.*' + req.body.search + '.*', 'i')};
        }

        function getFiltered() {
            let getResults = model.Deck
                .find(filter)
                // https://github.com/lukehoban/es6features#enhanced-object-literals
                .sort({[sortField]: sortOrder})
                .select(select)
                .skip(offset)
                .limit(limit)
                .exec();
            let getCount = model.Deck.count({normalizedChampion: {$regex: championRegex}});
            let queries = {rows: getResults, total: getCount};

            return Promise.props(queries);
        }

        if (!req.body.search) {
            let key = `decksearch_${req.params.champion}_${sortOrder}_${sortField}_${offset}`;
            cache.get(key).then(function (result:any) {
                if (typeof result === 'string') {
                    return res.json(JSON.parse(result));
                } else {
                    getFiltered()
                        .then(function (data:any) {
                            res.json(data);
                            return Promise.resolve(data);
                        })
                        .then(function (data:any) {
                            cache.set(key, data);
                            cache.expires(key, 120 * 60);
                            return Promise.resolve(result);
                        });
                }
            });
        } else {
            getFiltered().then(function (data:any) {
                res.json(data);
            });
        }

    });