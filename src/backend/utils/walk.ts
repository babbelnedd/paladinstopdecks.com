///<reference path="../typings/node/node.d.ts"/>
'use strict';
import fs = require('fs');
import path = require('path');

function walk(dir:string, done:(err:any, results?:string[]) => void) {
    let results:string[] = [];
    fs.readdir(dir, function (err:any, list:any) {
        if (err) {
            return done(err);
        }
        let pending = list.length;
        if (!pending) {
            return done(null, results);
        }
        list.forEach(function (file:any) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err:any, stat:any) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err:any, res:any) {
                        results = results.concat(res);
                        if (!--pending) {
                            done(null, results);
                        }
                    });
                } else {
                    results.push(file);
                    if (!--pending) {
                        done(null, results);
                    }
                }
            });
        });
    });
}

export = walk;