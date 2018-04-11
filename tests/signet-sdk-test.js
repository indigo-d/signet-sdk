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
var api_endpoint = 'http://localhost:1337';
sdk.initialize(api_endpoint);

// Includes
describe('Signet SDK Tests', function () {
    // Verify that the object is of the right class
    it('has correct class name', function () {
        assert.equal(sdk.constructor.name, 'SignetSDK');
    });
    // Verify that the object has the right version
    it('has correct version after instantiation', function () {
        assert.equal(sdk.version, '0.0.1');
    });
    // Verify that the initialize call sets the correct value
    it('has correct signet api endpoint after intialize', function () {
        assert.equal(sdk.client.constructor.name, 'SignetAPIClient');
        assert.equal(sdk.client.signet_api_endpoint, api_endpoint);
    });
    // Verify that the createAgent returns an Agent object
    it('createAgent should return agent object', function () {
        assert.equal(agent.constructor.name, 'SignetAgent');
    });
    // Verify that the createEntity returns an Entity object
    it('createEntity should return entity object', async function () {
        this.timeout(15000); // Set timeout to 15 seconds!
        let guid =  'guid-' + Math.random().toString(36).substr(2, 5);
        var entity = await sdk.createEntity(agent,guid);
        console.log('Entity: ' + entity);
        assert.notEqual(entity, undefined, 'Entity is not defined');
        assert.equal(entity.constructor.name, 'SignetEntity');
    });
});
