import {dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

import baseConfig from '@repo/eslint-config'
import i18nConfig from '@sanity/eslint-config-i18n'
import boundaries from 'eslint-plugin-boundaries'
import testingLibrary from 'eslint-plugin-testing-library'
import {defineConfig} from 'eslint/config'
import globals from 'globals'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// @TODO these could be moved to oxlint, it's just that oxlint doesn't support merging individual rules atm so doing it there would create a lot of rules duplication
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
    name: 'react',
    importNames: ['createContext'],
    message: 'Please place "context" in _singletons',
  },
  // It's only allowed to call createContext from a singleton file, otherwise it defeats the purpose of the singleton (it may get duplicated during bundling)
  {
    name: 'sanity',
    importNames: ['createContext'],
    message:
      "It's only allowed to call createContext from a file in src/_singletons, otherwise it defeats the purpose of the singleton (it may get duplicated during bundling)",
  },
]

export default defineConfig([
  ...baseConfig,
  ...i18nConfig,
  {
    name: 'sanity/overrides',
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
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
    },
  },
  {
    name: 'sanity/boundaries-setup',
    // It's unclear why the boundaries plugin is failing the check on the `definitionExtensions.test.ts` file, investigate why
    ignores: ['src/core/form/types/definitionExtensions.test.ts'],
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/include': ['src/**/*.*'],
      'boundaries/elements': [
        {
          type: 'sanity',
          pattern: ['src/_exports/index.ts'],
          mode: 'full',
        },
        {
          type: 'sanity__contents',
          pattern: ['src/core/**/*.*'],
          mode: 'full',
        },
        {
          type: 'sanity/_internal',
          pattern: ['src/_exports/_internal.ts'],
          mode: 'full',
        },
        {
          type: 'sanity/_internal__contents',
          pattern: ['src/_internal/**/*.*'],
          mode: 'full',
        },
        {
          type: 'sanity/cli',
          pattern: ['src/_exports/cli.ts'],
          mode: 'full',
        },
        {
          type: 'sanity/cli__contents',
          pattern: ['src/cli/**/*.*'],
          mode: 'full',
        },
        {
          type: 'sanity/desk',
          pattern: ['src/_exports/desk.ts'],
          mode: 'file',
        },
        {
          type: 'sanity/desk__contents',
          pattern: ['src/desk/**/*.*'],
          mode: 'file',
        },
        {
          type: 'sanity/router',
          pattern: ['src/_exports/router.ts'],
          mode: 'full',
        },
        {
          type: 'sanity/router__contents',
          pattern: ['src/router/**/*.*'],
          mode: 'full',
        },
        {
          type: 'sanity/structure',
          pattern: ['src/_exports/structure.ts'],
          mode: 'file',
        },
        {
          type: 'sanity/structure__contents',
          pattern: ['src/structure/**/*.*'],
          mode: 'file',
        },
        {
          type: 'sanity/_singletons',
          pattern: ['src/_exports/_singletons.ts'],
          mode: 'file',
        },
        {
          type: 'sanity/_singletons__contents',
          pattern: ['src/_singletons/**/*.*'],
          mode: 'full',
        },
      ],
    },
    rules: {
      ...boundaries.configs.recommended.rules,
      '@typescript-eslint/no-require-imports': 'off',
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
      'boundaries/element-types': [
        2,
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
              allow: ['sanity__contents', 'sanity/router', 'sanity/_singletons'],
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
                'sanity/_singletons',
              ],
            },
            {
              // export
              from: 'sanity/router',
              allow: ['sanity/router__contents'],
            },
            {
              from: 'sanity/router__contents',
              allow: ['sanity/router__contents', 'sanity/_singletons'],
            },
            {
              // export
              from: 'sanity/structure',
              allow: ['sanity/structure__contents'],
            },
            {
              from: 'sanity/structure__contents',
              allow: [
                'sanity',
                'sanity/structure__contents',
                'sanity/router',
                'sanity/_singletons',
              ],
            },
            {
              from: 'sanity/_singletons__contents',
              allow: ['sanity/_singletons__contents'],
            },
            {
              from: 'sanity/_singletons__contents',
              allow: ['sanity__contents', 'sanity/structure__contents', 'sanity/router__contents'],
              importKind: 'type',
            },
            {
              from: 'sanity/_singletons__contents',
              disallow: ['sanity', 'sanity/structure', 'sanity/router'],
              importKind: 'type',
            },
          ],
        },
      ],
    },
  },
  {
    name: 'sanity/singletons/restricted-imports',
    files: ['./src/_singletons/**/*.*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'sanity',
              message: 'Use relative type imports instead',
            },
            {
              name: 'sanity/presentation',
              message: 'Use relative type imports instead',
            },
            {
              name: 'sanity/structure',
              message: 'Use relative type imports instead',
            },
            {
              name: 'sanity/router',
              message: 'Use relative type imports instead',
            },
            {
              name: 'react',
              importNames: ['createContext'],
              message: "Use `createContext` from 'sanity/_createContext' instead",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.*'],
    rules: {
      'max-nested-callbacks': 'off',
    },
  },
  {
    files: [`**/*/test/**/*`, '**/*/__tests__/**/*', '**/*.test.{js,ts,tsx}'],
    rules: {
      'i18next/no-literal-string': 'off',
      '@sanity/i18n/no-attribute-string-literals': 'off',
      '@sanity/i18n/no-attribute-template-literals': 'off',
    },
  },
  // Ignore i18n in ScheduledPublishing / scheduled-publishing files.
  {
    files: ['**/*/scheduledPublishing/**/*', '**/*/scheduled-publishing/**/*'],
    rules: {
      'i18next/no-literal-string': 'off',
      '@sanity/i18n/no-attribute-string-literals': 'off',
      '@sanity/i18n/no-attribute-template-literals': 'off',
    },
  },
  // Files to disable i18n literals,
  {
    files: ['**/*/debug/**/*'],
    rules: {
      'i18next/no-literal-string': 'off',
      '@sanity/i18n/no-attribute-string-literals': 'off',
      '@sanity/i18n/no-attribute-template-literals': 'off',
    },
  },
  // Prefer local components vs certain @sanity/ui imports (in sanity package)
  {
    ignores: ['src/_singletons/**', 'src/_createContext/**'],
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
    files: ['src/core/**'],
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
  // Prefer top-level type imports in singletons because boundaries plugin doesn't support named typed imports
  {
    files: ['src/_singletons/**'],
    rules: {
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
    },
  },
  {
    files: ['test/cli/**/*', 'playwright-ct/tests/**/*', 'src/core/config/__tests__/**/*'],
    rules: {
      'tsdoc/syntax': 'off',
    },
  },
  {
    files: ['test/validation/**/*'],
    languageOptions: {
      globals: {...globals.node},
    },
    rules: {
      'no-sync': 0,
      'max-nested-callbacks': ['error', 4],
    },
  },
  {
    files: ['src/core/preview/**/*'],
    rules: {
      camelcase: 'off',
    },
  },
  {
    files: ['src/core/templates/__tests__/**/*'],
    languageOptions: {
      globals: {...globals.browser, ...globals.node},
    },
    rules: {
      'no-sync': 0,
    },
  },
  {
    files: ['src/core/form/studio/**/*'],
    rules: {
      'import/no-unresolved': 'off',
    },
  },
  {
    files: [
      'src/_internal/**/*',
      'src/desk/**/*',
      'src/media-library/**/*',
      'src/presentation/**/*',
      'src/structure/**/*',
      'test/**/*',
      'playwright-ct/**/*',
    ],
    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        {
          includeTypes: true,
          packageDir: [__dirname, `${__dirname}/.eslint_no_extraneous_dependencies_workaround`],
        },
      ],
    },
  },
  // An issue with the vitest suite prevented this file from changing the 'react-i18next' import to 'sanity'.
  // This should be fixed, and the rule is disabled here rather than with an inline comment to give the override visibility so we don't forget about it.
  {
    files: ['src/ui-components/dialog/Dialog.tsx'],
    rules: {
      '@sanity/i18n/no-i18next-import': 'off',
    },
  },
  // Enable rules that aid with ensuring react tests don't have race conditions
  {
    ...testingLibrary.configs['flat/react'],
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    ignores: ['playwright-ct/**/*'],
    rules: {
      ...testingLibrary.configs['flat/react'].rules,
      'testing-library/prefer-user-event': 'error',
      // Rules that require follow up work to be enabled
      'testing-library/prefer-screen-queries': 'error',
      'testing-library/no-node-access': 'warn',
      'testing-library/no-container': 'warn',
      'testing-library/prefer-query-by-disappearance': 'warn',
      'testing-library/render-result-naming-convention': 'warn',
      'testing-library/no-render-in-lifecycle': 'warn',
    },
  },
])
