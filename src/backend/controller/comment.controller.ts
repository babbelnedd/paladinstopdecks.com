///<reference path="../typings/node/node.d.ts"/>
'use strict';

import model = require('../model/index');
import log = require('../log');
import utils = require('../utils/index');
let Promise = require('bluebird');
let md = require('../../shared/md');

function buildComment(user:model.IUser, comment:model.IComment) {
    // todo: validate! if not valid reject;
    return new Promise(function (resolve:Function) {
        comment.author = {id: <any>user.id, name: user.name};
        comment.text = md(comment.text);
        return resolve(new model.Comment(comment));
    });
}

function saveComment(comment:model.IComment) {
    return new Promise(function (resolve:any, reject:any) {
        comment.save(function (err:any, c:model.IComment) {
            if (err) {
                log.warn('Could not save comment!', {comment: comment, err: err.message});
                return resolve({err: 'Could not save comment. Try again'});
            }
            log.info('New Comment', {
                comment: {
                    author: comment.author.name,
                    text: comment.text,
                    origin: comment.origin,
                    slug: comment.slug
                }
            });
            return resolve(c);
        });
    });
}

function clearCache(comment:model.IComment) {
    return new Promise(function (resolve:any, reject:any) {
        return utils.cache.del(`comments_${comment.slug}`).then(function () {
            resolve(comment);
        });
    });
}

export function getCommentsBySlug(slug:string) {
    return new Promise(function (resolve:any, reject:any) {
        let key = `comments_${slug}`;
        utils.cache.get(key).then(function (comments:string) {
            if (typeof comments === 'string') {
                return resolve(JSON.parse(comments));
            } else {
                (<any>model.Comment).findBySlug(slug).then(function (comments:string) {
                    utils.cache.set(key, comments).then(function () {
                        return resolve(comments);
                    });
                });
            }
        });
    });
}

export function comment(user:model.IUser, comment:model.IComment) {
    return buildComment(user, comment).then(saveComment).then(clearCache);
}

export let Type = {
    Deck: 'deck',
    Article: 'article'
};