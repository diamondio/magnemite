var _     = require('lodash');
var async = require('async');
var redis = require('redis');
var hash  = require('object-hash');

var delimiter = '#~#';

function Cache (opts) {
  var self = this;
  if (!opts.url) throw new Error('You must include the "url" option to create a magnemite cache');
  self._client = redis.createClient({url: opts.url});
  self._prefix = opts.prefix || 'magnemite';
  self._getters = {};
}

Cache.prototype.get = function (type, key, cb) {
  var self = this;
  if (!self._getters[type]) return cb(`Unknown cached type "${type}", did you forget to call the .register method?`);
  var serializedKey = [self._prefix, type, hash(key)].join(delimiter);
  self._client.get(serializedKey, function (err, str) {
    if (str) {
      var returnObject;
      try {
        returnObject = JSON.parse(str);
        if (!returnObject.expiryTime || returnObject.expiryTime > Date.now()) return cb(null, returnObject.result);
      } catch (e) {
        // Do nothing. We will try our very best to succeed.
      }
    }
    // If we made it here, we need to try to retrieve it from the source.
    self._getters[type](key, function (err, result, expiryTime) {
      // If we don't have it in the cache, *and* we can't get it with the getter, we're pretty boned.
      if (err) return cb(err);
      var jsonResult;
      try {
        jsonResult = JSON.stringify({
          result: result,
          expiryTime: expiryTime || 0
        });
      } catch (e) {
        return cb('Magnemite does not support the caching of objects that are not JSON serializible');
      }
      self._client.set(serializedKey, jsonResult, function (err) {
        // Regardless of whether there was an error, we can still return the cached object:
        return cb(null, result);
      });
    });
  });
}

Cache.prototype.register = function (type, getter) {
  this._getters[type] = getter;
}

Cache.prototype.invalidate = function (type, key, cb) {
  var self = this;
  if (cb) {
    var serializedKey = [self._prefix, type, hash(key)].join(delimiter);
    return self._client.del(serializedKey, cb);
  }
  if (key) {
    cb = key;
    return self._client.keys([self._prefix, type, '*'].join(delimiter), function (err, keys) {
      if (err) return cb(err);
      async.eachSeries(_.chunk(keys, 500), function (keyChunk, asyncCB) {
        self._client.batch(keyChunk.map(k => ['del', k])).exec(asyncCB);
      }, cb);
    });
  }
  cb = type;
  self._client.keys([self._prefix, '*', '*'].join(delimiter), function (err, keys) {
    if (err) return cb(err);
    async.eachSeries(_.chunk(keys, 500), function (keyChunk, asyncCB) {
      self._client.batch(keyChunk.map(k => ['del', k])).exec(asyncCB);
    }, cb);
  });
}

module.exports = Cache;
