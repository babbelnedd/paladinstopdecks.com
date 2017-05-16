///<reference path='../typings/tsd.d.ts'/>
'use strict';

import {Tierlist, ITierlist} from '../model/index';
import moment = require('moment');
import log = require('../log');
let md = require('../../shared/md');

export function create(tierlist:ITierlist) {

    let len = (tierlist.SS || []).length +
        (tierlist.S || []).length +
        (tierlist.A || []).length +
        (tierlist.B || []).length +
        (tierlist.C || []).length;

    if (len < 5) {
        return Promise.reject({err: 'Your list have to consist of at least 5 champions'});
    }

    if (tierlist.title.trim().length < 5) {
        return Promise.reject({err: 'Title needs at least 5 characters'});
    }

    return new Promise(function (resolve:Function, reject:Function) {
        Tierlist.find({_user: tierlist._user}).select('updated').sort({updated: -1}).limit(1)
            .lean().exec().then(function (tl:ITierlist[]) {
            let diff = moment.duration(moment().diff(moment(tl[0].updated.toString(), 'x'))).asSeconds();
            if (diff < 120) {
                let d = parseInt((120 - diff).toString());
                return reject({err: `You are trying it too often, try it again in ${d} seconds`});
            }
            new Tierlist(tierlist).save(function (err:Error, tierlist?:ITierlist) {
                if (err) {
                    console.info('err', err);
                    log.error('Could not save a tierlist', {err: err.message});
                    return reject({err: 'Failed to save Tierlist'});
                }
                return resolve(tierlist);
            });
        });
    });
}

let shortidRegex = /[A-Za-z0-9_-]{7,14}/;
export function getById(id:string) {
    return new Promise(function (resolve:Function, reject:Function) {
        if (!shortidRegex.test(id)) {
            return reject();
        }
        Tierlist.findOne({_id: id}).lean().exec().then(function (tierlist:ITierlist) {
            if (!!tierlist) {
                tierlist.description = md(tierlist.description);
                resolve(tierlist);
            } else {
                reject({err: 'Tierlist not found'});
            }
        });
    });
}