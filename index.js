var keypair = require('keypair');
var axios = require('axios');

class SignetAPIClient {
    constructor(signet_api_endpoint) {
        this.signet_api_endpoint = signet_api_endpoint;
    }

    // Make POST request to Signet API
    doPost(url_path, params, callback) {
        let url = this.signet_api_endpoint + url_path;
        console.log('Sending POST request to URL: ' + url);
        console.log('Params:', params);
        axios.post(url, params).then(
            function (resp) { callback(resp); }
        ).catch(
            function(error) { console.log(error); }
        );
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
     * Method to create an entity which involves the following:
     *   01) Generate Signet key set
     *   02) Create an entity on the Signet API
     *   03) Add entity key set to agent key chain
     */
    createEntity(agent, guid, callback) {
        console.log('Starting createEntity()');
        let entityKeySet = new SignetKeySet();
        let publicKeys = entityKeySet.getPublicKeys();
        let verkey = publicKeys[0].substring(0,250);
        let params = { guid: guid, verkey: verkey };
        this.client.doPost('/entity/', params, function (resp) {
            console.log('Success: ' + resp.data);
            agent.addEntityKeySetToKeyChain(guid, entityKeySet);
            let entity = new SignetEntity(guid, verkey);
            callback(entity);
        });
        console.log('Finished createEntity()');
    }
}


module.exports = new SignetSDK();
