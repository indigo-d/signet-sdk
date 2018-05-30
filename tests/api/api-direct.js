const assert = require("assert");

const api_endpoint = "http://localhost:1337";

// supertest provides an api object for http
const request = require('supertest');
const api = request.agent(api_endpoint);

const sodium = require("libsodium-wrappers");

// Rewirings of index.js
const rewire = require("rewire");
const sdk = rewire("../../index.js");
const SignetKeySet = sdk.__get__("SignetKeySet")

const orgSigningKey =
  'kBL96MxRGT3MbMnIw9-Q8ILsyjPEjY3ha30X_mc8-SCS7L4c6c3atLiMu6e65cycZT' +
  'gqs6lzq8kUUvY2GXJb0Q=';
const orgVerifyKey =
  'kuy-HOnN2rS4jLunuuXMnGU4KrOpc6vJFFL2NhlyW9E=';

describe("Signet API Tests", function() {
  before(async function() {
    sdk.verbose = true;
    sdk.initialize(api_endpoint);
    await sodium.ready;
  });

  describe("POST /entity/", function() {

    it("Create an entity", async function() {
      let guid = await sdk.genGUID();
      let entityKeySet = new SignetKeySet();
      let verkey = entityKeySet.ownershipKeyPair;
      let agent = await sdk.createAgent();
      let signedPayLoad = agent.getSignedPayLoad(guid, verkey, '', [], []);
      let orgSign = agent.signObject(signedPayLoad, orgSigningKey);
      let signedPayLoadJSON = JSON.stringify(signedPayLoad);
      let params = {
        signed_payload: signedPayLoadJSON
      };
      api.post("/entity")
        .set('X-Org-Key', orgVerifyKey).set('X-Org-Sign', orgSign)
        .send(params).expect(200).end(
          function(err, res) {
            if (err) return done(err);
            done();
          }
        );
    });
  });
});
