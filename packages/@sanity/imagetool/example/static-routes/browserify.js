var browserify = require('browserify');
var rebundler = require("rebundler");

var browser = rebundler(function(cache, pkgCache) {

  var to5ify = require("6to5ify");

  return browserify(require.resolve('../browser.js'), {
    cache:         cache,
    packageCache:  pkgCache,
    extensions:    ['.jsx'],
    debug:         true,
    fullPaths:     true
  })
    .transform(to5ify.configure({
      experimental: true
    }))
});


module.exports = {
  '/browser.js': () => browser().bundle()
};