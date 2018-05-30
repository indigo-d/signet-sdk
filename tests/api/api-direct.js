const assert = require("assert");
const api_endpoint = "http://localhost:1337";

const sdk = require("../../index.js");

const sodium = require("libsodium-wrappers");

describe("Signet API Tests", function() {
  before(async function() {
    sdk.verbose = true;
    sdk.initialize("http://localhost:1337");
    await sodium.ready;
  });

  describe("POST /entity/", function() {

    it("Create an entity", function() {
        guid = sdk.genGUID();
    });

  });
});







