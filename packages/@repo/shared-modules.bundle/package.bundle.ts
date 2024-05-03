import {defineConfig, mergeConfig} from 'vite'

import {defaultConfig} from '../package.bundle/src/package.bundle'

export default defineConfig(() => {
  return mergeConfig(defaultConfig, {
    build: {
      lib: {
        entry: {
          'react': './node_modules/react/cjs/react.production.min.js',
          'react-dom': './node_modules/react-dom/cjs/react-dom.production.min.js',
          'react-dom_server':
            './node_modules/react-dom/cjs/react-dom-server-legacy.browser.production.min.js',
          'react_jsx-runtime': './node_modules/react/cjs/react-jsx-runtime.production.min.js',
          'styled-components': './node_modules/styled-components/dist/styled-components.esm.js',
        },
      },
    },
  })
})
