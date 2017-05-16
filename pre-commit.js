'use strict';

var fs = require('fs'),
    path = require('path');

var srcdir = path.join(__dirname, 'src');
var pfile = path.join(srcdir, 'package.json');

var text = fs.readFileSync(pfile, 'utf8');
var p = JSON.parse(text);
var v = p.version.split('.');
var oldNumber = parseInt(v.slice(-1));
var newNumber = oldNumber + 1;
v[v.length - 1] = newNumber;
v = v.join('.');
p.version = v;
fs.writeFileSync(pfile, JSON.stringify(p, null, 4), 'utf8');
require('child_process').exec('git add ' + pfile);

