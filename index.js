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
   * Get the base64 encoded string of the public key of the key pair.
   * Add a trailing '=' sign to make it URL-safe.
   * @return {SignetKey} Public key object.
   */
  getPublicKey() {
    return base64url(this.keypair.publicKey) + '=';
  }

  /**
   * Get the base64 encoded string of the private key of the key pair.
   * Add a trailing '=' sign to make it URL-safe.
   * @return {SignetKey} Private key object.
   */
  getPrivateKey() {
    return base64url(this.keypair.privateKey) + '=';
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
   * Get the public key of the ownership key pair.
   * @return {Array} Array with two SignetKey values
   */
  getOwnershipKeypairPublicKey() {
    return this.ownershipKeyPair.getPublicKey();
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
   * @param {SignetEntity} entity SignetEntity object
   * @return {string} A signed canonical JSON representation of the entity
   */
  getSignedPayload(guid,signetKeyPair,prevSign,xids) {
    console.log('-- Starting getSignedPayload');
    console.log('-- signetKeyPair: ', signetKeyPair);
    let entityRep = {
      entity_data: {guid: guid},
      entity_verify: {
        verify_key: signetKeyPair.getPublicKey(),
        sign_time: (new Date()).toISOString(),
        prev_sign: prevSign
      }
    };
    if (xids.length > 0) { entityRep['entity_data']['xids'] = xids; }
    // Get a JSON representation of the object and sign it
    let plainTxt = JSON.stringify(entityRep);
    let sigArray = sodium.crypto_sign_detached(plainTxt, signetKeyPair.keypair.privateKey);
    // Get a base64url encoded version of it with a '=' appended
    let signature = base64url(sigArray) + '=';
    console.log('-- Signature: ', signature);
    entityRep['sign'] = signature;
    console.log('-- entityRep: ', entityRep);
    console.log('-- Finished getSignedPayload');
    return entityRep;
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
      let entityRep = this.getSignedPayload(guid,verkey,'',[]);
      let entityJSON = JSON.stringify(entityRep);
      let params = { entity_json: entityJSON };
      let resp = await sdk.client.doPost('/entity/', params);
      console.log('-- POST call response: ', resp.status, resp.data);
      this.addEntityKeySetToKeyChain(guid, entityKeySet);
      console.log('-- Added entity to key chain');
      entity = new SignetEntity(guid, verkey.getPublicKey());
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
    let params = { xid: xid };
    console.log('-- Params: ', params);
    var retVal = undefined;
    // Make the REST API call and wait for it to finish
    try {
      let resp = await sdk.client.doPost('/entity/'+entity.guid+'/setXID', params);
      console.log('-- POST call response: ', resp.status, resp.data);
      if (resp.status != 200) throw(resp.data);
      entity.xid = xid;
      retVal = true;
    } catch (err) {
      console.log('-- Error: ', err);
    }
    console.log('-- Entity object to be returned: ', entity);
    console.log('-- Finished setXID()');
    console.log('-- -------------------------------------------------');
    return retVal;
  }
}


/**
 * A proxy class for a Signet Entity.
 * <pre>
 * Objects of this class would contain entity attributes such as:
 *   - guid    => GUID of the Signet Entity
 *   - xid     => XID of the Signet Entity
 *   - verkey  => Verification key (Management key) of the Signet Entity
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
      if (resp.data.xid) entity.xid = resp.data.xid;
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
      entity.xid = resp.data.xid;
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
