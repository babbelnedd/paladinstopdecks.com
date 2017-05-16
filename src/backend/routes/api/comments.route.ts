///<reference path="../../typings/tsd.d.ts"/>
'use strict';

import {IArticle} from '../../model/Article';
import {Router, Request, Response} from 'express';
import log = require('../../log');
import Controller = require('../../controller/index');
import model = require('../../model/index');
import utils = require('../../utils/index');
let activity = require('../../../shared/activityType');
let notification = require('../../../shared/notificationType');

export = Router()
    .get('/:slug', function (req:Request, res:Response, next:any) {
        Controller.Comment.getCommentsBySlug(req.params.slug)
            .then(utils.respond(res))
            .catch(next);
    })
    .post('/', function (req:Request, res:Response, next:Function) {
        if (!req.isAuthenticated()) {
            log.warn('Someone tries to post a comment but is not authenticated', {
                ip: req.ip,
                headers: req.headers,
                slug: req.body.slug,
                author: req.body.author
            });
            return next();
        }

        let champion = req.body.slug.split('_')[0],
            deckid = req.body.slug.split('_')[1];
        Controller.Comment.comment(req.user, req.body).then(function (comment:model.IComment) {
            res.json(comment.id);

            if (comment.type === Controller.Comment.Type.Deck) {
                model.Deck.findOne({
                    deckid: deckid,
                    normalizedChampion: champion
                }).exec().then(function (deck:model.IDeck) {
                    Controller.Activity.newActivity(req.user, activity.type.submittedComment, {
                        url: deck.fullPath,
                        info: [`Commented on Deck: ${deck.name}`]
                    });
                    if (!req.user._id.equals(deck._author)) {
                        let user = <model.IUser>{_id: deck._author};
                        Controller.Notification.newNotification(user, notification.type.comment, {
                            url: deck.fullPath,
                            info: `New Comment by ${req.user.name} on Deck: ${deck.name}`
                        });
                    }
                    // && !comment.origin.equals(deck._author) && !comment.origin.equals(req.user._id)) {
                    if (comment.origin) {
                        model.Comment.findOne({_id: comment.origin}).lean().exec().then(function (c:model.IComment) {
                            let u = <model.IUser>{_id: c.author.id};
                            Controller.Notification.newNotification(u, notification.type.comment, {
                                url: deck.fullPath,
                                info: `New Reply by ${req.user.name} on Deck: ${deck.name}`
                            });
                        });
                    }
                });
            }
            if (comment.type === Controller.Comment.Type.Article) {
                model.Article.findOne({slug: comment.slug}).lean().exec().then(function (article:IArticle) {
                    Controller.Activity.newActivity(req.user, activity.type.submittedComment, {
                        url: `/news/${article.slug}`,
                        info: [`Commented on Article: ${article.meta.title}`]
                    });
                    // todo: notification for author
                });
            }

        });
    });