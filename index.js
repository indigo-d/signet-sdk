class SignetAgent {
    constructor() {
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
