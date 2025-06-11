const path = require('node:path')

const ROOT_PATH = path.resolve(__dirname, '../../..')

module.exports = {
  rules: {
    'import/no-extraneous-dependencies': ['error', {packageDir: [ROOT_PATH, __dirname]}],
    '@sanity/i18n/no-attribute-string-literals': 'off',
    'i18next/no-literal-string': 'off',
  },
}
