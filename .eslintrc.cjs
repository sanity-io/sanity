/* eslint-disable strict */

'use strict'

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  globals: {
    JSX: true,
  },
  env: {
    node: true,
    browser: true,
  },
  settings: {
    react: {version: '18.0.0'},
  },
  extends: [
    'sanity',
    'sanity/react',
    'sanity/import',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'sanity/typescript',
    'prettier',
  ],
  rules: {
    'prettier/prettier': 'error',
    'react/jsx-filename-extension': ['error', {extensions: ['.js', '.jsx', '.tsx']}],
    'sort-imports': 'off', // prefer import/order

    // tsdoc
    'tsdoc/syntax': 'error',
  },
  plugins: ['import', '@typescript-eslint', 'prettier', 'react', 'tsdoc'],
  overrides: [
    {
      files: ['*.{ts,tsx}'],
      rules: {
        'import/no-unresolved': 'off',
        'no-undef': 'off',
        'import/named': 'off',
        // the normal `no-dupe-class-members` doesn't work with TS overrides
        'no-dupe-class-members': 'off',
        '@typescript-eslint/no-dupe-class-members': ['error'],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['warn'],
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': ['error'],
      },
    },
    {
      files: ['./test/jest-setup.js', '*.test.{js,ts,tsx}'],
      env: {jest: true},
    },
  ],
}
