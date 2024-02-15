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
    'plugin:react/jsx-runtime',
    'prettier',
    '@sanity/eslint-config-i18n',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    'boundaries',
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
  ],
  rules: {
    '@typescript-eslint/no-var-requires': 'off', // prefer import/no-dynamic-require
    'import/extensions': ['error', {pattern: {cjs: 'always', json: 'always'}}],
    'import/named': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/no-unresolved': 'off',
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
          attributes: ['animate', 'closed', 'exit', 'fill', 'full', 'initial', 'size'],
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
            // export (deprecated, aliases structure)
            from: 'sanity/desk',
            allow: ['sanity/desk__contents', 'sanity/structure', 'sanity/structure__contents'],
          },
          {
            from: 'sanity/desk__contents',
            allow: [
              'sanity',
              'sanity/desk__contents',
              'sanity/router',
              'sanity/_internal',
              'sanity/structure',
              'sanity/structure__contents',
            ],
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
          {
            // export
            from: 'sanity/structure',
            allow: ['sanity/structure__contents'],
          },
          {
            from: 'sanity/structure__contents',
            allow: ['sanity', 'sanity/structure__contents', 'sanity/router'],
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
      {
        type: 'sanity/structure',
        pattern: ['packages/sanity/exports/structure.ts'],
        mode: 'file',
      },
      {
        type: 'sanity/structure__contents',
        pattern: ['packages/sanity/src/structure/**/*.*'],
        mode: 'file',
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
    // Ignore i18n in Tasks files for now. This will need to be removed before task is completed.
    {
      files: ['**/*/Tasks*.{js,ts,tsx}', '**/*/tasks/**/*'],
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
            ],
          },
        ],
      },
    },
  ],
}

module.exports = config
