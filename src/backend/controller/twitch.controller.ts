///<reference path='../typings/tsd.d.ts'/>
'use strict';
import moment = require('moment');
import request = require('request-promise');
import {cache} from '../utils/index';
import log = require('../log');

const channels = [
    'dmbrandon',
    'hahahakumakichi',
    'krazycaley',
    'rebelace0',
    'Tizlyfe',
    'captcoach',
    'mudd721',
    'yaboialexi',
    'MagiMelkor',
    'Tatl_Tael',
    'ngvisator',
    'Sirduckbot',
    'aStarvingGoat',
    'vox_tempus',
    'Kretuhtuh',
    'XDGUCCI',
    'hirezdan',
    'clumzyd',
    'dreouk',
    'marsvoltian',
    'kanebis',
    'bitey',
    'skillganon',
    'fatstv',
    'thatgreatdane',
    'bugajo007',
    'coOkienOmsterTV',
    'ManmadePlatypus',
    'iGAnatoLiy',
    'pootsthecat',
    'alternit',
    'steelex_tv',
    'jaggerous',
    'pixiekittie',
    'realelven',
    'spunkki',
    'gregersvar',
    'deathbylemmings',
    'hellokellylink',
    'iholdshift',
    'detonategg',
    'lolcoop',
    'zammitdoe',
    'kami0889',
    'kevinchhann',
    'RagingGalka',
    'reptiledc',
    'm3toxi'
];

const STREAMS_KEY = 'index_streams';
export function getStreams() {
    return new Promise(function (resolve:Function) {
        cache.get(STREAMS_KEY).then(function (result:any) {
            let refresh = true;
            if (typeof result === 'string') {
                result = JSON.parse(result);
                if (moment().diff(moment(result.timestamp, 'x'), 'seconds') < 120) {
                    refresh = false;
                }
                resolve(result.streams);
            }
            if (refresh) {
                resolve({streams: []});
                let url = `https://api.twitch.tv/kraken/streams?channel=${channels.join(',')}`;
                request(url)
                    .then(function (result:any) {
                        result = JSON.parse(result);
                        if (result.streams) {
                            result = result.streams;
                        }
                        result = result.filter(function (s:any) {
                            return (s.game.toLowerCase() === 'paladins');
                        });
                        cache.set(STREAMS_KEY, {streams: result, timestamp: moment().format('x')});
                    })
                    .catch(function (err) {
                        log.debug('Failed to fetch data from Twitch', {err: err});
                    });
            }
        });
    });
}
