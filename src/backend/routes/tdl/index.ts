///<reference path="../../typings/tsd.d.ts"/>
import {ITeam} from '../../model/Team';
'use strict';

import {Router, Request, Response} from 'express';
import path = require('path');
import Model = require('../../model/index');

let imgPath = path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'frontend', 'static', 'img');
let scoreboard = path.join(imgPath, 'topdecks-league', 'scoreboard.png');


export = Router()
    .get('/', function (req:Request, res:Response) {
        res.render('tdl/index', {
            title: 'Top Decks League',
            meta: {
                description: 'Top Decks League is a Round-Robin based Paladins Tournament. ' +
                'The best teams from North America and Europe will compete for a spot ' +
                'at the top eight to get into the finals.'
            }
        });
    })
    .get('/rules', function (req:Request, res:Response) {
        res.render('tdl/rules', {
            title: 'Top Decks League rules',
            meta: {
                description: 'The official Rules for Top Decks League by Paladins Top Decks.'
            }
        });
    })
    .get('/teams', function (req:Request, res:Response) {
        Model.Team.find({signedUp: 'season_one'})
            .select('name normalizedName')
            .lean().exec().then(function (teams:ITeam[]) {
            res.render('tdl/teams', {
                title: 'Top Decks League teams',
                teams: teams,
                meta: {
                    description: 'The official participants for Season I of the Top Decks League by Paladins Top Decks.'
                }
            });
        });
    })
    .get('/discord', function (req:Request, res:Response) {
        res.redirect('https://discord.gg/0lRwpXtEpZF02r4c');
    })
    .get('/attachment/scoreboard', function (req:Request, res:Response) {
        res.sendFile(scoreboard);
    });