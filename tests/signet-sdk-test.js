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
var sdk = require('../index.js');
var agent = sdk.createAgent();

// Includes
describe('Signet SDK Tests', function () {
    // Verify that the object is of the right class
    it('should have correct class name', function () {
        assert.equal(sdk.constructor.name, 'SignetSDK');
    });
    // Verify that the object has the right attributes
    it('should have correct attributes', function () {
        assert.equal(sdk.version, '0.0.1');
    });
    // Verify that the createAgent returns an Agent object
    it('createAgent should return agent object', function () {
        assert.equal(agent.constructor.name, 'SignetAgent');
    });
});
