/*
 * Description:
 *   This test suite will test the functions exported by the
 *   Signet SDK library.  The high-level objects of the SDK
 *   library such as Agent, Entity etc. would have their own
 *   test suites.
 * Last Modified: 2018-04-06
 * Author: Vivek Aanand Ganesan (onevivek@yahoo.com)
 */

// Includes
var assert = require('assert');
var async = require('async');

// Includes
describe('Async Tests', function () {
    it('async anonymous functions', function () {
        async.waterfall([
            function (callback) {
                callback(null, 'one', 'two');
            },
            function (arg1, arg2, callback) {
                // arg1 now equals 'one' and arg2 now equals 'two'
                assert.equal(arg1,'one');
                assert.equal(arg2,'two');
                callback(null, 'three');
            },
            function (arg1, callback) {
                // arg1 now equals 'three'
                assert.equal(arg1,'three');
                callback(null, 'done');
            }
        ], function (err, result) {
            if ( err != null ) {
                console.log(err);
                console.log(result);
            } else {
              // result now equals 'done'
              assert.equal(result,'done');
            }
        });
    });

    it('async waterfall named functions', function () {
        function myFirstFunction(callback) {
            callback(null, 'one', 'two');
        }
        function mySecondFunction(arg1, arg2, callback) {
            // arg1 now equals 'one' and arg2 now equals 'two'
            callback(null, 'three');
        }
        function myLastFunction(arg1, callback) {
            // arg1 now equals 'three'
            callback(null, 'done');
        }
        // Async waterfall with named functions
        async.waterfall([
            myFirstFunction,
            mySecondFunction,
            myLastFunction,
        ], function (err, result) {
            if ( err != null ) {
                console.log(err);
                console.log(result);
            } else {
              // result now equals 'done'
              assert.equal(result,'done');
            }
        });
    });
});
