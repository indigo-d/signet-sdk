var keypair = require('keypair');
var axios = require('axios');
var async = require('async');

class SignetAPIClient {
    constructor(signet_api_endpoint) {
        this.signet_api_endpoint = signet_api_endpoint;
    }

    // Make GET request to Signet API
    doGet(url_path, params) {
        let url = this.signet_api_endpoint + url_path;
        console.log('Sending GET request to URL: ' + url);
        console.log('Params:', params);
        // Note: the following method call returns a promise
        return axios.get(url, params);
    }

    // Make POST request to Signet API
    doPost(url_path, params) {
        let url = this.signet_api_endpoint + url_path;
        console.log('Sending POST request to URL: ' + url);
        console.log('Params:', params);
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
        console.log('Starting createAgent()');
        var agent = new SignetAgent();
        console.log('Finished createAgent()');
        return agent;
    }

    /*
     * Async method to create an entity which involves the following:
     *   01) Generate Signet key set
     *   02) Create an entity on the Signet API
     *   03) Add entity key set to agent key chain
     */
    async createEntity(agent, guid) {
        console.log('Starting createEntity()');
        let entityKeySet = new SignetKeySet();
        let publicKeys = entityKeySet.getPublicKeys();
        let verkey = publicKeys[0].substring(0,250);
        let params = { guid: guid, verkey: verkey };
        // Make the REST API call and wait for it to finish
        try {
            let resp = await this.client.doPost('/entity/', params);
            console.log('Success:');
            console.log(resp.data);
            agent.addEntityKeySetToKeyChain(guid, entityKeySet);
            let entity = new SignetEntity(guid, verkey);
            return entity;
        } catch (err) {
            console.log(err.toString());
        }
        console.log('Finished createEntity()');
    }

    /*
     * Async method to fetch an entity from the Signet API Service
     */
    async fetchEntity(guid) {
        console.log('Starting fetchEntity()');
        let params = {};
        // Make the REST API call and wait for it to finish
        try {
            let resp = await this.client.doGet('/entity/'+guid,params);
            console.log('Success:');
            console.log(resp.data);
            let entity = new SignetEntity(resp.data.guid, resp.data.verkey);
            return entity;
        } catch (err) {
            console.log(err.toString());
        }
        console.log('Finished fetchEntity()');
    }
}


module.exports = new SignetSDK();
