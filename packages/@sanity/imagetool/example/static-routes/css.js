var sass = require('node-sass');

function toBase64(str) {
  return new Buffer(str).toString('base64');
}

var routes = module.exports = {
  "/styles.css": function(callback) {
    sass.render({
      file: require.resolve("../styles.scss"),
      sourceComments: 'map',
      omitSourceMapUrl: true,
      outputStyle: 'nested'
    }, function(err, result) {
      if (err) {
        return callback(err)
      }
      callback(null, result.css);
    });
  }
};
