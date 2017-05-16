'use strict';

var gulp = require('gulp'),
    path = require('path'),
    sourcemaps = require('gulp-sourcemaps'),
    less = require('gulp-less'),
    LessPluginCleanCSS = require('less-plugin-clean-css'),
    prefix = require('gulp-autoprefixer'),
    merge = require('merge2'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    browserSync = require('browser-sync'),
    uglify = require('gulp-uglify'),
    gutil = require('gulp-util'),
    rename = require('gulp-rename'),
    tsconfig = require('./tsconfig.json'),
    tsc = require('gulp-typescript'),
    tslint = require('gulp-tslint'),
    concat = require('gulp-concat'),
    htmlmin = require('gulp-html-minifier'),
    uncss = require('gulp-uncss'),
    print = require('gulp-print'),
    beep = require('beepbeep'),
    source = require('vinyl-source-stream'),
    transform = require('vinyl-transform'),
    buffer = require('vinyl-buffer'),
    browserify = require('browserify'),
    through = require('through2'),
    globby = require('globby'),
    fs = require('fs'),
    replace = require('gulp-replace-task'),
    eslint = require('gulp-eslint'),
    factor = require('factor-bundle');

var tscProject = tsc.createProject('./tsconfig.json');
var eslintConfig = require('./.eslintrc.json');
var cssPrefixOptions = {
    browsers: [
        '> 1%',
        'last 2 versions',
        'IE >= 9',
        'Opera >= 11.1',
        'Android > 3',
        'Safari > 9',
        'Edge >= 12'
    ]
};

// ##############################
// BROWSERIFY
// ##############################
var bundler = require('gulp-watchify-factor-bundle');
var fixtures = path.resolve.bind(path, __dirname, 'frontend', 'static', 'js', 'app');

var _entries = [
    'tierlists/create.js',
    'account/index.js',
    'account/edit.js',
    'account/team.js',
    'team/manage.js',
    'app.js',
    'article.js',
    'auth.js',
    'card.js',
    'champion.js',
    'deck.js',
    'deckbuilder.js',
    'recent-decks.js',
    'deckupdate.js',
    'decklist.js',
    'index.js',
    'register.js'
];
var entries = [];
for (var i = 0; i < _entries.length; i++) entries.push(fixtures(_entries[i]));

var b = browserify({
    entries: entries
});

var bundle = bundler(b,
    // options for factor bundle.
    {
        entries: entries,
        outputs: _entries,
        common: 'common.js'
    },
    // more transforms. Should always return a stream.
    function (bundleStream) {
        return bundleStream
            .on('error', gutil.log.bind(gutil, 'Browserify Error'))

            // `optional`. use `buffer()` to make `stream not support` gulp plugins work
            .pipe(buffer())

            .pipe(gulp.dest('./frontend/static/js/bundle/'))
            .pipe(sourcemaps.init())
            .pipe(uglify())
            .pipe(rename(function (path) {
                path.extname = '.min.js';
            }))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('./frontend/static/js/bundle/'));
    }
);

b.on('log', gutil.log);

var tasks = {
    customStyles: function (done) {

        // todo: create non min + min and name min = .min
        var stream = gulp
            .src(['./frontend/static/css/index.less'])
            .pipe(print(function (filepath) {
                console.info('[CSS] Build:', filepath);
            }));
        if (process.env.NODE_ENV === 'production') {
            stream.pipe(replace({
                patterns: [
                    {
                        match: 'version',
                        replacement: require('./package.json').version
                    },
                    {
                        match: 'patch',
                        replacement: require('./settings.json').production.patch
                    },
                    {
                        match: 'cdn',
                        replacement: 'https://d1m720j85s9xxu.cloudfront.net'
                    }]
            }));
        } else {
            stream.pipe(replace({
                patterns: [
                    {
                        match: 'version',
                        replacement: require('./package.json').version
                    },
                    {
                        match: 'patch',
                        replacement: require('./settings.json').development.patch
                    },
                    {
                        match: 'cdn',
                        replacement: ''
                    }]
            }));
        }
        stream.pipe(less({
                plugins: [new LessPluginCleanCSS({advanced: true})]
            }))
            .on('error', done)
            .pipe(prefix(cssPrefixOptions))
            /*            .pipe(uncss({
             html: [
             'http://localhost:3000/'
             ]
             }))*/
            .pipe(sourcemaps.init())
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('./frontend/static/css'));

        return stream;

    },
    images: function () {
        return gulp
            .src('./frontend/static/img/**/*')
            .pipe(imagemin({
                progressive: true,
                optimizationLevel: 4,
                use: [pngquant()]
            }))
            .pipe(gulp.dest('./frontend/static/img'));

    },
    hbs: function (done, file) {
        var hbAttrWrapOpen = /\{\{#[^}]+\}\}/;
        var hbAttrWrapClose = /\{\{\/[^}]+\}\}/;
        var hbAttrWrapPair = [hbAttrWrapOpen, hbAttrWrapClose];

        var src = ['./frontend/static/templates/**/*.hbs', '!./frontend/static/templates/**/*.min.hbs'];
        var dst = './frontend/static/templates/';
        if (file) {
            gutil.log('Compile handlebars', gutil.colors.magenta(file.path));
            src = file.path;
            dst = path.dirname(file.path);
        }

        return gulp.src(src)
            .pipe(print(function (filepath) {
                console.info('[HBS] Build:', filepath);
            }))
            // todo: DO NOT remove html conditional comment
            .pipe(htmlmin({
                minifyJS: true,
                removeComments: true,
                collapseWhitespace: true,
                collapseBooleanAttributes: true,
                removeAttributeQuotes: false,
                removeRedundantAttributes: true,
                removeEmptyAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                processScripts: ['text/x-handlebars-template'],
                customAttrSurround: [hbAttrWrapPair]
            }))
            .on('error', done)
            .pipe(rename(function (path) {
                path.extname = '.min.hbs';
            }))
            .pipe(gulp.dest(dst))
    },
    noop: function () {
    },
    browsersync: function () {
        var browser = browserSync.create();
        browser.init({
            proxy: "localhost:3000",
            port: 3001,
            files: [
                './frontend/templates/**/*.min.hbs',
                './frontend/static/css/**/*.css'
            ]
        });

    },
    tsc: function (done, file) {
        if (file) {
            gutil.log('Compile typescript', gutil.colors.magenta(file.path));
            return gulp
                .src(file.path)
                .pipe(print(function (filepath) {
                    console.info('[TSC] Build:', filepath);
                }))
                .pipe(tslint({configuration: require('./tslint.json')}))
                .pipe(tslint.report('verbose'))
                .on('error', done)
                .pipe(sourcemaps.init())
                .pipe(tsc(tscProject)).js
                .on('error', done)
                .pipe(sourcemaps.write('.'))
                .pipe(gulp.dest(path.dirname(file.path)))
                .on('end', function () {
                    gutil.log(gutil.colors.green('Done compiling Typescript', file.path));
                });
        } else {
            return gulp
                .src(['./**/*.ts', '!./**/node_modules/**/*', '!./**/typings/**/*', '!./stats/**/*'])
                .pipe(print(function (filepath) {
                    console.info('[TSC] Build:', filepath);
                }))
                // .pipe(tslint({configuration: require('./tslint.json')}))
                // .pipe(tslint.report('verbose'))
                // .pipe(sourcemaps.init())
                .pipe(tsc(tscProject)).js
                // .pipe(sourcemaps.write('.'))
                .pipe(gulp.dest('./'));
        }
    },
    eslint: function (done, file) {
        var src = [
            './frontend/static/js/app/**/*.js',
            './frontend/static/js/lib/**/*.js',
            '!./frontend/static/js/lib/vendor/**/*.js'
        ];
        if (file) {
            gutil.log(gutil.colors.magenta('[ESLINT]', file.path));
            src = file.path;
        }
        return gulp
            .src(src)
            .pipe(eslint(eslintConfig))
            .pipe(eslint.format())
            .pipe(eslint.failAfterError())
            .on('error', done);
    },
    watch: function () {
        var done = function (err) {
            beep(3, 250);
        };
        // styles
        gulp.watch('./frontend/static/css/**/*.less', ['customStyles']);
        // handlebars templates
        gulp.watch([
            './frontend/static/templates/**/*.hbs',
            '!./frontend/static/templates/**/*.min.hbs'
        ]).on('change', function (file) {
            tasks.hbs(done, file);
        });
        // typescript
        gulp.watch([
            './*.ts',
            './bin/*.ts',
            './backend/**/*.ts',
            './shared/**/*.ts',
            '!./backend/typings/**/*'
        ]).on('change', function (file) {
            tasks.tsc(done, file);
        });
        // eslint
        gulp.watch([
            './frontend/static/js/app/**/*.js',
            './frontend/static/js/lib/**/*.js',
            '!./frontend/static/js/lib/vendor/**/*.js'
        ]).on('change', function (file) {
            tasks.eslint(done, file)
        });
    }
};

gulp.task('browsersync', tasks.browsersync)
    .task('browserify', bundle)
    .task('watch', tasks.watch)
    .task('watchify', bundler.watch(bundle))
    .task('customStyles', tasks.customStyles)
    .task('styles', ['customStyles'])
    .task('images', tasks.images)
    .task('hbs', tasks.hbs)
    .task('eslint', tasks.eslint)
    .task('tsc', tasks.tsc)
    .task('scripts', ['tsc', 'browserify'])
    .task('build', ['hbs', 'styles', 'scripts']);