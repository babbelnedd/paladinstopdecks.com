///<reference path="../../typings/express/express.d.ts"/>
'use strict';

import {Router, Request, Response} from 'express';
import {cache} from '../../utils/index';
import {Card, ICard} from '../../model/index';

export = Router()
    .get('/:id/:size', function (req:Request, res:Response) {
        let key = `cardtip_${req.params.id}`;

        function render(card:ICard) {
            return res.render('../partials/card', {
                layout: '',
                card: card,
                size: req.params.size
            });
        }

        cache.get(key).then(function (result:any) {
            if (typeof result === 'string') {
                return render(JSON.parse(result));
            }

            Card.findOne({_id: req.params.id}).exec().then(function (card:ICard) {
                cache.set(key, card);
                return render(card);
            });
        });
    });