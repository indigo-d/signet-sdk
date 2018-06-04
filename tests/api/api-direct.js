const assert = require("assert");

const api_endpoint = "http://localhost:1337";

// supertest provides an api object for http
const supertest = require('supertest');
const request = supertest.agent(api_endpoint);
const should = require("should");
const expect = require('chai').expect;

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
const xidNamespace = "lola.com";

describe("Signet API Tests", function() {

  before(async function() {
    sdk.verbose = true;
    sdk.initialize(api_endpoint);
    await sodium.ready;
    xidNameA = Math.random().toString(36);
    xidNameB = Math.random().toString(36);
  });

  describe("POST /entity/", function() {

    it("Creates an entity without XID, can't create again with same GUID",
      async function() {
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
        let res = await request.post("/entity")
          .set('X-Org-Key', orgVerifyKey).set('X-Org-Sign', orgSign)
          .send(params);
        expect(res.status).to.equal(200);
        // Do it a second time and get error - duplicate GUID
        res = await request.post("/entity")
          .set('X-Org-Key', orgVerifyKey).set('X-Org-Sign', orgSign)
          .send(params);
        expect(res.status).to.equal(400);
      });

    it("Creates an entity with XID, can't create again with same XID," +
      " different GUID",
      async function() {
        let guidA = await sdk.genGUID();
        let guidB = await sdk.genGUID();
        let entityKeySet = new SignetKeySet();
        let verkey = entityKeySet.ownershipKeyPair;
        let agent = await sdk.createAgent();
        // XID
        let xidObj = {
          nstype: 'dn',
          ns: xidNamespace,
          name: xidNameA
        };
        let signedPayLoadA = agent.getSignedPayLoad(guidA, verkey, '', [xidObj], []);
        let orgSignA = agent.signObject(signedPayLoadA, orgSigningKey);
        let signedPayLoadJSONA = JSON.stringify(signedPayLoadA);
        let paramsA = {
          signed_payload: signedPayLoadJSONA
        };
        let resA = await request.post("/entity")
          .set('X-Org-Key', orgVerifyKey).set('X-Org-Sign', orgSignA)
          .send(paramsA);
        expect(resA.status).to.equal(200)
        // Do it again, with same XID and different GUID. Get error -
        // duplicate XID
        let signedPayLoadB = agent.getSignedPayLoad(guidA, verkey, '', [xidObj], []);
        let orgSignB = agent.signObject(signedPayLoadB, orgSigningKey);
        let signedPayLoadJSONB = JSON.stringify(signedPayLoadB);
        let paramsB = {
          signed_payload: signedPayLoadJSONB
        };
        let resB = await request.post("/entity")
          .set('X-Org-Key', orgVerifyKey).set('X-Org-Sign', orgSignB)
          .send(paramsB);
          expect(resB.status).to.equal(400)
      });
    //
    //     it("Get entity A using guid", function() {
    //       let url = "/entity?guid=" + guidA;
    //       api.get(url).send()
    //         .expect(200)
    //         .end(
    //           function(err, res) {
    //             if (err) return done(err);
    //             assert.notEqual(undefined, res.body);
    //             assert.equal(guid, res.body.guid);
    //             done();
    //           }
    //         );
    // //      sdk.logr("body=", res.body)
    //     })
  });
});
