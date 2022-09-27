'use strict'

const path = require('path')

const ROOT_PATH = path.resolve(__dirname, '../../..')

module.exports = {
  env: {
    browser: false,
    node: true,
  },
  rules: {
    complexity: [1, 18],
    'import/no-extraneous-dependencies': ['error', {packageDir: [ROOT_PATH, __dirname]}],
  },
}
