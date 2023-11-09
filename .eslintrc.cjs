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
    'plugin:boundaries/recommended',
    'sanity',
    'sanity/react',
    'sanity/import',
    'sanity/typescript',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    'boundaries',
    'import',
    '@typescript-eslint',
    'prettier',
    'react',
    'tsdoc',
    'i18next',
    'no-attribute-string-literals',
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
  ],
  rules: {
    '@typescript-eslint/no-var-requires': 'off', // prefer import/no-dynamic-require
    'import/extensions': ['error', {pattern: {cjs: 'always', json: 'always'}}],
    'import/named': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/no-unresolved': 'off',
    'prettier/prettier': 'error',
    'sort-imports': 'off', // prefer import/order
    'tsdoc/syntax': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': [
      'error',
      {
        additionalHooks: '(useMemoObservable|useObservableCallback|useAsync)',
      },
    ],
    'react/no-unescaped-entities': 'off',
    'react/jsx-uses-react': 'warn',
    'i18next/no-literal-string': ['error'],
    'no-attribute-string-literals/no-attribute-string-literals': [
      'error',
      {
        ignore: [
          {
            components: ['svg', 'path', 'g', 'circle', 'option', 'meta', 'link', 'rect'],
            componentPatterns: ['^motion\\.', 'Svg', 'Motion'],
            attributePatterns: ['^data-', 'Key', 'Mode'],
            valuePatterns: ['^data-'],
            attributes: [
              'align',
              'aria-autocomplete',
              'aria-controls',
              'aria-hidden',
              'aria-live',
              'as',
              'assetType',
              'autoComplete',
              'autoFocus',
              'axis',
              'className',
              'direction',
              'display',
              'fill',
              'flex',
              'forwardedAs',
              'height',
              'href',
              'i18nKey',
              'id',
              'intent',
              'justify',
              'key',
              'key',
              'lang',
              'language',
              'layout',
              'mode',
              'mode',
              'overflow',
              'path',
              'pattern',
              'placement',
              'portal',
              'referrerPolicy',
              'rel',
              'role',
              'scheme',
              'selectionType',
              'sizing',
              'src',
              'step',
              'stroke',
              'target',
              'textOverflow',
              'tone',
              'type',
              'viewBox',
              'weight',
              'width',
              'wrap',
              'zOffset',
            ],
            values: [
              '_blank',
              'after',
              'before',
              'bottom',
              'center',
              'default',
              'dialog',
              'error',
              'false',
              'first',
              'from',
              'horizontal',
              'info',
              'left',
              'me',
              'numeric',
              'online',
              'popover',
              'right',
              'second',
              'sidebar',
              'test',
              'to',
              'top',
              'topbar',
              'transparent',
              'true',
              'viewport',
              'warning',
            ],
          },
        ],
      },
    ],
    '@typescript-eslint/no-dupe-class-members': ['error'],
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/no-unused-vars': ['warn'],
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          {
            // export
            from: 'sanity/_internal',
            allow: ['sanity/_internal__contents'],
          },
          {
            from: 'sanity/_internal__contents',
            allow: ['sanity', 'sanity/_internal__contents'],
          },
          {
            // export
            from: 'sanity/cli',
            allow: ['sanity/cli__contents'],
          },
          {
            from: 'sanity/cli__contents',
            allow: ['sanity/cli__contents'],
          },
          {
            // export
            from: 'sanity',
            allow: ['sanity__contents'],
          },
          {
            from: 'sanity__contents',
            allow: ['sanity__contents', 'sanity/router'],
          },
          {
            // export
            from: 'sanity/desk',
            allow: ['sanity/desk__contents'],
          },
          {
            from: 'sanity/desk__contents',
            allow: ['sanity', 'sanity/desk__contents', 'sanity/router'],
          },
          {
            // export
            from: 'sanity/router',
            allow: ['sanity/router__contents'],
          },
          {
            from: 'sanity/router__contents',
            allow: ['sanity/router__contents'],
          },
        ],
      },
    ],
    'no-undef': 'off',
    'no-dupe-class-members': 'off', // doesn't work with TS overrides
    'no-shadow': 'off',
    'no-unused-vars': 'off',
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
          'packages/@sanity/*/tsconfig.json',
          'packages/*/tsconfig.json',
        ],
      },
    },
    'boundaries/include': ['packages/sanity/exports/*.*', 'packages/sanity/src/**/*.*'],
    'boundaries/elements': [
      {
        type: 'sanity',
        pattern: ['packages/sanity/exports/index.ts'],
        mode: 'full',
      },
      {
        type: 'sanity__contents',
        pattern: ['packages/sanity/src/core/**/*.*'],
        mode: 'full',
      },
      {
        type: 'sanity/_internal',
        pattern: ['packages/sanity/exports/_internal.ts'],
        mode: 'full',
      },
      {
        type: 'sanity/_internal__contents',
        pattern: ['packages/sanity/src/_internal/**/*.*'],
        mode: 'full',
      },
      {
        type: 'sanity/cli',
        pattern: ['packages/sanity/exports/cli.ts'],
        mode: 'full',
      },
      {
        type: 'sanity/cli__contents',
        pattern: ['packages/sanity/src/cli/**/*.*'],
        mode: 'full',
      },
      {
        type: 'sanity/desk',
        pattern: ['packages/sanity/exports/desk.ts'],
        mode: 'file',
      },
      {
        type: 'sanity/desk__contents',
        pattern: ['packages/sanity/src/desk/**/*.*'],
        mode: 'file',
      },
      {
        type: 'sanity/router',
        pattern: ['packages/sanity/exports/router.ts'],
        mode: 'full',
      },
      {
        type: 'sanity/router__contents',
        pattern: ['packages/sanity/src/router/**/*.*'],
        mode: 'full',
      },
    ],
    react: {version: '18.0.0'},
  },
  overrides: [
    // Test files
    {
      files: [`**/*/test/**/*`, '**/*/__tests__/**/*', '**/*.test.{js,ts,tsx}'],
      env: {jest: true},
      rules: {
        'i18next/no-literal-string': 'off',
        'no-attribute-string-literals/no-attribute-string-literals': 'off',
      },
    },

    // Files to disable i18n literals,
    {
      files: ['./**/*/__workshop__/**/*', './dev/**/*', './examples/**/*', '**/*/debug/**/*'],
      rules: {
        'i18next/no-literal-string': 'off',
        'no-attribute-string-literals/no-attribute-string-literals': 'off',
      },
    },

    // Ignore i18n in Comments files for now. This will need to be removed before Comments feature is GA
    {
      files: ['**/*/Comment*.{js,ts,tsx}', '**/*/comments/**/*'],
      rules: {
        'i18next/no-literal-string': 'off',
        'no-attribute-string-literals/no-attribute-string-literals': 'off',
      },
    },
  ],
}

module.exports = config
