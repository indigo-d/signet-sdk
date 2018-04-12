var keypair = require('keypair');
var axios = require('axios');
var async = require('async');

class SignetAPIClient {
    constructor(signet_api_endpoint) {
        this.signet_api_endpoint = signet_api_endpoint;
    }

    // Make GET request to Signet API
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

    // Make POST request to Signet API
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

class SignetKeyPair {
    constructor() {
        // Create a RSA 2048 Public-Private Key pair
        Object.defineProperty(this, 'keypair', {
          value: keypair(),
          writable: false
        });
    }

    // Return the public key of the key pair
    getPublicKey() {
        return this.keypair['public'];
    }

    // Return the private key of the key pair
    getPrivateKey() {
        return this.keypair['private'];
    }
}

class SignetKeySet {
    /*
     * Constructor to create a management key and an encryption key.
     * The management key will be used to sign for ownership of the
     * entity and the encryption key will be used to encrypt/decrypt
     * communication regarding the entity.
     */
    constructor() {
        this.managementKey = new SignetKeyPair();
        this.encryptionKey = new SignetKeyPair();
    }

    getPublicKeys() {
        return [this.managementKey.getPublicKey(), this.encryptionKey.getPublicKey()];
    }
}

class SignetEntity {
    constructor(guid, verkey) {
        this.guid = guid;
        this.verkey = verkey;
    }
}

class SignetAgent {
    constructor() {
        // Empty hash containing the entity keys managed by this agent
        this.keyChain = {};
    }

    addEntityKeySetToKeyChain(guid, keySet) {
        this.keyChain[guid] = keySet;
        return keySet.managementKey;
    }

    getSigningKey(guid) {
        if ( !(guid in this.keyChain) ) {
            return undefined;
        } else {
            let keySet = this.keyChain[guid];
            return keySet.managementKey;
        }
    }
}

class SignetSDK {
    constructor(signet_api_endpoint) {
        this.version = "0.0.1";
        this.client = undefined;
    }

    // Create a client object for the Signet API
    initialize(signet_api_endpoint) {
        this.client = new SignetAPIClient(signet_api_endpoint);
    }

    // Create Agent call (Note: this does not call the Signet API)
    createAgent() {
        console.log('-- -------------------------------------------------');
        console.log('-- Starting createAgent()');
        var agent = new SignetAgent();
        console.log('-- Finished createAgent()');
        console.log('-- -------------------------------------------------');
        return agent;
    }

    /*
     * Async method to create an entity which involves the following:
     *   01) Generate Signet key set
     *   02) Create an entity on the Signet API
     *   03) Add entity key set to agent key chain
     * Returns undefined for API call failure or any other run-time error.
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

    /*
     * Async method to fetch an entity from the Signet API Service.
     * Returns undefined for API call failure or any other run-time error.
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

    /*
     * Async method to fetch an entity from the Signet API Service by XID.
     * Returns undefined for API call failure or any other run-time error.
     */
    async fetchEntityByXID(xid) {
        console.log('-- -------------------------------------------------');
        console.log('-- Starting fetchEntityByXID()');
        console.log("--   xid = '" + xid + "'");
        let params = { xid: xid };
        var entity = undefined;
        // Make the REST API call and wait for it to finish
        try {
            let resp = await this.client.doGet('/entity/fetchEntityByXID/',params);
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
