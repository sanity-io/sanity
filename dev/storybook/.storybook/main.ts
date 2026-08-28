import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {type StorybookConfig} from '@storybook/react-vite'
import viteReact from '@vitejs/plugin-react'
import {defaultClientConditions, mergeConfig} from 'vite'

const config: StorybookConfig = {
  stories: [
    '../../../packages/{groq,@repo/*,@sanity/*}/src/**/*.stories.@(ts|tsx)',
    // src/core/comments is an unmodified duplicate of src/core/comments-legacy (the plugin the
    // studio loads), including story titles. Only one copy can be indexed or the story ids
    // collide, and the indexer does not support negated entries, so `!(comments)` (which the
    // indexer treats as "does not start with comments") skips both trees and comments-legacy is
    // re-included explicitly.
    '../../../packages/sanity/src/!(core)/**/*.stories.@(ts|tsx)',
    '../../../packages/sanity/src/core/!(comments)/**/*.stories.@(ts|tsx)',
    '../../../packages/sanity/src/core/comments-legacy/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@chromatic-com/storybook', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  async viteFinal(viteConfig) {
    return mergeConfig(viteConfig, {
      // Mirrors packages/sanity/vitest.browser.config.mts so stories build the
      // `sanity` package from source exactly like the vitest browser-mode tests
      // do: vanilla-extract `.css.ts` support, the React Compiler transform the
      // studio ships with (via `oxc-transform-react`, no babel), and the
      // `monorepo` exports condition that resolves workspace packages to their
      // TypeScript source.
      plugins: [vanillaExtractPlugin(), viteReact({compiler: {target: '19'}})],
      resolve: {
        conditions: ['monorepo', ...defaultClientConditions],
        dedupe: ['react', 'react-dom', 'sanity', 'styled-components', 'ui5'],
      },
    })
  },
}

export default config
