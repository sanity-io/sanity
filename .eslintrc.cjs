'use strict'

const baseConfig = {
  env: {
    node: true,
    browser: true,
  },
  extends: [
    'sanity',
    'sanity/react',
    'sanity/import',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['import', '@typescript-eslint', 'prettier', 'react', 'tsdoc'],
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
    'react/jsx-filename-extension': ['error', {extensions: ['.jsx']}],
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
  },
  settings: {
    'import/extensions': ['.cjs', '.mjs', '.js', '.jsx', '.ts', '.tsx'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.cjs', '.mjs', '.js', '.jsx', '.ts', '.tsx'],
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
    react: {version: '18.0.0'},
  },
}

module.exports = {
  ...baseConfig,

  overrides: [
    // TypeScript files
    {
      files: ['*.{ts,tsx}'],
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
      plugins: ['boundaries', 'import', '@typescript-eslint', 'prettier', 'react', 'tsdoc'],
      rules: {
        ...baseConfig.rules,
        '@typescript-eslint/no-dupe-class-members': ['error'],
        '@typescript-eslint/no-shadow': ['error'],
        '@typescript-eslint/no-unused-vars': ['warn'],
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
        'react/jsx-filename-extension': ['error', {extensions: ['.tsx']}],
      },
      settings: {
        ...baseConfig.settings,
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
        'boundaries/include': ['packages/sanity/exports/*.*', 'packages/sanity/src/**/*.*'],
      },
    },

    // CommonJS files
    {
      files: ['*.cjs'],
      parserOptions: {
        sourceType: 'script',
      },
      rules: {
        ...baseConfig.rules,
        strict: ['error', 'global'],
      },
    },

    // Test files
    {
      files: ['./test/**/*.js', './test/*.js', '*.test.{js,ts,tsx}'],
      env: {jest: true},
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
                  'MenuItem',
                  'MenuItemProps',
                  'Tab',
                  'TabProps',
                  'Tooltip',
                  'TooltipProps',
                ],
                message:
                  'Please use the (more opinionated) exported components in sanity/src/ui instead.',
              },
            ],
          },
        ],
      },
    },
  ],

  root: true,
}
