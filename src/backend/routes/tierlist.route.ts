///<reference path='../typings/tsd.d.ts'/>
'use strict';

import {Router, Request, Response, NextFunction} from 'express';
import {IChampion, Champion} from '../model/index';
import {Tierlist} from '../controller/index';
import {ITierlist} from '../model/Tierlist';

export = Router()
    .get('/', function (req:Request, res:Response) {
        res.render('tierlists/overview', {
            tierlists: []
        });
    })
    .get('/create', function (req:Request, res:Response) {
        Champion.find({}).select('normalizedName').lean().exec().then(function (champions:IChampion[]) {
            res.render('tierlists/create', {
                champions: champions.map(function (obj:IChampion) {
                    return obj.normalizedName;
                }),
                tiers: ['SS', 'S', 'A', 'B', 'C'],
                dependencies: {
                    js: ['tierlists/create']
                }

            });
        });
    })
    .get('/:id', function (req:Request, res:Response, next:NextFunction) {
        Tierlist.getById(req.params.id)
            .then(function (tierlist:ITierlist) {
                res.render('tierlists/single', {
                    tierlist: tierlist
                });
            })
            .catch(function () {
                next();
            });
    });