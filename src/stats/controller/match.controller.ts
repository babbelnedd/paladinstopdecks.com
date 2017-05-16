///<reference path="../typings/tsd.d.ts"/>
'use strict';

import {IGame, IGamePlayer} from '../model/game';
import {Player, IPlayer} from '../model/index';
import {Card, ICard} from '../../backend/model/index';
import {Types} from 'mongoose';
import Promise = require('bluebird');

function getCard(name:string) {
    return new Promise(function (resolve:(card:ICard)=>void) {
        Card.findOne({
            name: new RegExp(`^${name}$`, 'i')
        }).lean().exec().then(function (card:ICard) {
            resolve(card);
        });
    });
}

function getCards(game:IGame) {
    return new Promise(function (resolve:(game:IGame)=>void) {
        let q:any = [];

        for (let i = 0; i < game.players.length; i++) {
            let player:IGamePlayer = game.players[i];
            let cards:any[] = JSON.parse(JSON.stringify(player.cards));
            player.cards = [];
            for (let j = 0; j < cards.length; j++) {
                q.push(function (player:IGamePlayer, j:number) {
                    return new Promise(function (resolve:any) {
                        getCard(cards[j]).then(function (card:ICard) {
                            player.cards.push(card);
                            resolve();
                        });
                    });
                }(player, j));
            }
        }

        Promise.all(q).then(function () {
            resolve(game);
        });
    });
}

function getPlayer(name:string) {
    return new Promise(function (resolve:(id:Types.ObjectId)=>void) {
        Player.findOne({
            name: new RegExp(`^${name}$`, 'i')
        }).select('_id').lean().exec().then(function (player:IPlayer) {
            if (!player) {
                new Player({
                    name: name,
                    queues: []
                }).save(function (err:any, player:IPlayer) {
                    resolve(player._id);
                });
            } else {
                resolve(player._id);
            }
        });
    });
}

function getPlayers(game:IGame) {
    return new Promise(function (resolve:(game:IGame)=>void) {
        let q:any[] = [];

        for (let i = 0; i < game.players.length; i++) {
            q.push(function () {
                game.players[i] = getPlayer(game.players[i]);
            }());
        }

        Promise.all(q).then(function () {
            return game;
        });
    });
}

export function buildGameFromApiResults(result:any):IGame {
    return new Promise(function (resolve:(game:IGame)=>void, reject:any) {
        let game:IGame;
        getPlayers(game);
        getCards(game);
        return game;
    });
}