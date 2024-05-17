'use strict'

const path = require('path')

const ROOT_PATH = path.resolve(__dirname, '../../..')

module.exports = {
  rules: {
    'import/no-extraneous-dependencies': ['error', {packageDir: [ROOT_PATH, __dirname]}],
  },
}
