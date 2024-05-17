import {defineConfig, mergeConfig} from 'vite'

import {defaultConfig} from '../package.bundle/src/package.bundle'

export default defineConfig(() => {
  return mergeConfig(defaultConfig, {
    build: {
      lib: {
        // NOTE: IF ANY OF THIS CHANGES MAKE SURE TO UPDATE `scripts/uploadBundles.ts`
        entry: {
          'react/index': './node_modules/react/cjs/react.production.min.js',
          'react-dom/index': './node_modules/react-dom/cjs/react-dom.production.min.js',
          'react-dom/client': './node_modules/react-dom/cjs/react-dom.production.min.js',
          'react-dom/server':
            './node_modules/react-dom/cjs/react-dom-server-legacy.browser.production.min.js',
          'react/jsx-runtime': './node_modules/react/cjs/react-jsx-runtime.production.min.js',
          'styled-components/index':
            './node_modules/styled-components/dist/styled-components.esm.js',
        },
      },
    },
  })
})
