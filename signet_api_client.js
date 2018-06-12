const axios  = require('axios');
const logger = require("js-logger");

/**
 * Class to wrap all calls to the Signet REST API.
 */
class SignetAPIClient {
  /**
   * Constructor for the SignetAPI Client
   * @param {string} URL The Signet API endpoint
   * e.g. http://localhost:1337
   * @return {object} object of type SignetAPIClient
   */
  constructor(signet_api_endpoint) {
    this.signet_api_endpoint = signet_api_endpoint;
  }

  /**
   * Wrapper method for the http GET call.
   * @param {string} URL_PATH The relative url to call i.e. /foo
   * @param {object} A dictionary of key value pairs for GET parameters
   * @return {promise} A promise object for the HTTP GET call
   */
  doGet(url_path, params) {
    logger.debug('-- ** **********************************************');
    logger.debug('-- ** Starting doGet()');
    let url = this.signet_api_endpoint + url_path;
    logger.debug('-- ** Sending GET request to URL: ' + url);
    logger.debug('-- ** Params:', params);
    logger.debug('-- ** Finished doGet()');
    logger.debug('-- ** **********************************************');
    // Note: the following method call returns a promise
    return axios.get(url, params);
  }

  /**
   * Wrapper method for the http POST call
   * @param {string} URL The relative url to call i.e. /foo
   * @param {object} A dictionary of key value pairs for POST parameters
   * @param {object} A dictionary of HTTP header key value pairs (Optional)
   * @return {promise} A promise object for the HTTP POST call
   */
  doPost(url_path, params, headers={}) {
    logger.debug('-- ** **********************************************');
    logger.debug('-- ** Starting doPost()');
    let url = this.signet_api_endpoint + url_path;
    logger.debug('-- ** Sending POST request to URL: ' + url);
    logger.debug('-- ** Params: ', params);
    let config = { headers: headers };
    logger.debug('-- ** Config: ', config);
    logger.debug('-- ** Finished doPost()');
    logger.debug('-- ** **********************************************');
    // Note: the following method call returns a promise
    return axios.post(url, params, config);
  }

  /**
   * Wrapper method for the http PATCH call
   * @param {string} URL The relative url to call i.e. /foo
   * @param {object} A dictionary of key value pairs for PATCH parameters
   * @param {object} A dictionary of HTTP header key value pairs (Optional)
   * @return {promise} A promise object for the HTTP POST call
   */
  doPatch(url_path, params, headers={}) {
    logger.debug('-- ** **********************************************');
    logger.debug('-- ** Starting doPatch()');
    let url = this.signet_api_endpoint + url_path;
    logger.debug('-- ** Sending PATCH request to URL: ' + url);
    logger.debug('-- ** Params: ', params);
    let config = { headers: headers };
    logger.debug('-- ** Config: ', config);
    logger.debug('-- ** Finished doPatch()');
    logger.debug('-- ** **********************************************');
    // Note: the following method call returns a promise
    return axios.patch(url, params, config);
  }

}

module.exports = SignetAPIClient;
