import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {type StorybookConfig} from '@storybook/react-vite'
import viteReact from '@vitejs/plugin-react'
import {defaultClientConditions, mergeConfig} from 'vite'

const config: StorybookConfig = {
  stories: ['../../../packages/{sanity,groq,@repo/*,@sanity/*}/src/**/*.stories.@(ts|tsx)'],
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
