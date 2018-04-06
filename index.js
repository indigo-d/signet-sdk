var keypair = require('keypair');

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
    constructor(publicKeys) {
        // TODO: This should become an API call that returns the ID
        this.entityID = publicKeys[0];
    }
}

class SignetAgent {
    constructor() {
        // Empty hash containing the entity keys managed by this agent
        this.keyChain = {};
    }

    addEntityKeySetToKeyChain(entityID, keySet) {
        this.keyChain[entityID] = keySet;
    }

    /*
     * Method to create an entity which involves the following:
     *   01) Generate Signet key set
     *   02) Create an entity on the Signet API
     *   03) Associate the entity keys with the newly created entity
     */
    createEntity() {
        console.log('Starting createEntity()');
        var entityKeySet = new SignetKeySet();
        var entity = new SignetEntity(entityKeySet.getPublicKeys());
        this.addEntityKeySetToKeyChain(entity.entityID, entityKeySet);
        console.log('Finished createEntity()');
        return entity;
    }
}

class SignetSDK {
    constructor() {
        this.version = "0.0.1";
    }
    createAgent() {
        console.log('Starting createAgent()');
        var agent = new SignetAgent();
        console.log('Finished createAgent()');
        return agent;
    }
}


module.exports = new SignetSDK();
