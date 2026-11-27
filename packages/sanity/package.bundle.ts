import {createDefaultConfig} from '@repo/package.bundle'
import {defineConfig, mergeConfig} from 'vite'

import pkg from './package.json' with {type: 'json'}

export default defineConfig(() => {
  const {version, browserslist} = pkg
  return mergeConfig(createDefaultConfig({version, browserslist, styles: 'panda'}), {
    build: {
      lib: {
        entry: {
          '_singletons': './src/_exports/_singletons.ts',
          '_dangerously_use_private_internals_that_do_not_follow_semver':
            './src/_exports/_dangerously_use_private_internals_that_do_not_follow_semver.ts',
          '_dangerously_use_private_internals_that_do_not_follow_semver/1':
            './src/_exports/_dangerously_use_private_internals_that_do_not_follow_semver/1.ts',
          '_dangerously_use_private_internals_that_do_not_follow_semver/router':
            './src/_exports/_dangerously_use_private_internals_that_do_not_follow_semver/router.ts',
          '_dangerously_use_private_internals_that_do_not_follow_semver/structure':
            './src/_exports/_dangerously_use_private_internals_that_do_not_follow_semver/structure.ts',
          // 'sanity' module
          'index': './src/_exports/index.ts',
          'i18n': './src/_exports/i18n.ts',
          'media-library': './src/_exports/media-library.ts',
          'presentation': './src/_exports/presentation.ts',
          'router': './src/_exports/router.ts',
          'structure': './src/_exports/structure.ts',
        },
      },
    },
  })
})
