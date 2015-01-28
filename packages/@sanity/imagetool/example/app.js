require("6to5-core/register")({
  experimental: true
});

var express = require('express');
var path = require('path');
var serve = require('staticr/serve');
var capture = require('error-capture-middleware');

var app = express();

app.use(require("quickreload")());
app.use(serve.js(require("./static-routes/browserify")));
app.use(serve.css(require("./static-routes/css")));
app.use(capture.css());
app.use(capture.js());

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;