import {fileURLToPath} from 'node:url'

import {pandacss} from '@pandacss/vite'
import {removeCascadeLayers} from '@sanity/pandacss-tsdown-plugin/vite'
import {type StorybookConfig} from '@storybook/react-vite'
import viteReact from '@vitejs/plugin-react'
import {defaultClientConditions, mergeConfig} from 'vite'

/** The `sanity` package: the repository's only Panda CSS project (packages/sanity/panda.config.ts). */
const SANITY_PACKAGE_DIR = fileURLToPath(new URL('../../../packages/sanity/', import.meta.url))

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
      // do: Panda CSS for the `.css.ts` modules (`@pandacss/vite` pointed at the
      // package's Panda project rewrites the class names in place and fills
      // `panda.css`, which the preview imports, with their CSS;
      // `removeCascadeLayers()` takes Panda's layers out again, like the
      // published `bundle.css` has none), the React Compiler transform the
      // studio ships with (via `oxc-transform-react`, no babel), and the
      // `monorepo` exports condition that resolves workspace packages to their
      // TypeScript source.
      plugins: [
        pandacss({cwd: SANITY_PACKAGE_DIR, transform: true}),
        removeCascadeLayers(['reset', 'base', 'tokens', 'recipes', 'utilities']),
        viteReact({compiler: {target: '19'}}),
      ],
      resolve: {
        conditions: ['monorepo', ...defaultClientConditions],
        dedupe: ['react', 'react-dom', 'sanity', 'styled-components', 'ui5'],
      },
    })
  },
}

export default config
