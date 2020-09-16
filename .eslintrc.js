module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  globals: {
    __DEV__: true
  },
  env: {
    node: true,
    browser: true
  },
  settings: {
    react: {version: '16.9.0'}
  },
  extends: [
    './packages/eslint-config-sanity/index.js',
    './packages/eslint-config-sanity/react.js',
    './packages/eslint-config-sanity/import.js',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'prettier',
    'prettier/react',
    './packages/eslint-config-sanity/typescript.js'
  ],
  rules: {
    'import/no-extraneous-dependencies': 'off', // because of parts
    'import/no-unresolved': ['error', {ignore: ['.*:.*']}],

    'prettier/prettier': 'error',
    'sort-imports': 'off' // prefer import/order
  },
  plugins: ['import', '@typescript-eslint', 'prettier', 'react']
}
