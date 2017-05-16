'use strict';

var assert = require('assert');
var controller = require('../../../../src/backend/controller/auth.controller');
describe('auth.controller', function () {
    describe('#isValidPassword()', function () {
        it('should return false if password is not a string', function () {
            assert.equal(false, controller.isValidPassword(null).result);
            assert.equal(false, controller.isValidPassword(undefined).result);
            assert.equal(false, controller.isValidPassword(1234567789).result);
        });
        it('should return false if password contains non ascii characters', function () {
            assert.equal(false, controller.isValidPassword('12345678\xf19c').result);
        });
        it('should return false if password is shorter than 6 characters', function () {
            assert.equal(false, controller.isValidPassword('1').result);
            assert.equal(false, controller.isValidPassword('1').result);
            assert.equal(false, controller.isValidPassword('12').result);
            assert.equal(false, controller.isValidPassword('123').result);
            assert.equal(false, controller.isValidPassword('1234').result);
            assert.equal(false, controller.isValidPassword('12345').result);
            assert.equal(false, controller.isValidPassword('abcde').result);
        });
        it('should return false if password is longer than 100 characters', function () {
            var pw = '';
            for (var i = 0; i < 101; i++) pw += 'x';
            assert.equal(false, controller.isValidPassword(pw).result);
        });
        it('should return true if password is >=6 && <= 100 characters and doesn\'t contain any space or non-ascii characters', function () {
            var pw = '';
            for (var i = 0; i < 100; i++) pw += 'x';
            assert.equal(true, controller.isValidPassword(pw).result);
            assert.equal(true, controller.isValidPassword('123abc').result);
            assert.equal(true, controller.isValidPassword('123456').result);
            assert.equal(true, controller.isValidPassword('abcdef').result);
        });
    });
    describe('#isValidUsername()', function () {
        it('should return false if username is not a string', function () {
            assert.equal(false, controller.isValidUsername(null).result);
            assert.equal(false, controller.isValidUsername(undefined).result);
            assert.equal(false, controller.isValidUsername(1234567789).result);
        });
        it('should return false if username contains non ascii characters', function () {
            assert.equal(false, controller.isValidUsername('12345678\xf19c').result);
        });
        it('should return false if username is shorter than 3 characters', function () {
            'use strict';
            assert.equal(false, controller.isValidUsername('1').result);
            assert.equal(false, controller.isValidUsername('12').result);
            assert.equal(false, controller.isValidUsername('a').result);
            assert.equal(false, controller.isValidUsername('ab').result);
        });
        it('should return false if username is longer than 40 characters', function () {
            var un = '';
            for (var i = 0; i < 41; i++) un += 'x';
            assert.equal(false, controller.isValidUsername(un).result);
        });
        it('should return true if username is >=3 characters and doesn\'t contain any space or non-ascii characters', function () {
            var un = '';
            for (var i = 0; i < 40; i++) un += 'x';
            assert.equal(true, controller.isValidUsername(un).result);
            assert.equal(true, controller.isValidUsername('12a').result);
            assert.equal(true, controller.isValidUsername('123').result);
            assert.equal(true, controller.isValidUsername('abc').result);
        });
    });
    describe('#usernameExists()', function () {
        it('should return false is username does not exist', function () {
            controller.usernameExists('THISUERNAMEDOESNOTEXIST3242ß34843214324').then(function (result) {
                assert.equal(false, result);
            });
        });
        it('should return true is username exists', function () {
            controller.usernameExists('lsc').then(function (result) {
                assert.equal(true, result);
            });
        });
        it('should return false is username violates #isValidUsername()', function () {
            controller.usernameExists('u s e r n a m e').then(function (result) {
                assert.equal(false, result);
            });
        });
    });
});