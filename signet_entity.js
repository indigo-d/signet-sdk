/**
 * A proxy class for a Signet Entity.
 * <pre>
 * Objects of this class would contain entity attributes such as:
 *   - guid      => GUID of the Signet Entity
 *   - xid       => XID of the Signet Entity
 *   - verkey    => Verification key (Management key) of the Signet Entity
 *   - prevSign  => Previous Signature of entity
 *
 * Certain method calls to this object may trigger a call to the Signet API.
 * In such cases, these method calls would update the local state.
 * </pre>
 */

const logger = require("js-logger");

class SignetEntity {
  /**
   * Constructor to create a SignetEntity object.
   * @return {object} object of type SignetEntity
   */
  constructor(guid, verkey) {
    this.guid = guid;
    this.verkey = verkey;
    this.xid = undefined;
    this.channel = undefined;
    this.prevSign = undefined;
    this.signedAt = undefined;
    this.entityJSON = undefined;
  }

  /**
   * Method to take an entity JSON representation object and to set the fields
   *   of the local object to the representation object.
   * @param {Object} A representation of an entity that is returned
   *   by a REST API call
   */
  refresh(entityRep) {
    logger.debug('-- refresh starting');
    let entityObj = JSON.parse(entityRep.entityJSON);
    this.verkey = entityRep.verkey;
    this.xid = entityRep.xid;
    this.channel = entityRep.channel;
    this.prevSign = entityRep.signature;
    this.signedAt = entityRep.signedAt;
    this.entityJSON = entityRep.entityJSON;
    logger.debug('-- Entity object refreshed: ', this);
    logger.debug('-- refresh finished');
  }
}

module.exports = SignetEntity;
