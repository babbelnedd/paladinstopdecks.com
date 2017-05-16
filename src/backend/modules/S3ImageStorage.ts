///<reference path="../typings/tsd.d.ts"/>
'use strict';
import {StorageEngine} from 'multer';
import {extname} from 'path';
import {Upload, IUpload} from '../model/index';
import hashStream = require('./HashStream');

let gm = require('gm');
let im = gm.subClass({imageMagick: true});
let S3FS = require('s3fs');

interface IS3ImageStorage {
    bucket: string;
    secretAccessKey: string;
    accessKeyId: string;
    region: string;
    dirname: string;
    filename: Function;
    gm: {
        resize?: string;
        format?: string;
        bitdepth?: number;
        quality?: number;
        autoOrient?: boolean;
    };
}

class S3ImageStorage implements StorageEngine {
    private options:IS3ImageStorage;
    private s3fs:any;

    constructor(opts:IS3ImageStorage) {
        if (!opts.bucket) {
            throw new Error('bucket is required');
        }
        if (!opts.secretAccessKey) {
            throw new Error('secretAccessKey is required');
        }
        if (!opts.accessKeyId) {
            throw new Error('accessKeyId is required');
        }
        if (!opts.region) {
            throw new Error('region is required');
        }
        if (!opts.dirname) {
            throw new Error('dirname is required');
        }
        if (!opts.filename) {
            throw new Error('filename is required');
        }
        if (!opts.gm) {
            opts.gm = {};
        }
        this.options = opts;
        this.options.filename = opts.filename;
        this.s3fs = new S3FS(opts.bucket, opts);
    }

    public _handleFile(req:any, file:any, cb:Function) {
        let self = this;
        self.options.filename(req, file, function (err:any, filename:string) {
            if (err) {
                return cb(err);
            }

            let stream = file.stream;
            hashStream(stream, function (err:any, hash:string, buffer:Buffer) {
                if (err) {
                    return cb(err);
                }
                Upload.findOne({hash: hash}).select('url').lean().exec().then(function (upload:IUpload) {
                    let filePath = self.options.dirname + '/' + hash;

                    if (upload && upload.url) {
                        req.uploadedLocation = upload.url;
                        return cb(null);
                    }

                    let img = im(buffer, filename);
                    if (self.options.gm.resize) {
                        img = img.resize(self.options.gm.resize);
                    }
                    if (self.options.gm.bitdepth) {
                        img = img.bitdepth(self.options.gm.bitdepth);
                    }
                    if (self.options.gm.quality) {
                        img = img.quality(self.options.gm.quality);
                    }
                    if (self.options.gm.autoOrient === true) {
                        img = img.autoOrient();
                    }
                    if (self.options.gm.format) {
                        img = img.setFormat(self.options.gm.format);
                        filename = `${filename.replace(extname(filename), '')}.${self.options.gm.format}`;
                    }
                    let outStream = self.s3fs.createWriteStream(filePath);

                    img.stream()
                        .pipe(outStream);

                    // file.stream.pipe(outStream);
                    outStream.on('error', cb);
                    outStream.on('finish', function () {
                        // let loc = `https://${self.options.bucket}.s3.amazonaws.com/${filePath}`;
                        let loc = `https://d60e5or39z5gn.cloudfront.net/${filePath}`;
                        req.uploadedLocation = loc;
                        new Upload({hash: hash, url: loc, user: req.user._id}).save(function () {
                            cb(null, {
                                size: outStream.bytesWritten,
                                key: filePath,
                                location: loc
                            });
                        });
                    });
                });
            });
        });
    }

    public _removeFile(req:any, file:any, cb:Function) {
        this.s3fs.unlink(file.key, cb);
    }
}

export = function (opts:any) {
    return new S3ImageStorage(opts);
};