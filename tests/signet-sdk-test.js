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
const assert = require('assert');
const axios = require('axios');
var sdk = require('../index.js');
var agent = sdk.createAgent();
const api_endpoint = 'http://localhost:1337';
sdk.initialize(api_endpoint);
var guid =  'guid-' + Math.random().toString(36).substr(2, 5);
var xid =  'xid-' + Math.random().toString(36).substr(2, 5);
const sinon = require('sinon');
var entity = undefined;

// Includes
describe('Signet SDK Tests', function () {
    // Setup the sandbox and the setup and cleanup functions
    let sandbox;
    beforeEach(() => sandbox = sinon.sandbox.create());
    afterEach(() => sandbox.restore());

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
        console.log('== =================================================');
        console.log('== createEntity test starting');
        this.timeout(15000); // Set timeout to 15 seconds!
        // Stub the axios post call!
        const resolved = new Promise((r) => r({
            status: 200, data: { guid: guid, verkey: 'verkey' }
        }));
        sandbox.stub(axios, 'post').returns(resolved);
        entity = await sdk.createEntity(agent,guid);
        console.log('== Entity object returned by createEntity: ', entity);
        assert.notEqual(entity, undefined, 'Entity is not defined');
        assert.equal(entity.constructor.name, 'SignetEntity');
        console.log('== createEntity test finished');
        console.log('== =================================================');
    });
    // Verify that the fetchEntity returns an Entity object
    it('fetchEntity should return entity object', async function () {
        console.log('== =================================================');
        console.log('== fetchEntity test starting');
        // Stub the axios post call!
        const resolved = new Promise((r) => r({
            status: 200, data: { guid: guid, xid: xid, verkey: 'verkey' }
        }));
        sandbox.stub(axios, 'get').returns(resolved);
        entity = await sdk.fetchEntity(guid);
        console.log('== Entity object returned by fetchEntity: ', entity);
        assert.notEqual(entity, undefined, 'Entity is not defined');
        assert.equal(entity.constructor.name, 'SignetEntity');
        assert.equal(entity.guid, guid, 'guid does not match');
        assert.equal(entity.xid, xid, 'xid does not match');
        assert.equal(entity.verkey, 'verkey', 'verkey does not match');
        console.log('== fetchEntity test finished');
        console.log('== =================================================');
    });
    // Verify that the setXID returns true
    it('setXID should return true and update XID', async function () {
        console.log('== =================================================');
        console.log('== setXID test starting');
        // Stub the axios post call!
        const resolved = new Promise((r) => r({
            status: 200, data: { guid: guid, xid: xid+'-mod' }
        }));
        sandbox.stub(axios, 'post').returns(resolved);
        let retVal = await sdk.setXID(agent, entity, xid+'-mod');
        console.log('== Return value of setXID: ', retVal);
        assert(retVal, 'setXID did not return true');
        assert.equal(entity.guid, guid);
        assert.equal(entity.xid, xid+'-mod');
        console.log('== setXID test finished');
        console.log('== =================================================');
    });
    // Verify that the fetchEntityByXID returns an Entity object
    it('fetchEntityByXID should return entity object', async function () {
        console.log('== =================================================');
        console.log('== fetchEntityByXID test starting');
        // Stub the axios post call!
        const resolved = new Promise((r) => r({
            status: 200, data: { guid: guid, xid: xid, verkey: 'verkey' }
        }));
        sandbox.stub(axios, 'get').returns(resolved);
        entity = await sdk.fetchEntityByXID(xid);
        console.log('== Entity object returned by fetchEntity: ', entity);
        assert.notEqual(entity, undefined, 'Entity is not defined');
        assert.equal(entity.constructor.name, 'SignetEntity');
        assert.equal(entity.guid, guid, 'guid does not match');
        assert.equal(entity.xid, xid, 'xid does not match');
        assert.equal(entity.verkey, 'verkey', 'verkey does not match');
        console.log('== fetchEntityByXID test finished');
        console.log('== =================================================');
    });
    // Verify that the getSigningKey returns the management key
    it('getSigningKey should return management key', async function () {
        console.log('== =================================================');
        console.log('== getSigningKey test starting');
        let key = agent.getSigningKey(guid);
        console.log(key);
        assert.notEqual(key, undefined, 'Signing key is not defined');
        assert.equal(key.constructor.name, 'SignetKeyPair');
        console.log('== getSigningKey test finished');
        console.log('== =================================================');
    });
});
