'use strict';

module.exports = {
    version: require('../../../../package.json').version,
    patch: require('../../../../settings.json').production.patch,
    cdn: require('../../../../settings.json').production.cdn
};