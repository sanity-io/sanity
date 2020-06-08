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
    'prettier/react'
  ],
  rules: {
    // --- causing parse errors with d.ts files, see https://github.com/typescript-eslint/typescript-eslint/issues/420
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'error',
    // ---
    '@typescript-eslint/no-use-before-define': 'off',
    "@typescript-eslint/explicit-function-return-type": 'off',

    '@typescript-eslint/no-var-requires': 'off', // covered by @typescript-eslint/no-var-requires
    'react/jsx-filename-extension': ['error', {extensions: ['.tsx', '.js']}],

    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': ['error', {ignore: ['.*:.*']}],

    'prettier/prettier': 'error',
    'sort-imports': 'off'
  },
  plugins: ['import', '@typescript-eslint', 'prettier', 'react']
}
