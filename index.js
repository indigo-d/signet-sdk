/**
 * Signet SDK is a NodeJS module to act as an interface to the Signet API.
 * <pre>
 * Usage:
 *   var sdk = require('signet-sdk');
 *   sdk.connect('http://localhost:1337'); // Set the Signet API endpoint
 *   var agent = sdk.createAgent(); // Create a new agent (local object)
 *   var entity = agent.createEntity('12345678-aaaa-bbbb-cccc-1234567890ab'); // GUID must be of UUID4 format
 *   agent.setXID(entity,'XID1'); // Set the XID of the entity
 *   var eByGUID = sdk.fetchEntity('guid1'); // Fetched entity object
 *   var eByXID = sdk.fetchEntityByXID('XID1'); // Fetched entity object
 * </pre>
 * @module SignetSDK
 */
const async  = require('async');
const axios  = require('axios');
const sodium = require('libsodium-wrappers');
const base64url = require('base64url');
const uuid4 = require('uuid4');
var sdk;


/**
 * Class to wrap all calls to the Signet REST API.
 */
class SignetAPIClient {
  /**
   * Constructor for the SignetAPI Client
   * @param {string} URL The Signet API endpoint e.g. http://localhost:1337
   * @return {object} object of type SignetAPIClient
   */
  constructor(signet_api_endpoint) {
    this.signet_api_endpoint = signet_api_endpoint;
  }

  /**
   * Wrapper method for the http GET call.
   * @param {url} URL The relative url to call i.e. /foo
   * @param {params} params A hash of key value pairs for GET parameters
   * @return {promise} A promise object for the HTTP GET call
   */
  doGet(url_path, params) {
    console.log('-- ** **********************************************');
    console.log('-- ** Starting doGet()');
    let url = this.signet_api_endpoint + url_path;
    console.log('-- ** Sending GET request to URL: ' + url);
    console.log('-- ** Params:', params);
    console.log('-- ** Finished doGet()');
    console.log('-- ** **********************************************');
    // Note: the following method call returns a promise
    return axios.get(url, params);
  }

  /**
   * Wrapper method for the http POST call
   * @param {url} URL The relative url to call i.e. /foo
   * @param {params} params A hash of key value pairs for POST parameters
   * @return {promise} A promise object for the HTTP POST call
   */
  doPost(url_path, params) {
    console.log('-- ** **********************************************');
    console.log('-- ** Starting doPost()');
    let url = this.signet_api_endpoint + url_path;
    console.log('-- ** Sending POST request to URL: ' + url);
    console.log('-- ** Params: ', params);
    console.log('-- ** Finished doPost()');
    console.log('-- ** **********************************************');
    // Note: the following method call returns a promise
    return axios.post(url, params);
  }
}


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


/**
 * A proxy class for a Signet Agent.
 * <pre>
 * Objects of this class would contain agent attributes such as:
 *   - keyChain => A hash with key as guid and value as SignetKeySet object
 *
 * Certain method calls to this object may trigger a call to the Signet API.
 * In such cases, these method calls would update the local state.
 * </pre>
 */
class SignetAgent {
  /**
   * Constructor to create a SignetEntity object.
   * @return {object} object of type SignetAgent
   */
  constructor() {
    // Empty hash containing the entity keys managed by this agent
    this.keyChain = {};
    // Empty hash containing the signature history of managed entities
    this.signatureHistory = {};
  }

  /**
   * Adds the key set object of the given entity to the agent's key chain.
   * @return {None} None
   */
  addEntityKeySetToKeyChain(guid, entityKeySet) {
    this.keyChain[guid] = entityKeySet;
  }

  /**
   * Gets the ownership key set of the entity with the given GUID.
   * @return {SignetKeySet} The ownership key set or undefined if not found
   */
  getOwnershipKeySet(guid) {
    if ( !(guid in this.keyChain) ) {
      return undefined;
    } else {
      return this.keyChain[guid];
    }
  }

  /**
   * Gets the ownership key pair of the entity with the given GUID.
   * @return {SignetKeyPair} The ownership key pair of the key set or undefined if not found
   */
  getOwnershipKeyPair(guid) {
    if ( !(guid in this.keyChain) ) {
      return undefined;
    } else {
      let keySet = this.keyChain[guid];
      return keySet.ownershipKeyPair;
    }
  }

  /**
   * Method to generate a signature and a canonical JSON representation
   *   of an entity managed by this agent.
   * @param {string} GUID of the Entity
   * @param {SignetKeyPair} Signing Key Pair for the Entity
   * @param {string} Previous Signature
   * @param {array} Array of XID objects (see Schema for details)
   * @param {array} Array of Channel objects (see Schema for details)
   * @return {string} A signed canonical JSON representation of the entity
   */
  getSignedPayLoad(guid,signetKeyPair,prevSign,xids,channels) {
    console.log('-- Starting getSignedPayLoad');
    console.log('-- signetKeyPair: ', signetKeyPair);
    // Build the payload object
    let payload = {
      data: {guid: guid},
      verify: {
        verify_key: signetKeyPair.getPublicKey(),
        sign_time: (new Date()).toISOString(),
        prev_sign: prevSign
      }
    };
    if (xids != undefined) {
      if (xids.length > 0) { payload['data']['xids'] = xids; }
    }
    if (channels != undefined) {
      if (channels.length > 0) { payload['data']['channels'] = channels; }
    }
    // Get a JSON representation of the object and sign it
    let plainTxt = JSON.stringify(payload);
    let sigArray = sodium.crypto_sign_detached(plainTxt, signetKeyPair.keypair.privateKey);
    // Get a base64url encoded version of it with a '=' appended
    let signature = base64url(sigArray) + '=';
    console.log('-- Signature: ', signature);
    // Build the signed payload object
    let signedPayLoad = {
      payload: payload,
      sign: signature
    };
    console.log('-- signedPayLoad: ', signedPayLoad);
    console.log('-- Finished getSignedPayLoad');
    return signedPayLoad;
  }

  /**
   * <pre>
   * Async method to create an entity which involves the following:
   *   01) Generate Signet key set
   *   02) Create an entity on the Signet API
   *   03) Add entity key set to agent key chain
   * Returns undefined for API call failure or any other run-time error.
   * </pre>
   * @return {SignetEntity} A SignetEntity object or undefined
   */
  async createEntity(guid) {
    console.log('-- -------------------------------------------------');
    console.log('-- Starting createEntity()');
    console.log('--   guid = ', guid);
    var entity = undefined;
    // Make the REST API call and wait for it to finish
    try {
      let entityKeySet = new SignetKeySet();
      let verkey = entityKeySet.ownershipKeyPair;
      let signedPayLoad = this.getSignedPayLoad(guid,verkey,'',[],[]);
      let signedPayLoadJSON = JSON.stringify(signedPayLoad);
      let params = { signed_payload: signedPayLoadJSON };
      let resp = await sdk.client.doPost('/entity/', params);
      console.log('-- POST call response: ', resp.status, resp.data);
      if (resp.status != 200) throw(resp.data);
      this.addEntityKeySetToKeyChain(guid, entityKeySet);
      console.log('-- Added entity to key chain');
      entity = new SignetEntity(guid, verkey.getPublicKey());
      entity.refresh(resp.data);
    } catch (err) {
      console.log('-- Error: ', err.toString());
    }
    console.log('-- Entity object to be returned: ', entity);
    console.log('-- Finished createEntity()');
    console.log('-- -------------------------------------------------');
    return entity;
  }

  /**
   * Method to set an XID for an entity both locally and on the Signet API server.
   * Returns undefined for API call failure or any other run-time error.
   * @param {SignetEntity} entity Signet entity to set the XID for
   * @param {str} xid New XID to set
   * @return {expression} An expression that is either true or undefined
   */
  async setXID(entity, xid) {
    console.log('-- -------------------------------------------------');
    console.log('-- Starting setXID()');
    console.log("--   entity guid = '" + entity.guid + "'");
    console.log("--   new XID  = '" + xid + "'");
    let verkey = this.getOwnershipKeyPair(entity.guid);
    let xidParts = xid.split(':');
    let xidObj = {
      nstype: xidParts[0],
      ns: xidParts[1],
      name: xidParts[2],
    };
    let signedPayLoad = this.getSignedPayLoad(entity.guid,verkey,entity.prevSign,[xidObj],[]);
    let signedPayLoadJSON = JSON.stringify(signedPayLoad);
    let params = { signed_payload: signedPayLoadJSON };
    console.log('-- Params: ', params);
    var retVal = false;
    // Make the REST API call and wait for it to finish
    try {
      let resp = await sdk.client.doPost('/entity/'+entity.guid+'/update', params);
      console.log('-- POST call response: ', resp.status, resp.data);
      if (resp.status != 200) throw(resp.data);
      entity.refresh(resp.data);
      retVal = true;
    } catch (err) {
      console.log('-- Error: ', err.response.data);
    }
    console.log('-- Finished setXID()');
    console.log('-- Returning: ', retVal);
    console.log('-- -------------------------------------------------');
    return retVal;
  }

  /**
   * Method to generate a rekey payload for an entity managed by this agent.
   * @param {string} GUID of the entity object to rekey
   * @param {object} SignetKeyPair the old key pair
   * @param {object} SignetKeyPair the new key pair
   * @return {string} A signed rekey payload
   */
  getRekeyPayLoad(guid, newKeyPair, oldKeyPair, prevSign) {
    console.log('-- Starting getRekeyPayLoad');
    console.log('-- GUID: ', guid);
    console.log('-- New Key Pair: ', newKeyPair.getPublicKey());
    console.log('-- Old Key Pair: ', oldKeyPair.getPublicKey());
    console.log('-- Previous Sign: ', prevSign);
    if ((prevSign == undefined) || (prevSign == '')) throw('Invalid previous sign');
    let signedPayLoad = this.getSignedPayLoad(guid,newKeyPair,prevSign,[],[]);
    // Get a JSON representation of the object and sign it with the old key
    let plainTxt = JSON.stringify(signedPayLoad);
    let sigArray = sodium.crypto_sign_detached(plainTxt, oldKeyPair.keypair.privateKey);
    // Get a base64url encoded version of it with a '=' appended
    let signature = base64url(sigArray) + '=';
    console.log('-- Signature: ', signature);
    // Build the rekey payload object
    let rekeyPayLoad = {
      signed_payload: signedPayLoad,
      old_sign: signature
    };
    console.log('-- rekeyPayLoad: ', rekeyPayLoad);
    console.log('-- Finished getRekeyPayLoad');
    return rekeyPayLoad;
  }

  /**
   * Method to rekey an existing entity that is already managed by this agent.
   * Returns false for API call failure or any other run-time error.
   * @param {SignetEntity} entity Signet entity to rekey
   * @return {boolean} Boolean value indicating success
   */
  async rekey(entity) {
    console.log('-- -------------------------------------------------');
    console.log('-- Starting rekey()');
    console.log("--   entity guid = '" + entity.guid + "'");
    console.log(entity);
    let oldKeyPair = this.getOwnershipKeyPair(entity.guid);
    let newEntityKeySet = new SignetKeySet();
    let newKeyPair = newEntityKeySet.ownershipKeyPair;
    let rekeyPayLoad = this.getRekeyPayLoad(
      entity.guid, newKeyPair, oldKeyPair, entity.prevSign
    );
    let rekeyPayLoadJSON = JSON.stringify(rekeyPayLoad);
    let params = { rekey_payload: rekeyPayLoadJSON };
    console.log('-- Params: ', params);
    var retVal = undefined;
    // Make the REST API call and wait for it to finish
    try {
      let resp = await sdk.client.doPost('/entity/'+entity.guid+'/rekey', params);
      console.log('-- POST call response: ', resp.status, resp.data);
      if (resp.status != 200) throw('API call to rekey failed');
      this.addEntityKeySetToKeyChain(entity.guid, newEntityKeySet);
      entity.refresh(resp.data);
      retVal = true;
    } catch (err) {
      console.log('-- Error: ', err);
    }
    console.log('-- Finished rekey()');
    console.log('-- -------------------------------------------------');
    return retVal;
  }

  /**
   * Method to add an entity that was created to by another agent to
   *   this agent.  After the successful completion of this method, the
   *   entity would now be co-owned/co-managed by the agent that created
   *   the entity and the agent that invoked this method.  The agent
   *   that invoked this method should also perform a rekey operation on
   *   the entity if it wishes to establish exclusive ownership of the
   *   entity.  Once re-keyed, only this agent can modify the entity.
   * Returns false for API call failure or any other run-time error.
   * @param {SignetEntity} entity Signet entity to assign to this agent
   * @param {string} String representation of a SignetKeyPair public key
   * @param {string} String representation of a SignetKeyPair private key
   * @return {boolean} Boolean value indicating success
   */
  async assignEntity(entity, publicKeyString, privateKeyString) {
    console.log('-- -------------------------------------------------');
    console.log('-- Starting assignEntity()');
    console.log("-- Entity object: ", entity);
    console.log("-- Entity guid = '" + entity.guid + "'");
    console.log("-- publicKeyString = '" + publicKeyString + "'");
    console.log("-- privateKeyString = '" + privateKeyString + "'");
    var retVal = undefined;
    // Make the REST API call and wait for it to finish
    try {
      let entityKeySet = new SignetKeySet();
      // Need to import the given key strings to this new key set
      entityKeySet.ownershipKeyPair.importKeys(publicKeyString,privateKeyString);
      this.addEntityKeySetToKeyChain(entity.guid, entityKeySet);
      retVal = true;
    } catch (err) {
      console.log('-- Error: ', err);
    }
    console.log('-- Finished assignEntity()');
    console.log('-- -------------------------------------------------');
    return retVal;
  }
}


/**
 * A proxy class for a Signet Entity.
 * <pre>
 * Objects of this class would contain entity attributes such as:
 *   - guid      => GUID of the Signet Entity
 *   - xid       => XID of the Signet Entity
 *   - verkey    => Verification key (Management key) of the Signet Entity
 *   - prevSign  => Previous Signature of entity
 *
 * Certain method calls to this object may trigger a call to the Signet API.
 * In such cases, these method calls would update the local state.
 * </pre>
 */
class SignetEntity {
  /**
   * Constructor to create a SignetEntity object.
   * @return {object} object of type SignetEntity
   */
  constructor(guid, verkey) {
    this.guid = guid;
    this.verkey = verkey;
    this.xid = undefined;
    this.prevSign = undefined;
    this.signedAt = undefined;
    this.entityJSON = undefined;
  }

  /**
   * Method to take an entity JSON representation object and to set the fields
   *   of the local object to the representation object.
   * @param {Object} A representation of an entity that is returned by a REST API call
   */
  refresh(entityRep) {
    console.log('-- refresh starting');
    let entityObj = JSON.parse(entityRep.entityJSON);
    this.verkey = entityRep.verkey;
    this.xid = entityRep.xid;
    this.prevSign = entityRep.signature;
    this.signedAt = entityRep.signedAt;
    this.entityJSON = entityRep.entityJSON;
    console.log('-- Entity object refreshed: ', this);
    console.log('-- refresh finished');
  }
}


/**
 * The main SDK class that implements the Signet SDK.
 */
class SignetSDK {
  /**
   * Constructor to create a SignetSDK object.
   * @return {object} object of type SignetSDK
   */
  constructor(signet_api_endpoint) {
    this.version = "0.0.1";
    this.client = undefined;
    this.sodiumReady = false;
  }

  /**
   * Set the Signet API endpoint for the SDK.
   * @param {str} Endpoint for the Signet API
   */
  async initialize(signet_api_endpoint) {
    this.client = new SignetAPIClient(signet_api_endpoint);
    if (!this.sodiumReady) {
      // Initialize Sodium; Sodium methods won't work without this step!
      await sodium.ready;
    }
  }

  /**
   * Async method to generate a GUID that is a UUID4 format UUID.
   * @return {string} UUID4 UUID
   */
  async genGUID() {
    return uuid4.valid();
  }

  /**
   * Async method to create a a Signetgent object.
   * Note: this does not call the Signet API.
   * @return {SignetAgent} A SignetAgent object
   */
  async createAgent() {
    console.log('-- -------------------------------------------------');
    console.log('-- Starting createAgent()');
    var agent = undefined;
    try {
      agent = new SignetAgent();
    } catch (err) {
      console.log('-- Error: ', err.toString());
    }
    console.log('-- Finished createAgent()');
    console.log('-- -------------------------------------------------');
    return agent;
  }

  /**
   * Async method to fetch an entity by GUID from the Signet API Service.
   * Returns undefined for API call failure or any other run-time error.
   * @param {str} guid GUID of the Signet entity to fetch
   * @return {SignetEntity} A SignetEntity object or undefined
   */
  async fetchEntity(guid) {
    console.log('-- -------------------------------------------------');
    console.log('-- Starting fetchEntity()');
    console.log("--   guid = '" + guid + "'");
    let params = {};
    var entity = undefined;
    // Make the REST API call and wait for it to finish
    try {
      let resp = await this.client.doGet('/entity/'+guid,params);
      console.log('-- GET call response: ', resp.status, resp.data);
      entity = new SignetEntity(resp.data.guid, resp.data.verkey);
      entity.refresh(resp.data);
    } catch (err) {
      console.log(err.toString());
    }
    console.log('-- Entity object to be returned: ', entity);
    console.log('-- Finished fetchEntity()');
    console.log('-- -------------------------------------------------');
    return entity;
  }

  /**
   * Async method to fetch an entity by XID from the Signet API Service.
   * Returns undefined for API call failure or any other run-time error.
   * @param {str} xid XID of the Signet entity to fetch
   * @return {SignetEntity} A SignetEntity object or undefined
   */
  async fetchEntityByXID(xid) {
    console.log('-- -------------------------------------------------');
    console.log('-- Starting fetchEntityByXID()');
    console.log("--   xid = '" + xid + "'");
    let params = {};
    var entity = undefined;
    // Make the REST API call and wait for it to finish
    try {
      let resp = await this.client.doGet('/entity/fetchByXID/'+xid,params);
      console.log('-- GET call response: ', resp.status, resp.data);
      entity = new SignetEntity(resp.data.guid, resp.data.verkey);
      entity.refresh(resp.data);
    } catch (err) {
      console.log(err.toString());
    }
    console.log('-- Entity object to be returned: ', entity);
    console.log('-- Finished fetchEntityByXID()');
    console.log('-- -------------------------------------------------');
    return entity;
  }
}


sdk = new SignetSDK();
module.exports = sdk;
