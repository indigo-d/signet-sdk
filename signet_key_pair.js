const sodium = require('libsodium-wrappers');
const base64url = require('base64url');

/**
 * A container class for key pairs used by Signet.
 * Each key pair contains a public key and a private key.
 * The keypair is generated using the libsodium library.
 */

class SignetKeyPair {
  /**
   * Constructor for the SignetAPI Client
   * @return {object} object of type SignetKeyPair
   */
  constructor() {
    Object.defineProperty(this, 'keypair', {
      value: sodium.crypto_sign_keypair(),
      writable: false
    });
  }

  /**
   * Utility method to convert a base64 URL encoded string
   *   with a trailing '=' to an Uint8Array.
   * Note: libsodium expects keys to be Uint8Array objects.
   * @param {string} base64 URL encoded string with trailing '='
   * @return {Uint8Array} Array of Uint8 integers
   */
  base64URLEncodedStringToArray(keyString) {
    // Remove the trailing '=' character
    let modKeyString = keyString.slice(0, -1);
    return new Uint8Array(base64url.toBuffer(modKeyString));
  }

  /**
   * Method to set the key values for a public-private key pair
   *   with base64 URL encoded strings with trailing '='s.
   * Note: this method overwrites the original keys in this object!
   * @param {string} public key: base64 URL encoded string with trailing '='
   * @param {string} private key: base64 URL encoded string with trailing '='
   */
  importKeys(pubKeyString, privKeyString) {
    this.keypair.publicKey = this.base64URLEncodedStringToArray(pubKeyString);
    this.keypair.privateKey = this.base64URLEncodedStringToArray(privKeyString);
  }

  /**
   * Get the base64 URL encoded string of the public key of the key pair.
   * Add a trailing '=' sign to make it URL-safe.
   * @return {string} base64 URL encoded string with trailing '='
   */
  getPublicKey() {
    return base64url(this.keypair.publicKey) + '=';
  }

  /**
   * Get the base64 encoded string of the private key of the key pair.
   * Add a trailing '=' sign to make it URL-safe.
   * @return {string} base64 URL encoded string with trailing '='
   */
  getPrivateKey() {
    return base64url(this.keypair.privateKey) + '=';
  }

  /**
   * Export a key pair to two base64 URL encoded strings.
   * @return {string} base64 URL encoded string with trailing '='
   */
  exportKeys() {
    return [ this.getPublicKey(), this.getPrivateKey() ];
  }
}

module.exports = SignetKeyPair;
