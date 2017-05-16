///<reference path='../../typings/tsd.d.ts'/>
'use strict';
import {Router, Response, Request} from 'express';


export = Router()
    .get('*', function (req:Request, res:Response) {
        res.json({
            name: 'Paladins Top Decks - Your #1 Source for Decks & Guides',
            short_name: 'Paladins Top Decks',
            start_url: '/',
            display: 'fullscreen',
            lang: 'en-US',
            orientation: 'portrait',
            theme_color: '#00bcff',
            background_color: '#222222',
            icons: [
                {
                    src: '/static/img/mobile/launcher-icon-0-75x.png',
                    sizes: '36x36',
                    type: 'image/png',
                    density: 0.75
                },
                {
                    src: '/static/img/mobile/launcher-icon-1x.png',
                    sizes: '48x48',
                    type: 'image/png',
                    density: 1.0
                },
                {
                    src: '/static/img/mobile/launcher-icon-1-5x.png',
                    sizes: '72x72',
                    type: 'image/png',
                    density: 1.5
                },
                {
                    src: '/static/img/mobile/launcher-icon-2x.png',
                    sizes: '96x96',
                    type: 'image/png',
                    density: 2.0
                },
                {
                    src: '/static/img/mobile/launcher-icon-3x.png',
                    sizes: '144x144',
                    type: 'image/png',
                    density: 3.0
                },
                {
                    src: '/static/img/mobile/launcher-icon-4x.png',
                    sizes: '192x192',
                    type: 'image/png',
                    density: 4.0
                },
                {
                    src: '/static/img/mobile/icon-256.png',
                    sizes: '256x256',
                    type: 'image/png'
                },
                {
                    src: '/static/img/mobile/icon-512.png',
                    sizes: '512x512',
                    type: 'image/png'
                },
                {
                    src: '/static/img/mobile/icon-1024.png',
                    sizes: '1024x1024',
                    type: 'image/png'
                }

            ]
            /*,
             splash_screens: [{
             'src': '/static/img/mobile/splash/lowres.png',
             'sizes': '320x240'
             }, {
             'src': '/static/img/mobile/splash/hd_small.png',
             'sizes': '1334x750'
             }, {
             'src': '/static/img/mobile/splash/hd_hi.png',
             'sizes': '1920x1080',
             'density': 3
             }]*/
        });
    });