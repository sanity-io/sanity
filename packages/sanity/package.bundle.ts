import {createDefaultConfig} from '@repo/package.bundle'
import {defineConfig, mergeConfig} from 'vite'

import pkg from './package.json' with {type: 'json'}

export default defineConfig(() => {
  const {version, browserslist} = pkg
  return mergeConfig(
    createDefaultConfig({
      version,
      browserslist,
      styles: 'panda',
      // Every studio loads these lazy modules right after boot (`AuthenticatedStudio` and the
      // layout and navbar it renders, plus the workspace source resolver `prepareConfig` loads),
      // so the studio preloads them instead of discovering them one `import()` at a time. The
      // list must stay this short: anything else lazy (tools, `_dangerously…-2`) is on demand.
      preload: {
        entry: 'index',
        packageName: 'sanity',
        lazyBoundaries: [
          './src/core/studio/AuthenticatedStudio.tsx',
          './src/core/config/resolveWorkspaceSource.tsx',
          './src/core/studio/StudioLayoutComponent.lazy.ts',
          './src/core/studio/components/navbar/StudioNavbar.lazy.ts',
        ],
      },
    }),
    {
      build: {
        lib: {
          entry: {
            '_singletons': './src/_exports/_singletons.ts',
            // TODO: the `-1`, `-2`, `-router` and `-structure` subpaths use `-` instead of `/`
            // because module-server only serves single-segment subpaths until
            // https://github.com/sanity-io/module-server/pull/251 is deployed to production. Once it
            // is, move them back to `…/1`, `…/2`, `…/router` and `…/structure`.
            '_dangerously_use_private_internals_that_do_not_follow_semver':
              './src/_exports/_dangerously_use_private_internals_that_do_not_follow_semver.ts',
            '_dangerously_use_private_internals_that_do_not_follow_semver-1':
              './src/_exports/_dangerously_use_private_internals_that_do_not_follow_semver-1.ts',
            '_dangerously_use_private_internals_that_do_not_follow_semver-2':
              './src/_exports/_dangerously_use_private_internals_that_do_not_follow_semver-2.ts',
            '_dangerously_use_private_internals_that_do_not_follow_semver-router':
              './src/_exports/_dangerously_use_private_internals_that_do_not_follow_semver-router.ts',
            '_dangerously_use_private_internals_that_do_not_follow_semver-structure':
              './src/_exports/_dangerously_use_private_internals_that_do_not_follow_semver-structure.ts',
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
    },
  )
})
