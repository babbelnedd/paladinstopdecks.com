///<reference path="../typings/express/express.d.ts"/>

'use strict';
import {Router, Request, Response} from 'express';

export = Router()
    .get('/twitter', function (req:Request, res:Response) {
        res.status(302).redirect('https://twitter.com/paladinstopdeck');
    })
    .get('/youtube', function (req:Request, res:Response) {
        res.status(302).redirect('https://www.youtube.com/channel/UCRUxgaDmFElqLLb5tEGMwNA');
    })
    .get('/twitch', function (req:Request, res:Response) {
        res.status(302).redirect('http://www.twitch.tv/paladinstopdecks/');
    });