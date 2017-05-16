///<reference path="backend/typings/node/node.d.ts"/>
import {IDatabaseConfiguration} from './backend/db/DatabaseConfiguration';
'use strict';

interface ITwitterConfiguration {
    consumer_key: string;
    consumer_secret: string;
    access_token: string;
    access_secret: string;
    callback_url: string;
}

interface IMailConfiguration {
    port: number;
    host: string;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}

interface ILogglyConfiguration {
    token: string;
    subdomain: string;
    tags: string[];
}

interface IRedisConfiguration {
    host?: string;
    port?: number;
    socket?: string;
}

interface IAwsSecurity {
    secretAccessKey: string;
    accessKeyId: string;
    region: string;
}

interface IAwsS3 extends IAwsSecurity {
    bucket: string;
}

interface IAmazonWebServices {
    s3: IAwsS3;
}

interface IAuth {
    ga: string;
    database: IDatabaseConfiguration;
    redis: IRedisConfiguration;
    twitter: ITwitterConfiguration;
    session: {
        secret: string;
    };
    mail: IMailConfiguration;
    loggly: ILogglyConfiguration;
    aws: IAmazonWebServices;
}


let auth:IAuth = require('./auth.json')[process.env.NODE_ENV || 'development'];
export = auth;