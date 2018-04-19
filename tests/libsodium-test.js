/*
 * Description:
 *   This test suite will test the libsodium JS library and base64 encoding.
 * Author: Vivek Aanand Ganesan (onevivek@yahoo.com)
 */

// Includes
const assert = require('assert');
const sodium = require('libsodium-wrappers');
const base64url = require('base64url');
var keypair;


describe('Libsodium Tests', function () {
  before(async function () {
    await sodium.ready;
    keypair = sodium.crypto_sign_keypair();
  });

  it('Key lengths for keypairs', async () => {
    let pubKeyBase64 = base64url(keypair.publicKey);
    assert.equal(pubKeyBase64.length,43)
    let priKeyBase64 = base64url(keypair.privateKey);
    assert.equal(priKeyBase64.length,86)
  });

  it('Signature test for strings', async () => {
    let plainTxt = 'abcdefghijklmnopqrstuvwxyz';
    let signedMsg = sodium.crypto_sign(plainTxt, keypair.privateKey);
    // This should work without throwing an error
    let openedMsg = sodium.crypto_sign_open(signedMsg, keypair.publicKey);
    assert.equal(plainTxt, sodium.to_string(openedMsg));
    try {
      // Note: this should throw an error - testing it for it below
      signedMsg[0] = 12;
      sodium.crypto_sign_open(signedMsg, keypair.publicKey);
    } catch (e) {
      //console.log("Error message: '" + e.message + "'");
      assert.equal(e.message,'incorrect signature for the given public key');
    }
  });

  it('Detached signature test for json objects', async () => {
    let plainObj = {
      firstName: 'Foo',
      lastName: 'Bar',
      age: 28,
      birthTimestamp: (new Date()).toISOString()
    };
    let plainTxt = JSON.stringify(plainObj);
    let sigArray = sodium.crypto_sign_detached(plainTxt, keypair.privateKey);
    // This should work without throwing an error and return true
    var ver1 = sodium.crypto_sign_verify_detached(sigArray, plainTxt, keypair.publicKey);
    assert.equal(ver1, true);
    // This should work without throwing an error and return false
    sigArray[0] = 1;
    var ver2 = sodium.crypto_sign_verify_detached(sigArray, plainTxt, keypair.publicKey);
    assert.equal(ver2, false);
  });
});
