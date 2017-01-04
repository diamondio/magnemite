var assert      = require('assert');
var magnemite   = require('../');

var cache = new magnemite({
  url: 'redis://localhost:6379',
  prefix: 'test'
});

describe('Simple Tests', function () {
  beforeEach(function (done) {
    cache.invalidate(done);
  });

  it('Cache works', function (done) {
    var numCalls = 0;
    cache.register('user', function (dbname, cb) {
      numCalls++;
      setImmediate(function () {
        cb(null, {
          userId: dbname,
          name: 'Jake'
        })
      });
    });
    cache.get('user', '12345', function (err, user) {
      assert.equal(err, null);
      assert.equal(user.userId, '12345');
      cache.get('user', '12345', function (err, user) {
        assert.equal(err, null);
        assert.equal(user.userId, '12345');
        assert.equal(numCalls, 1);
        done();
      });
    });
  });

  it('Cache invalidation works', function (done) {
    var numCalls = 0;
    cache.register('user', function (dbname, cb) {
      numCalls++;
      setImmediate(function () {
        cb(null, {
          userId: dbname,
          name: 'Jake'
        })
      });
    });
    cache.get('user', '12345', function (err, user) {
      assert.equal(err, null);
      assert.equal(user.userId, '12345');
      cache.invalidate('user', '12345', function (err) {
        assert.equal(err, null);
        cache.get('user', '12345', function (err, user) {
          assert.equal(err, null);
          assert.equal(user.userId, '12345');
          assert.equal(numCalls, 2);
          done();
        });
      });
    });
  });

  it('Cache keys dont collide', function (done) {
    var numCalls = 0;
    cache.register('user', function (dbname, cb) {
      numCalls++;
      setImmediate(function () {
        cb(null, {
          userId: dbname,
          name: 'Jake'
        })
      });
    });
    cache.get('user', '12345', function (err, user) {
      assert.equal(err, null);
      assert.equal(user.userId, '12345');
      cache.get('user', '123456', function (err, user) {
        assert.equal(err, null);
        assert.equal(user.userId, '123456');
        assert.equal(numCalls, 2);
        done();
      });
    });
  });
});
