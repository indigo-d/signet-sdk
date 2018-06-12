let flaverr = require('flaverr');

/**
 * Custom Error class for Signet Errors.
 */
class SignetError {
  /**
   * Constructor for the  Client
   * @param {string} ERROR_CODE An error code string
   * @param {string} ERROR_MESG An error message string
   * @return {object} object of type SignetAPIClient
   */
  constructor(code, mesg) {
    throw flaverr(code, new Error(mesg));
  }
}

module.exports = SignetError;
