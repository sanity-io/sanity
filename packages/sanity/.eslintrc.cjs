/* eslint-disable */
// @ts-check
const path = require('path')

const ROOT_PATH = path.resolve(__dirname, '../..')

/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['plugin:boundaries/recommended'],
  plugins: ['boundaries'],
  rules: {
    'import/no-extraneous-dependencies': ['error', {packageDir: [ROOT_PATH, __dirname]}],
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
            allow: ['sanity', 'sanity/_internal__contents', 'sanity__contents'],
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
            allow: ['sanity', 'sanity/structure__contents', 'sanity/router', 'sanity/_singletons'],
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
  overrides: [
    {
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
  ],
}
