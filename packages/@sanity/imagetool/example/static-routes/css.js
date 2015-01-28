var sass = require('node-sass');

function toBase64(str) {
  return new Buffer(str).toString('base64');
}

var routes = module.exports = {
  "/styles.css": function(callback) {
    sass.render({
      file: require.resolve("../styles.scss"),
      success: function(result) {
        if (!result.map.version) {
          return callback(null, result.css);
        }
        result.map.sources = result.map.sources.map(function (source) {
          // Set correct path of each source file
          return '../' + source;
        });

        var comment = "/*# sourceMappingURL=data:application/json;base64," + toBase64(JSON.stringify(result.map)) + "*/";

        callback(null, result.css + "\n"+comment);
      },
      error: function(message) {
        callback(new Error(message));
      },
      sourceComments: 'map',
      omitSourceMapUrl: true,
      outputStyle: 'nested'
    });
  }
};
