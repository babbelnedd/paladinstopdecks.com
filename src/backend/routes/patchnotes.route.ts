///<reference path='../typings/express/express.d.ts'/>
'use strict';

import express = require('express');
import model = require('../model/index');
import Enum = require('../enum/index');
import utils = require('../utils/index');

let router = express.Router();

router.get('/champion', function (req:express.Request, res:express.Response) {

    let filter = {type: Enum.PatchType[Enum.PatchType.CHAMPION]};
    model.Patch.distinct('champion', filter, function (err:any, champions:any) {
        res.render('patchnotes/champions', {
            nav: 'patchnotes',
            champions: champions,
            title: 'Patchnotes'
        });
    });

});

router.get('/champion/:champion', function (req:express.Request, res:express.Response) {

    model.Patch.find({
            type: Enum.PatchType[Enum.PatchType.CHAMPION],
            champion: {$regex: new RegExp(req.params.champion, 'i')}
        })
        .sort('-version')
        .exec(function (err:any, changes:any) {
            res.render('patchnotes/champion', {
                nav: 'patchnotes',
                changes: changes,
                title: `${utils.capitalize(req.params.champion)} Patchnotes`
            });
        });

});

router.get('/card', function (req:express.Request, res:express.Response) {
    res.render('patchnotes/card', {nav: 'patchnotes'});
});

router.get('/version', function (req:express.Request, res:express.Response) {

    let aggregation = [
        {'$group': {_id: {version: '$version', date: '$date'}}},
        {'$project': {_id: 0, version: '$_id.version', date: '$_id.date'}}];
    model.Patch.aggregate(aggregation, function (err:any, versions:any) {
        res.render('patchnotes/version', {nav: 'patchnotes', versions: versions});
    });

});

export = router;