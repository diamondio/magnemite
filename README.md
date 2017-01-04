## Magnemite - Easy redis-backed caching

#### Getting Started

You will need to have the following resources available in your infrastucture:

 - Redis
 - Node.js

Install magnemite by doing

```bash
npm install --save magnemite
```

#### Using Magnemite

```js
var magnemite = require('magnemite');

var cache = new magnemite({url: 'redis://localhost:6379'});

cache.register('user', function (dbname, cb) {
  // This function goes off and grabs the "user" object from wherever the "true" source is
  setImmedate(function () {
    cb(null, {
      userId: dbname,
      name: 'Jake'
    })
  });
});

cache.get('user', '1234', function (err, user) {
  console.log('Got the user object:', user);
  cache.invalidate('user', '1234', function (err) {
    console.log('Invalidated the 1234 user');
    cache.invalidate('user', function (err) {
      console.log('Invalidated the every user');
      cache.invalidate(function (err) {
        console.log('Invalidated the whole cache');
      });
    });
  });
});
```
