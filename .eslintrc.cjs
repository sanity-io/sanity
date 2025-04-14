/* eslint-disable */
// @ts-check
'use strict'

const noRestrictedImportPaths = [
  {
    name: '@sanity/ui',
    importNames: [
      'Button',
      'ButtonProps',
      'Dialog',
      'DialogProps',
      'ErrorBoundary',
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
    importNames: ['default', 'createContext', 'createElement'],
    message:
      'Please use named imports, e.g. `import {useEffect, useMemo, type ComponentType} from "react"` instead.\nPlease place "context" in _singletons\nPlease use JSX instead of createElement, for example `createElement(Icon)` should be `<Icon />`',
  },
]

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
    'turbo',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    'import',
    'simple-import-sort',
    'unused-imports',
    '@typescript-eslint',
    'prettier',
    'react',
    'react-compiler',
    'tsdoc',
    'unicorn',
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
    'react-hooks/exhaustive-deps': 'error',
    // Set react-compiler to `error` once existing issues are fixed
    /**
     * Once all react-compiler warnings are fixed then this rule should be changed to 'error' and:
     * - the `.eslintignore.react-compiler` file should be deleted
     * - the `.github/workflows/are-we-compiled-yet.yml` action can be deleted
     * - the `pnpm check:react-compiler` command removed
     */
    'react-compiler/react-compiler': 'warn',
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
            'textWeight',
            'showChangesBy',
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
    'unicorn/prefer-string-slice': 'error',
    'unicorn/prefer-node-protocol': 'error',
    'unicorn/prefer-keyboard-event-key': 'error',
    'unicorn/custom-error-definition': 'error',
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
    'react': {version: '18.0.0'},
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
    // Ignore i18n in ScheduledPublishing files.
    {
      files: ['**/*/scheduledPublishing/**/*'],
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
      excludedFiles: [
        '**/__workshop__/**',
        'packages/sanity/src/_singletons/**',
        'packages/sanity/src/_createContext/**',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: noRestrictedImportPaths,
          },
        ],
      },
    },
    {
      files: ['packages/sanity/src/core/**'],
      excludedFiles: ['**/__workshop__/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'sanity',
                message:
                  'Please import from a relative path instead (since you are inside `packages/sanity/src/core`).',
              },
              ...noRestrictedImportPaths,
            ],
          },
        ],
      },
    },
    {
      files: ['test/e2e/**'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@playwright/test',
                importNames: ['test', 'default'],
                message:
                  'Please use named imports, e.g. `import {test} from "studio-test"` instead.',
              },
              {
                name: '@sanity/test',
                importNames: ['test', 'default'],
                message:
                  'Please use named imports, e.g. `import {test} from "studio-test"` instead.',
              },
            ],
          },
        ],
      },
    },
    // Prefer top-level type imports in singletons because boundaries plugin doesn't support named typed imports
    {
      files: ['packages/sanity/src/_singletons/**'],
      rules: {
        'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      },
    },

    // Don't lint React Compiler rules on test code
    {
      files: [
        `**/*/test/**/*`,
        '**/*/__tests__/**/*',
        '**/*.test.{js,ts,tsx}',
        'packages/sanity/playwright-ct/**',
      ],
      rules: {
        'react-compiler/react-compiler': 'off',
      },
    },
    // Don't lint Turbo undeclared process env variables in code that is used in the CLI at runtime
    {
      files: [
        'packages/@sanity/cli/**',
        'packages/sanity/src/_internal/cli/**',
        'packages/sanity/playwright-ct/**',
      ],
      rules: {
        'turbo/no-undeclared-env-vars': 'off',
      },
    },
  ],
}

module.exports = config
