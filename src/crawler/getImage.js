var imagemin = require('imagemin'),
    optipng = require('imagemin-optipng'),
    pngquant = require('imagemin-pngquant'),
    rp = require('request-promise'),
    normalize = require('../shared/normalize'),
    rename = require('gulp-rename');

/**
 * {image: string, path: string: name: string}
 * @param obj
 * @returns {Promise}
 */
function getImage(obj) {
    return new Promise(function (resolve, reject) {


        try {
            rp(obj.image, {encoding: null})
                .then(function (data) {
                    try {
                        new imagemin()
                            .src(data)
                            .use(rename(function (_path) {
                                _path.basename = normalize(obj.name);
                            }))
                            .dest(obj.path)
                            .use(pngquant({
                                speed: 1
                            }))
                            .run(function (err, files) {
                                if (err) return reject('Failed to minify image', err);
                                resolve(obj);
                            });
                    } catch (err) {
                        return reject('Failed to minify image', err);
                    }
                })
                .catch(function (err) {
                    return reject('Failed to download image ' + obj, err);
                });
        } catch (err) {
            return reject('Failed to download Image', err);
        }
    });
}

module.exports = getImage;