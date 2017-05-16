///<reference path="backend/typings/node/node.d.ts"/>
'use strict';

interface IPageSettings {
    title: string;
    meta: {
        description: string;
        keywords: string;
    };
}

interface ISettings {
    patch: string;
    cdn: string;
    page: IPageSettings;
}

let settings:ISettings = require('./settings.json')[process.env.NODE_ENV || 'development'];
export = settings;