'use strict'

const common = {
  env: {
    node: true,
    browser: true
  },
  rules: {
    'newline-per-chained-call': 0,
    'prettier/prettier': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'sort-imports': 0
  },
  globals: {
    __DEV__: true
  },
  settings: {
    react: {version: 'detect'}
  }
}

module.exports = {
  ...common,
  root: true,
  overrides: [
    // JavaScript only:
    {
      files: ['**/*.js', '**/*.jsx', '**/*.mjs'],
      parser: 'babel-eslint',
      extends: [
        './packages/eslint-config-sanity/index.js',
        './packages/eslint-config-sanity/react.js',
        './packages/eslint-config-sanity/import.js',
        'prettier',
        'prettier/react'
      ],
      rules: {
        ...common.rules,
        'import/no-extraneous-dependencies': 'off',
        'import/no-unresolved': ['error', {ignore: ['.*:.*']}],
        'import/unambiguous': 'off'
      },
      plugins: ['import', 'prettier', 'react'],
      settings: {
        'import/ignore': ['\\.css$', '.*node_modules.*', '.*:.*'],
        'import/resolver': 'webpack'
      }
    },
    // TypeScript only:
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: [
        // './packages/eslint-config-sanity/index.js',
        './packages/eslint-config-sanity/react.js',
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint',
        'prettier',
        'prettier/react'
      ],
      rules: {
        ...common.rules,
        'prettier/prettier': 'error',
        'react/jsx-filename-extension': ['error', {extensions: ['.tsx']}]
      },
      plugins: ['@typescript-eslint', 'prettier', 'react']
    }
  ]
}
