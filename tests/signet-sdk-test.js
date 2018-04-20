/*
 * Description:
 *   This test suite will test the functions exported by the
 *   Signet SDK library.  The high-level objects of the SDK
 *   library such as Agent, Entity etc. would have their own
 *   test suites.
 * Author: Vivek Aanand Ganesan (onevivek@yahoo.com)
 */

// Includes and Globals
const assert = require('assert');
const axios = require('axios');
const sinon = require('sinon');
const uuid4 = require('uuid4');
const base64url = require('base64url');
const sodium = require('libsodium-wrappers');
const rewire = require('rewire');
const sdk = rewire('../index.js');
const keyset = sdk.__get__('SignetKeySet');
const api_endpoint = 'http://localhost:1337';
var guid =  uuid4.valid();
var xid =  'xid-' + Math.random().toString(36).substr(2, 5);
var keypair = undefined;
var agent = undefined;
var entity = undefined;

// Includes
describe('Signet SDK Tests', function () {
  // Setup the sandbox and the setup and cleanup functions
  let sandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  // SDK initialization tests
  it('SDK initialization tests', async function () {
    console.log('== =================================================');
    console.log('== SDK initialization tests starting');
    assert.equal(sdk.constructor.name, 'SignetSDK');
    assert.equal(sdk.version, '0.0.1');
    await sdk.initialize(api_endpoint);
    assert.equal(sdk.client.constructor.name, 'SignetAPIClient');
    assert.equal(sdk.client.signet_api_endpoint, api_endpoint);
    guid = await sdk.genGUID();
    console.log('== SDK initialization tests finished');
    console.log('== =================================================');
  });
  // SDK Agent tests
  it('SDK createAgent and other agent tests', async function () {
    console.log('== =================================================');
    console.log('== SDK createAgent and other agent tests starting');
    agent = await sdk.createAgent();
    assert.equal(agent.constructor.name, 'SignetAgent');
    // ***************************************************************
    // Check the signature and verification of entity object
    // ***************************************************************
    console.log('== Testing signature:');
    let keySet = new keyset();
    let entityRep = agent.getSignedPayload(guid, keySet.ownershipKeyPair, '', []);
    console.log('== entityRep returned by getSignedPayLoad: ', entityRep);
    assert.equal(
      entityRep['entity_data']['guid'],
      guid,
      'GUID is not correct in the entity representation'
    );
    assert.equal(
      entityRep['entity_verify']['verify_key'],
      keySet.ownershipKeyPair.getPublicKey(),
      'verify_key is not correct in the entity representation'
    );
    assert.equal(
      entityRep['entity_verify']['prev_sign'],
      '',
      'prev_sign is not correct in the entity representation'
    );
    await sodium.ready;
    let sign = entityRep['sign'];
    console.log('-- Entity sign: ', sign);
    // Remove the trailing '=' character
    let signature = sign.slice(0, -1);
    console.log('-- Entity signature: ', signature);
    let sigArray = new Uint8Array(base64url.toBuffer(signature));
    console.log(sigArray);
    // Remove the trailing '=' character
    let verkey = entityRep['entity_verify']['verify_key'].slice(0, -1);
    console.log('-- Verify Key: ', verkey);
    let pubKeyArray = base64url.toBuffer(verkey);
    console.log('-- Public Key Array: ', pubKeyArray);
    let intArray = new Uint8Array(pubKeyArray);
    console.log('-- Public Key Int Array: ', intArray);
    console.log(keySet.ownershipKeyPair.keypair.publicKey);
    assert.deepEqual(keySet.ownershipKeyPair.keypair.publicKey, intArray, 'Invalid public key');
    // Delete the sign field and get a JSON string of the entity representation
    delete entityRep['sign'];
    let plainTxt = JSON.stringify(entityRep);
    console.log('-- plainTxt: ', plainTxt);
    // This should work without throwing an error and return true
    let ver = sodium.crypto_sign_verify_detached(sigArray, plainTxt, intArray);
    assert.equal(ver, true);
    // ***************************************************************
    // Test the agent createEntity method
    // ***************************************************************
    console.log('== Testing createEntity:');
    // Stub the axios post call for the createEntity call
    var r1 = new Promise((r) => r({
      status: 200, data: {}
    }));
    var stub = sandbox.stub(axios, 'post');
    stub.returns(r1);
    entity = await agent.createEntity(guid);
    console.log('== Entity object returned by createEntity: ', entity);
    assert.notEqual(entity, undefined, 'Entity is not defined');
    assert.equal(entity.constructor.name, 'SignetEntity');
    let key = agent.getOwnershipKeyPair(guid);
    assert.notEqual(key, undefined, 'Ownership key is not defined');
    assert.equal(key.constructor.name, 'SignetKeyPair');
    sandbox.restore();
    // ***************************************************************
    // Test the agent setXID method
    // ***************************************************************
    console.log('== Testing setXID:');
    // Stub the axios post call for setXID call
    sandbox = sinon.sandbox.create();
    var r2 = new Promise((r) => r({
      status: 200, data: { guid: guid, xid: xid+'-mod' }
    }));
    sandbox.stub(axios, 'post').returns(r2);
    let retVal = await agent.setXID(entity, xid+'-mod');
    console.log('== Return value of setXID: ', retVal);
    assert(retVal, 'setXID did not return true');
    assert.equal(entity.guid, guid);
    assert.equal(entity.xid, xid+'-mod');
    console.log('== SDK createAgent and other agent tests finished');
    console.log('== =================================================');
  });
  // SDK fetchEntity test
  it('SDK fetchEntity test', async function () {
    console.log('== =================================================');
    console.log('== SDK fetchEntity test starting');
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
    console.log('== SDK fetchEntity test finished');
    console.log('== =================================================');
  });
  // SDK fetchEntityByXID test
  it('SDK fetchEntityByXID should return entity object', async function () {
    console.log('== =================================================');
    console.log('== SDK fetchEntityByXID test starting');
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
    console.log('== SDK fetchEntityByXID test finished');
    console.log('== =================================================');
  });
});
