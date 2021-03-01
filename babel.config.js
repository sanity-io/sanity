/* eslint-disable @typescript-eslint/no-var-requires, no-sync */
const fs = require('fs')
const path = require('path')

const babelrc = JSON.parse(fs.readFileSync(path.join(__dirname, '.babelrc'), 'utf8'))

module.exports = Object.assign({}, babelrc, {
  babelrcRoots: ['.'].concat(require('./lerna.json').packages),
})
