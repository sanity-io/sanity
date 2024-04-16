/* eslint-disable */
// @ts-check
'use strict'

const extensions = ['.cjs', '.mjs', '.js', '.jsx', '.ts', '.tsx']

/** @type {import('eslint').Linter.Config} */
const config = {
  root: true,
  env: {
    node: true,
    browser: true,
  },
  extends: [
    'sanity',
    'sanity/react',
    'sanity/import',
    'sanity/typescript',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime',
    'prettier',
    '@sanity/eslint-config-i18n',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    'import',
    'simple-import-sort',
    'unused-imports',
    '@typescript-eslint',
    'prettier',
    'react',
    'tsdoc',
  ],
  ignorePatterns: [
    '**/etc/*',
    '**/.sanity/*',
    '**/public/*',
    '**/build/*',
    '**/.next/*',
    '**/static/*',
    '**/coverage/*',
    '**/lib/*',
    '**/node_modules/*',
    '**/dist/*',
    '*.json',
    '*.css',
    '*.snap',
    '*.md',
    'dev/test-studio/sanity.theme.mjs',
    'dev/test-studio/workshop/scopes.js',
  ],
  rules: {
    '@typescript-eslint/no-var-requires': 'off', // prefer import/no-dynamic-require
    'import/extensions': ['error', {pattern: {cjs: 'always', json: 'always'}}],
    'import/named': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/no-unresolved': 'off',
    'import/default': 'off',
    'prettier/prettier': 'error',
    'tsdoc/syntax': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': [
      'error',
      {
        additionalHooks: '(useMemoObservable|useObservableCallback|useAsync)',
      },
    ],
    'react/no-unescaped-entities': 'off',
    'i18next/no-literal-string': ['error'],
    '@sanity/i18n/no-attribute-string-literals': [
      'error',
      {
        ignores: {
          componentPatterns: ['motion$'],
          attributes: [
            'animate',
            'closed',
            'documentType',
            'exit',
            'fill',
            'full',
            'initial',
            'size',
            'sortOrder',
            'status',
            'group',
          ],
        },
      },
    ],
    '@typescript-eslint/no-explicit-any': ['warn'],
    '@typescript-eslint/no-dupe-class-members': ['error'],
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/no-unused-vars': ['warn'],
    '@typescript-eslint/consistent-type-imports': ['error', {prefer: 'type-imports'}],
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

    'no-undef': 'off',
    'no-dupe-class-members': 'off', // doesn't work with TS overrides
    'no-shadow': 'off',
    'no-unused-vars': 'off',
    'no-useless-catch': 'warn',
    'no-async-promise-executor': 'warn',
  },
  settings: {
    'import/extensions': extensions,
    'import/parsers': {
      '@typescript-eslint/parser': extensions,
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: [
          'dev/*/tsconfig.json',
          'examples/*/tsconfig.json',
          'packages/@repo/*/tsconfig.json',
          'packages/@sanity/*/tsconfig.json',
          'packages/*/tsconfig.json',
        ],
      },
    },
    react: {version: '18.0.0'},
  },
  overrides: [
    // Test files
    {
      files: [`**/*/test/**/*`, '**/*/__tests__/**/*', '**/*.test.{js,ts,tsx}'],
      env: {jest: true},
      rules: {
        'i18next/no-literal-string': 'off',
        '@sanity/i18n/no-attribute-string-literals': 'off',
        '@sanity/i18n/no-attribute-template-literals': 'off',
      },
    },

    // Files to disable i18n literals,
    {
      files: ['./**/*/__workshop__/**/*', './dev/**/*', './examples/**/*', '**/*/debug/**/*'],
      rules: {
        'i18next/no-literal-string': 'off',
        '@sanity/i18n/no-attribute-string-literals': 'off',
        '@sanity/i18n/no-attribute-template-literals': 'off',
      },
    },

    // Prefer local components vs certain @sanity/ui imports (in sanity package)
    {
      files: ['packages/sanity/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@sanity/ui',
                importNames: [
                  'Button',
                  'ButtonProps',
                  'Dialog',
                  'DialogProps',
                  'MenuButton',
                  'MenuButtonProps',
                  'MenuGroup',
                  'MenuGroupProps',
                  'MenuItem',
                  'MenuItemProps',
                  'Popover',
                  'PopoverProps',
                  'Tab',
                  'TabProps',
                  'Tooltip',
                  'TooltipProps',
                  'TooltipDelayGroupProvider',
                  'TooltipDelayGroupProviderProps',
                ],
                message:
                  'Please use the (more opinionated) exported components in sanity/src/ui-components instead.',
              },
              {
                name: 'styled-components',
                importNames: ['default'],
                message: 'Please use `import {styled} from "styled-components"` instead.',
              },
              {
                name: 'react',
                importNames: ['default'],
                message:
                  'Please use named imports, e.g. `import {useEffect, useMemo, type ComponentType} from "react"` instead.',
              },
            ],
          },
        ],
      },
    },
  ],
}

module.exports = config
