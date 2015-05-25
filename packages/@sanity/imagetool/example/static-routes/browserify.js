var browserify = require('browserify');
var rebundler = require("rebundler");
var babelify = require("babelify");
var envify = require("envify");

var browser = rebundler(function(cache, pkgCache) {
  return browserify(require.resolve('../browser.js'), {
    cache:         cache,
    packageCache:  pkgCache,
    extensions:    ['.jsx'],
    debug:         true,
    fullPaths:     true
  })
    .transform(babelify)
    .transform(envify)
});


module.exports = {
  '/browser.js': () => browser().bundle()
};