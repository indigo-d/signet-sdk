/**
 * Description:
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
var assert = require('assert');
var api_endpoint = 'http://localhost:1337';
// Needed to access non-exported classes
const rewire = require('rewire');
const sdk = rewire('../../index.js');
var agent, entity, guid, channel, xid1, xid2, xid3, xid4;
var agent2, a2Entity, guid2, xid5;
var orgPublicKey = 'kuy-HOnN2rS4jLunuuXMnGU4KrOpc6vJFFL2NhlyW9E=';
var orgPrivateKey = 'kBL96MxRGT3MbMnIw9-Q8ILsyjPEjY3ha30X_mc8-SCS7L4c6c3atLiMu6e65cycZTgqs6lzq8kUUvY2GXJb0Q=';


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
  sdk.initialize('http://localhost:1337');
  it('SDK Scenario 01: Create entity, set channel and fetch entity', async function () {
    console.log('== =================================================');
    // Generate GUID
    guid = await sdk.genGUID();
    console.log('== GUID: ', guid);
    // Create Agent
    agent = await sdk.createAgent();
    agent.setOrgKeys(orgPublicKey, orgPrivateKey);
    console.log('== Agent: ', agent);
    console.log('== =================================================');
    // Create an entity
    console.log('== =================================================');
    console.log('== Create entity');
    entity = await agent.createEntity(guid);
    console.log('== Created entity:', entity);
    assert.notEqual(entity, undefined, 'Entity create failed');
    assert.equal(entity.guid, guid);
    console.log('== =================================================');
    // Set Channel
    console.log('== =================================================');
    console.log('== Set Channel');
    channel = Math.random().toString(36).substr(2, 5);
    let retSetChannel = await agent.setChannel(entity, 'REST', 'v1', channel);
    assert.ok(retSetChannel);
    assert.equal(entity.channel, 'REST#v1#'+channel);
    console.log('== =================================================');
    // Fetch entity
    console.log('== =================================================');
    console.log('== Fetch entity');
    let fetchedEntity = await sdk.fetchEntity(guid);
    console.log('== Entity fetched: ', fetchedEntity);
    assert.equal(fetchedEntity.guid, guid);
    assert.equal(fetchedEntity.channel, 'REST#v1#'+channel);
    console.log('== =================================================');
  });
  it('SDK Scenario 02: Set XID and fetch entity by XID', async function () {
    // Set XID
    console.log('== =================================================');
    console.log('== Set XID');
    xid1 =  Math.random().toString(36).substr(2, 5);
    let ret1 = await agent.setXID(entity, 'dn', 'lola.com', xid1);
    assert.ok(ret1);
    assert.equal(entity.xid, 'dn:lola.com:'+xid1);
    assert.equal(entity.channel, 'REST#v1#'+channel);
    console.log('== =================================================');
    // Fetch entity by XID
    console.log('== =================================================');
    console.log('== Fetch entity by XID');
    let fetchedEntityByXID = await sdk.fetchEntityByXID('dn','lola.com',xid1);
    console.log('== Entity fetched by XID: ', fetchedEntityByXID);
    assert.equal(fetchedEntityByXID.xid, 'dn:lola.com:'+xid1);
    assert.equal(fetchedEntityByXID.channel, 'REST#v1#'+channel);
    console.log('== =================================================');
  });
  it('SDK Scenario 03: Rekey entity tests', async function () {
    // Rekey entity
    console.log('== =================================================');
    console.log('== Rekey:');
    await agent.rekey(entity);
    console.log('== =================================================');
    // Set XID after rekey
    console.log('== =================================================');
    console.log('== Set XID after rekey');
    xid2 =  Math.random().toString(36).substr(2, 5);
    let ret2 = await agent.setXID(entity, 'dn', 'lola.com', xid2);
    assert.ok(ret2);
    assert.equal(entity.xid, 'dn:lola.com:'+xid2);
    assert.equal(entity.channel, 'REST#v1#'+channel);
    console.log('== =================================================');
    // Fetch entity by XID after rekey
    console.log('== =================================================');
    console.log('== Fetch entity by XID after rekey');
    let fetchedEntityByXIDAfterRekey = await sdk.fetchEntityByXID('dn','lola.com',xid2);
    console.log('== Entity fetched by XID after rekey: ', fetchedEntityByXIDAfterRekey);
    assert.equal(fetchedEntityByXIDAfterRekey.xid, 'dn:lola.com:'+xid2);
    assert.equal(fetchedEntityByXIDAfterRekey.channel, 'REST#v1#'+channel);
    console.log('== =================================================');
    // Rekey entity again and run some negative tests
    console.log('== =================================================');
    console.log('== Rekey:');
    let oldKeySet = agent.keyChain[guid];
    await agent.rekey(entity);
    let newKeySet = agent.keyChain[guid];
    console.log('== =================================================');
    // Reset the signing key to the old signing key (before the rekey)
    console.log('== =================================================');
    console.log(agent.getOwnershipKeyPair(guid).getPublicKey());
    agent.addEntityKeySetToKeyChain(guid, oldKeySet);
    console.log(agent.getOwnershipKeyPair(guid).getPublicKey());
    xid3 =  Math.random().toString(36).substr(2, 5);
    let ret3 = await agent.setXID(entity, 'dn', 'lola.com', xid3);
    assert.equal(ret3, false);
    console.log('== =================================================');
    // Fetch entity after the negative test and check XID
    console.log('== =================================================');
    console.log('== Fetch entity after negative test');
    let entity2 = await sdk.fetchEntity(guid);
    console.log('== Entity fetched after negative test: ', entity2);
    assert.equal(entity.guid, guid);
    assert.equal(entity.xid, 'dn:lola.com:'+xid2);
    assert.notEqual(entity.xid, 'dn:lola.com:'+xid3);
    assert.equal(entity.channel, 'REST#v1#'+channel);
    console.log('== =================================================');
    // Reset to new key, set XID to a new value and then check XID
    console.log('== =================================================');
    console.log(agent.getOwnershipKeyPair(guid).getPublicKey());
    agent.addEntityKeySetToKeyChain(guid, newKeySet);
    console.log(agent.getOwnershipKeyPair(guid).getPublicKey());
    console.log('== Set XID3:');
    ret3 = await agent.setXID(entity, 'dn', 'lola.com', xid3);
    assert.ok(ret3);
    console.log('== Fetch entity by XID3');
    let entity3 = await sdk.fetchEntityByXID('dn','lola.com',xid3);
    console.log('== Entity3: ', entity3);
    assert.equal(entity3.xid, 'dn:lola.com:'+xid3);
    assert.equal(entity3.channel, 'REST#v1#'+channel);
    console.log('== =================================================');
  });
  it('Scenario 04: Assign Entity Workflow', async function () {
    console.log('== =================================================');
    agent2 = await sdk.createAgent();
    console.log('== Agent2: ', agent2);
    // Fetch the entity created in the previous scenario
    // This entity would then be assigned to the new agent created above
    //   in this scenario.
    let e4 = await sdk.fetchEntity(guid);
    let a1e4Keys = agent.getOwnershipKeySet(guid).exportOwnershipKeyPair();
    let ret4 = await agent2.assignEntity(e4,a1e4Keys[0],a1e4Keys[1]);
    console.log(ret4);
    assert.ok(ret4);
    let a2e4Keys = agent2.getOwnershipKeySet(guid).exportOwnershipKeyPair();
    console.log(a2e4Keys);
    assert.deepEqual(a1e4Keys,a2e4Keys);
    // Rekey entity to take exclusive ownership
    let rekeyRetVal = await agent2.rekey(e4);
    assert.ok(rekeyRetVal);
    let eByXID = await sdk.fetchEntityByXID('dn','lola.com',xid3);
    assert.equal(eByXID.xid, 'dn:lola.com:'+xid3);
    assert.equal(eByXID.channel, 'REST#v1#'+channel);
    // Negative test: try to set XID by old agent (should fail!)
    let setXIDByOldAgentRetVal = await agent.setXID(e4, 'dn', 'lola.com', 'foo');
    assert.equal(setXIDByOldAgentRetVal, false);
    // Positive test: set XID by new agent (should pass)
    agent2.setOrgKeys(orgPublicKey, orgPrivateKey);
    console.log('== Set XID4:');
    xid4 =  Math.random().toString(36).substr(2, 5);
    ret4 = await agent2.setXID(eByXID, 'dn', 'lola.com', xid4);
    assert.ok(ret4);
    console.log('== Fetch entity by XID4');
    e4 = await sdk.fetchEntityByXID('dn','lola.com',xid4);
    console.log('== Entity4: ', e4);
    assert.equal(e4.xid, 'dn:lola.com:'+xid4);
    assert.equal(e4.channel, 'REST#v1#'+channel);
    // Positive test: agent2 should create an entity with XID set
    console.log('== =================================================');
    console.log('== Agent2 create entity with XID set');
    guid2 = await sdk.genGUID();
    console.log('== GUID2: ', guid2);
    xid5 =  Math.random().toString(36).substr(2, 5);
    console.log('== XID5: ', xid5);
    a2Entity = await agent.createEntity(guid2, {'xid': ['dn','lola.com',xid5]});
    console.log('== Agent2 created entity:', a2Entity);
    assert.notEqual(a2Entity, undefined, 'Agent2 entity create failed');
    assert.equal(a2Entity.guid, guid2);
    assert.equal(a2Entity.xid, 'dn:lola.com:'+xid5);
    console.log('== =================================================');
  });
});
