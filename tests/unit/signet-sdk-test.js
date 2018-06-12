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
const uuid4 = require("uuid/v4");
const base64url = require('base64url');
const sodium = require('libsodium-wrappers');
const signet = require("../../index.js")
//const keyset = require("../../signet_key_set.js");
const api_endpoint = 'http://localhost:1337';
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

  // SignetKeySet and SignetKeyPair tests
  it('SignetKeySet and SignetKeyPair tests', async function () {
    console.log('== =================================================');
    console.log('== SignetKeySet and SignetKeyPair tests starting');
    let keySetA = new signet.KeySet();
    let keyPairA = keySetA.ownershipKeyPair;
    let keySetB = new signet.KeySet();
    let keyPairB = keySetB.ownershipKeyPair;
    assert.notEqual(keySetA, keySetB);
    assert.notEqual(keyPairA, keyPairB);
    // Now set key pair B to have the same keys as key pair A
    let aKeys = keySetA.exportOwnershipKeyPair();
    console.log('== Exported Key Set A: ', aKeys);
    let bKeys = keySetB.exportOwnershipKeyPair();
    console.log('== Exported Key Set B: ', bKeys);
    keyPairB.importKeys(aKeys[0],aKeys[1]);
    let bKeysAfterImport = keySetB.exportOwnershipKeyPair();
    console.log('== Exported Key Set B after import: ', bKeysAfterImport);
    assert.deepEqual(aKeys,bKeysAfterImport);
    assert.deepEqual(keySetA,keySetB);
    // Now sign an object with A's keys and verify with B's keys
    let plainTxt = JSON.stringify({someVal: 'Some Value'});
    console.log('== plainTxt: ', plainTxt);
    let sigArray = sodium.crypto_sign_detached(plainTxt, keySetA.ownershipKeyPair.keypair.privateKey);
    let ver = sodium.crypto_sign_verify_detached(sigArray, plainTxt, keySetB.ownershipKeyPair.keypair.publicKey);
    assert.ok(ver);
    console.log('== SignetKeySet and SignetKeyPair tests finished');
    console.log('== =================================================');
  });
  // SDK Agent tests
  it('SDK agent tests', async function () {
    console.log('== =================================================');
    console.log('== SDK agent tests starting');
    let agent = await signet.createAgent();
    let guid = await agent._genGUID();
    assert.equal(agent.constructor.name, 'Agent');
    // ***************************************************************
    // Check the signature and verification of entity object
    // ***************************************************************
    console.log('== Testing signature:');
    console.log('== *************************************************');
    let keySet = new signet.KeySet();
    // The last two empty arrays refer to XIDs and Channels
    // These are empty for a createEntity call and hence they are empty in this call
    let signedPayLoad = agent.getSignedPayLoad(guid, keySet.ownershipKeyPair, '', [], []);
    console.log('== signedPayLoad returned by getSignedPayLoad: ', signedPayLoad);
    assert.equal(
      signedPayLoad['payload']['data']['guid'],
      guid,
      'GUID is not correct in the entity representation'
    );
    assert.equal(
      signedPayLoad['payload']['verify']['verify_key'],
      keySet.ownershipKeyPair.getPublicKey(),
      'verify_key is not correct in the entity representation'
    );
    assert.equal(
      signedPayLoad['payload']['verify']['prev_sign'],
      '',
      'prev_sign is not correct in the entity representation'
    );
    await sodium.ready;
    let sign = signedPayLoad['sign'];
    console.log('-- Entity sign: ', sign);
    // Remove the trailing '=' character
    let signature = sign.slice(0, -1);
    console.log('-- Entity signature: ', signature);
    let sigArray = new Uint8Array(base64url.toBuffer(signature));
    //console.log(sigArray);
    // Remove the trailing '=' character
    let verkey = signedPayLoad['payload']['verify']['verify_key'].slice(0, -1);
    console.log('-- Verify Key: ', verkey);
    let pubKeyArray = base64url.toBuffer(verkey);
    //console.log('-- Public Key Array: ', pubKeyArray);
    let intArray = new Uint8Array(pubKeyArray);
    //console.log('-- Public Key Int Array: ', intArray);
    //console.log(keySet.ownershipKeyPair.keypair.publicKey);
    assert.deepEqual(keySet.ownershipKeyPair.keypair.publicKey, intArray, 'Invalid public key');
    let plainTxt = JSON.stringify(signedPayLoad['payload']);
    console.log('-- plainTxt: ', plainTxt);
    // This should work without throwing an error and return true
    let ver = sodium.crypto_sign_verify_detached(sigArray, plainTxt, intArray);
    assert.equal(ver, true);
    console.log('== *************************************************');
    // ***************************************************************
    // Check the rekey payload
    // ***************************************************************
    console.log('== Testing rekey:');
    console.log('== *************************************************');
    let keySet2 = new signet.KeySet();
    let rekeyPayLoad = agent.getRekeyPayLoad(
      guid,
      keySet2.ownershipKeyPair,
      keySet.ownershipKeyPair,
      'some_prev_sign'
    );
    console.log(rekeyPayLoad);
    assert.equal(rekeyPayLoad['signed_payload']['payload']['data']['guid'],guid);
    assert.equal(rekeyPayLoad['signed_payload']['payload']['verify']['verify_key'],keySet2.ownershipKeyPair.getPublicKey());
    assert.equal(rekeyPayLoad['signed_payload']['payload']['verify']['prev_sign'],'some_prev_sign');
    assert.notEqual(rekeyPayLoad['old_sign'],undefined);
    console.log('== *************************************************');
    console.log('== SDK agent tests finished');
    console.log('== =================================================');
  });
});
