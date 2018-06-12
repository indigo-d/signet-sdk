"use strict";

/**
 * Signet SDK is a NodeJS module to act as an interface to the Signet API.
 * @module SignetSDK
 */

const logger = require("js-logger");
const sodium = require('libsodium-wrappers');
const uuid4 = require('uuid/v4');
const base64url = require('base64url');

const hlp = require("./signet_helpers");



let Entity = require("./signet_entity");
let APIClient = require("./signet_api_client");
let KeySet = require("./signet_key_set");
let SignetError = require("./signet_error");

// This is the "state" of the Signet Interface Module
// These are private variables to this module.
let restClient = undefined;   // API endpoint
let sodiumReady = false;  // libsodium has been initialized?

/**
 * Set the Signet API endpoint for the SDK.
 * @param {string} Endpoint for the Signet API
 */

async function initialize(signet_api_endpoint) {
  restClient = new APIClient(signet_api_endpoint);
  if (!sodiumReady) {
    // Initialize Sodium; Sodium methods won't work without this step!
    await sodium.ready;
    sodiumReady = true;
  }
}

/**
 * Async method to create a a Signetgent object.
 * Note: this does not call the Signet API.
 * @return {SignetAgent} A SignetAgent object
 */
async function createAgent() {
  let agent = new Agent();
  return agent;
}

/*
* Async method to fetch an entity by GUID from the Signet API Service.
* Returns undefined for API call failure or any other run - time error.*
@param {
  string
}
guid GUID of the Signet entity to fetch *
  @return {
    Entity
  }
A Entity object or undefined
*/

async function fetchEntity(guid) {
  logger.debug('-- -------------------------------------------------');
  logger.debug('-- Starting fetchEntity()');
  logger.debug("--   guid = '" + guid + "'");
  let params = {};
  var entity = undefined;
  // Make the REST API call and wait for it to finish
  try {
    let resp = await restClient.doGet('/entity?guid=' + guid, params);
    logger.debug('-- GET call response: ', resp.status, resp.data);
    entity = new Entity(resp.data.guid, resp.data.verkey);
    entity.refresh(resp.data);
  } catch (err) {
    logger.error(err.toString());
  }
  logger.debug('-- Entity object to be returned: ', entity);
  logger.debug('-- Finished fetchEntity()');
  logger.debug('-- -------------------------------------------------');
  return entity;
}

/**
 * Async method to fetch an entity by XID from the Signet API Service.
 * Returns undefined for API call failure or any other run-time error.
 * @param {string} Type of the namespace
 * @param {string} Name of the namespace
 * @param {string} XID string
 * @return {Entity} A Entity object or undefined
 */
async function fetchEntityByXID(nsType, nsName, xidStr) {
  logger.debug('-- -------------------------------------------------');
  logger.debug('-- Starting fetchEntityByXID()');
  logger.debug("-- nsType  = '" + nsType + "'");
  logger.debug("-- nsName  = '" + nsName + "'");
  logger.debug("-- xidStr  = '" + xidStr + "'");
  let xid = encodeURIComponent(nsType + ':' + nsName + ':' + xidStr);
  let params = {};
  var entity = undefined;
  // Make the REST API call and wait for it to finish
  try {
    let resp = await restClient.doGet('/entity?xid=' + xid, params);
    logger.debug('-- GET call response: ', resp.status, resp.data);
    entity = new Entity(resp.data.guid, resp.data.verkey);
    entity.refresh(resp.data);
  } catch (err) {
    logger.error(err.toString());
  }
  logger.debug('-- Entity object to be returned: ', entity);
  logger.debug('-- Finished fetchEntityByXID()');
  logger.debug('-- -------------------------------------------------');
  return entity;
}

class Agent {
  /**
   * Constructor to create a SignetAgent object.
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
   * Async method to generate a GUID that is a UUID4 format UUID.
   * @return {string} UUID4 format UUID
   * @private
   */
  async _genGUID() {
    return uuid4({"random": sodium.randombytes_buf(16)});
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
   * @return {KeySet} The ownership key set or undefined if not found
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
   * @param {Unit8Array} string which is base64url encoding of signing key
   */
  signObject(objectToBeSigned,signKey) {
    // Get a JSON string representation of the object
    let plainTxt = JSON.stringify(objectToBeSigned);
    // Sign the JSON string representation of the object
    let signKeyArray = hlp.convertKeyBase64url2KeyArray(signKey)
    let signArray = sodium.crypto_sign_detached(plainTxt, signKeyArray);
    // Get a base64url encoded version of it with a '=' appended
    let signature = hlp.convertKeyArray2KeyBase64url(signArray);
    return signature;
  }

  /**
   * Method to generate an org signature
   * @param {object} Object that is the payload of the whole request
   * @return {string} A signed canonical JSON representation of the object
   */
  getOrgSignature (payLoad) {
    logger.debug('-- getOrgSignature starting');
    if (!this.orgPrivateKey)
      new SignetError('E_ORG_KEY_NOT_SET','Org private key not set');
    if (!this.orgPublicKey)
      new SignetError('E_ORG_KEY_NOT_SET','Org public key not set');
    let orgSign = this.signObject(payLoad,this.orgPrivateKey);
    logger.debug('-- orgSign = ', orgSign);
    logger.debug('-- getOrgSignature finished');
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
    //logger.debug('-- Starting getSignedPayLoad');
    //logger.debug('-- signetKeyPair: ', signetKeyPair);
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
    let signature = this.signObject(payload, signetKeyPair.getPrivateKey());
    //logger.debug('-- Signature: ', signature);
    // Build the signed payload object
    let signedPayLoad = {
      payload: payload,
      sign: signature
    };
    //logger.debug('-- signedPayLoad: ', signedPayLoad);
    //logger.debug('-- Finished getSignedPayLoad');
    return signedPayLoad;
  }

  /**
   * <pre>
   * Async method to create an entity which does the following:
   *   01) Generate a GUID
   *   02) Generate Signet key set
   *   03) Create an entity on the Signet API
   *   04) Add entity key set to agent key chain
   *   05) Create a local Entity object and set correct properties
   * Returns undefined for API call failure or any other run-time error.
   * </pre>
   * @param {Object} Optional A dictionary of options.
   * Set 'xid' to an array consisting of nstype, namespace, and XID string
   * @return {Entity} A Entity object or undefined
   */
  async createEntity(opts={}) {
    logger.debug('-- -------------------------------------------------');
    logger.debug('-- Starting createEntity()');
    let guid = await this._genGUID();
    //var guid = uuid4({"random": sodium.randombytes_buf(16)});
    logger.debug('-- guid = ', guid);
    var entity = undefined;
    // Make the REST API call and wait for it to finish
    try {
      let entityKeySet = new KeySet();
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
      let resp = await restClient.doPost('/entity/', params, headers);
      logger.debug('-- POST call response: ', resp.status, resp.data);
      if (resp.status != 200) new SignetError('E_SIGNET_API',resp.data);
      this.addEntityKeySetToKeyChain(guid, entityKeySet);
      logger.debug('-- Added entity to key chain');
      entity = new Entity(guid, verkey.getPublicKey());
      entity.refresh(resp.data);
    } catch (err) {
      logger.debug('-- Error: ', err.toString());
    }
    logger.debug('-- Entity object to be returned: ', entity);
    logger.debug('-- Finished createEntity()');
    logger.debug('-- -------------------------------------------------');
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
   * @param {Entity} entity Signet entity to set the XID for
   * @param {string} Type of the namespace
   * @param {string} Name of the namespace
   * @param {string} XID to set
   * @return {boolean} true if successful or false for failure
   */
  async setXID(entity, nsType, nsName, xid) {
    logger.debug('-- -------------------------------------------------');
    logger.debug('-- Starting setXID()');
    logger.debug("-- entity guid = '" + entity.guid + "'");
    logger.debug("-- nsType  = '" + nsType + "'");
    logger.debug("-- nsName  = '" + nsName + "'");
    logger.debug("-- xid  = '" + xid + "'");
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
    logger.debug('-- Params: ', params);
    let orgSign = this.getOrgSignature(signedPayLoad);
    let headers = {
      'X-Org-Key': this.orgPublicKey,
      'X-Org-Sign': orgSign
    };
    logger.debug('-- Headers: ', headers);
    var retVal = false;
    // Make the REST API call and wait for it to finish
    try {
      let resp = await restClient.doPatch('/entity/update?guid='+entity.guid,
          params, headers);
      logger.debug('-- PATCH call response: ', resp.status, resp.data);
      if (resp.status != 200) new SignetError('E_SIGNET_API',resp.data);
      entity.refresh(resp.data);
      retVal = true;
    } catch (err) {
      logger.debug('-- Error: ', err.response.data);
    }
    logger.debug('-- Finished setXID()');
    logger.debug('-- Returning: ', retVal);
    logger.debug('-- -------------------------------------------------');
    return retVal;
  }

  /**
   * Method to set a channel for an entity both locally
   * and on the Signet API server.
   * Returns false for API call failure or any other run-time error.
   * @param {Entity} entity Signet entity to set the channel for
   * @param {string} Type of the channel
   * @param {string} Version of the channel
   * @param {string} Endpoint for the channel
   * @return {boolean} true if successful or false for failure
   */
  async setChannel(entity, chType, chVersion, chEndPoint) {
    var retVal = false;
    logger.debug('-- -------------------------------------------------');
    logger.debug('-- Starting setChannel()');
    logger.debug("-- entity guid = '" + entity.guid + "'");
    logger.debug("-- chType = '" + chType + "'");
    logger.debug("-- chVersion = '" + chVersion + "'");
    logger.debug("-- chEndPoint = '" + chEndPoint + "'");
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
    logger.debug('-- Params: ', params);
    // Make the REST API call and wait for it to finish
    try {
      let resp = await restClient.doPatch(
          '/entity/update?guid='+entity.guid, params);
      logger.debug('-- POST call response: ', resp.status, resp.data);
      if (resp.status != 200) new SignetError('E_SIGNET_API',resp.data);
      entity.refresh(resp.data);
      retVal = true;
    } catch (err) {
      logger.debug('-- Error: ', err.response.data);
    }
    logger.debug('-- Finished setChannel()');
    logger.debug('-- Returning: ', retVal);
    logger.debug('-- -------------------------------------------------');
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
    logger.debug('-- Starting getRekeyPayLoad');
    logger.debug('-- GUID: ', guid);
    logger.debug('-- New Key Pair: ', newKeyPair.getPublicKey());
    logger.debug('-- Old Key Pair: ', oldKeyPair.getPublicKey());
    logger.debug('-- Previous Sign: ', prevSign);
    if ((prevSign == undefined) || (prevSign == ''))
      new SignetError('E_PARAM_INVALID','Invalid previous sign');
    let signedPayLoad = this.getSignedPayLoad(guid,newKeyPair,prevSign,[],[]);
    let signature =
      this.signObject(signedPayLoad, oldKeyPair.getPrivateKey());
    logger.debug('-- Signature: ', signature);
    // Build the rekey payload object
    let rekeyPayLoad = {
      signed_payload: signedPayLoad,
      old_sign: signature
    };
    logger.debug('-- rekeyPayLoad: ', rekeyPayLoad);
    logger.debug('-- Finished getRekeyPayLoad');
    return rekeyPayLoad;
  }

  /**
   * Method to rekey an existing entity that is already managed by this agent.
   * Returns false for API call failure or any other run-time error.
   * @param {Entity} entity Signet entity to rekey
   * @return {boolean} Boolean value indicating success
   */
  async rekey(entity) {
    logger.debug('-- -------------------------------------------------');
    logger.debug('-- Starting rekey()');
    logger.debug("--   entity guid = '" + entity.guid + "'");
    logger.debug(entity);
    let oldKeyPair = this.getOwnershipKeyPair(entity.guid);
    let newEntityKeySet = new KeySet();
    let newKeyPair = newEntityKeySet.ownershipKeyPair;
    let rekeyPayLoad = this.getRekeyPayLoad(
      entity.guid, newKeyPair, oldKeyPair, entity.prevSign
    );
    let rekeyPayLoadJSON = JSON.stringify(rekeyPayLoad);
    let params = { rekey_payload: rekeyPayLoadJSON };
    logger.debug('-- Params: ', params);
    var retVal = undefined;
    // Make the REST API call and wait for it to finish
    try {
      let resp = await restClient.doPatch(
          '/entity/rekey?guid='+entity.guid, params);
      logger.debug('-- POST call response: ', resp.status, resp.data);
      if (resp.status != 200)
        new SignetError('E_SIGNET_API','API call to rekey failed');
      this.addEntityKeySetToKeyChain(entity.guid, newEntityKeySet);
      entity.refresh(resp.data);
      retVal = true;
    } catch (err) {
      logger.debug('-- Error: ', err);
    }
    logger.debug('-- Finished rekey()');
    logger.debug('-- -------------------------------------------------');
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
   * @param {Entity} entity Signet entity to assign to this agent
   * @param {string} String representation of a SignetKeyPair public key
   * @param {string} String representation of a SignetKeyPair private key
   * @return {boolean} Boolean value indicating success
   */
  async assignEntity(entity, publicKeyString, privateKeyString) {
    logger.debug('-- -------------------------------------------------');
    logger.debug('-- Starting assignEntity()');
    logger.debug("-- Entity object: ", entity);
    logger.debug("-- Entity guid = '" + entity.guid + "'");
    logger.debug("-- publicKeyString = '" + publicKeyString + "'");
    logger.debug("-- privateKeyString = '" + privateKeyString + "'");
    var retVal = undefined;
    // Make the REST API call and wait for it to finish
    try {
      let entityKeySet = new KeySet();
      // Need to import the given key strings to this new key set
      entityKeySet.ownershipKeyPair.importKeys(publicKeyString,privateKeyString);
      this.addEntityKeySetToKeyChain(entity.guid, entityKeySet);
      retVal = true;
    } catch (err) {
      logger.debug('-- Error: ', err);
    }
    logger.debug('-- Finished assignEntity()');
    logger.debug('-- -------------------------------------------------');
    return retVal;
  }
}

module.exports = {initialize, fetchEntity, createAgent, fetchEntityByXID, KeySet, Agent};
