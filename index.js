/**
 * Signet SDK is a NodeJS module to act as an interface to the Signet API.
 * @module SignetSDK
 */
const async  = require('async');
const axios  = require('axios');
const sodium = require('libsodium-wrappers');
const base64url = require('base64url');
const uuid4 = require('uuid4');
var flaverr = require('flaverr');
var sdk;

/**
 * Custom Error class for Signet Errors.
 */
class SignetError {
  /**
   * Constructor for the  Client
   * @param {string} ERROR_CODE An error code string
   * @param {string} ERROR_MESG An error message string
   * @return {object} object of type SignetAPIClient
   */
  constructor(code, mesg) {
    throw flaverr(code, new Error(mesg));
  }
}


/**
 * Class to wrap all calls to the Signet REST API.
 */
class SignetAPIClient {
  /**
   * Constructor for the SignetAPI Client
   * @param {string} URL The Signet API endpoint
   * e.g. http://localhost:1337
   * @return {object} object of type SignetAPIClient
   */
  constructor(signet_api_endpoint) {
    this.signet_api_endpoint = signet_api_endpoint;
  }

  /**
   * Wrapper method for the http GET call.
   * @param {string} URL_PATH The relative url to call i.e. /foo
   * @param {object} A dictionary of key value pairs for GET parameters
   * @return {promise} A promise object for the HTTP GET call
   */
  doGet(url_path, params) {
    sdk.logr('-- ** **********************************************');
    sdk.logr('-- ** Starting doGet()');
    let url = this.signet_api_endpoint + url_path;
    sdk.logr('-- ** Sending GET request to URL: ' + url);
    sdk.logr('-- ** Params:', params);
    sdk.logr('-- ** Finished doGet()');
    sdk.logr('-- ** **********************************************');
    // Note: the following method call returns a promise
    return axios.get(url, params);
  }

  /**
   * Wrapper method for the http POST call
   * @param {string} URL The relative url to call i.e. /foo
   * @param {object} A dictionary of key value pairs for POST parameters
   * @param {object} A dictionary of HTTP header key value pairs (Optional)
   * @return {promise} A promise object for the HTTP POST call
   */
  doPost(url_path, params, headers={}) {
    sdk.logr('-- ** **********************************************');
    sdk.logr('-- ** Starting doPost()');
    let url = this.signet_api_endpoint + url_path;
    sdk.logr('-- ** Sending POST request to URL: ' + url);
    sdk.logr('-- ** Params: ', params);
    let config = { headers: headers };
    sdk.logr('-- ** Config: ', config);
    sdk.logr('-- ** Finished doPost()');
    sdk.logr('-- ** **********************************************');
    // Note: the following method call returns a promise
    return axios.post(url, params, config);
  }

  /**
   * Wrapper method for the http PATCH call
   * @param {string} URL The relative url to call i.e. /foo
   * @param {object} A dictionary of key value pairs for PATCH parameters
   * @param {object} A dictionary of HTTP header key value pairs (Optional)
   * @return {promise} A promise object for the HTTP POST call
   */
  doPatch(url_path, params, headers={}) {
    sdk.logr('-- ** **********************************************');
    sdk.logr('-- ** Starting doPatch()');
    let url = this.signet_api_endpoint + url_path;
    sdk.logr('-- ** Sending PATCH request to URL: ' + url);
    sdk.logr('-- ** Params: ', params);
    let config = { headers: headers };
    sdk.logr('-- ** Config: ', config);
    sdk.logr('-- ** Finished doPatch()');
    sdk.logr('-- ** **********************************************');
    // Note: the following method call returns a promise
    return axios.patch(url, params, config);
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
    // Hold the organization public key and private key here
    this.orgPublicKey = '';
    this.orgPrivateKey = '';
  }

  /**
   * Set the Organization public and private key strings.
   * @params {string} Organization public key string ending in '='
   * @params {string} Organization private key string ending in '='
   */
  setOrgKeys(pubKeyStr, privateKeyStr) {
    if (!pubKeyStr)
      new SignetError('E_PARAM_MISSING','Org Public Key is missing');
    if (pubKeyStr.substr(this.orgPublicKey.length - 1) != '=') {
      new SignetError('E_PARAM_INVALID',
          'Org Public Key does not end with = character');
    }
    if (!privateKeyStr)
      new SignetError('E_PARAM_MISSING','Org Private Key is missing');
    if (privateKeyStr.substr(this.orgPrivateKey.length - 1) != '=') {
      new SignetError('E_PARAM_INVALID',
          'Org Private Key does not end with = character');
    }
    this.orgPublicKey = pubKeyStr; // Must have trailing '='
    this.orgPrivateKey = privateKeyStr; // Must have trailing '='
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
   * @return {SignetKeyPair} The ownership key pair of the key set
   * or undefined if not found
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
   * Method to generate a signature of an object
   * @param {object} Object to be signed
   * @param {Unit8Array} Array of Uint8 objects (generated by libsodium)
   */
  signObject(objectToBeSigned,privateKeyArray) {
    sdk.logr('-- signObject starting');
    // Get a JSON string representation of the object
    let plainTxt = JSON.stringify(objectToBeSigned);
    // Sign the JSON string representation of the object
    let sigArray = sodium.crypto_sign_detached(plainTxt, privateKeyArray);
    // Get a base64url encoded version of it with a '=' appended
    let signature = base64url(sigArray) + '=';
    sdk.logr('-- signObject return value = ', signature);
    sdk.logr('-- signObject finished');
    return signature;
  }

  /**
   * Method to generate an org signature
   * @param {object} Object that is the payload of the whole request
   * @return {string} A signed canonical JSON representation of the object
   */
  getOrgSignature (payLoad) {
    sdk.logr('-- getOrgSignature starting');
    if (!this.orgPrivateKey)
      new SignetError('E_ORG_KEY_NOT_SET','Org private key not set');
    if (!this.orgPublicKey)
      new SignetError('E_ORG_KEY_NOT_SET','Org public key not set');
    let privateKeyArray = new
      Uint8Array(base64url.toBuffer(this.orgPrivateKey.slice(0,-1)));
    let orgSign = this.signObject(payLoad,privateKeyArray);
    sdk.logr('-- orgSign = ', orgSign);
    sdk.logr('-- getOrgSignature finished');
    return orgSign;
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
    sdk.logr('-- Starting getSignedPayLoad');
    sdk.logr('-- signetKeyPair: ', signetKeyPair);
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
    let signature = this.signObject(payload, signetKeyPair.keypair.privateKey);
    sdk.logr('-- Signature: ', signature);
    // Build the signed payload object
    let signedPayLoad = {
      payload: payload,
      sign: signature
    };
    sdk.logr('-- signedPayLoad: ', signedPayLoad);
    sdk.logr('-- Finished getSignedPayLoad');
    return signedPayLoad;
  }

  /**
   * <pre>
   * Async method to create an entity which does the following:
   *   01) Generate a GUID
   *   02) Generate Signet key set
   *   03) Create an entity on the Signet API
   *   04) Add entity key set to agent key chain
   *   05) Create a local SignetEntity object and set correct properties
   * Returns undefined for API call failure or any other run-time error.
   * </pre>
   * @param {Object} Optional A dictionary of options.
   * Set 'xid' to an array consisting of nstype, namespace, and XID string
   * @return {SignetEntity} A SignetEntity object or undefined
   */
  async createEntity(opts={}) {
    sdk.logr('-- -------------------------------------------------');
    sdk.logr('-- Starting createEntity()');
    var guid = uuid4.valid();
    sdk.logr('-- guid = ', guid);
    var entity = undefined;
    // Make the REST API call and wait for it to finish
    try {
      let entityKeySet = new SignetKeySet();
      let verkey = entityKeySet.ownershipKeyPair;
      let xidArray = [];
      if (opts['xid']) {
        let xidObj = this.getXIDObject(opts['xid'][0],opts['xid'][1],opts['xid'][2]);
        xidArray.push(xidObj);
      }
      let signedPayLoad = this.getSignedPayLoad(guid,verkey,'',xidArray,[]);
      let params = { signed_payload: JSON.stringify(signedPayLoad) };
      let orgSign = this.getOrgSignature(signedPayLoad);
      let headers = {
        'X-Org-Key': this.orgPublicKey,
        'X-Org-Sign': orgSign
      };
      let resp = await sdk.client.doPost('/entity/', params, headers);
      sdk.logr('-- POST call response: ', resp.status, resp.data);
      if (resp.status != 200) new SignetError('E_SIGNET_API',resp.data);
      this.addEntityKeySetToKeyChain(guid, entityKeySet);
      sdk.logr('-- Added entity to key chain');
      entity = new SignetEntity(guid, verkey.getPublicKey());
      entity.refresh(resp.data);
    } catch (err) {
      sdk.logr('-- Error: ', err.toString());
    }
    sdk.logr('-- Entity object to be returned: ', entity);
    sdk.logr('-- Finished createEntity()');
    sdk.logr('-- -------------------------------------------------');
    return entity;
  }

  /**
   * Method to contruct an XID object given nsType, nsName, and XID string
   * @param {string} Type of the namespace
   * @param {string} Name of the namespace
   * @param {string} XID string
   */
  getXIDObject(nsType, nsName, xidStr) {
    return {
      nstype: nsType,
      ns: nsName,
      name: xidStr
    };
  }

  /**
   * Method to contruct a channel object given chType, version, and endpoint
   * @param {string} Type of the channel
   * @param {string} Version of the channel
   * @param {string} Endpoint for the channel
   */
  getChannelObject(chType, version, endpoint) {
    return {
      chtype: chType,
      version: version,
      endpoint: endpoint
    };
  }

  /**
   * Method to set an XID for an entity both locally
   * and on the Signet API server.
   * Returns false for API call failure or any other run-time error.
   * @param {SignetEntity} entity Signet entity to set the XID for
   * @param {string} Type of the namespace
   * @param {string} Name of the namespace
   * @param {string} XID to set
   * @return {boolean} true if successful or false for failure
   */
  async setXID(entity, nsType, nsName, xid) {
    sdk.logr('-- -------------------------------------------------');
    sdk.logr('-- Starting setXID()');
    sdk.logr("-- entity guid = '" + entity.guid + "'");
    sdk.logr("-- nsType  = '" + nsType + "'");
    sdk.logr("-- nsName  = '" + nsName + "'");
    sdk.logr("-- xid  = '" + xid + "'");
    let verkey = this.getOwnershipKeyPair(entity.guid);
    let xidObj = this.getXIDObject(nsType, nsName, xid);
    let channelArray = [];
    if (entity.channel) {
      let channelParts = entity.channel.split('#');
      channelArray.push(this.getChannelObject(
            channelParts[0],channelParts[1],channelParts[2]));
    }
    let signedPayLoad = this.getSignedPayLoad(
        entity.guid,verkey,entity.prevSign,[xidObj],channelArray);
    let signedPayLoadJSON = JSON.stringify(signedPayLoad);
    let params = { signed_payload: signedPayLoadJSON };
    sdk.logr('-- Params: ', params);
    let orgSign = this.getOrgSignature(signedPayLoad);
    let headers = {
      'X-Org-Key': this.orgPublicKey,
      'X-Org-Sign': orgSign
    };
    sdk.logr('-- Headers: ', headers);
    var retVal = false;
    // Make the REST API call and wait for it to finish
    try {
      let resp = await sdk.client.doPatch('/entity/update?guid='+entity.guid,
          params, headers);
      sdk.logr('-- PATCH call response: ', resp.status, resp.data);
      if (resp.status != 200) new SignetError('E_SIGNET_API',resp.data);
      entity.refresh(resp.data);
      retVal = true;
    } catch (err) {
      sdk.logr('-- Error: ', err.response.data);
    }
    sdk.logr('-- Finished setXID()');
    sdk.logr('-- Returning: ', retVal);
    sdk.logr('-- -------------------------------------------------');
    return retVal;
  }

  /**
   * Method to set a channel for an entity both locally
   * and on the Signet API server.
   * Returns false for API call failure or any other run-time error.
   * @param {SignetEntity} entity Signet entity to set the channel for
   * @param {string} Type of the channel
   * @param {string} Version of the channel
   * @param {string} Endpoint for the channel
   * @return {boolean} true if successful or false for failure
   */
  async setChannel(entity, chType, chVersion, chEndPoint) {
    var retVal = false;
    sdk.logr('-- -------------------------------------------------');
    sdk.logr('-- Starting setChannel()');
    sdk.logr("-- entity guid = '" + entity.guid + "'");
    sdk.logr("-- chType = '" + chType + "'");
    sdk.logr("-- chVersion = '" + chVersion + "'");
    sdk.logr("-- chEndPoint = '" + chEndPoint + "'");
    let verkey = this.getOwnershipKeyPair(entity.guid);
    let xidArray = [];
    if (entity.xid) {
      let xidParts = entity.xid.split(':');
      xidArray.push(this.getXIDObject(xidParts[0],xidParts[1],xidParts[2]));
    }
    let channelObj = this.getChannelObject(chType, chVersion, chEndPoint);
    let signedPayLoad = this.getSignedPayLoad(
        entity.guid,verkey,entity.prevSign,xidArray,[channelObj]);
    let signedPayLoadJSON = JSON.stringify(signedPayLoad);
    let params = { signed_payload: signedPayLoadJSON };
    sdk.logr('-- Params: ', params);
    // Make the REST API call and wait for it to finish
    try {
      let resp = await sdk.client.doPatch(
          '/entity/update?guid='+entity.guid, params);
      sdk.logr('-- POST call response: ', resp.status, resp.data);
      if (resp.status != 200) new SignetError('E_SIGNET_API',resp.data);
      entity.refresh(resp.data);
      retVal = true;
    } catch (err) {
      sdk.logr('-- Error: ', err.response.data);
    }
    sdk.logr('-- Finished setChannel()');
    sdk.logr('-- Returning: ', retVal);
    sdk.logr('-- -------------------------------------------------');
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
    sdk.logr('-- Starting getRekeyPayLoad');
    sdk.logr('-- GUID: ', guid);
    sdk.logr('-- New Key Pair: ', newKeyPair.getPublicKey());
    sdk.logr('-- Old Key Pair: ', oldKeyPair.getPublicKey());
    sdk.logr('-- Previous Sign: ', prevSign);
    if ((prevSign == undefined) || (prevSign == ''))
      new SignetError('E_PARAM_INVALID','Invalid previous sign');
    let signedPayLoad = this.getSignedPayLoad(guid,newKeyPair,prevSign,[],[]);
    let signature = 
      this.signObject(signedPayLoad, oldKeyPair.keypair.privateKey);
    sdk.logr('-- Signature: ', signature);
    // Build the rekey payload object
    let rekeyPayLoad = {
      signed_payload: signedPayLoad,
      old_sign: signature
    };
    sdk.logr('-- rekeyPayLoad: ', rekeyPayLoad);
    sdk.logr('-- Finished getRekeyPayLoad');
    return rekeyPayLoad;
  }

  /**
   * Method to rekey an existing entity that is already managed by this agent.
   * Returns false for API call failure or any other run-time error.
   * @param {SignetEntity} entity Signet entity to rekey
   * @return {boolean} Boolean value indicating success
   */
  async rekey(entity) {
    sdk.logr('-- -------------------------------------------------');
    sdk.logr('-- Starting rekey()');
    sdk.logr("--   entity guid = '" + entity.guid + "'");
    sdk.logr(entity);
    let oldKeyPair = this.getOwnershipKeyPair(entity.guid);
    let newEntityKeySet = new SignetKeySet();
    let newKeyPair = newEntityKeySet.ownershipKeyPair;
    let rekeyPayLoad = this.getRekeyPayLoad(
      entity.guid, newKeyPair, oldKeyPair, entity.prevSign
    );
    let rekeyPayLoadJSON = JSON.stringify(rekeyPayLoad);
    let params = { rekey_payload: rekeyPayLoadJSON };
    sdk.logr('-- Params: ', params);
    var retVal = undefined;
    // Make the REST API call and wait for it to finish
    try {
      let resp = await sdk.client.doPatch(
          '/entity/rekey?guid='+entity.guid, params);
      sdk.logr('-- POST call response: ', resp.status, resp.data);
      if (resp.status != 200)
        new SignetError('E_SIGNET_API','API call to rekey failed');
      this.addEntityKeySetToKeyChain(entity.guid, newEntityKeySet);
      entity.refresh(resp.data);
      retVal = true;
    } catch (err) {
      sdk.logr('-- Error: ', err);
    }
    sdk.logr('-- Finished rekey()');
    sdk.logr('-- -------------------------------------------------');
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
    sdk.logr('-- -------------------------------------------------');
    sdk.logr('-- Starting assignEntity()');
    sdk.logr("-- Entity object: ", entity);
    sdk.logr("-- Entity guid = '" + entity.guid + "'");
    sdk.logr("-- publicKeyString = '" + publicKeyString + "'");
    sdk.logr("-- privateKeyString = '" + privateKeyString + "'");
    var retVal = undefined;
    // Make the REST API call and wait for it to finish
    try {
      let entityKeySet = new SignetKeySet();
      // Need to import the given key strings to this new key set
      entityKeySet.ownershipKeyPair.importKeys(publicKeyString,privateKeyString);
      this.addEntityKeySetToKeyChain(entity.guid, entityKeySet);
      retVal = true;
    } catch (err) {
      sdk.logr('-- Error: ', err);
    }
    sdk.logr('-- Finished assignEntity()');
    sdk.logr('-- -------------------------------------------------');
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
    this.channel = undefined;
    this.prevSign = undefined;
    this.signedAt = undefined;
    this.entityJSON = undefined;
  }

  /**
   * Method to take an entity JSON representation object and to set the fields
   *   of the local object to the representation object.
   * @param {Object} A representation of an entity that is returned
   *   by a REST API call
   */
  refresh(entityRep) {
    sdk.logr('-- refresh starting');
    let entityObj = JSON.parse(entityRep.entityJSON);
    this.verkey = entityRep.verkey;
    this.xid = entityRep.xid;
    this.channel = entityRep.channel;
    this.prevSign = entityRep.signature;
    this.signedAt = entityRep.signedAt;
    this.entityJSON = entityRep.entityJSON;
    sdk.logr('-- Entity object refreshed: ', this);
    sdk.logr('-- refresh finished');
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
    this.verbose = true;
  }

  logr(...args) {
    if (this.verbose) console.log(...args);
  }

  /**
   * Set the Signet API endpoint for the SDK.
   * @param {string} Endpoint for the Signet API
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
    sdk.logr('-- -------------------------------------------------');
    sdk.logr('-- Starting createAgent()');
    var agent = undefined;
    try {
      agent = new SignetAgent();
    } catch (err) {
      sdk.logr('-- Error: ', err.toString());
    }
    sdk.logr('-- Finished createAgent()');
    sdk.logr('-- -------------------------------------------------');
    return agent;
  }

  /**
   * Async method to fetch an entity by GUID from the Signet API Service.
   * Returns undefined for API call failure or any other run-time error.
   * @param {string} guid GUID of the Signet entity to fetch
   * @return {SignetEntity} A SignetEntity object or undefined
   */
  async fetchEntity(guid) {
    sdk.logr('-- -------------------------------------------------');
    sdk.logr('-- Starting fetchEntity()');
    sdk.logr("--   guid = '" + guid + "'");
    let params = {};
    var entity = undefined;
    // Make the REST API call and wait for it to finish
    try {
      let resp = await this.client.doGet('/entity?guid='+guid,params);
      sdk.logr('-- GET call response: ', resp.status, resp.data);
      entity = new SignetEntity(resp.data.guid, resp.data.verkey);
      entity.refresh(resp.data);
    } catch (err) {
      sdk.logr(err.toString());
    }
    sdk.logr('-- Entity object to be returned: ', entity);
    sdk.logr('-- Finished fetchEntity()');
    sdk.logr('-- -------------------------------------------------');
    return entity;
  }

  /**
   * Async method to fetch an entity by XID from the Signet API Service.
   * Returns undefined for API call failure or any other run-time error.
   * @param {string} Type of the namespace
   * @param {string} Name of the namespace
   * @param {string} XID string
   * @return {SignetEntity} A SignetEntity object or undefined
   */
  async fetchEntityByXID(nsType, nsName, xidStr) {
    sdk.logr('-- -------------------------------------------------');
    sdk.logr('-- Starting fetchEntityByXID()');
    sdk.logr("-- nsType  = '" + nsType + "'");
    sdk.logr("-- nsName  = '" + nsName + "'");
    sdk.logr("-- xidStr  = '" + xidStr + "'");
    let xid = encodeURIComponent(nsType + ':' + nsName + ':' + xidStr);
    let params = {};
    var entity = undefined;
    // Make the REST API call and wait for it to finish
    try {
      let resp = await this.client.doGet('/entity?xid='+xid,params);
      sdk.logr('-- GET call response: ', resp.status, resp.data);
      entity = new SignetEntity(resp.data.guid, resp.data.verkey);
      entity.refresh(resp.data);
    } catch (err) {
      sdk.logr(err.toString());
    }
    sdk.logr('-- Entity object to be returned: ', entity);
    sdk.logr('-- Finished fetchEntityByXID()');
    sdk.logr('-- -------------------------------------------------');
    return entity;
  }
}


sdk = new SignetSDK();
module.exports = sdk;
