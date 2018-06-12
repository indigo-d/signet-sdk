"use strict";

const base64url = require('base64url');

// Key conversion functions
// ------------------------

// Convert key array (used by libsodium) to base64url key
exports.convertKeyArray2KeyBase64url = function(keyA) {
  return base64url(keyA)+"=";
}

// Convert base64url key to key array (used by libsodium)
exports.convertKeyBase64url2KeyArray = function(keyB) {
  return new Uint8Array(base64url.toBuffer(keyB.slice(0,-1)));
}
