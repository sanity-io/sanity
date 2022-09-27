'use strict'

const path = require('path')
const pkg = require('./package.json')

const ROOT_PATH = path.resolve(__dirname, '../..')

const exportIds = Object.keys(pkg.exports).map((exportPath) => path.join(pkg.name, exportPath))

module.exports = {
  rules: {
    'import/no-extraneous-dependencies': ['error', {packageDir: [ROOT_PATH, __dirname]}],
  },
  settings: {
    // This will allow importing from 'sanity', 'sanity/desk', etc.
    'import/core-modules': exportIds,
  },
}
