/*
 * Description:
 *   This test suite will test the functions exported by the
 *   Signet SDK library.  The high-level objects of the SDK
 *   library such as Agent, Entity etc. would have their own
 *   test suites.
 * Last Modified: 2018-04-06
 * Author: Vivek Aanand Ganesan (onevivek@yahoo.com)
 */

// Includes
var assert = require('assert');
//const expect = require('chai').expect;


function waitASecond() {
  return new Promise(
    function (resolve,reject) {
      setTimeout(resolve, 1000);
      resolve('Yay!');
    }
  );
}

// Includes
describe('Await Tests', function () {
  it('await test', async () => {
    this.timeout(3000);
    // Do it once!
    var retVal = await waitASecond();
    console.log('Return Value: ' + retVal);
    assert.equal(retVal, 'Yay!');
    // Do it twice just to be sure!!
    var retVal = await waitASecond();
    console.log('Return Value: ' + retVal);
    assert.equal(retVal, 'Yay!');
  }); // End of 'it'
});
