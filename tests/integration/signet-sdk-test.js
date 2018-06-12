/**
 *   This test suite will test the functions exported by the
 *   Signet SDK library.  The high-level objects of the SDK
 *   library such as Agent, Entity etc. would have their own
 *   test suites.
 */


/**
 * The initial section where modules are included and the global
 *   variables are declared and also initialized if need be.
 */
// Includes
var logger = require("js-logger");
var assert = require('assert');
var api_endpoint = 'http://localhost:1337';

// Needed to access non-exported classes
const signet = require("../../index.js");

var agent, entity, guid, channel, xid1, xid2, xid3, xid4;
var agent2, a2Entity, guid2, xid5;
var orgPublicKey = 'kuy-HOnN2rS4jLunuuXMnGU4KrOpc6vJFFL2NhlyW9E=';
var orgPrivateKey = 'kBL96MxRGT3MbMnIw9-Q8ILsyjPEjY3ha30X_mc8-SCS7'+
  'L4c6c3atLiMu6e65cycZTgqs6lzq8kUUvY2GXJb0Q=';

logger.useDefaults();

/**
 * The following test suite implements integration tests for the Signet
 * API and SDK.  We will be making SDK calls that will in turn call the
 * Signet API and then verify the results.  This requires the Signet API
 * to be running on localhost on a known port (see above for details).
 */

describe('Signet Integration Tests', function () {

  // Initialize the SDK i.e. set the Signet API endpoint
  // Note: This implies that there should be a Signet API server running
  //       and that the server is listening on port 1337 on localhost.

  signet.initialize('http://localhost:1337');
  it('SDK Scenario 01: Create entity, set channel and fetch entity',
      async function () {

        logger.debug('== =================================================');

        // Create Agent
        agent = await signet.createAgent();
        agent.setOrgKeys(orgPublicKey, orgPrivateKey);
        logger.debug('== Agent: ', agent);
        logger.debug('== =================================================');

        // Create an entity
        logger.debug('== =================================================');
        logger.debug('== Create entity');
        entity = await agent.createEntity();
        logger.debug('== Created entity:', entity);
        assert.notEqual(entity, undefined, 'Entity create failed');
        assert.notEqual(entity.guid, undefined, 'Entity missing GUID');
        guid = entity.guid;
        logger.debug('== GUID: ', guid);
        logger.debug('== =================================================');

        // Set Channel
        logger.debug('== =================================================');
        logger.debug('== Set Channel');
        channel = Math.random().toString(36).substr(2, 5);
        let retSetChannel = await agent.setChannel(entity, 'REST', 'v1', channel);
        assert.ok(retSetChannel);
        assert.equal(entity.channel, 'REST#v1#'+channel);
        logger.debug('== =================================================');

        // Fetch entity
        logger.debug('== =================================================');
        logger.debug('== Fetch entity');
        let fetchedEntity = await signet.fetchEntity(guid);
        logger.debug('== Entity fetched: ', fetchedEntity);
        assert.equal(fetchedEntity.guid, guid);
        assert.equal(fetchedEntity.channel, 'REST#v1#'+channel);
        logger.debug('== =================================================');

      });

  it('SDK Scenario 02: Set XID and fetch entity by XID',
      async function () {

        // Set XID
        logger.debug('== =================================================');
        logger.debug('== Set XID');
        xid1 =  Math.random().toString(36).substr(2, 5);
        let ret1 = await agent.setXID(entity, 'dn', 'lola.com', xid1);
        assert.ok(ret1);
        assert.equal(entity.xid, 'dn:lola.com:'+xid1);
        assert.equal(entity.channel, 'REST#v1#'+channel);
        logger.debug('== =================================================');

        // Fetch entity by XID
        logger.debug('== =================================================');
        logger.debug('== Fetch entity by XID');
        let fetchedEntityByXID = await signet.fetchEntityByXID('dn','lola.com',xid1);
        logger.debug('== Entity fetched by XID: ', fetchedEntityByXID);
        assert.equal(fetchedEntityByXID.xid, 'dn:lola.com:'+xid1);
        assert.equal(fetchedEntityByXID.channel, 'REST#v1#'+channel);
        logger.debug('== =================================================');

      });

  it('SDK Scenario 03: Rekey entity tests',
      async function () {

        // Rekey entity
        logger.debug('== =================================================');
        logger.debug('== Rekey:');
        await agent.rekey(entity);
        logger.debug('== =================================================');

        // Set XID after rekey
        logger.debug('== =================================================');
        logger.debug('== Set XID after rekey');
        xid2 =  Math.random().toString(36).substr(2, 5);
        let ret2 = await agent.setXID(entity, 'dn', 'lola.com', xid2);
        assert.ok(ret2);
        assert.equal(entity.xid, 'dn:lola.com:'+xid2);
        assert.equal(entity.channel, 'REST#v1#'+channel);
        logger.debug('== =================================================');

        // Fetch entity by XID after rekey
        logger.debug('== =================================================');
        logger.debug('== Fetch entity by XID after rekey');
        let fetchedEntityByXIDAfterRekey =
          await signet.fetchEntityByXID('dn','lola.com',xid2);
        logger.debug('== Entity fetched by XID after rekey: ',
            fetchedEntityByXIDAfterRekey);
        assert.equal(fetchedEntityByXIDAfterRekey.xid, 'dn:lola.com:'+xid2);
        assert.equal(fetchedEntityByXIDAfterRekey.channel, 'REST#v1#'+channel);
        logger.debug('== =================================================');

        // Rekey entity again and run some negative tests
        logger.debug('== =================================================');
        logger.debug('== Rekey:');
        let oldKeySet = agent.keyChain[guid];
        await agent.rekey(entity);
        let newKeySet = agent.keyChain[guid];
        logger.debug('== =================================================');

        // Reset the signing key to the old signing key (before the rekey)
        logger.debug('== =================================================');
        logger.debug(agent.getOwnershipKeyPair(guid).getPublicKey());
        agent.addEntityKeySetToKeyChain(guid, oldKeySet);
        logger.debug(agent.getOwnershipKeyPair(guid).getPublicKey());
        xid3 =  Math.random().toString(36).substr(2, 5);
        let ret3 = await agent.setXID(entity, 'dn', 'lola.com', xid3);
        assert.equal(ret3, false);
        logger.debug('== =================================================');

        // Fetch entity after the negative test and check XID
        logger.debug('== =================================================');
        logger.debug('== Fetch entity after negative test');
        let entity2 = await signet.fetchEntity(guid);
        logger.debug('== Entity fetched after negative test: ', entity2);
        assert.equal(entity.guid, guid);
        assert.equal(entity.xid, 'dn:lola.com:'+xid2);
        assert.notEqual(entity.xid, 'dn:lola.com:'+xid3);
        assert.equal(entity.channel, 'REST#v1#'+channel);
        logger.debug('== =================================================');

        // Reset to new key, set XID to a new value and then check XID
        logger.debug('== =================================================');
        logger.debug(agent.getOwnershipKeyPair(guid).getPublicKey());
        agent.addEntityKeySetToKeyChain(guid, newKeySet);
        logger.debug(agent.getOwnershipKeyPair(guid).getPublicKey());
        logger.debug('== Set XID3:');
        ret3 = await agent.setXID(entity, 'dn', 'lola.com', xid3);
        assert.ok(ret3);
        logger.debug('== Fetch entity by XID3');
        let entity3 = await signet.fetchEntityByXID('dn','lola.com',xid3);
        logger.debug('== Entity3: ', entity3);
        assert.equal(entity3.xid, 'dn:lola.com:'+xid3);
        assert.equal(entity3.channel, 'REST#v1#'+channel);
        logger.debug('== =================================================');

      });

  it('Scenario 04: Assign Entity Workflow',
      async function () {

        logger.debug('== =================================================');

        agent2 = await signet.createAgent();
        logger.debug('== Agent2: ', agent2);

        // Fetch the entity created in the previous scenario
        // This entity would then be assigned to the new agent created above
        //   in this scenario.
        let e4 = await signet.fetchEntity(guid);
        let a1e4Keys = agent.getOwnershipKeySet(guid).exportOwnershipKeyPair();
        let ret4 = await agent2.assignEntity(e4,a1e4Keys[0],a1e4Keys[1]);
        logger.debug(ret4);
        assert.ok(ret4);
        let a2e4Keys = agent2.getOwnershipKeySet(guid).exportOwnershipKeyPair();
        logger.debug(a2e4Keys);
        assert.deepEqual(a1e4Keys,a2e4Keys);

        // Rekey entity to take exclusive ownership
        let rekeyRetVal = await agent2.rekey(e4);
        assert.ok(rekeyRetVal);
        let eByXID = await signet.fetchEntityByXID('dn','lola.com',xid3);
        assert.equal(eByXID.xid, 'dn:lola.com:'+xid3);
        assert.equal(eByXID.channel, 'REST#v1#'+channel);

        // Negative test: try to set XID by old agent (should fail!)
        let setXIDByOldAgentRetVal = await agent.setXID(e4, 'dn', 'lola.com', 'foo');
        assert.equal(setXIDByOldAgentRetVal, false);

        // Positive test: set XID by new agent (should pass)
        agent2.setOrgKeys(orgPublicKey, orgPrivateKey);
        logger.debug('== Set XID4:');
        xid4 =  Math.random().toString(36).substr(2, 5);
        ret4 = await agent2.setXID(eByXID, 'dn', 'lola.com', xid4);
        assert.ok(ret4);
        logger.debug('== Fetch entity by XID4');
        e4 = await signet.fetchEntityByXID('dn','lola.com',xid4);
        logger.debug('== Entity4: ', e4);
        assert.equal(e4.xid, 'dn:lola.com:'+xid4);
        assert.equal(e4.channel, 'REST#v1#'+channel);

        // Positive test: agent2 should create an entity with XID set
        logger.debug('== =================================================');
        logger.debug('== Agent2 create entity with XID set');
        xid5 =  Math.random().toString(36).substr(2, 5);
        logger.debug('== XID5: ', xid5);
        a2Entity = await agent.createEntity({'xid': ['dn','lola.com',xid5]});
        logger.debug('== Agent2 created entity:', a2Entity);
        assert.notEqual(a2Entity, undefined, 'Agent2 entity create failed');
        assert.notEqual(a2Entity.guid, undefined, 'Agent2 entity missing GUID');
        guid2 = a2Entity.guid;
        logger.debug('== GUID2: ', guid2);
        assert.equal(a2Entity.xid, 'dn:lola.com:'+xid5);
        logger.debug('== =================================================');
      });
});
