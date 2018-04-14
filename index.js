/**
 * Signet SDK is a NodeJS module to act as an interface to the Signet API.
 * <pre>
 * Usage:
 *   var sdk = require('signet-sdk');
 *   sdk.connect('http://localhost:1337'); // Set the Signet API endpoint
 *   var agent = sdk.createAgent(); // Create a new agent (local object)
 *   var entity = sdk.createEntity(agent,'guid1'); // Create a new entity
 *   sdk.setXID(agent,entity,'XID1'); // Set the XID of the entity
 *   var eByGUID = sdk.fetchEntity('guid1'); // Fetched entity object
 *   var eByXID = sdk.fetchEntityByXID('XID1'); // Fetched entity object
 * </pre>
 * @module SignetSDK
 */
var keypair = require('keypair');
var axios = require('axios');
var async = require('async');


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
 */
class SignetKeyPair {
    /**
     * Constructor for the SignetAPI Client
     * @return {object} object of type SignetKeyPair
     */
    constructor() {
        // Create a RSA 2048 Public-Private Key pair
        Object.defineProperty(this, 'keypair', {
          value: keypair(),
          writable: false
        });
    }

    /**
     * Get the public key of the key pair.
     * @return {SignetKey} Public key object.
     */
    getPublicKey() {
        return this.keypair['public'];
    }

    /**
     * Get the private key of the key pair.
     * @return {SignetKey} Private key object.
     */
    getPrivateKey() {
        return this.keypair['private'];
    }
}


// Note: Add <pre> ... </pre> tags for proper formatting with jsdoc!
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
        this.managementKey = new SignetKeyPair();
        this.encryptionKey = new SignetKeyPair();
    }

    /**
     * Get the public keys of the management and encryption key pairs.
     * @return {Array} Array with two SignetKey values
     */
    getPublicKeys() {
        return [this.managementKey.getPublicKey(), this.encryptionKey.getPublicKey()];
    }
}


// Note: Add <pre> ... </pre> tags for proper formatting with jsdoc!
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
     * @return {object} object of type SignetKeyEntity
     */
    constructor(guid, verkey) {
        this.guid = guid;
        this.verkey = verkey;
    }
}

// Note: Add <pre> ... </pre> tags for proper formatting with jsdoc!
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
    }

    /**
     * Adds the key set object of the given entity to the agent's key chain.
     * @return {SignetKeySet} The management key of the key set
     */
    addEntityKeySetToKeyChain(guid, keySet) {
        this.keyChain[guid] = keySet;
        return keySet.managementKey;
    }

    /**
     * Gets the signing key (management key) of the key set object
     * @return {SignetKeySet} The management key of the key set or undefined if not found
     */
    getSigningKey(guid) {
        if ( !(guid in this.keyChain) ) {
            return undefined;
        } else {
            let keySet = this.keyChain[guid];
            return keySet.managementKey;
        }
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
    }

    /**
     * Set the Signet API endpoint for the SDK.
     * @param {str} Endpoint for the Signet API
     */
    initialize(signet_api_endpoint) {
        this.client = new SignetAPIClient(signet_api_endpoint);
    }

    /**
     * Create a a Signetgent object (Note: this does not call the Signet API)
     * @return {SignetAgent} A SignetAgent object
     */
    createAgent() {
        console.log('-- -------------------------------------------------');
        console.log('-- Starting createAgent()');
        var agent = new SignetAgent();
        console.log('-- Finished createAgent()');
        console.log('-- -------------------------------------------------');
        return agent;
    }

    /**
     * <pre>
     * Async method to create an entity which involves the following:
     *   01) Generate Signet key set
     *   02) Create an entity on the Signet API
     *   03) Add entity key set to agent key chain
     * Returns undefined for API call failure or any other run-time error.
     * </pre>
     * @param {SignetAgent} agent Signet agent that would manage the entity
     * @param {str} guid GUID for the entity
     * @return {SignetEntity} A SignetEntity object or undefined
     */
    async createEntity(agent, guid) {
        console.log('-- -------------------------------------------------');
        console.log('-- Starting createEntity()');
        let entityKeySet = new SignetKeySet();
        let publicKeys = entityKeySet.getPublicKeys();
        let verkey = publicKeys[0].substring(0,250);
        let params = { guid: guid, verkey: verkey };
        var entity = undefined;
        // Make the REST API call and wait for it to finish
        try {
            let resp = await this.client.doPost('/entity/', params);
            console.log('-- POST call response: ', resp.status, resp.data);
            agent.addEntityKeySetToKeyChain(guid, entityKeySet);
            console.log('-- Added entity to agent key chain');
            entity = new SignetEntity(guid, verkey);
        } catch (err) {
            console.log('-- Error: ', err.toString());
        }
        console.log('-- Entity object to be returned: ', entity);
        console.log('-- Finished createEntity()');
        console.log('-- -------------------------------------------------');
        return entity;
    }

    /**
     * Method to set an XID for a given entity.
     * Returns undefined for API call failure or any other run-time error.
     * @param {SignetAgent} agent Signet agent that manages the entity
     * @param {SignetEntity} entity Signet entity to set the XID for
     * @param {str} xid New XID to set
     * @return {expression} An expression that is either true or undefined
     */
    async setXID(agent, entity, xid) {
        console.log('-- -------------------------------------------------');
        console.log('-- Starting setXID()');
        console.log("--   entity guid = '" + entity.guid + "'");
        console.log("--   new XID  = '" + xid + "'");
        let params = { xid: xid };
        console.log('-- Params: ', params);
        var retVal = undefined;
        // Make the REST API call and wait for it to finish
        try {
            let resp = await this.client.doPost('/entity/'+entity.guid+'/setXID', params);
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


module.exports = new SignetSDK();
