///<reference path='../../typings/tsd.d.ts'/>
'use strict';

import {Router, Request, Response, NextFunction} from 'express';
import {Article, IArticle} from '../../model/index';

export = Router()
    .get('/', function (req:Request, res:Response, next:NextFunction) {
        // todo: next if no permissions

        let filter:any = {};
        if (req.user.name !== 'schadstoff') {
            filter = {author: new RegExp(req.user.name, 'i')};
        }
        Article.find(filter).lean().exec().then(function (articles:IArticle[]) {
            res.render('admin/articles', {
                layout: 'layout/admin',
                articles: articles
            });
        });
    })
    .post('/', function (req:Request, res:Response, next:NextFunction) {
        if (!req.body._id) {
            return next();
        }

        let filter:any = {_id: req.body._id};
        if (req.user.name !== 'schadstoff') {
            filter.author = new RegExp(req.user.name, 'i');
        }

        Article.findOne(filter).exec().then(function (article:IArticle) {
            if (!article) {
                return next();
            }

            article.content = req.body.content;
            article.comments = req.body.comments;
            article.title = req.body.title;
            article.date = req.body.date;
            article.slug = req.body.slug;
            article.logo = req.body.logo;
            article.visible = req.body.visible === 'on';
            article.comments = req.body.comments === 'on';
            article.preview = req.body.preview || ' ';
            article.meta.description = req.body.meta_description;
            article.meta.title = req.body.meta_title;
            article.save(function (err:any) {
                console.info('err', err);
                res.redirect(req.header('Referer') || '/');
            });
        });

    });