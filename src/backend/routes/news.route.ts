///<reference path='../typings/tsd.d.ts'/>

'use strict';
import {Router, Request, Response, NextFunction} from 'express';
import {Article, IArticle, IUser} from '../model/index';
import {cache} from '../utils/index';
import Controller = require('../controller/index');

export = Router()
    .get('/', function (req:Request, res:Response) {
        Article.find({})
            .sort({date: -1})
            .lean().exec().then(function (articles:IArticle[]) {
            return res.render('blog/index', {
                articles: articles
            });
        });
    })
    .get('/:slug', function (req:Request, res:Response, next:NextFunction) {
        let key:string = `article_${req.params.slug}`;

        function send(obj:any) {
            res.render('article', obj);
        }

        function onSuccess(article:IArticle) {
            if (!article) {
                return next();
            }
            function respond(article:IArticle, user?:IUser) {
                let meta:any = {
                    description: article.meta.description,
                    image: article.logo
                };

                if (article.meta.other) {
                    for (let i = 0; i < article.meta.other.length; i++) {
                        meta[article.meta.other[i].name] = article.meta.other[i].content;
                    }
                }

                let obj:any = {
                    article: article,
                    title: article.meta.title,
                    meta: meta,
                    dependencies: {
                        js: ['article']
                    }
                };
                if (user) {
                    obj.author = user;
                }
                cache.set(key, obj);
                send(obj);
            }

            if (article.author) {
                Controller.User.findOne(<string>article.author)
                    .then(function (user:IUser) {
                        respond(article, user);
                    });
            } else {
                respond(article);
            }
        }


        cache.get(key).then(function (res:string) {
            if (typeof res === 'string') {
                return send(JSON.parse(res));
            } else {
                Article
                    .findOne({slug: req.params.slug})
                    .lean().exec()
                    .then(onSuccess, next);
            }
        });
    });