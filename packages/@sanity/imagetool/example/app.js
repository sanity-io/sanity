require("babel-core/register");

const express = require('express');
const path = require('path');
const serve = require('staticr/serve');
const capture = require('error-capture-middleware');

const app = express();

app.use(require("quickreload")());
app.use(serve.js(require("./static-routes/browserify")));
app.use(serve.css(require("./static-routes/css")));
app.use(capture.css());
app.use(capture.js());

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;