///<reference path='../../typings/tsd.d.ts'/>

import {Router, Request, Response} from 'express';
import auth = require('../../../auth');
import {extname} from 'path';
import moment = require('moment');
import S3Storage = require('../../modules/S3ImageStorage');
let multer = require('multer');

// let s3 = require('multer-s3');
interface IFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
}
let storage = S3Storage({
    dirname: 'uploads',
    bucket: auth.aws.s3.bucket,
    secretAccessKey: auth.aws.s3.secretAccessKey,
    accessKeyId: auth.aws.s3.accessKeyId,
    region: auth.aws.s3.region,
    gm: {
        resize: '825>',
        bitdepth: 8,
        quality: 75
    },
    filename: function (req:Request, file:IFile, cb:Function) {
        let ext = extname(file.originalname);
        let fn = moment().format('X') + ext;
        cb(null, fn);
    }
});
let upload = multer({storage: storage}).single('img');

interface IUploadRequest extends Request {
    uploadedLocation:string;
}

export = Router()
    .post('/', function (req:IUploadRequest, res:Response) {
        if (!req.isAuthenticated()) {
            return res.json({err: 'Not Authenticated'});
        }

        upload(req, res, function (err:any) {
            console.info('okay done', err);
            res.json({err: null, url: req.uploadedLocation});
        });

    });