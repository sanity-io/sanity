'use strict'

/** @type import('eslint').Linter.Config */
module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: [
    'import',
    'prettier',
    'simple-import-sort',
    'unused-imports',
    '@typescript-eslint',
  ],
  rules: {
    'no-console': 'error',
    'no-shadow': 'error',
    'no-warning-comments': [
      'warn',
      {
        location: 'start',
        terms: ['todo', 'fixme'],
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: true,
      },
      extends: [
        'eslint:recommended',
        'plugin:prettier/recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      plugins: ['import', '@typescript-eslint', 'prettier'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/member-delimiter-style': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {prefer: 'type-imports'},
        ],
        '@typescript-eslint/no-dupe-class-members': ['error'],
        '@typescript-eslint/no-shadow': ['error'],
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': ['warn'],
        'import/no-duplicates': ['error', {'prefer-inline': true}],
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/consistent-type-specifier-style': ['error', 'prefer-inline'],
        'import/order': 'off', // handled by simple-import-sort
        'sort-imports': 'off', // handled by simple-import-sort
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
      },
    },
  ],
}
