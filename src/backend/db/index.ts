///<reference path="../typings/mongoose/mongoose.d.ts"/>
///<reference path="../typings/node/node.d.ts" />
'use strict';
import {IDatabaseConfiguration} from './DatabaseConfiguration';
import events = require('events');
import mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

export class Database extends events.EventEmitter {
    private cfg:IDatabaseConfiguration;

    public constructor(cfg:IDatabaseConfiguration) {
        super();
        events.EventEmitter.call(this);
        this.cfg = cfg;
    }

    public connect(cb?:Function) {
        mongoose.connect(this.cfg.getConnectionString(), this.cfg.getCredentials(), (err:any) => {
            if (cb) {
                cb(err);
            }
            if (err) {
                this.emit('error', err);
            } else {
                this.emit('ready');
            }
        });
    }
}