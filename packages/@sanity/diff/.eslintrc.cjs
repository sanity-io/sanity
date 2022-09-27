'use strict'

const path = require('path')

const ROOT_PATH = path.resolve(__dirname, '../../..')

module.exports = {
  rules: {
    complexity: 'off',
    'max-depth': 'off',
    'id-length': 'off',
    'import/no-extraneous-dependencies': ['error', {packageDir: [ROOT_PATH, __dirname]}],
  },
}
