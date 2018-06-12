const SignetKeyPair = require("./signet_key_pair.js");

/**
 * A container class for key pairs.
 * <pre>
 * By default, a Signet key set has two kinds of keys:
 *
 *   - Management key: used to "manage" an entity
 *     - Management key is used to make changes to the entity
 *       and to transfer ownership of the entity to another agent
 *   - Encryption key: used to encrypt communications in a channel
 *
 * Additional key pairs may be added to a key set as needed.
 * </pre>
 */
class SignetKeySet {
  /**
   * Constructor to create a SignetKeySet object.
   * @return {object} object of type SignetKeySet
   */
  constructor() {
    this.ownershipKeyPair = new SignetKeyPair();
  }

  /**
   * Export the ownership key pair public key and private key
   *   as base64 URL encoded strings.
   *   See SignetKeyPair.exportKeys for details.
   * @return {Array} Array with two SignetKey values
   */
  exportOwnershipKeyPair() {
    return this.ownershipKeyPair.exportKeys();
  }
}

module.exports = SignetKeySet;
