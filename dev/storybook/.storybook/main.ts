import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {type StorybookConfig} from '@storybook/react-vite'
import viteReact from '@vitejs/plugin-react'
import {defaultClientConditions, mergeConfig} from 'vite'

const config: StorybookConfig = {
  stories: ['../../../packages/{sanity,groq,@repo/*,@sanity/*}/src/**/*.stories.@(ts|tsx)'],
  addons: ['@chromatic-com/storybook', '@storybook/addon-vitest'],
  // Storybook composition: the upstream `@sanity/ui` stories show up as their
  // own sidebar tree, so the design system the studio builds on is browsable
  // from here. The manager fetches the remote `index.json` and renders its
  // stories from the remote `iframe.html` at runtime — nothing is bundled, and
  // Chromatic does not snapshot composed refs. "(upstream)" keeps the tree
  // apart from the local `Sanity UI/` tone sentinels in `src/ui-components`.
  refs: {
    'sanity-ui': {
      title: 'Sanity UI (upstream)',
      url: 'https://sanity-ui-storybook.sanity.dev',
    },
  },
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
