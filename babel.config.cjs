'use strict'

/* eslint-disable no-sync */

const fs = require('fs')
const path = require('path')

const babelrc = JSON.parse(fs.readFileSync(path.join(__dirname, '.babelrc'), 'utf8'))

module.exports = {
  ...babelrc,
  babelrcRoots: ['.', ...require('./lerna.json').packages],
}
